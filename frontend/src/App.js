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

const CryptoCard = ({ crypto, portfolio }) => {
  const isPositive = crypto.change_24h >= 0;
  const holding = portfolio[crypto.symbol] || 0;
  const value = holding * crypto.price;
  
  return (
    <div className="crypto-card">
      <div className="crypto-header">
        <div className="crypto-info">
          <div className={`crypto-icon ${crypto.symbol.toLowerCase()}`}>
            {crypto.symbol.charAt(0)}
          </div>
          <div>
            <h4 className="crypto-name">{crypto.symbol}</h4>
            <p className="crypto-holding">{holding.toFixed(4)} {crypto.symbol}</p>
          </div>
        </div>
        <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{crypto.change_24h?.toFixed(2)}%
        </div>
      </div>
      
      <div className="crypto-values">
        <div className="crypto-price">${crypto.price?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</div>
        <div className="crypto-value">${value.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
      </div>
    </div>
  );
};

const BalanceCard = ({ title, amount, currency, isMain, subtitle }) => (
  <div className={`balance-card ${isMain ? 'main-balance' : 'secondary-balance'}`}>
    <div className="balance-header">
      <h3 className="balance-title">{title}</h3>
      {subtitle && <p className="balance-subtitle">{subtitle}</p>}
    </div>
    <div className="balance-amount">
      <span className="amount">{amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
      <span className="currency">{currency}</span>
    </div>
  </div>
);

const TransactionItem = ({ transaction }) => (
  <div className="transaction-item">
    <div className="transaction-icon">
      <span>{transaction.icon}</span>
    </div>
    <div className="transaction-details">
      <div className="transaction-description">{transaction.description}</div>
      <div className="transaction-date">{transaction.date}</div>
    </div>
    <div className={`transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
      {transaction.currency === 'SWAP' ? '' : 
        `${transaction.amount >= 0 ? '+' : ''}${transaction.amount.toLocaleString(undefined, {minimumFractionDigits: 2})} ${transaction.currency}`
      }
    </div>
  </div>
);

const QuickAction = ({ icon, title, onClick, color = 'primary' }) => (
  <button className={`quick-action ${color}`} onClick={onClick}>
    <div className="action-icon">{icon}</div>
    <span className="action-title">{title}</span>
  </button>
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
    <div className="swap-widget">
      <div className="swap-header">
        <h3>Instant Swap</h3>
        <p>Trade crypto instantly with live rates</p>
      </div>
      
      <div className="swap-form">
        {/* From Section */}
        <div className="swap-section">
          <label>From</label>
          <div className="swap-input-group">
            <select value={fromCrypto} onChange={(e) => setFromCrypto(e.target.value)} className="crypto-select">
              {availableCryptos.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.001"
              className="amount-input"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="swap-button-container">
          <button className="swap-toggle">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
            </svg>
          </button>
        </div>

        {/* To Section */}
        <div className="swap-section">
          <label>To</label>
          <div className="swap-input-group">
            <select value={toCrypto} onChange={(e) => setToCrypto(e.target.value)} className="crypto-select">
              {availableCryptos.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
            <div className="amount-display">
              {estimatedReceive.toFixed(6)}
            </div>
          </div>
        </div>

        {/* Rate Info */}
        <div className="swap-rate">
          <div className="rate-info">
            <span>Rate: 1 {fromCrypto} = {estimatedReceive > 0 ? (estimatedReceive / parseFloat(amount || 1)).toFixed(6) : '0'} {toCrypto}</span>
            <span>Fee: 0.5%</span>
          </div>
        </div>

        <button onClick={handleSwap} className="swap-execute-button">
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
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 30000);
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
        BTC: { symbol: 'BTC', name: 'Bitcoin', price: 118922, change_24h: 2.5, volume_24h: 15000000000 },
        ETH: { symbol: 'ETH', name: 'Ethereum', price: 3340, change_24h: 1.8, volume_24h: 8000000000 },
        BNB: { symbol: 'BNB', name: 'BNB', price: 695, change_24h: -0.5, volume_24h: 1000000000 },
        ADA: { symbol: 'ADA', name: 'Cardano', price: 1.15, change_24h: 3.2, volume_24h: 500000000 },
        SOL: { symbol: 'SOL', name: 'Solana', price: 264, change_24h: 4.1, volume_24h: 2000000000 }
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

  const calculateTotalPortfolioValue = () => {
    let totalValue = 0;
    Object.entries(user.crypto_portfolio).forEach(([symbol, amount]) => {
      if (cryptoPrices[symbol]) {
        totalValue += amount * cryptoPrices[symbol].price;
      }
    });
    return totalValue;
  };

  const calculateTotalBalance = () => {
    return user.eur_balance + user.try_balance * 0.029 + calculateTotalPortfolioValue(); // Convert TRY to EUR approximation
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="akka-logo">
          <div className="logo-gradient"></div>
          <span>akka</span>
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="akka-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-top">
          <div className="user-greeting">
            <h1>Good morning, {user.name.split(' ')[0]} ✨</h1>
            <p>Tuesday, January 22</p>
          </div>
          <div className="header-actions">
            <button className="notification-btn">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
              </svg>
            </button>
            <button className="profile-btn">
              <div className="profile-avatar">{user.name.charAt(0)}</div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'home' && (
          <div className="home-content">
            {/* Total Balance */}
            <div className="total-balance-section">
              <BalanceCard
                title="Total Balance"
                amount={calculateTotalBalance()}
                currency="EUR"
                isMain={true}
                subtitle="All accounts"
              />
            </div>

            {/* Account Balances */}
            <div className="account-balances">
              <div className="accounts-header">
                <h3>Your Accounts</h3>
                <button className="add-account-btn">+</button>
              </div>
              <div className="accounts-grid">
                <BalanceCard title="Euro Account" amount={user.eur_balance} currency="EUR" />
                <BalanceCard title="Turkish Lira" amount={user.try_balance} currency="TRY" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <div className="actions-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="actions-grid">
                <QuickAction icon="+" title="Top Up" color="success" />
                <QuickAction icon="↗" title="Send" color="primary" />
                <QuickAction icon="🔄" title="Swap" onClick={() => setActiveTab('swap')} color="crypto" />
                <QuickAction icon="💳" title="Card" color="secondary" />
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="recent-transactions">
              <div className="transactions-header">
                <h3>Recent Activity</h3>
                <button className="see-all-btn">See all</button>
              </div>
              <div className="transactions-list">
                {RECENT_TRANSACTIONS.slice(0, 4).map(transaction => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crypto' && (
          <div className="crypto-content">
            <div className="crypto-header">
              <h2>Your Crypto</h2>
              <div className="crypto-total">
                <span>Portfolio Value</span>
                <span className="crypto-total-amount">${calculateTotalPortfolioValue().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
            
            <div className="crypto-list">
              {Object.values(cryptoPrices).map((crypto) => (
                <CryptoCard key={crypto.symbol} crypto={crypto} portfolio={user.crypto_portfolio} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'swap' && (
          <div className="swap-content">
            <SwapWidget cryptoPrices={cryptoPrices} onSwap={handleSwap} />
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="cards-content">
            <div className="virtual-card">
              <div className="card-header">
                <h3>Virtual Card</h3>
                <div className="card-status active">Active</div>
              </div>
              <div className="card-visual">
                <div className="akka-card">
                  <div className="card-top">
                    <div className="card-logo">akka</div>
                    <div className="card-type">VISA</div>
                  </div>
                  <div className="card-number">**** **** **** 8472</div>
                  <div className="card-bottom">
                    <div className="card-holder">{user.name.toUpperCase()}</div>
                    <div className="card-expiry">12/28</div>
                  </div>
                </div>
              </div>
              <div className="card-actions">
                <button className="card-action-btn primary">View Details</button>
                <button className="card-action-btn secondary">Freeze Card</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6zm5-.793V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/>
            <path d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"/>
          </svg>
          <span>Home</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'crypto' ? 'active' : ''}`}
          onClick={() => setActiveTab('crypto')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 13a3.5 3.5 0 0 1-.369-6.98 5.5 5.5 0 0 1 10.738 0A3.5 3.5 0 0 1 10.5 13H5.5z"/>
          </svg>
          <span>Crypto</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'swap' ? 'active' : ''}`}
          onClick={() => setActiveTab('swap')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
          </svg>
          <span>Swap</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H0V4z"/>
            <path d="M0 7v5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V7H0zm3 2h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z"/>
          </svg>
          <span>Cards</span>
        </button>
      </nav>
    </div>
  );
}

export default App;