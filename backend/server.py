from fastapi import FastAPI, APIRouter, HTTPException, Query, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import requests
import asyncio
from typing import Union

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Akka Fintech API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# CoinMarketCap API Configuration
COINMARKETCAP_API_KEY = os.environ.get('COINMARKETCAP_API_KEY')
COINMARKETCAP_BASE_URL = "https://pro-api.coinmarketcap.com/v1"
COINMARKETCAP_HEADERS = {
    "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
    "Accept": "application/json"
}

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    eur_balance: float = Field(default=0.0)
    try_balance: float = Field(default=0.0)
    crypto_portfolio: Dict[str, float] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    name: str

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    transaction_type: str  # 'fiat_topup', 'crypto_swap', 'fiat_to_crypto'
    from_currency: str
    to_currency: str
    from_amount: float
    to_amount: float
    exchange_rate: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SwapRequest(BaseModel):
    user_id: str
    from_currency: str
    to_currency: str
    amount: float

class CryptoPrice(BaseModel):
    symbol: str
    name: str
    price: float
    change_24h: float
    market_cap: float
    volume_24h: float

# CoinMarketCap Service
class CoinMarketCapService:
    @staticmethod
    async def get_crypto_prices(symbols: str = "BTC,ETH,BNB,ADA,SOL,XRP,DOGE,AVAX,DOT,MATIC"):
        try:
            params = {"symbol": symbols, "convert": "USD"}
            response = requests.get(
                f"{COINMARKETCAP_BASE_URL}/cryptocurrency/quotes/latest",
                headers=COINMARKETCAP_HEADERS,
                params=params
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=429, detail="CoinMarketCap API error")
                
            data = response.json()["data"]
            prices = {}
            
            for symbol in symbols.split(","):
                if symbol in data:
                    coin_data = data[symbol]
                    prices[symbol] = {
                        "symbol": symbol,
                        "name": coin_data["name"],
                        "price": coin_data["quote"]["USD"]["price"],
                        "change_24h": coin_data["quote"]["USD"]["percent_change_24h"],
                        "market_cap": coin_data["quote"]["USD"]["market_cap"],
                        "volume_24h": coin_data["quote"]["USD"]["volume_24h"]
                    }
            
            return prices
        except Exception as e:
            print(f"CoinMarketCap API error: {e}")
            # Return mock data if API fails
            return {
                "BTC": {"symbol": "BTC", "name": "Bitcoin", "price": 42000.0, "change_24h": 2.5, "market_cap": 800000000000, "volume_24h": 15000000000},
                "ETH": {"symbol": "ETH", "name": "Ethereum", "price": 2500.0, "change_24h": 1.8, "market_cap": 300000000000, "volume_24h": 8000000000}
            }
    
    @staticmethod
    async def get_exchange_rate(from_symbol: str, to_symbol: str):
        try:
            symbols = f"{from_symbol},{to_symbol}"
            params = {"symbol": symbols, "convert": "USD"}
            response = requests.get(
                f"{COINMARKETCAP_BASE_URL}/cryptocurrency/quotes/latest",
                headers=COINMARKETCAP_HEADERS,
                params=params
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=429, detail="CoinMarketCap API error")
                
            data = response.json()["data"]
            
            if from_symbol in data and to_symbol in data:
                from_price = data[from_symbol]["quote"]["USD"]["price"]
                to_price = data[to_symbol]["quote"]["USD"]["price"]
                exchange_rate = from_price / to_price
                return exchange_rate
            
            return 1.0
        except Exception as e:
            print(f"Exchange rate error: {e}")
            return 1.0

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Welcome to Akka - Your Crypto Banking Super-App"}

# Authentication endpoints
@api_router.post("/auth/signup")
async def signup(user_data: dict):
    """Create a new user account"""
    try:
        # In a real app, you'd hash the password and validate data
        user = {
            "id": str(uuid.uuid4()),
            "name": user_data.get("name"),
            "email": user_data.get("email"),
            "verified": False,
            "balance_eur": 0.0,
            "balance_try": 0.0,
            "crypto_portfolio": {},
            "created_at": datetime.utcnow()
        }
        
        # Store user in database
        await db.users.insert_one(user)
        
        # Remove sensitive data from response
        user.pop("password", None)
        
        return {"success": True, "user": user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/login")
async def login(credentials: dict):
    """Login user"""
    try:
        email = credentials.get("email")
        password = credentials.get("password")
        
        # In a real app, you'd verify password hash
        # For demo, we'll return a mock user
        user = {
            "id": str(uuid.uuid4()),
            "name": email.split("@")[0].title(),
            "email": email,
            "verified": True,
            "balance_eur": 3250.45,
            "balance_try": 35750.20,
            "crypto_portfolio": {
                "BTC": {"amount": 0.125, "value": 14865.25},
                "ETH": {"amount": 2.5, "value": 8350.00}
            }
        }
        
        return {"success": True, "user": user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/logout")
async def logout():
    """Logout user"""
    return {"success": True, "message": "Logged out successfully"}

@api_router.get("/crypto/prices")
async def get_crypto_prices(symbols: str = Query(default="BTC,ETH,BNB,ADA,SOL,XRP,DOGE,AVAX,DOT,MATIC")):
    """Get real-time cryptocurrency prices"""
    prices = await CoinMarketCapService.get_crypto_prices(symbols)
    return {"prices": prices, "timestamp": datetime.utcnow().isoformat()}

@api_router.get("/crypto/trending")
async def get_trending():
    """Get top trending cryptocurrencies"""
    prices = await CoinMarketCapService.get_crypto_prices("BTC,ETH,BNB,ADA,SOL,XRP,DOGE,AVAX,DOT,MATIC,LINK,UNI,LTC,BCH,ATOM")
    
    # Sort by market cap descending, handle None values
    trending = sorted(prices.values(), key=lambda x: x.get("market_cap", 0) or 0, reverse=True)[:10]
    return {"trending": trending}

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user_data = await db.users.find_one({"id": user_id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_data)

@api_router.post("/swap")
async def crypto_swap(swap_request: SwapRequest):
    """Simulate cryptocurrency swap"""
    try:
        # Get exchange rate
        exchange_rate = await CoinMarketCapService.get_exchange_rate(
            swap_request.from_currency, 
            swap_request.to_currency
        )
        
        # Calculate receive amount (with 0.5% fee)
        fee = 0.005
        receive_amount = (swap_request.amount * exchange_rate) * (1 - fee)
        
        # Create transaction record
        transaction = Transaction(
            user_id=swap_request.user_id,
            transaction_type="crypto_swap",
            from_currency=swap_request.from_currency,
            to_currency=swap_request.to_currency,
            from_amount=swap_request.amount,
            to_amount=receive_amount,
            exchange_rate=exchange_rate
        )
        
        await db.transactions.insert_one(transaction.dict())
        
        # Update user portfolio (simplified - in real app, check user balance first)
        user_data = await db.users.find_one({"id": swap_request.user_id})
        if user_data:
            portfolio = user_data.get("crypto_portfolio", {})
            
            # Subtract from currency
            from_balance = portfolio.get(swap_request.from_currency, 0)
            if from_balance >= swap_request.amount:
                portfolio[swap_request.from_currency] = from_balance - swap_request.amount
                
                # Add to currency
                to_balance = portfolio.get(swap_request.to_currency, 0)
                portfolio[swap_request.to_currency] = to_balance + receive_amount
                
                # Update user
                await db.users.update_one(
                    {"id": swap_request.user_id},
                    {"$set": {"crypto_portfolio": portfolio}}
                )
        
        return {
            "success": True,
            "transaction_id": transaction.id,
            "exchange_rate": exchange_rate,
            "receive_amount": receive_amount,
            "fee_percentage": fee * 100
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Swap failed: {str(e)}")

@api_router.get("/users/{user_id}/transactions")
async def get_user_transactions(user_id: str):
    """Get user transaction history"""
    transactions = await db.transactions.find({"user_id": user_id}).sort("timestamp", -1).to_list(100)
    return {"transactions": [Transaction(**t) for t in transactions]}

@api_router.post("/users/{user_id}/topup")
async def fiat_topup(user_id: str, currency: str, amount: float):
    """Simulate fiat currency top-up"""
    user_data = await db.users.find_one({"id": user_id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    if currency == "EUR":
        new_balance = user_data.get("eur_balance", 0) + amount
        await db.users.update_one({"id": user_id}, {"$set": {"eur_balance": new_balance}})
    elif currency == "TRY":
        new_balance = user_data.get("try_balance", 0) + amount
        await db.users.update_one({"id": user_id}, {"$set": {"try_balance": new_balance}})
    else:
        raise HTTPException(status_code=400, detail="Invalid currency")
    
    # Create transaction record
    transaction = Transaction(
        user_id=user_id,
        transaction_type="fiat_topup",
        from_currency="BANK",
        to_currency=currency,
        from_amount=amount,
        to_amount=amount,
        exchange_rate=1.0
    )
    await db.transactions.insert_one(transaction.dict())
    
    return {"success": True, "new_balance": new_balance, "currency": currency}

@api_router.get("/exchange-rates")
async def get_exchange_rates():
    """Get current exchange rates between major currencies"""
    return {
        "EUR_TRY": 34.2,
        "USD_EUR": 0.92,
        "USD_TRY": 31.5,
        "timestamp": datetime.utcnow().isoformat()
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()