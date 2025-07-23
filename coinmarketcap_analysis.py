#!/usr/bin/env python3
"""
CoinMarketCap Integration Analysis
Focused test to understand why only 7-8 coins are showing instead of 30
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
load_dotenv('/app/backend/.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

# FEATURED_CRYPTOS from frontend (30 cryptocurrencies)
FEATURED_CRYPTOS = [
    'BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'AVAX', 'MATIC', 'ATOM', 'LINK', 'UNI', 
    'AAVE', 'SAND', 'MANA', 'CRV', 'SUSHI', 'YFI', 'BAT', 'ZRX', 'XTZ', 'ALGO',
    'VET', 'ENJ', 'LRC', 'GRT', 'COMP', 'MKR', 'SNX', 'BAL', 'REN', 'KNC'
]

print("=" * 80)
print("COINMARKETCAP INTEGRATION ANALYSIS")
print("=" * 80)
print(f"Testing backend at: {API_BASE_URL}")
print(f"Expected cryptocurrencies: {len(FEATURED_CRYPTOS)}")
print(f"FEATURED_CRYPTOS: {', '.join(FEATURED_CRYPTOS)}")
print()

def test_default_crypto_prices():
    """Test the default crypto prices endpoint"""
    print("1. TESTING DEFAULT CRYPTO PRICES ENDPOINT")
    print("-" * 50)
    
    try:
        response = requests.get(f"{API_BASE_URL}/crypto/prices")
        
        if response.status_code == 200:
            data = response.json()
            prices = data.get("prices", {})
            
            print(f"✅ API Response Status: {response.status_code}")
            print(f"✅ Total cryptocurrencies returned: {len(prices)}")
            print(f"✅ Cryptocurrencies found: {', '.join(prices.keys())}")
            print()
            
            # Check which FEATURED_CRYPTOS are missing
            found_cryptos = set(prices.keys())
            featured_cryptos_set = set(FEATURED_CRYPTOS)
            missing_cryptos = featured_cryptos_set - found_cryptos
            
            print(f"📊 FEATURED_CRYPTOS found: {len(found_cryptos & featured_cryptos_set)}/{len(FEATURED_CRYPTOS)}")
            print(f"❌ Missing FEATURED_CRYPTOS: {', '.join(sorted(missing_cryptos))}")
            print()
            
            # Check if we're getting real data
            btc_price = prices.get("BTC", {}).get("price", 0)
            is_real_data = btc_price > 10000 and btc_price != 42000.0
            
            if is_real_data:
                print(f"✅ Real CoinMarketCap data detected (BTC: ${btc_price:,.2f})")
            else:
                print(f"⚠️  Mock/fallback data detected (BTC: ${btc_price:,.2f})")
            
            return prices
        else:
            print(f"❌ API Error: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return {}
            
    except Exception as e:
        print(f"❌ Connection Error: {str(e)}")
        return {}

def test_custom_crypto_prices():
    """Test with all FEATURED_CRYPTOS"""
    print("\n2. TESTING WITH ALL FEATURED_CRYPTOS")
    print("-" * 50)
    
    try:
        # Test with all 30 FEATURED_CRYPTOS
        symbols_param = ",".join(FEATURED_CRYPTOS)
        response = requests.get(f"{API_BASE_URL}/crypto/prices?symbols={symbols_param}")
        
        if response.status_code == 200:
            data = response.json()
            prices = data.get("prices", {})
            
            print(f"✅ API Response Status: {response.status_code}")
            print(f"✅ Requested: {len(FEATURED_CRYPTOS)} cryptocurrencies")
            print(f"✅ Received: {len(prices)} cryptocurrencies")
            print()
            
            # Detailed analysis
            found_cryptos = set(prices.keys())
            featured_cryptos_set = set(FEATURED_CRYPTOS)
            missing_cryptos = featured_cryptos_set - found_cryptos
            
            print(f"📊 Success Rate: {len(found_cryptos & featured_cryptos_set)}/{len(FEATURED_CRYPTOS)} ({(len(found_cryptos & featured_cryptos_set)/len(FEATURED_CRYPTOS)*100):.1f}%)")
            
            if missing_cryptos:
                print(f"❌ Missing cryptocurrencies ({len(missing_cryptos)}): {', '.join(sorted(missing_cryptos))}")
            else:
                print("✅ All FEATURED_CRYPTOS found!")
            
            print(f"✅ Found cryptocurrencies: {', '.join(sorted(found_cryptos))}")
            
            return prices
        else:
            print(f"❌ API Error: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return {}
            
    except Exception as e:
        print(f"❌ Connection Error: {str(e)}")
        return {}

def test_coinmarketcap_api_limits():
    """Test CoinMarketCap API rate limits and capabilities"""
    print("\n3. COINMARKETCAP API ANALYSIS")
    print("-" * 50)
    
    # Check environment variables
    api_key = os.environ.get('COINMARKETCAP_API_KEY')
    print(f"API Key: {api_key}")
    
    if not api_key:
        print("❌ No CoinMarketCap API key found in environment")
        return
    
    # Test direct API call to understand limits
    try:
        headers = {
            "X-CMC_PRO_API_KEY": api_key,
            "Accept": "application/json"
        }
        
        # Test with a small batch first
        test_symbols = "BTC,ETH,ADA,DOT,SOL"
        params = {"symbol": test_symbols, "convert": "USD"}
        
        response = requests.get(
            "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
            headers=headers,
            params=params
        )
        
        print(f"Direct CoinMarketCap API Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Direct API call successful")
            print(f"✅ Returned data for: {', '.join(data.get('data', {}).keys())}")
            
            # Test with all FEATURED_CRYPTOS
            print("\nTesting with all 30 FEATURED_CRYPTOS...")
            all_symbols = ",".join(FEATURED_CRYPTOS)
            params_all = {"symbol": all_symbols, "convert": "USD"}
            
            response_all = requests.get(
                "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
                headers=headers,
                params=params_all
            )
            
            print(f"All symbols API Status: {response_all.status_code}")
            
            if response_all.status_code == 200:
                data_all = response_all.json()
                returned_symbols = list(data_all.get('data', {}).keys())
                print(f"✅ Successfully retrieved {len(returned_symbols)}/30 cryptocurrencies")
                print(f"✅ Returned symbols: {', '.join(returned_symbols)}")
                
                missing = set(FEATURED_CRYPTOS) - set(returned_symbols)
                if missing:
                    print(f"❌ Missing symbols: {', '.join(sorted(missing))}")
                    print("💡 These symbols may not exist on CoinMarketCap or have different names")
            else:
                print(f"❌ Failed to get all symbols: {response_all.text}")
                
        elif response.status_code == 429:
            print("❌ Rate limit exceeded")
        elif response.status_code == 401:
            print("❌ Invalid API key")
        else:
            print(f"❌ API Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Direct API test error: {str(e)}")

def main():
    """Run all analysis tests"""
    
    # Test 1: Default endpoint
    default_prices = test_default_crypto_prices()
    
    # Test 2: Custom endpoint with all FEATURED_CRYPTOS
    custom_prices = test_custom_crypto_prices()
    
    # Test 3: Direct CoinMarketCap API analysis
    test_coinmarketcap_api_limits()
    
    # Summary
    print("\n" + "=" * 80)
    print("ANALYSIS SUMMARY")
    print("=" * 80)
    
    print(f"Expected cryptocurrencies (FEATURED_CRYPTOS): {len(FEATURED_CRYPTOS)}")
    print(f"Default endpoint returns: {len(default_prices)} cryptocurrencies")
    print(f"Custom endpoint returns: {len(custom_prices)} cryptocurrencies")
    
    if len(custom_prices) < len(FEATURED_CRYPTOS):
        print(f"\n🔍 ROOT CAUSE ANALYSIS:")
        print(f"   - Frontend expects {len(FEATURED_CRYPTOS)} cryptocurrencies")
        print(f"   - Backend only returns {len(custom_prices)} cryptocurrencies")
        print(f"   - This explains why only 7-8 coins are showing instead of 30")
        
        missing_count = len(FEATURED_CRYPTOS) - len(custom_prices)
        print(f"   - {missing_count} cryptocurrencies are missing from the API response")
        
        if custom_prices:
            found_cryptos = set(custom_prices.keys())
            featured_cryptos_set = set(FEATURED_CRYPTOS)
            missing_cryptos = featured_cryptos_set - found_cryptos
            print(f"   - Missing symbols: {', '.join(sorted(missing_cryptos))}")
    else:
        print(f"\n✅ All FEATURED_CRYPTOS are available from the API")
    
    print(f"\n💡 RECOMMENDATIONS:")
    if len(custom_prices) < len(FEATURED_CRYPTOS):
        print(f"   1. Update FEATURED_CRYPTOS array to only include symbols available from CoinMarketCap")
        print(f"   2. Or implement fallback data for missing cryptocurrencies")
        print(f"   3. Or use CoinMarketCap's cryptocurrency/listings/latest endpoint for discovery")
    else:
        print(f"   1. Backend API is working correctly with all FEATURED_CRYPTOS")
        print(f"   2. Issue may be in frontend filtering or display logic")

if __name__ == "__main__":
    main()