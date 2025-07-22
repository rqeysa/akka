import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock user data for demo
const DEMO_USER = {
  id: "demo-user-123",
  name: "Alex Thompson",
  email: "alex@akka.com",
  eur_balance: 2450.75,
  try_balance: 35750.20,
  crypto_portfolio: {
    BTC: 0.05,
    ETH: 1.2,
    BNB: 25.0,
    ADA: 1000.0,
    SOL: 15.5
  }
};

// Recent transactions mock data
const RECENT_TRANSACTIONS = [
  { id: 1, type: 'crypto_buy', description: 'Bitcoin Purchase', amount: -500.00, currency: 'EUR', date: '2025-01-21', icon: '₿' },
  { id: 2, type: 'transfer_out', description: 'Transfer to Sarah', amount: -150.00, currency: 'EUR', date: '2025-01-21', icon: '↗' },
  { id: 3, type: 'card_payment', description: 'Starbucks Coffee', amount: -4.85, currency: 'EUR', date: '2025-01-20', icon: '☕' },
  { id: 4, type: 'crypto_swap', description: 'ETH → BTC', amount: 0, currency: 'SWAP', date: '2025-01-20', icon: '🔄' },
  { id: 5, type: 'top_up', description: 'Top up from Bank', amount: +1000.00, currency: 'EUR', date: '2025-01-19', icon: '+' }
];

const CryptoCard = ({ crypto }) => {
  const isPositive = crypto.change_24h >= 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{crypto.symbol}</h3>
          <p className="text-sm text-gray-500">{crypto.name}</p>
        </div>
        <div className={`px-2 py-1 rounded-md text-xs font-medium ${
          isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {isPositive ? '+' : ''}{crypto.change_24h?.toFixed(2)}%
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-lg font-bold text-gray-900">
          ${crypto.price?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}
        </p>
        <p className="text-xs text-gray-500">
          Vol: ${(crypto.volume_24h / 1e9)?.toFixed(1)}B
        </p>
      </div>
    </div>
  );
};

const BalanceCard = ({ title, amount, currency, gradient, icon }) => (
  <div className={`${gradient} rounded-xl p-6 text-white shadow-lg`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium opacity-90">{title}</h3>
      <div className="text-2xl opacity-75">{icon}</div>
    </div>
    <p className="text-3xl font-bold">
      {amount?.toLocaleString(undefined, {minimumFractionDigits: 2})} {currency}
    </p>
  </div>
);

const SwapWidget = ({ cryptoPrices, onSwap }) => {
  const [fromCrypto, setFromCrypto] = useState('BTC');
  const [toCrypto, setToCrypto] = useState('ETH');
  const [amount, setAmount] = useState('0.01');
  const [estimatedReceive, setEstimatedReceive] = useState(0);

  useEffect(() => {
    if (cryptoPrices[fromCrypto] && cryptoPrices[toCrypto] && amount) {
      const fromPrice = cryptoPrices[fromCrypto].price;
      const toPrice = cryptoPrices[toCrypto].price;
      const rate = fromPrice / toPrice;
      const receive = parseFloat(amount) * rate * 0.995; // 0.5% fee
      setEstimatedReceive(receive);
    }
  }, [fromCrypto, toCrypto, amount, cryptoPrices]);

  const handleSwap = () => {
    if (onSwap) {
      onSwap({
        from_currency: fromCrypto,
        to_currency: toCrypto,
        amount: parseFloat(amount)
      });
    }
  };

  const availableCryptos = Object.keys(cryptoPrices);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Instant Crypto Swap</h3>
      
      <div className="space-y-4">
        {/* From Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">From</label>
          <div className="flex space-x-3">
            <select
              value={fromCrypto}
              onChange={(e) => setFromCrypto(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableCryptos.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.001"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Amount"
            />
          </div>
        </div>

        {/* Swap Icon */}
        <div className="flex justify-center">
          <div className="bg-gray-100 p-2 rounded-full">
            ⇅
          </div>
        </div>

        {/* To Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">To</label>
          <div className="flex space-x-3">
            <select
              value={toCrypto}
              onChange={(e) => setToCrypto(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableCryptos.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              {estimatedReceive.toFixed(6)}
            </div>
          </div>
        </div>

        {/* Fee Info */}
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between">
            <span>Exchange Rate:</span>
            <span>1 {fromCrypto} = {estimatedReceive > 0 ? (estimatedReceive / parseFloat(amount || 1)).toFixed(6) : '0'} {toCrypto}</span>
          </div>
          <div className="flex justify-between">
            <span>Network Fee:</span>
            <span>0.5%</span>
          </div>
        </div>

        <button
          onClick={handleSwap}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
        >
          Swap {fromCrypto} → {toCrypto}
        </button>
      </div>
    </div>
  );
};

function App() {
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [user] = useState(DEMO_USER);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCryptoPrices = async () => {
    try {
      const response = await axios.get(`${API}/crypto/prices`);
      setCryptoPrices(response.data.prices);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      // Fallback mock data
      setCryptoPrices({
        BTC: { symbol: 'BTC', name: 'Bitcoin', price: 42000, change_24h: 2.5, volume_24h: 15000000000 },
        ETH: { symbol: 'ETH', name: 'Ethereum', price: 2500, change_24h: 1.8, volume_24h: 8000000000 },
        BNB: { symbol: 'BNB', name: 'BNB', price: 320, change_24h: -0.5, volume_24h: 1000000000 }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async (swapData) => {
    try {
      const response = await axios.post(`${API}/swap`, {
        user_id: user.id,
        ...swapData
      });
      
      if (response.data.success) {
        alert(`Swap successful! You received ${response.data.receive_amount.toFixed(6)} ${swapData.to_currency}`);
      }
    } catch (error) {
      console.error('Swap error:', error);
      alert('Swap simulated successfully! (Demo mode)');
    }
  };

  const calculatePortfolioValue = () => {
    let totalValue = 0;
    Object.entries(user.crypto_portfolio).forEach(([symbol, amount]) => {
      if (cryptoPrices[symbol]) {
        totalValue += amount * cryptoPrices[symbol].price;
      }
    });
    return totalValue;
  };

  const Navigation = () => (
    <nav className="bg-white border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Akka
          </h1>
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'market' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setActiveTab('swap')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'swap' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Swap
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">Premium Account</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">A</span>
          </div>
        </div>
      </div>
    </nav>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Akka...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 text-white">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h2>
                <p className="text-blue-100 mb-6">Your crypto-banking super-app with everything in one place</p>
                <div className="flex space-x-4">
                  <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                    Add Money
                  </button>
                  <button className="border border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                    Get Card
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
                <img 
                  src="https://images.unsplash.com/photo-1639815188508-13f7370f664a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxjcnlwdG98ZW58MHx8fGJsdWV8MTc1MzE0Mjg5NXww&ixlib=rb-4.1.0&q=85"
                  alt="Crypto Technology"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BalanceCard
                title="EUR Balance"
                amount={user.eur_balance}
                currency="EUR"
                gradient="bg-gradient-to-r from-green-500 to-emerald-600"
                icon="€"
              />
              <BalanceCard
                title="TRY Balance"
                amount={user.try_balance}
                currency="TRY"
                gradient="bg-gradient-to-r from-red-500 to-pink-600"
                icon="₺"
              />
              <BalanceCard
                title="Crypto Portfolio"
                amount={calculatePortfolioValue()}
                currency="USD"
                gradient="bg-gradient-to-r from-orange-500 to-amber-600"
                icon="₿"
              />
            </div>

            {/* Portfolio Holdings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Portfolio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(user.crypto_portfolio).map(([symbol, amount]) => {
                  const price = cryptoPrices[symbol]?.price || 0;
                  const value = amount * price;
                  
                  return (
                    <div key={symbol} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{symbol}</h4>
                          <p className="text-sm text-gray-500">{amount} {symbol}</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        ${value.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Crypto Market</h2>
              <div className="text-sm text-gray-500">
                Updated every 30 seconds • Powered by CoinMarketCap
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Object.values(cryptoPrices).map((crypto) => (
                <CryptoCard key={crypto.symbol} crypto={crypto} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'swap' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Instant Crypto Swap</h2>
              <p className="text-gray-600">Trade between 300+ cryptocurrencies instantly</p>
            </div>
            
            <SwapWidget cryptoPrices={cryptoPrices} onSwap={handleSwap} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;