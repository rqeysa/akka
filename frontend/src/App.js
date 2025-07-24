import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Authentication Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock user data for demo
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

// User's Multi-Currency Balances with Bank Account Info
const CURRENCY_BALANCES = {
  EUR: { 
    balance: 3250.45, 
    symbol: '€', 
    name: 'Euro',
    flag: '🇪🇺',
    change_24h: 0.0, // Base currency
    bank_info: {
      account_name: 'Carlos Martinez',
      iban: 'DE89 3704 0044 0532 0130 00',
      bic: 'AKKAEUXX',
      bank_name: 'Akka Bank Europe',
      account_type: 'Current Account',
      sort_code: '37-04-00'
    }
  },
  USD: { 
    balance: 3540.25, 
    symbol: '$', 
    name: 'US Dollar',
    flag: '🇺🇸',
    change_24h: 1.2, // vs EUR
    bank_info: {
      account_name: 'Carlos Martinez',
      account_number: '1234567890',
      routing_number: '021000021',
      bank_name: 'Akka Bank USA',
      account_type: 'Checking Account',
      swift: 'AKKAUSXX'
    }
  },
  TRY: { 
    balance: 89750.30, 
    symbol: '₺', 
    name: 'Turkish Lira',
    flag: '🇹🇷',
    change_24h: -0.8, // vs EUR
    bank_info: {
      account_name: 'Carlos Martinez',
      iban: 'TR33 0006 1005 1978 6457 8413 26',
      bank_name: 'Akka Bank Türkiye',
      account_type: 'Vadesiz Hesap',
      branch_code: '1005',
      swift: 'AKKATRXX'
    }
  },
  GBP: { 
    balance: 2780.90, 
    symbol: '£', 
    name: 'British Pound',
    flag: '🇬🇧',
    change_24h: 0.3, // vs EUR
    bank_info: {
      account_name: 'Carlos Martinez',
      account_number: '12345678',
      sort_code: '20-00-00',
      bank_name: 'Akka Bank UK',
      account_type: 'Current Account',
      swift: 'AKKAGBXX'
    }
  }
};

// User's Cards Data
const USER_CARDS = [
  {
    id: "card-1",
    type: "debit",
    name: "Akka Debit Card",
    number: "**** **** **** 4567",
    balance: DEMO_USER.balance_eur, // Connected to EUR balance
    currency: "EUR",
    status: "active",
    created_date: "2024-12-15",
    monthly_limit: 5000,
    spent_this_month: 1847.25,
    last_transaction: "2025-01-22",
    card_color: "gradient-blue",
    connected_to: "eur_balance",
    description: "Connected to your EUR balance"
  },
  {
    id: "card-2", 
    type: "crypto",
    name: "Akka Crypto Card",
    number: "**** **** **** 7891",
    balance: DEMO_USER.total_portfolio, // Connected to crypto portfolio
    currency: "EUR",
    status: "active",
    created_date: "2024-11-20",
    monthly_limit: 3000,
    spent_this_month: 924.70,
    last_transaction: "2025-01-21",
    card_color: "gradient-black",
    connected_to: "crypto_portfolio",
    description: "Connected to your crypto portfolio"
  }
];

// Card Spending History
const CARD_SPENDING_HISTORY = [
  { id: 1, card_id: "card-1", merchant: "Amazon", amount: 89.99, category: "Shopping", date: "2025-01-22 16:45", status: "completed", payment_source: "EUR Balance" },
  { id: 2, card_id: "card-1", merchant: "Starbucks", amount: 4.50, category: "Food & Drink", date: "2025-01-22 09:15", status: "completed", payment_source: "EUR Balance" },
  { id: 3, card_id: "card-2", merchant: "Shell", amount: 65.00, category: "Gas", date: "2025-01-21 18:30", status: "completed", payment_source: "Auto-converted from BTC" },
  { id: 4, card_id: "card-1", merchant: "Netflix", amount: 15.99, category: "Entertainment", date: "2025-01-21 12:00", status: "completed", payment_source: "EUR Balance" },
  { id: 5, card_id: "card-2", merchant: "Uber", amount: 23.40, category: "Transport", date: "2025-01-20 22:15", status: "completed", payment_source: "Auto-converted from ETH" },
  { id: 6, card_id: "card-1", merchant: "Migros", amount: 127.85, category: "Groceries", date: "2025-01-20 14:20", status: "completed", payment_source: "EUR Balance" },
  { id: 7, card_id: "card-2", merchant: "Apple Store", amount: 199.00, category: "Technology", date: "2025-01-19 16:30", status: "completed", payment_source: "Auto-converted from SOL" },
  { id: 8, card_id: "card-1", merchant: "Zara", amount: 85.50, category: "Shopping", date: "2025-01-19 13:45", status: "completed", payment_source: "EUR Balance" }
];

const RECENT_TRANSACTIONS = [
  { id: 1, type: 'buy', crypto: 'BTC', amount: 0.025, eur_amount: 2970.50, date: '2025-01-22 14:30', status: 'completed' },
  { id: 2, type: 'sell', crypto: 'ETH', amount: 0.5, eur_amount: 1670.00, date: '2025-01-22 12:15', status: 'completed' },
  { id: 3, type: 'deposit', crypto: 'EUR', amount: 500.00, date: '2025-01-21 18:45', status: 'completed' },
  { id: 4, type: 'buy', crypto: 'ADA', amount: 500, eur_amount: 575.00, date: '2025-01-21 16:20', status: 'pending' },
  { id: 5, type: 'send', crypto: 'BTC', amount: 0.01, eur_amount: 1185.30, recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', date: '2025-01-21 10:30', status: 'completed' },
  { id: 6, type: 'receive', crypto: 'ETH', amount: 1.2, eur_amount: 4020.00, sender: 'John Doe', date: '2025-01-20 22:45', status: 'completed' },
  { id: 7, type: 'send', crypto: 'EUR', amount: 250.00, recipient: 'Maria Garcia', recipient_iban: 'ES12 1234 5678 9012 3456 7890', date: '2025-01-20 16:30', status: 'completed' },
  { id: 8, type: 'buy', crypto: 'SOL', amount: 15, eur_amount: 2730.00, date: '2025-01-20 11:20', status: 'completed' },
  { id: 9, type: 'receive', crypto: 'USD', amount: 800.00, sender: 'David Smith', sender_iban: 'DE89 3704 0044 0532 0130 00', date: '2025-01-19 19:15', status: 'completed' },
  { id: 10, type: 'sell', crypto: 'ADA', amount: 200, eur_amount: 230.00, date: '2025-01-19 14:10', status: 'completed' },
  { id: 11, type: 'send', crypto: 'DOT', amount: 25, eur_amount: 175.25, recipient: '13UVJyLnbVp77Z2t6rN2fD3UZEYfUq', date: '2025-01-19 09:05', status: 'completed' },
  { id: 12, type: 'receive', crypto: 'TRY', amount: 1500.00, sender: 'Ahmed Hassan', sender_iban: 'TR33 0006 1005 1978 6457 8413 26', date: '2025-01-18 20:30', status: 'completed' }
];

const FEATURED_CRYPTOS = [
  'BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'AVAX', 'MATIC', 'ATOM', 'LINK', 'UNI', 
  'AAVE', 'SAND', 'MANA', 'CRV', 'SUSHI', 'YFI', 'BAT', 'ZRX', 'XTZ', 'ALGO',
  'VET', 'ENJ', 'LRC', 'GRT', 'COMP', 'MKR', 'SNX', 'BAL', 'REN', 'KNC'
];

// Login Page Component
const LoginPage = ({ onLogin, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email && password) {
        onLogin({
          email,
          name: email.split('@')[0],
          id: 'user-' + Date.now()
        });
      } else {
        setError('Please fill in all fields');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon"></div>
          <h1>Akka</h1>
        </div>

        {/* Welcome Text */}
        <div className="auth-header">
          <h2>Welcome back</h2>
          <p>Sign in to your Akka account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Forgot Password */}
        <button className="forgot-password-btn">
          Forgot password?
        </button>

        {/* Switch to Signup */}
        <div className="auth-switch">
          <span>Don't have an account? </span>
          <button onClick={onSwitchToSignup} className="switch-btn">
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

// Signup Page Component
const SignupPage = ({ onSignup, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.password) {
        setError('Please fill in all fields');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSignup({
        email: formData.email,
        name: formData.name,
        id: 'user-' + Date.now()
      });
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon"></div>
          <h1>Akka</h1>
        </div>

        {/* Welcome Text */}
        <div className="auth-header">
          <h2>Create account</h2>
          <p>Join Akka and start trading crypto</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Terms */}
        <p className="auth-terms">
          By creating an account, you agree to our{' '}
          <button className="terms-link">Terms of Service</button> and{' '}
          <button className="terms-link">Privacy Policy</button>
        </p>

        {/* Switch to Login */}
        <div className="auth-switch">
          <span>Already have an account? </span>
          <button onClick={onSwitchToLogin} className="switch-btn">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Components (keeping existing ones)
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
      case 'send': return '📤';
      case 'receive': return '📥';
      default: return '•';
    }
  };

  const getTransactionText = (transaction) => {
    switch(transaction.type) {
      case 'buy': return `Buy ${transaction.crypto}`;
      case 'sell': return `Sell ${transaction.crypto}`;
      case 'deposit': return `EUR Deposit`;
      case 'withdraw': return `Withdraw ${transaction.crypto}`;
      case 'send': 
        if (transaction.recipient_iban) {
          return `Send ${transaction.crypto} to ${transaction.recipient}`;
        } else {
          return `Send ${transaction.crypto}`;
        }
      case 'receive':
        if (transaction.sender) {
          return `Receive ${transaction.crypto} from ${transaction.sender}`;
        } else {
          return `Receive ${transaction.crypto}`;
        }
      default: return 'Transaction';
    }
  };

  const getTransactionAmount = (transaction) => {
    const isNegative = transaction.type === 'buy' || transaction.type === 'send';
    const prefix = isNegative ? '-' : '+';
    
    if (transaction.eur_amount) {
      return `${prefix}€${transaction.eur_amount}`;
    } else {
      return `${prefix}${transaction.amount} ${transaction.crypto}`;
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
        {getTransactionAmount(transaction)}
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

// Sell Modal Component
const SellModal = ({ onClose }) => {
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [amount, setAmount] = useState('');
  const [eurAmount, setEurAmount] = useState('');
  
  const userCryptos = Object.keys(DEMO_USER.crypto_portfolio);

  const handleSell = () => {
    alert(`Sell order placed: ${amount} ${selectedCrypto} for €${eurAmount}`);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="buy-sell-modal">
        <div className="modal-header">
          <h3>Sell Crypto</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="input-group">
            <label>Select Crypto to Sell</label>
            <select 
              value={selectedCrypto} 
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className="crypto-select"
            >
              <option value="">Choose cryptocurrency</option>
              {userCryptos.map(crypto => (
                <option key={crypto} value={crypto}>
                  {crypto} (Available: {DEMO_USER.crypto_portfolio[crypto].amount})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Amount to Sell</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`0.00 ${selectedCrypto}`}
            />
          </div>

          <div className="input-group">
            <label>Estimated EUR Value</label>
            <input
              type="number"
              value={eurAmount}
              onChange={(e) => setEurAmount(e.target.value)}
              placeholder="0.00 EUR"
            />
          </div>

          <button 
            className="confirm-buy-btn"
            onClick={handleSell}
            disabled={!selectedCrypto || !amount}
          >
            Confirm Sale
          </button>
        </div>
      </div>
    </div>
  );
};

// Send Modal Component  
const SendModal = ({ onClose }) => {
  const [sendType, setSendType] = useState('crypto'); // 'crypto' or 'fiat'
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientIBAN, setRecipientIBAN] = useState('');
  const [recipientName, setRecipientName] = useState('');
  
  const userCryptos = Object.keys(DEMO_USER.crypto_portfolio);
  const fiatCurrencies = [
    { code: 'EUR', name: 'Euro', balance: DEMO_USER.balance_eur },
    { code: 'USD', name: 'US Dollar', balance: 2650.75 }, // Mock USD balance
    { code: 'TRY', name: 'Turkish Lira', balance: 5420.30 } // Mock TRY balance
  ];

  const handleSend = () => {
    if (sendType === 'crypto') {
      alert(`Send initiated: ${amount} ${selectedCurrency} to ${recipient}`);
    } else {
      alert(`Bank transfer initiated: ${amount} ${selectedCurrency} to ${recipientName} (IBAN: ${recipientIBAN})`);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="buy-sell-modal">
        <div className="modal-header">
          <h3>Send Money</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* Send Type Selection */}
          <div className="input-group">
            <label>Send Type</label>
            <div className="send-type-tabs">
              <button 
                className={`send-type-tab ${sendType === 'crypto' ? 'active' : ''}`}
                onClick={() => setSendType('crypto')}
              >
                Crypto
              </button>
              <button 
                className={`send-type-tab ${sendType === 'fiat' ? 'active' : ''}`}
                onClick={() => setSendType('fiat')}
              >
                Bank Transfer
              </button>
            </div>
          </div>

          {sendType === 'crypto' ? (
            <>
              <div className="input-group">
                <label>Select Crypto to Send</label>
                <select 
                  value={selectedCurrency} 
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="crypto-select"
                >
                  <option value="">Choose cryptocurrency</option>
                  {userCryptos.map(crypto => (
                    <option key={crypto} value={crypto}>
                      {crypto} (Available: {DEMO_USER.crypto_portfolio[crypto].amount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Recipient Wallet Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter wallet address"
                />
              </div>
            </>
          ) : (
            <>
              <div className="input-group">
                <label>Select Currency</label>
                <select 
                  value={selectedCurrency} 
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="crypto-select"
                >
                  <option value="">Choose currency</option>
                  {fiatCurrencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.code}) - Balance: {currency.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Recipient Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Enter recipient full name"
                />
              </div>

              <div className="input-group">
                <label>Recipient IBAN</label>
                <input
                  type="text"
                  value={recipientIBAN}
                  onChange={(e) => setRecipientIBAN(e.target.value)}
                  placeholder="Enter IBAN (e.g., TR12 3456 7890 1234 5678 9012 34)"
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label>Amount to Send</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`0.00 ${selectedCurrency}`}
            />
          </div>

          <button 
            className="confirm-buy-btn"
            onClick={handleSend}
            disabled={
              !selectedCurrency || !amount || 
              (sendType === 'crypto' ? !recipient : (!recipientName || !recipientIBAN))
            }
          >
            {sendType === 'crypto' ? 'Send Crypto' : 'Send Bank Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Receive Modal Component
const ReceiveModal = ({ onClose }) => {
  const [receiveType, setReceiveType] = useState('crypto'); // 'crypto' or 'fiat'
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
  
  const generateAddress = (crypto) => {
    // Mock addresses for demo
    const addresses = {
      BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      ETH: '0x742d35Cc6634C0532925a3b8D87f2B08',
      ADA: 'addr1qxy2lpan99fcnr3qkm8uw5adyy7fx',
      DOT: '13UVJyLnbVp77Z2t6rN2fD3UZEYfUq',
      SOL: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6Z'
    };
    return addresses[crypto] || '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
  };

  const getBankDetails = (currency) => {
    // Mock bank details for different currencies
    const bankDetails = {
      EUR: {
        iban: 'TR12 0010 0000 0012 3456 7890 01',
        accountName: 'Carlos Martinez',
        bankName: 'Akka Bank',
        swift: 'AKKATRXX'
      },
      USD: {
        iban: 'TR13 0010 0000 0098 7654 3210 02',
        accountName: 'Carlos Martinez',
        bankName: 'Akka Bank',
        swift: 'AKKATRXX'
      },
      TRY: {
        iban: 'TR14 0010 0000 0055 1122 3344 03',
        accountName: 'Carlos Martinez',
        bankName: 'Akka Bank',
        swift: 'AKKATRXX'
      }
    };
    return bankDetails[currency] || bankDetails.EUR;
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copied to clipboard!`);
  };

  const fiatCurrencies = [
    { code: 'EUR', name: 'Euro' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'TRY', name: 'Turkish Lira' }
  ];

  return (
    <div className="modal-overlay">
      <div className="buy-sell-modal">
        <div className="modal-header">
          <h3>Receive Money</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* Receive Type Selection */}
          <div className="input-group">
            <label>Receive Type</label>
            <div className="send-type-tabs">
              <button 
                className={`send-type-tab ${receiveType === 'crypto' ? 'active' : ''}`}
                onClick={() => setReceiveType('crypto')}
              >
                Crypto
              </button>
              <button 
                className={`send-type-tab ${receiveType === 'fiat' ? 'active' : ''}`}
                onClick={() => setReceiveType('fiat')}
              >
                Bank Transfer
              </button>
            </div>
          </div>

          {receiveType === 'crypto' ? (
            <>
              <div className="input-group">
                <label>Select Crypto to Receive</label>
                <select 
                  value={selectedCurrency} 
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="crypto-select"
                >
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="ADA">Cardano (ADA)</option>
                  <option value="DOT">Polkadot (DOT)</option>
                  <option value="SOL">Solana (SOL)</option>
                </select>
              </div>

              <div className="receive-address">
                <label>Your {selectedCurrency} Address</label>
                <div className="address-container">
                  <div className="address-text">{generateAddress(selectedCurrency)}</div>
                  <button className="copy-btn" onClick={() => copyToClipboard(generateAddress(selectedCurrency), 'Address')}>
                    Copy
                  </button>
                </div>
              </div>

              <div className="receive-instructions">
                <p>Send only {selectedCurrency} to this address. Sending any other cryptocurrency may result in permanent loss.</p>
              </div>
            </>
          ) : (
            <>
              <div className="input-group">
                <label>Select Currency</label>
                <select 
                  value={selectedCurrency} 
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="crypto-select"
                >
                  {fiatCurrencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bank-details">
                <label>Your Bank Account Details</label>
                
                <div className="bank-info-item">
                  <span className="bank-label">Account Name:</span>
                  <div className="address-container">
                    <div className="address-text">{getBankDetails(selectedCurrency).accountName}</div>
                    <button className="copy-btn" onClick={() => copyToClipboard(getBankDetails(selectedCurrency).accountName, 'Account Name')}>
                      Copy
                    </button>
                  </div>
                </div>

                <div className="bank-info-item">
                  <span className="bank-label">IBAN:</span>
                  <div className="address-container">
                    <div className="address-text">{getBankDetails(selectedCurrency).iban}</div>
                    <button className="copy-btn" onClick={() => copyToClipboard(getBankDetails(selectedCurrency).iban, 'IBAN')}>
                      Copy
                    </button>
                  </div>
                </div>

                <div className="bank-info-item">
                  <span className="bank-label">Bank Name:</span>
                  <div className="address-container">
                    <div className="address-text">{getBankDetails(selectedCurrency).bankName}</div>
                    <button className="copy-btn" onClick={() => copyToClipboard(getBankDetails(selectedCurrency).bankName, 'Bank Name')}>
                      Copy
                    </button>
                  </div>
                </div>

                <div className="bank-info-item">
                  <span className="bank-label">SWIFT Code:</span>
                  <div className="address-container">
                    <div className="address-text">{getBankDetails(selectedCurrency).swift}</div>
                    <button className="copy-btn" onClick={() => copyToClipboard(getBankDetails(selectedCurrency).swift, 'SWIFT Code')}>
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="receive-instructions">
                <p>Share these bank details with the sender to receive {selectedCurrency} transfers. Processing time: 1-3 business days.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Card Components
const CardComponent = ({ card, onClick }) => {
  const getCardGradient = (color) => {
    switch(color) {
      case 'gradient-blue':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'gradient-black':
        return 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  const getCardIcon = (type) => {
    switch(type) {
      case 'debit': return '💳';
      case 'crypto': return '₿';
      default: return '💳';
    }
  };

  const getCardTypeText = (card) => {
    switch(card.type) {
      case 'debit': return 'EUR Debit Card';
      case 'crypto': return 'Crypto Card';
      default: return card.name;
    }
  };

  return (
    <div 
      className="card-component" 
      style={{background: getCardGradient(card.card_color)}}
      onClick={() => onClick(card)}
    >
      <div className="card-header">
        <div className="card-type">
          {getCardIcon(card.type)} {getCardTypeText(card)}
        </div>
        <div className="card-status">
          <span className={`status-dot ${card.status}`}></span>
          {card.status}
        </div>
      </div>
      
      <div className="card-number">
        {card.number}
      </div>
      
      <div className="card-balance">
        <div className="balance-label">Available Balance</div>
        <div className="balance-amount">€{card.balance.toFixed(2)}</div>
      </div>
      
      <div className="card-connection">
        <div className="connection-text">{card.description}</div>
      </div>
      
      <div className="card-footer">
        <div className="card-limit">
          <span>Monthly: €{card.spent_this_month.toFixed(2)} / €{card.monthly_limit}</span>
        </div>
        <div className="card-chip">💎</div>
      </div>
    </div>
  );
};

const CardDetailsModal = ({ card, onClose }) => {
  if (!card) return null;

  const cardTransactions = CARD_SPENDING_HISTORY.filter(t => t.card_id === card.id);
  const monthlySpending = cardTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate spending by category
  const spendingByCategory = cardTransactions.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
    return acc;
  }, {});

  return (
    <div className="modal-overlay">
      <div className="card-details-modal">
        <div className="modal-header">
          <h3>{card.name} Details</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* Card Overview */}
          <div className="card-overview">
            <CardComponent card={card} onClick={() => {}} />
          </div>

          {/* Card Stats */}
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-label">This Month Spent</span>
              <span className="stat-value">€{card.spent_this_month.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Monthly Limit</span>
              <span className="stat-value">€{card.monthly_limit}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Remaining</span>
              <span className="stat-value positive">€{(card.monthly_limit - card.spent_this_month).toFixed(2)}</span>
            </div>
          </div>

          {/* Spending by Category */}
          <div className="spending-categories">
            <h4>Spending by Category</h4>
            {Object.entries(spendingByCategory).map(([category, amount]) => (
              <div key={category} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category}</span>
                  <span className="category-amount">€{amount.toFixed(2)}</span>
                </div>
                <div className="category-bar">
                  <div 
                    className="category-fill" 
                    style={{width: `${(amount / Math.max(...Object.values(spendingByCategory))) * 100}%`}}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Transactions */}
          <div className="card-transactions">
            <h4>Recent Transactions</h4>
            {cardTransactions.slice(0, 5).map(transaction => (
              <div key={transaction.id} className="card-transaction-item">
                <div className="transaction-merchant">
                  <div className="merchant-name">{transaction.merchant}</div>
                  <div className="transaction-category">{transaction.category}</div>
                  <div className="payment-source">{transaction.payment_source}</div>
                </div>
                <div className="transaction-details">
                  <div className="transaction-amount">-€{transaction.amount}</div>
                  <div className="transaction-date">{transaction.date.split(' ')[0]}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Card Actions */}
          <div className="card-actions">
            <button className="card-action-btn freeze">
              🧊 Freeze Card
            </button>
            <button className="card-action-btn settings">
              ⚙️ Card Settings
            </button>
            <button className="card-action-btn limits">
              📊 Change Limits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cards Overview Component
const CardsSection = ({ onClose }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  
  const totalBalance = USER_CARDS.reduce((sum, card) => sum + card.balance, 0);
  const totalSpentThisMonth = USER_CARDS.reduce((sum, card) => sum + card.spent_this_month, 0);

  return (
    <div className="cards-section">
      <div className="cards-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <h2>My Cards</h2>
      </div>

      {/* Cards Overview Stats */}
      <div className="cards-overview-stats">
        <div className="overview-stat">
          <span className="stat-label">Total Balance</span>
          <span className="stat-value">€{totalBalance.toFixed(2)}</span>
        </div>
        <div className="overview-stat">
          <span className="stat-label">Spent This Month</span>
          <span className="stat-value spent">€{totalSpentThisMonth.toFixed(2)}</span>
        </div>
      </div>

      {/* Cards List */}
      <div className="cards-list">
        {USER_CARDS.map(card => (
          <CardComponent 
            key={card.id} 
            card={card} 
            onClick={setSelectedCard}
          />
        ))}
      </div>

      {/* Add New Card */}
      <div className="add-card-section">
        <button className="add-card-btn">
          + Add New Card
        </button>
      </div>

      {/* Card Details Modal */}
      {selectedCard && (
        <CardDetailsModal 
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
};

// Bank Account Details Modal
const BankAccountModal = ({ currencyCode, onClose }) => {
  if (!currencyCode || !CURRENCY_BALANCES[currencyCode]) return null;
  
  const currency = CURRENCY_BALANCES[currencyCode];
  const bankInfo = currency.bank_info;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  return (
    <div className="modal-overlay">
      <div className="bank-account-modal">
        <div className="modal-header">
          <h3>{currency.flag} {currency.name} Account</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* Account Balance */}
          <div className="account-balance-summary">
            <div className="balance-info">
              <span className="balance-label">Available Balance</span>
              <span className="balance-amount">{currency.symbol}{currency.balance.toLocaleString()}</span>
            </div>
            <div className="account-status">
              <span className="status-indicator active"></span>
              <span>Active Account</span>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="bank-details-section">
            <h4>Account Information</h4>
            
            <div className="bank-detail-item">
              <span className="detail-label">Account Holder</span>
              <div className="detail-value-container">
                <span className="detail-value">{bankInfo.account_name}</span>
                <button className="copy-detail-btn" onClick={() => copyToClipboard(bankInfo.account_name, 'Account Name')}>
                  Copy
                </button>
              </div>
            </div>

            <div className="bank-detail-item">
              <span className="detail-label">Bank Name</span>
              <div className="detail-value-container">
                <span className="detail-value">{bankInfo.bank_name}</span>
                <button className="copy-detail-btn" onClick={() => copyToClipboard(bankInfo.bank_name, 'Bank Name')}>
                  Copy
                </button>
              </div>
            </div>

            <div className="bank-detail-item">
              <span className="detail-label">Account Type</span>
              <div className="detail-value-container">
                <span className="detail-value">{bankInfo.account_type}</span>
              </div>
            </div>

            {bankInfo.iban && (
              <div className="bank-detail-item">
                <span className="detail-label">IBAN</span>
                <div className="detail-value-container">
                  <span className="detail-value iban">{bankInfo.iban}</span>
                  <button className="copy-detail-btn" onClick={() => copyToClipboard(bankInfo.iban, 'IBAN')}>
                    Copy
                  </button>
                </div>
              </div>
            )}

            {bankInfo.account_number && (
              <div className="bank-detail-item">
                <span className="detail-label">Account Number</span>
                <div className="detail-value-container">
                  <span className="detail-value">{bankInfo.account_number}</span>
                  <button className="copy-detail-btn" onClick={() => copyToClipboard(bankInfo.account_number, 'Account Number')}>
                    Copy
                  </button>
                </div>
              </div>
            )}

            {bankInfo.routing_number && (
              <div className="bank-detail-item">
                <span className="detail-label">Routing Number</span>
                <div className="detail-value-container">
                  <span className="detail-value">{bankInfo.routing_number}</span>
                  <button className="copy-detail-btn" onClick={() => copyToClipboard(bankInfo.routing_number, 'Routing Number')}>
                    Copy
                  </button>
                </div>
              </div>
            )}

            {bankInfo.sort_code && (
              <div className="bank-detail-item">
                <span className="detail-label">Sort Code</span>
                <div className="detail-value-container">
                  <span className="detail-value">{bankInfo.sort_code}</span>
                  <button className="copy-detail-btn" onClick={() => copyToClipboard(bankInfo.sort_code, 'Sort Code')}>
                    Copy
                  </button>
                </div>
              </div>
            )}

            {bankInfo.swift && (
              <div className="bank-detail-item">
                <span className="detail-label">SWIFT/BIC</span>
                <div className="detail-value-container">
                  <span className="detail-value">{bankInfo.swift}</span>
                  <button className="copy-detail-btn" onClick={() => copyToClipboard(bankInfo.swift, 'SWIFT Code')}>
                    Copy
                  </button>
                </div>
              </div>
            )}

            {bankInfo.bic && (
              <div className="bank-detail-item">
                <span className="detail-label">BIC</span>
                <div className="detail-value-container">
                  <span className="detail-value">{bankInfo.bic}</span>
                  <button className="copy-detail-btn" onClick={() => copyToClipboard(bankInfo.bic, 'BIC')}>
                    Copy
                  </button>
                </div>
              </div>
            )}

            {bankInfo.branch_code && (
              <div className="bank-detail-item">
                <span className="detail-label">Branch Code</span>
                <div className="detail-value-container">
                  <span className="detail-value">{bankInfo.branch_code}</span>
                  <button className="copy-detail-btn" onClick={() => copyToClipboard(bankInfo.branch_code, 'Branch Code')}>
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="account-actions">
            <button className="account-action-btn transfer">
              💸 Transfer Money
            </button>
            <button className="account-action-btn deposit">
              💰 Deposit Funds
            </button>
            <button className="account-action-btn statement">
              📄 Download Statement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const MainApp = () => {
  const { user, logout } = useAuth();
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [profilePage, setProfilePage] = useState('main'); // main, personal, security, payment, docs, help, settings
  const [historyFilter, setHistoryFilter] = useState('all'); // all, buys, sells, sends, receives
  const [showCardsSection, setShowCardsSection] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cryptoSearchQuery, setCryptoSearchQuery] = useState('');
  const [currentCurrencyIndex, setCurrentCurrencyIndex] = useState(0); // For sliding
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [selectedCurrencyAccount, setSelectedCurrencyAccount] = useState(null);

  useEffect(() => {
    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCryptoPrices = async () => {
    try {
      // Request all FEATURED_CRYPTOS by passing symbols parameter
      const symbolsParam = FEATURED_CRYPTOS.join(',');
      const response = await axios.get(`${API}/crypto/prices?symbols=${symbolsParam}`);
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
      console.log(`✅ Fetched ${Object.keys(eurPrices).length} cryptocurrencies:`, Object.keys(eurPrices).join(', '));
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      
      // Try fallback to default endpoint
      try {
        const fallbackResponse = await axios.get(`${API}/crypto/prices`);
        const fallbackPrices = fallbackResponse.data.prices;
        
        const eurPrices = {};
        Object.keys(fallbackPrices).forEach(symbol => {
          eurPrices[symbol] = {
            ...fallbackPrices[symbol],
            price: fallbackPrices[symbol].price * 0.92
          };
        });
        
        setCryptoPrices(eurPrices);
        console.log(`⚠️ Using fallback data: ${Object.keys(eurPrices).length} cryptocurrencies`);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        
        // Enhanced fallback mock data with all 30 cryptocurrencies
        setCryptoPrices({
          BTC: { symbol: 'BTC', name: 'Bitcoin', price: 109408, change_24h: 2.1, volume_24h: 13800000000 },
          ETH: { symbol: 'ETH', name: 'Ethereum', price: 3073, change_24h: 1.5, volume_24h: 7360000000 },
          ADA: { symbol: 'ADA', name: 'Cardano', price: 1.06, change_24h: 3.2, volume_24h: 460000000 },
          DOT: { symbol: 'DOT', name: 'Polkadot', price: 7.00, change_24h: -1.8, volume_24h: 180000000 },
          SOL: { symbol: 'SOL', name: 'Solana', price: 264, change_24h: 4.1, volume_24h: 1840000000 },
          AVAX: { symbol: 'AVAX', name: 'Avalanche', price: 45.60, change_24h: -0.8, volume_24h: 320000000 },
          MATIC: { symbol: 'MATIC', name: 'Polygon', price: 0.45, change_24h: 2.8, volume_24h: 150000000 },
          ATOM: { symbol: 'ATOM', name: 'Cosmos', price: 8.30, change_24h: 1.9, volume_24h: 95000000 },
          LINK: { symbol: 'LINK', name: 'Chainlink', price: 15.20, change_24h: 1.2, volume_24h: 280000000 },
          UNI: { symbol: 'UNI', name: 'Uniswap', price: 12.50, change_24h: -0.5, volume_24h: 120000000 },
          AAVE: { symbol: 'AAVE', name: 'Aave', price: 285, change_24h: 3.4, volume_24h: 85000000 },
          SAND: { symbol: 'SAND', name: 'The Sandbox', price: 0.52, change_24h: 5.2, volume_24h: 45000000 },
          MANA: { symbol: 'MANA', name: 'Decentraland', price: 0.43, change_24h: 2.8, volume_24h: 38000000 },
          CRV: { symbol: 'CRV', name: 'Curve DAO Token', price: 0.88, change_24h: -1.2, volume_24h: 25000000 },
          SUSHI: { symbol: 'SUSHI', name: 'SushiSwap', price: 1.45, change_24h: 1.8, volume_24h: 32000000 },
          YFI: { symbol: 'YFI', name: 'yearn.finance', price: 8420, change_24h: -2.1, volume_24h: 18000000 },
          BAT: { symbol: 'BAT', name: 'Basic Attention Token', price: 0.24, change_24h: 0.8, volume_24h: 15000000 },
          ZRX: { symbol: 'ZRX', name: '0x', price: 0.52, change_24h: 2.1, volume_24h: 12000000 },
          XTZ: { symbol: 'XTZ', name: 'Tezos', price: 1.25, change_24h: 1.5, volume_24h: 28000000 },
          ALGO: { symbol: 'ALGO', name: 'Algorand', price: 0.38, change_24h: 3.1, volume_24h: 22000000 },
          VET: { symbol: 'VET', name: 'VeChain', price: 0.045, change_24h: 2.3, volume_24h: 35000000 },
          ENJ: { symbol: 'ENJ', name: 'Enjin Coin', price: 0.28, change_24h: 4.2, volume_24h: 18000000 },
          LRC: { symbol: 'LRC', name: 'Loopring', price: 0.18, change_24h: 1.7, volume_24h: 14000000 },
          GRT: { symbol: 'GRT', name: 'The Graph', price: 0.21, change_24h: -0.8, volume_24h: 16000000 },
          COMP: { symbol: 'COMP', name: 'Compound', price: 67.50, change_24h: 2.9, volume_24h: 25000000 },
          MKR: { symbol: 'MKR', name: 'Maker', price: 1580, change_24h: -1.5, volume_24h: 42000000 },
          SNX: { symbol: 'SNX', name: 'Synthetix', price: 2.85, change_24h: 3.8, volume_24h: 19000000 },
          BAL: { symbol: 'BAL', name: 'Balancer', price: 2.95, change_24h: 1.2, volume_24h: 8000000 },
          REN: { symbol: 'REN', name: 'Ren', price: 0.058, change_24h: -2.1, volume_24h: 6000000 },
          KNC: { symbol: 'KNC', name: 'Kyber Network Crystal', price: 0.68, change_24h: 0.9, volume_24h: 9000000 }
        });
        console.log('🔄 Using enhanced mock data with all 30 cryptocurrencies');
      }
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'profile') {
      setProfilePage('main');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getFilteredTransactions = () => {
    switch(historyFilter) {
      case 'buys':
        return RECENT_TRANSACTIONS.filter(t => t.type === 'buy');
      case 'sells':
        return RECENT_TRANSACTIONS.filter(t => t.type === 'sell');
      case 'sends':
        return RECENT_TRANSACTIONS.filter(t => t.type === 'send');
      case 'receives':
        return RECENT_TRANSACTIONS.filter(t => t.type === 'receive');
      default:
        return RECENT_TRANSACTIONS;
    }
  };

  const getFilteredCryptos = () => {
    if (!cryptoSearchQuery.trim()) {
      return FEATURED_CRYPTOS;
    }
    
    const query = cryptoSearchQuery.toLowerCase().trim();
    return FEATURED_CRYPTOS.filter(symbol => {
      const crypto = cryptoPrices[symbol];
      if (!crypto) return false;
      
      return (
        symbol.toLowerCase().includes(query) ||
        crypto.name.toLowerCase().includes(query)
      );
    });
  };

  // Currency slider functions
  const currencyKeys = Object.keys(CURRENCY_BALANCES);
  const currentCurrency = currencyKeys[currentCurrencyIndex];
  
  const nextCurrency = () => {
    setCurrentCurrencyIndex((prev) => (prev + 1) % currencyKeys.length);
  };
  
  const prevCurrency = () => {
    setCurrentCurrencyIndex((prev) => (prev - 1 + currencyKeys.length) % currencyKeys.length);
  };
  
  const handleCurrencyClick = (currencyCode) => {
    setSelectedCurrencyAccount(currencyCode);
    setShowBankAccountModal(true);
  };

  // Simulate price updates (in real app, this would come from WebSocket or API polling)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(cryptoPrices).length > 0) {
        // Add small random variations to simulate live prices (±0.5%)
        const variation = (Math.random() - 0.5) * 0.01; // ±0.5%
        // This is just for demonstration - real implementation would fetch from API
        console.log('Price variation simulation:', variation);
      }
    }, 30000); // Update every 30 seconds for demo

    return () => clearInterval(interval);
  }, [cryptoPrices]);

  if (loading) {
    return (
      <div className="akka-loading">
        <div className="akka-logo">
          <div className="logo-icon"></div>
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
            <div className="akka-logo-header" onClick={() => handleTabChange('home')}>
              <div className="logo-icon"></div>
              <span>akka</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="notification-btn" onClick={() => handleTabChange('history')}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917z"/>
              </svg>
              <span className="notification-badge">3</span>
            </button>
            <div className="user-avatar" onClick={() => handleTabChange('profile')}>
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="akka-main">
        {activeTab === 'home' && !showCardsSection && (
          <div className="home-content">
            {/* Swipeable Currency Balances */}
            <div className="currency-balance-section">
              <div className="currency-slider-container">
                <button className="currency-nav-btn prev" onClick={prevCurrency}>
                  ‹
                </button>
                
                <div className="currency-slide-wrapper">
                  <div 
                    className="currency-slides" 
                    style={{transform: `translateX(-${currentCurrencyIndex * 100}%)`}}
                  >
                    {currencyKeys.map((currencyCode, index) => {
                      const currency = CURRENCY_BALANCES[currencyCode];
                      return (
                        <div 
                          key={currencyCode} 
                          className="currency-slide"
                          onClick={() => handleCurrencyClick(currencyCode)}
                        >
                          <div className="currency-balance-card">
                            <div className="balance-header">
                              <div className="currency-info">
                                <span className="currency-flag-large">{currency.flag}</span>
                                <div className="currency-details">
                                  <span className="currency-name">{currency.name}</span>
                                  <span className="currency-code-small">{currencyCode}</span>
                                </div>
                              </div>
                              <div className="balance-change">
                                <span className={`change-indicator ${currency.change_24h >= 0 ? 'positive' : 'negative'}`}>
                                  {currency.change_24h >= 0 ? '+' : ''}{currency.change_24h}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="main-balance">
                              <span className="balance-amount">
                                {currency.symbol}{currency.balance.toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="tap-hint">
                              <span>Tap to view account details</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <button className="currency-nav-btn next" onClick={nextCurrency}>
                  ›
                </button>
              </div>
              
              <div className="currency-indicators">
                {currencyKeys.map((_, index) => (
                  <span
                    key={index}
                    className={`indicator ${index === currentCurrencyIndex ? 'active' : ''}`}
                    onClick={() => setCurrentCurrencyIndex(index)}
                  />
                ))}
              </div>
            </div>

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
                  <div className="balance-amount">€{DEMO_USER.total_portfolio.toLocaleString()}</div>
                  <div className="balance-change positive">+€225.30 (+2.23%)</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="action-btn primary" onClick={() => handleTabChange('market')}>
                <span className="action-icon">+</span>
                Buy
              </button>
              <button className="action-btn sell-btn" onClick={() => setShowSellModal(true)}>
                <span className="action-icon">-</span>
                Sell
              </button>
              <button className="action-btn secondary" onClick={() => setShowSendModal(true)}>
                <span className="action-icon">↗</span>
                Send
              </button>
              <button className="action-btn secondary" onClick={() => setShowReceiveModal(true)}>
                <span className="action-icon">↙</span>
                Receive
              </button>
            </div>

            {/* Cards Quick Access */}
            <div className="cards-quick-access">
              <div className="section-header">
                <h3>My Cards</h3>
                <button className="see-all-btn" onClick={() => setShowCardsSection(true)}>View all</button>
              </div>
              <div className="cards-preview">
                {USER_CARDS.slice(0, 2).map(card => (
                  <div key={card.id} className="card-preview" onClick={() => setShowCardsSection(true)}>
                    <div className="card-preview-header">
                      <span className="card-type-icon">
                        {card.type === 'debit' ? '💳' : '₿'}
                      </span>
                      <span className="card-name">{card.name}</span>
                    </div>
                    <div className="card-balance-preview">
                      €{card.balance.toFixed(2)}
                    </div>
                    <div className="card-connection-preview">
                      {card.description}
                    </div>
                    <div className="card-spent-preview">
                      Spent: €{card.spent_this_month.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            <div className="home-portfolio">
              <div className="section-header">
                <h3>Your portfolio</h3>
                <button className="see-all-btn" onClick={() => handleTabChange('portfolio')}>View all</button>
              </div>
              <div className="portfolio-list">
                {Object.entries(DEMO_USER.crypto_portfolio).map(([crypto, data]) => (
                  <PortfolioItem key={crypto} crypto={crypto} data={data} />
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <div className="section-header">
                <h3>Recent activity</h3>
                <button className="see-all-btn" onClick={() => handleTabChange('history')}>View all</button>
              </div>
              <div className="transactions-list">
                {RECENT_TRANSACTIONS.slice(0, 3).map(transaction => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'home' && showCardsSection && (
          <CardsSection onClose={() => setShowCardsSection(false)} />
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
              <input 
                type="text" 
                placeholder="Search cryptocurrency..." 
                value={cryptoSearchQuery}
                onChange={(e) => setCryptoSearchQuery(e.target.value)}
              />
            </div>

            <div className="crypto-list">
              {getFilteredCryptos().map(symbol => {
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
              
              {getFilteredCryptos().length === 0 && cryptoSearchQuery && (
                <div className="no-results">
                  <p>No cryptocurrencies found matching "{cryptoSearchQuery}"</p>
                  <button onClick={() => setCryptoSearchQuery('')} className="clear-search-btn">
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="portfolio-content">
            <div className="portfolio-header">
              <h2>Portfolio</h2>
              <div className="portfolio-total">
                <span>Total value</span>
                <span className="total-value">€{DEMO_USER.total_portfolio.toLocaleString()}</span>
              </div>
            </div>

            <div className="portfolio-chart-placeholder">
              <div className="chart-info">
                <span>Portfolio chart</span>
                <span className="chart-period">7 days</span>
              </div>
              <div className="chart-visual">
                <svg viewBox="0 0 300 100" className="chart-svg">
                  <path d="M0,60 Q75,20 150,40 T300,30" stroke="#17ECE5" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            </div>

            <div className="portfolio-breakdown">
              <h3>Asset breakdown</h3>
              <div className="assets-list">
                {Object.entries(DEMO_USER.crypto_portfolio).map(([crypto, data]) => (
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
                <button 
                  className={`filter-btn ${historyFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${historyFilter === 'buys' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('buys')}
                >
                  Buys
                </button>
                <button 
                  className={`filter-btn ${historyFilter === 'sells' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('sells')}
                >
                  Sells
                </button>
                <button 
                  className={`filter-btn ${historyFilter === 'sends' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('sends')}
                >
                  Sends
                </button>
                <button 
                  className={`filter-btn ${historyFilter === 'receives' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('receives')}
                >
                  Receives
                </button>
              </div>
            </div>

            <div className="transactions-full-list">
              {getFilteredTransactions().map(transaction => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-content">
            {profilePage === 'main' && (
              <>
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
                  <div className="menu-item" onClick={() => setProfilePage('personal')}>
                    <span className="menu-icon">👤</span>
                    <span>Personal information</span>
                    <span className="menu-arrow">›</span>
                  </div>
                  <div className="menu-item" onClick={() => setProfilePage('security')}>
                    <span className="menu-icon">🔒</span>
                    <span>Security</span>
                    <span className="menu-arrow">›</span>
                  </div>
                  <div className="menu-item" onClick={() => setProfilePage('payment')}>
                    <span className="menu-icon">💳</span>
                    <span>Payment methods</span>
                    <span className="menu-arrow">›</span>
                  </div>
                  <div className="menu-item" onClick={() => setProfilePage('docs')}>
                    <span className="menu-icon">📄</span>
                    <span>Documents</span>
                    <span className="menu-arrow">›</span>
                  </div>
                  <div className="menu-item" onClick={() => setProfilePage('help')}>
                    <span className="menu-icon">❓</span>
                    <span>Help & support</span>
                    <span className="menu-arrow">›</span>
                  </div>
                  <div className="menu-item" onClick={() => setProfilePage('settings')}>
                    <span className="menu-icon">⚙️</span>
                    <span>Settings</span>
                    <span className="menu-arrow">›</span>
                  </div>
                </div>

                <button className="logout-btn" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            )}

            {profilePage === 'personal' && (
              <div className="profile-subpage">
                <div className="subpage-header">
                  <button className="back-btn" onClick={() => setProfilePage('main')}>‹</button>
                  <h2>Personal Information</h2>
                </div>
                
                <div className="profile-form">
                  <div className="form-section">
                    <h3>Basic Information</h3>
                    <div className="input-group">
                      <label>Full Name</label>
                      <input type="text" value={user.name} readOnly />
                    </div>
                    <div className="input-group">
                      <label>Email Address</label>
                      <input type="email" value={user.email} readOnly />
                    </div>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input type="tel" placeholder="+90 555 123 4567" />
                    </div>
                    <div className="input-group">
                      <label>Date of Birth</label>
                      <input type="date" value="1990-05-15" />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Address Information</h3>
                    <div className="input-group">
                      <label>Country</label>
                      <select>
                        <option>Turkey</option>
                        <option>Germany</option>
                        <option>Netherlands</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>City</label>
                      <input type="text" value="Istanbul" />
                    </div>
                    <div className="input-group">
                      <label>Address</label>
                      <textarea placeholder="Enter your full address"></textarea>
                    </div>
                  </div>

                  <button className="save-btn">Save Changes</button>
                </div>
              </div>
            )}

            {profilePage === 'security' && (
              <div className="profile-subpage">
                <div className="subpage-header">
                  <button className="back-btn" onClick={() => setProfilePage('main')}>‹</button>
                  <h2>Security</h2>
                </div>
                
                <div className="security-content">
                  <div className="security-section">
                    <h3>Password & Authentication</h3>
                    <div className="security-item">
                      <div className="security-info">
                        <span className="security-title">Password</span>
                        <span className="security-desc">Last changed 30 days ago</span>
                      </div>
                      <button className="security-action">Change</button>
                    </div>
                    <div className="security-item">
                      <div className="security-info">
                        <span className="security-title">Two-Factor Authentication</span>
                        <span className="security-desc enabled">Enabled via SMS</span>
                      </div>
                      <button className="security-action">Manage</button>
                    </div>
                  </div>

                  <div className="security-section">
                    <h3>Login Activity</h3>
                    <div className="login-activity">
                      <div className="activity-item">
                        <div className="activity-info">
                          <span className="activity-device">iPhone 15 Pro</span>
                          <span className="activity-location">Istanbul, Turkey</span>
                          <span className="activity-time">Active now</span>
                        </div>
                        <span className="current-device">Current</span>
                      </div>
                      <div className="activity-item">
                        <div className="activity-info">
                          <span className="activity-device">MacBook Pro</span>
                          <span className="activity-location">Istanbul, Turkey</span>
                          <span className="activity-time">2 hours ago</span>
                        </div>
                        <button className="logout-device">Sign out</button>
                      </div>
                    </div>
                  </div>

                  <div className="security-section">
                    <h3>Privacy Settings</h3>
                    <div className="privacy-toggle">
                      <span>Email notifications</span>
                      <label className="toggle">
                        <input type="checkbox" checked />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="privacy-toggle">
                      <span>SMS notifications</span>
                      <label className="toggle">
                        <input type="checkbox" checked />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {profilePage === 'payment' && (
              <div className="profile-subpage">
                <div className="subpage-header">
                  <button className="back-btn" onClick={() => setProfilePage('main')}>‹</button>
                  <h2>Payment Methods</h2>
                </div>
                
                <div className="payment-content">
                  <div className="payment-section">
                    <h3>Bank Accounts</h3>
                    <div className="payment-item bank-account">
                      <div className="payment-icon">🏦</div>
                      <div className="payment-info">
                        <span className="payment-title">Akka Bank</span>
                        <span className="payment-desc">****7890 (Primary)</span>
                      </div>
                      <button className="payment-action">Manage</button>
                    </div>
                    <button className="add-payment-btn">+ Add Bank Account</button>
                  </div>

                  <div className="payment-section">
                    <h3>Cards</h3>
                    <div className="payment-item card">
                      <div className="payment-icon">💳</div>
                      <div className="payment-info">
                        <span className="payment-title">Akka Virtual Card</span>
                        <span className="payment-desc">****4567 • Expires 12/27</span>
                      </div>
                      <button className="payment-action">View</button>
                    </div>
                    <button className="add-payment-btn">+ Add Card</button>
                  </div>

                  <div className="payment-section">
                    <h3>Transaction Limits</h3>
                    <div className="limit-item">
                      <span className="limit-title">Daily Send Limit</span>
                      <span className="limit-value">€5,000</span>
                    </div>
                    <div className="limit-item">
                      <span className="limit-title">Monthly Withdraw Limit</span>
                      <span className="limit-value">€25,000</span>
                    </div>
                    <button className="increase-limits-btn">Request Limit Increase</button>
                  </div>
                </div>
              </div>
            )}

            {profilePage === 'docs' && (
              <div className="profile-subpage">
                <div className="subpage-header">
                  <button className="back-btn" onClick={() => setProfilePage('main')}>‹</button>
                  <h2>Documents</h2>
                </div>
                
                <div className="docs-content">
                  <div className="docs-section">
                    <h3>Identity Verification</h3>
                    <div className="doc-item verified">
                      <div className="doc-icon">✅</div>
                      <div className="doc-info">
                        <span className="doc-title">National ID</span>
                        <span className="doc-status">Verified</span>
                      </div>
                      <button className="doc-action">View</button>
                    </div>
                    <div className="doc-item verified">
                      <div className="doc-icon">✅</div>
                      <div className="doc-info">
                        <span className="doc-title">Proof of Address</span>
                        <span className="doc-status">Verified</span>
                      </div>
                      <button className="doc-action">View</button>
                    </div>
                  </div>

                  <div className="docs-section">
                    <h3>Account Statements</h3>
                    <div className="statement-item">
                      <div className="statement-info">
                        <span className="statement-title">January 2025</span>
                        <span className="statement-date">Generated on Feb 1, 2025</span>
                      </div>
                      <button className="statement-download">Download PDF</button>
                    </div>
                    <div className="statement-item">
                      <div className="statement-info">
                        <span className="statement-title">December 2024</span>
                        <span className="statement-date">Generated on Jan 1, 2025</span>
                      </div>
                      <button className="statement-download">Download PDF</button>
                    </div>
                  </div>

                  <div className="docs-section">
                    <h3>Tax Documents</h3>
                    <div className="tax-item">
                      <span className="tax-title">2024 Tax Report</span>
                      <button className="tax-download">Download</button>
                    </div>
                    <div className="tax-info">
                      <p>Your 2025 tax report will be available in January 2026.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {profilePage === 'help' && (
              <div className="profile-subpage">
                <div className="subpage-header">
                  <button className="back-btn" onClick={() => setProfilePage('main')}>‹</button>
                  <h2>Help & Support</h2>
                </div>
                
                <div className="help-content">
                  <div className="help-section">
                    <h3>Quick Help</h3>
                    <div className="help-item">
                      <span className="help-icon">🔍</span>
                      <div className="help-info">
                        <span className="help-title">How to buy crypto?</span>
                        <span className="help-desc">Learn how to purchase cryptocurrency</span>
                      </div>
                    </div>
                    <div className="help-item">
                      <span className="help-icon">💰</span>
                      <div className="help-info">
                        <span className="help-title">Understanding fees</span>
                        <span className="help-desc">Learn about trading and transaction fees</span>
                      </div>
                    </div>
                    <div className="help-item">
                      <span className="help-icon">🔒</span>
                      <div className="help-info">
                        <span className="help-title">Security best practices</span>
                        <span className="help-desc">Keep your account safe and secure</span>
                      </div>
                    </div>
                  </div>

                  <div className="help-section">
                    <h3>Contact Support</h3>
                    <div className="contact-options">
                      <div className="contact-item">
                        <span className="contact-icon">💬</span>
                        <div className="contact-info">
                          <span className="contact-title">Live Chat</span>
                          <span className="contact-desc">Available 24/7</span>
                        </div>
                        <button className="contact-btn">Start Chat</button>
                      </div>
                      <div className="contact-item">
                        <span className="contact-icon">📧</span>
                        <div className="contact-info">
                          <span className="contact-title">Email Support</span>
                          <span className="contact-desc">support@akka.com</span>
                        </div>
                        <button className="contact-btn">Send Email</button>
                      </div>
                      <div className="contact-item">
                        <span className="contact-icon">📞</span>
                        <div className="contact-info">
                          <span className="contact-title">Phone Support</span>
                          <span className="contact-desc">+90 555 AKKA (2552)</span>
                        </div>
                        <button className="contact-btn">Call Now</button>
                      </div>
                    </div>
                  </div>

                  <div className="help-section">
                    <h3>Resources</h3>
                    <div className="resource-links">
                      <a href="#" className="resource-link">📚 User Guide</a>
                      <a href="#" className="resource-link">❓ FAQ</a>
                      <a href="#" className="resource-link">📋 Terms of Service</a>
                      <a href="#" className="resource-link">🔒 Privacy Policy</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {profilePage === 'settings' && (
              <div className="profile-subpage">
                <div className="subpage-header">
                  <button className="back-btn" onClick={() => setProfilePage('main')}>‹</button>
                  <h2>Settings</h2>
                </div>
                
                <div className="settings-content">
                  <div className="settings-section">
                    <h3>Appearance</h3>
                    <div className="setting-item">
                      <span className="setting-title">Theme</span>
                      <select className="setting-select">
                        <option>Dark</option>
                        <option>Light</option>
                        <option>Auto</option>
                      </select>
                    </div>
                    <div className="setting-item">
                      <span className="setting-title">Language</span>
                      <select className="setting-select">
                        <option>English</option>
                        <option>Türkçe</option>
                        <option>Deutsch</option>
                      </select>
                    </div>
                    <div className="setting-item">
                      <span className="setting-title">Currency Display</span>
                      <select className="setting-select">
                        <option>EUR (€)</option>
                        <option>USD ($)</option>
                        <option>TRY (₺)</option>
                      </select>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3>Notifications</h3>
                    <div className="notification-toggle">
                      <span>Price alerts</span>
                      <label className="toggle">
                        <input type="checkbox" checked />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="notification-toggle">
                      <span>Transaction notifications</span>
                      <label className="toggle">
                        <input type="checkbox" checked />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="notification-toggle">
                      <span>Marketing emails</span>
                      <label className="toggle">
                        <input type="checkbox" />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3>Advanced</h3>
                    <div className="setting-item">
                      <span className="setting-title">Auto-lock time</span>
                      <select className="setting-select">
                        <option>5 minutes</option>
                        <option>15 minutes</option>
                        <option>30 minutes</option>
                        <option>Never</option>
                      </select>
                    </div>
                    <div className="notification-toggle">
                      <span>Biometric login</span>
                      <label className="toggle">
                        <input type="checkbox" checked />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-section danger">
                    <h3>Account</h3>
                    <button className="danger-btn">Export Account Data</button>
                    <button className="danger-btn">Delete Account</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="akka-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => handleTabChange('home')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6z"/>
          </svg>
          <span>Home</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => handleTabChange('market')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3zM5 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V2zM9 5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V5z"/>
          </svg>
          <span>Market</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => handleTabChange('portfolio')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"/>
            <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0z"/>
          </svg>
          <span>Portfolio</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleTabChange('history')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
          </svg>
          <span>History</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabChange('profile')}
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

      {/* Sell Modal */}
      {showSellModal && (
        <SellModal
          onClose={() => setShowSellModal(false)}
        />
      )}

      {/* Send Modal */}
      {showSendModal && (
        <SendModal
          onClose={() => setShowSendModal(false)}
        />
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <ReceiveModal
          onClose={() => setShowReceiveModal(false)}
        />
      )}

      {/* Bank Account Modal */}
      {showBankAccountModal && (
        <BankAccountModal
          currencyCode={selectedCurrencyAccount}
          onClose={() => setShowBankAccountModal(false)}
        />
      )}
    </div>
  );
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('akka_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('akka_user', JSON.stringify(userData));
  };

  const signup = (userData) => {
    setUser(userData);
    localStorage.setItem('akka_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('akka_user');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Main App Component
function App() {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  return (
    <AuthProvider>
      <AuthWrapper authMode={authMode} setAuthMode={setAuthMode} />
    </AuthProvider>
  );
}

// Auth Wrapper Component
const AuthWrapper = ({ authMode, setAuthMode }) => {
  const { user, login, signup, loading } = useAuth();

  if (loading) {
    return (
      <div className="akka-loading">
        <div className="akka-logo">
          <div className="logo-icon"></div>
          <span>Akka</span>
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // If user is logged in, show main app
  if (user) {
    return <MainApp />;
  }

  // If not logged in, show auth pages
  if (authMode === 'login') {
    return (
      <LoginPage
        onLogin={login}
        onSwitchToSignup={() => setAuthMode('signup')}
      />
    );
  }

  return (
    <SignupPage
      onSignup={signup}
      onSwitchToLogin={() => setAuthMode('login')}
    />
  );
};

export default App;