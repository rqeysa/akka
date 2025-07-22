import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock user data for Akka clone
const DEMO_USER = {
  id: "demo-user-123",
  name: "Carlos Martinez",
  email: "carlos@akka.com",
  verified: true,
  balance_eur: 3250.45,
  total_portfolio: 8750.30,
  crypto_portfolio: {
    BTC: { amount: 0.1250, value: 14865.25 },
    ETH: { amount: 2.5, value: 8350.00 },
    ADA: { amount: 1500, value: 1725.00 },
    DOT: { amount: 75, value: 525.00 },
    SOL: { amount: 12, value: 3168.00 }
  }
};

const RECENT_TRANSACTIONS = [
  { id: 1, type: 'buy', crypto: 'BTC', amount: 0.025, eur_amount: 2970.50, date: '2025-01-22 14:30', status: 'completed' },
  { id: 2, type: 'sell', crypto: 'ETH', amount: 0.5, eur_amount: 1670.00, date: '2025-01-22 12:15', status: 'completed' },
  { id: 3, type: 'deposit', crypto: 'EUR', amount: 500.00, date: '2025-01-21 18:45', status: 'completed' },
  { id: 4, type: 'buy', crypto: 'ADA', amount: 500, eur_amount: 575.00, date: '2025-01-21 16:20', status: 'pending' },
  { id: 5, type: 'withdraw', crypto: 'BTC', amount: 0.01, date: '2025-01-21 10:30', status: 'completed' }
];

const FEATURED_CRYPTOS = ['BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'MATIC', 'LINK', 'AVAX'];

const CryptoListItem = ({ crypto, onBuy }) => {
  const isPositive = crypto.change_24h >= 0;
  
  return (
    <div className="crypto-list-item">
      <div className="crypto-info">
        <div className={`crypto-icon ${crypto.symbol.toLowerCase()}`}>
          {crypto.symbol.charAt(0)}
        </div>
        <div className="crypto-details">
          <div className="crypto-name">
            <span className="symbol">{crypto.symbol}</span>
            <span className="name">{crypto.name}</span>
          </div>
          <div className="crypto-price">€{crypto.price?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</div>
        </div>
      </div>
      <div className="crypto-actions">
        <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{crypto.change_24h?.toFixed(2)}%
        </div>
        <button className="buy-btn" onClick={() => onBuy(crypto)}>
          Buy
        </button>
      </div>
    </div>
  );
};

const PortfolioItem = ({ crypto, data }) => (
  <div className="portfolio-item">
    <div className="portfolio-crypto">
      <div className={`crypto-icon ${crypto.toLowerCase()}`}>
        {crypto.charAt(0)}
      </div>
      <div className="portfolio-details">
        <div className="portfolio-crypto-name">{crypto}</div>
        <div className="portfolio-amount">{data.amount} {crypto}</div>
      </div>
    </div>
    <div className="portfolio-value">
      <div className="value-eur">€{data.value.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
      <div className="value-change positive">+2.45%</div>
    </div>
  </div>
);

const TransactionItem = ({ transaction }) => {
  const getTransactionIcon = (type) => {
    switch(type) {
      case 'buy': return '↗';
      case 'sell': return '↙';
      case 'deposit': return '+';
      case 'withdraw': return '↗';
      default: return '•';
    }
  };

  const getTransactionText = (transaction) => {
    switch(transaction.type) {
      case 'buy': return `Buy ${transaction.crypto}`;
      case 'sell': return `Sell ${transaction.crypto}`;
      case 'deposit': return `EUR Deposit`;
      case 'withdraw': return `Withdraw ${transaction.crypto}`;
      default: return 'Transaction';
    }
  };

  return (
    <div className="transaction-item">
      <div className={`transaction-icon ${transaction.type}`}>
        {getTransactionIcon(transaction.type)}
      </div>
      <div className="transaction-details">
        <div className="transaction-description">{getTransactionText(transaction)}</div>
        <div className="transaction-date">{transaction.date}</div>
      </div>
      <div className="transaction-amount">
        {transaction.eur_amount ? `€${transaction.eur_amount}` : `${transaction.amount} ${transaction.crypto}`}
        <div className={`transaction-status ${transaction.status}`}>
          {transaction.status === 'completed' ? 'Completed' : 'Pending'}
        </div>
      </div>
    </div>
  );
};

const BuySellModal = ({ crypto, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [eurAmount, setEurAmount] = useState('');

  useEffect(() => {
    if (amount && crypto) {
      setEurAmount((parseFloat(amount) * crypto.price).toFixed(2));
    }
  }, [amount, crypto]);

  if (!crypto) return null;

  return (
    <div className="modal-overlay">
      <div className="buy-sell-modal">
        <div className="modal-header">
          <h3>Buy {crypto.symbol}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="crypto-info-modal">
            <div className={`crypto-icon ${crypto.symbol.toLowerCase()}`}>
              {crypto.symbol.charAt(0)}
            </div>
            <div>
              <div className="crypto-name-modal">{crypto.symbol}</div>
              <div className="crypto-price-modal">€{crypto.price?.toLocaleString()}</div>
            </div>
          </div>

          <div className="input-group">
            <label>Amount of {crypto.symbol}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`0.00 ${crypto.symbol}`}
            />
          </div>

          <div className="input-group">
            <label>Amount in EUR</label>
            <input
              type="number"
              value={eurAmount}
              onChange={(e) => {
                setEurAmount(e.target.value);
                if (e.target.value && crypto) {
                  setAmount((parseFloat(e.target.value) / crypto.price).toFixed(6));
                }
              }}
              placeholder="0.00 EUR"
            />
          </div>

          <div className="transaction-summary">
            <div className="summary-row">
              <span>Fee (1.5%)</span>
              <span>€{(eurAmount * 0.015).toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>€{(parseFloat(eurAmount || 0) * 1.015).toFixed(2)}</span>
            </div>
          </div>

          <button 
            className="confirm-buy-btn"
            onClick={() => onConfirm(crypto, amount, eurAmount)}
          >
            Confirm purchase
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [user] = useState(DEMO_USER);
  const [activeTab, setActiveTab] = useState('market');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);

  useEffect(() => {
    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCryptoPrices = async () => {
    try {
      const response = await axios.get(`${API}/crypto/prices`);
      const prices = response.data.prices;
      
      // Convert USD to EUR (approximate)
      const eurPrices = {};
      Object.keys(prices).forEach(symbol => {
        eurPrices[symbol] = {
          ...prices[symbol],
          price: prices[symbol].price * 0.92 // USD to EUR conversion
        };
      });
      
      setCryptoPrices(eurPrices);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      // Fallback mock data in EUR
      setCryptoPrices({
        BTC: { symbol: 'BTC', name: 'Bitcoin', price: 109408, change_24h: 2.1, volume_24h: 13800000000 },
        ETH: { symbol: 'ETH', name: 'Ethereum', price: 3073, change_24h: 1.5, volume_24h: 7360000000 },
        ADA: { symbol: 'ADA', name: 'Cardano', price: 1.06, change_24h: 3.2, volume_24h: 460000000 },
        DOT: { symbol: 'DOT', name: 'Polkadot', price: 7.00, change_24h: -1.8, volume_24h: 180000000 },
        SOL: { symbol: 'SOL', name: 'Solana', price: 264, change_24h: 4.1, volume_24h: 1840000000 },
        MATIC: { symbol: 'MATIC', name: 'Polygon', price: 0.45, change_24h: 2.8, volume_24h: 150000000 },
        LINK: { symbol: 'LINK', name: 'Chainlink', price: 15.20, change_24h: 1.2, volume_24h: 280000000 },
        AVAX: { symbol: 'AVAX', name: 'Avalanche', price: 45.60, change_24h: -0.8, volume_24h: 320000000 }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCrypto = (crypto) => {
    setSelectedCrypto(crypto);
    setShowBuyModal(true);
  };

  const handleConfirmBuy = (crypto, amount, eurAmount) => {
    // Simulate purchase
    alert(`Purchase confirmed: ${amount} ${crypto.symbol} for €${eurAmount}`);
    setShowBuyModal(false);
    setSelectedCrypto(null);
  };

  if (loading) {
    return (
      <div className="akka-loading">
        <div className="akka-logo">
          <div className="logo-icon">A</div>
          <span>Akka</span>
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="akka-app">
      {/* Header */}
      <header className="akka-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="akka-logo-header">
              <div className="logo-icon">A</div>
              <span>Akka</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="notification-btn">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917z"/>
              </svg>
              <span className="notification-badge">3</span>
            </button>
            <div className="user-avatar">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="akka-main">
        {activeTab === 'home' && (
          <div className="home-content">
            {/* Portfolio Summary */}
            <div className="portfolio-summary">
              <div className="summary-header">
                <h2>Hello, {user.name.split(' ')[0]} 👋</h2>
                <div className="verification-badge">
                  <span className="verified-icon">✓</span>
                  Verified
                </div>
              </div>
              
              <div className="balance-cards">
                <div className="balance-card main">
                  <div className="balance-label">Total portfolio value</div>
                  <div className="balance-amount">€{user.total_portfolio.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  <div className="balance-change positive">+€245.30 (+2.87%)</div>
                </div>
                
                <div className="balance-card secondary">
                  <div className="balance-label">EUR Balance</div>
                  <div className="balance-amount">€{user.balance_eur.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="action-btn primary" onClick={() => setActiveTab('market')}>
                <span className="action-icon">+</span>
                Buy
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">-</span>
                Sell
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">↗</span>
                Send
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">↙</span>
                Receive
              </button>
            </div>

            {/* Portfolio */}
            <div className="home-portfolio">
              <div className="section-header">
                <h3>Your portfolio</h3>
                <button className="see-all-btn">View all</button>
              </div>
              <div className="portfolio-list">
                {Object.entries(user.crypto_portfolio).map(([crypto, data]) => (
                  <PortfolioItem key={crypto} crypto={crypto} data={data} />
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <div className="section-header">
                <h3>Recent activity</h3>
                <button className="see-all-btn">View all</button>
              </div>
              <div className="transactions-list">
                {RECENT_TRANSACTIONS.slice(0, 3).map(transaction => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="market-content">
            <div className="market-header">
              <h2>Market</h2>
              <div className="market-stats">
                <span>24h Vol: €2.4B</span>
                <span className="positive">+3.2%</span>
              </div>
            </div>

            <div className="market-search">
              <input type="text" placeholder="Search cryptocurrency..." />
            </div>

            <div className="crypto-list">
              {FEATURED_CRYPTOS.map(symbol => {
                const crypto = cryptoPrices[symbol];
                if (!crypto) return null;
                return (
                  <CryptoListItem 
                    key={symbol} 
                    crypto={crypto} 
                    onBuy={handleBuyCrypto}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="portfolio-content">
            <div className="portfolio-header">
              <h2>Portfolio</h2>
              <div className="portfolio-total">
                <span>Total value</span>
                <span className="total-value">€{user.total_portfolio.toLocaleString()}</span>
              </div>
            </div>

            <div className="portfolio-chart-placeholder">
              <div className="chart-info">
                <span>Portfolio chart</span>
                <span className="chart-period">7 days</span>
              </div>
              <div className="chart-visual">
                <svg viewBox="0 0 300 100" className="chart-svg">
                  <path d="M0,60 Q75,20 150,40 T300,30" stroke="#FF6B35" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            </div>

            <div className="portfolio-breakdown">
              <h3>Asset breakdown</h3>
              <div className="assets-list">
                {Object.entries(user.crypto_portfolio).map(([crypto, data]) => (
                  <PortfolioItem key={crypto} crypto={crypto} data={data} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-content">
            <div className="history-header">
              <h2>History</h2>
              <div className="history-filters">
                <button className="filter-btn active">All</button>
                <button className="filter-btn">Buys</button>
                <button className="filter-btn">Sells</button>
              </div>
            </div>

            <div className="transactions-full-list">
              {RECENT_TRANSACTIONS.map(transaction => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-content">
            <div className="profile-header">
              <div className="profile-avatar-large">
                {user.name.charAt(0)}
              </div>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
              <div className="verification-status">
                <span className="verified-icon">✓</span>
                Verified account
              </div>
            </div>

            <div className="profile-menu">
              <div className="menu-item">
                <span className="menu-icon">👤</span>
                <span>Personal information</span>
                <span className="menu-arrow">›</span>
              </div>
              <div className="menu-item">
                <span className="menu-icon">🔒</span>
                <span>Security</span>
                <span className="menu-arrow">›</span>
              </div>
              <div className="menu-item">
                <span className="menu-icon">💳</span>
                <span>Payment methods</span>
                <span className="menu-arrow">›</span>
              </div>
              <div className="menu-item">
                <span className="menu-icon">📄</span>
                <span>Documents</span>
                <span className="menu-arrow">›</span>
              </div>
              <div className="menu-item">
                <span className="menu-icon">❓</span>
                <span>Help & support</span>
                <span className="menu-arrow">›</span>
              </div>
              <div className="menu-item">
                <span className="menu-icon">⚙️</span>
                <span>Settings</span>
                <span className="menu-arrow">›</span>
              </div>
            </div>

            <button className="logout-btn">
              Sign out
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="akka-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6z"/>
          </svg>
          <span>Home</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3zM5 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V2zM9 5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V5z"/>
          </svg>
          <span>Market</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"/>
            <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0z"/>
          </svg>
          <span>Portfolio</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
          </svg>
          <span>History</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
          </svg>
          <span>Profile</span>
        </button>
      </nav>

      {/* Buy/Sell Modal */}
      {showBuyModal && (
        <BuySellModal
          crypto={selectedCrypto}
          onClose={() => setShowBuyModal(false)}
          onConfirm={handleConfirmBuy}
        />
      )}
    </div>
  );
}

export default App;