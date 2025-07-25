import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
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

// Mock user data for demo - now mutable for transaction simulation
let DEMO_USER = {
  id: "demo-user-123",
  name: "Carlos Martinez",
  email: "carlos@akka.com",
  verified: true,
  balance_eur: 3250.45,
  crypto_portfolio: {
    BTC: { amount: 0.1250, value: 14865.25 },
    ETH: { amount: 2.5, value: 8350.00 },
    ADA: { amount: 1500, value: 1725.00 },
    DOT: { amount: 75, value: 525.00 },
    SOL: { amount: 12, value: 3168.00 }
  },
  // Calculate total portfolio dynamically
  get total_portfolio() {
    return Object.values(this.crypto_portfolio).reduce((total, crypto) => total + crypto.value, 0);
  }
};

// User's transaction history (will be updated with new transactions)
let USER_TRANSACTION_HISTORY = [
  { id: Date.now() + 1, type: 'buy', crypto: 'BTC', amount: 0.025, eur_amount: 2970.50, date: '2025-01-22 14:30', status: 'completed' },
  { id: Date.now() + 2, type: 'sell', crypto: 'ETH', amount: 0.5, eur_amount: 1670.00, date: '2025-01-22 12:15', status: 'completed' },
  { id: Date.now() + 3, type: 'deposit', crypto: 'EUR', amount: 500.00, date: '2025-01-21 18:45', status: 'completed' }
];

// User's Multi-Currency Balances with Bank Account Info
// Currency balances using state
const getCurrencyBalances = (userBalances) => ({
  EUR: { 
    balance: userBalances.eur, 
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
});

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

// Passcode Entry Component
const PasscodeEntry = () => {
  const [passcode, setPasscode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const { verifyPasscode } = useAuth();
  const inputRefs = useRef([]);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newPasscode = [...passcode];
    newPasscode[index] = value;
    setPasscode(newPasscode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newPasscode.every(digit => digit !== '') && newPasscode.join('').length === 6) {
      setTimeout(() => {
        handleVerifyPasscode(newPasscode.join(''));
      }, 100);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyPasscode = (code) => {
    const isValid = verifyPasscode(code);
    if (!isValid) {
      setError('Incorrect passcode. Please try again.');
      setIsShaking(true);
      setPasscode(['', '', '', '', '', '']);
      setTimeout(() => {
        setIsShaking(false);
        inputRefs.current[0]?.focus();
      }, 500);
    }
  };

  const handleNumberPadClick = (number) => {
    const firstEmptyIndex = passcode.findIndex(digit => digit === '');
    if (firstEmptyIndex !== -1) {
      handleInputChange(firstEmptyIndex, number.toString());
    }
  };

  const handleDelete = () => {
    const lastFilledIndex = passcode.map((digit, index) => digit !== '' ? index : -1)
                                   .filter(index => index !== -1)
                                   .pop();
    if (lastFilledIndex !== undefined) {
      const newPasscode = [...passcode];
      newPasscode[lastFilledIndex] = '';
      setPasscode(newPasscode);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="passcode-container">
      <div className="passcode-content">
        <div className="passcode-header">
          <div className="akka-logo-passcode">
            <div className="logo-icon"></div>
            <span className="logo-text">akka</span>
          </div>
          <h2>Enter your passcode</h2>
          <p>Please enter your 6-digit passcode to continue</p>
        </div>

        <div className={`passcode-inputs ${isShaking ? 'shake' : ''}`}>
          {passcode.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength="1"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="passcode-digit"
            />
          ))}
        </div>

        {error && (
          <div className="passcode-error">
            <span>{error}</span>
          </div>
        )}

        <div className="number-pad">
          <div className="number-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => (
              <button
                key={number}
                className="number-btn"
                onClick={() => handleNumberPadClick(number)}
              >
                {number}
              </button>
            ))}
            <div></div> {/* Empty space */}
            <button className="number-btn" onClick={() => handleNumberPadClick(0)}>
              0
            </button>
            <button className="delete-btn" onClick={handleDelete}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.83 5.146a.5.5 0 0 0 0 .708L7.975 8l-2.147 2.146a.5.5 0 0 0 .707.708l2.147-2.147 2.146 2.147a.5.5 0 0 0 .708-.708L9.39 8l2.146-2.146a.5.5 0 0 0-.707-.708L8.683 7.293 6.536 5.146a.5.5 0 0 0-.707 0z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="passcode-help">
          <p>Demo passcode: <strong>123456</strong></p>
        </div>
      </div>
    </div>
  );
};

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

const PortfolioItem = ({ crypto, data, onSell, onClick }) => (
  <div className="portfolio-item" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
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
      {onSell && (
        <button 
          className="portfolio-sell-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSell(crypto);
          }}
        >
          Sell
        </button>
      )}
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
const SellModal = ({ onClose, preselectedCrypto = null, onSellComplete }) => {
  const [selectedCrypto, setSelectedCrypto] = useState(preselectedCrypto?.symbol || '');
  const [amount, setAmount] = useState('');
  const [eurAmount, setEurAmount] = useState('');
  
  const userCryptos = Object.keys(DEMO_USER.crypto_portfolio);

  // Calculate EUR amount when crypto amount changes
  useEffect(() => {
    if (amount && selectedCrypto && DEMO_USER.crypto_portfolio[selectedCrypto]) {
      const cryptoData = DEMO_USER.crypto_portfolio[selectedCrypto];
      const pricePerUnit = cryptoData.value / cryptoData.amount;
      const calculatedEurAmount = (parseFloat(amount) * pricePerUnit).toFixed(2);
      setEurAmount(calculatedEurAmount);
    } else {
      setEurAmount('');
    }
  }, [amount, selectedCrypto]);

  const handleSell = () => {
    if (onSellComplete && amount && eurAmount) {
      onSellComplete(selectedCrypto, amount, eurAmount);
    } else {
      alert(`Sell order placed: ${amount} ${selectedCrypto} for €${eurAmount}`);
    }
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
              placeholder="0.00 EUR"
              readOnly
              className="readonly-input"
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
const SendModal = ({ onClose, onSendComplete, userBalances }) => {
  const [sendType, setSendType] = useState('crypto'); // 'crypto' or 'fiat'
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientIBAN, setRecipientIBAN] = useState('');
  const [recipientName, setRecipientName] = useState('');
  
  const userCryptos = Object.keys(DEMO_USER.crypto_portfolio);
  const fiatCurrencies = [
    { code: 'EUR', name: 'Euro', balance: userBalances.eur },
    { code: 'USD', name: 'US Dollar', balance: 2650.75 }, // Mock USD balance
    { code: 'TRY', name: 'Turkish Lira', balance: 5420.30 } // Mock TRY balance
  ];

  const handleSend = () => {
    if (onSendComplete) {
      if (sendType === 'crypto') {
        onSendComplete(selectedCurrency, amount, recipient);
      } else {
        onSendComplete(selectedCurrency, amount, recipientName);
      }
    } else {
      if (sendType === 'crypto') {
        alert(`Send initiated: ${amount} ${selectedCurrency} to ${recipient}`);
      } else {
        alert(`Bank transfer initiated: ${amount} ${selectedCurrency} to ${recipientName} (IBAN: ${recipientIBAN})`);
      }
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

// Crypto Details Modal Component
const CryptoDetailsModal = ({ crypto, data, onClose, onBuy, onSell, cryptoPrices }) => {
  if (!crypto || !data) return null;

  const cryptoPrice = cryptoPrices[crypto];
  const pricePerUnit = data.value / data.amount;
  
  return (
    <div className="modal-overlay">
      <div className="crypto-details-modal">
        <div className="modal-header">
          <h3>{crypto} Details</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* Crypto Info Header */}
          <div className="crypto-info-header">
            <div className={`crypto-icon-large ${crypto.toLowerCase()}`}>
              {crypto.charAt(0)}
            </div>
            <div className="crypto-main-info">
              <div className="crypto-name-large">{crypto}</div>
              <div className="crypto-full-name">{cryptoPrice?.name || `${crypto} Token`}</div>
              <div className="crypto-current-price">€{pricePerUnit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <div className="price-change positive">+2.45% (24h)</div>
            </div>
          </div>

          {/* Holdings Summary */}
          <div className="holdings-summary">
            <div className="holding-card">
              <div className="holding-label">Your Holdings</div>
              <div className="holding-amount">{data.amount} {crypto}</div>
              <div className="holding-value">€{data.value.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
          </div>

          {/* Price Chart Placeholder */}
          <div className="price-chart-section">
            <div className="chart-header">
              <h4>📈 Price Chart (7 Days)</h4>
              <div className="chart-period-tabs">
                <button className="period-tab active">7D</button>
                <button className="period-tab">1M</button>
                <button className="period-tab">3M</button>
                <button className="period-tab">1Y</button>
              </div>
            </div>
            <div className="chart-placeholder">
              <svg viewBox="0 0 400 120" className="price-chart-svg">
                <defs>
                  <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                <path d="M0,80 Q50,40 100,60 T200,50 T300,30 T400,45" 
                      stroke="#10B981" 
                      strokeWidth="3" 
                      fill="none"/>
                <path d="M0,80 Q50,40 100,60 T200,50 T300,30 T400,45 L400,120 L0,120 Z" 
                      fill="url(#priceGradient)"/>
              </svg>
              <div className="chart-stats">
                <div className="stat-item">
                  <span className="stat-label">24h High</span>
                  <span className="stat-value">€{(pricePerUnit * 1.03).toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">24h Low</span>
                  <span className="stat-value">€{(pricePerUnit * 0.97).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="crypto-actions">
            <button 
              className="crypto-action-button buy-btn"
              onClick={() => {
                onClose();
                onBuy(cryptoPrice || { symbol: crypto, price: pricePerUnit, name: crypto });
              }}
            >
              <span className="action-icon">📈</span>
              <div className="action-content">
                <div className="action-title">Buy More</div>
                <div className="action-subtitle">Purchase additional {crypto}</div>
              </div>
            </button>
            
            <button 
              className="crypto-action-button sell-btn"
              onClick={() => {
                onClose();
                onSell(crypto);
              }}
            >
              <span className="action-icon">📉</span>
              <div className="action-content">
                <div className="action-title">Sell {crypto}</div>
                <div className="action-subtitle">Convert to EUR</div>
              </div>
            </button>
          </div>

          {/* Market Stats */}
          <div className="market-stats">
            <div className="stat-row">
              <span className="stat-label">Market Cap</span>
              <span className="stat-value">€2.1T</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">24h Volume</span>
              <span className="stat-value">€45.2B</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Circulating Supply</span>
              <span className="stat-value">19.8M {crypto}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// History Modal Component
const HistoryModal = ({ onClose, historyFilter, setHistoryFilter }) => {
  const getFilteredTransactions = (filter) => {
    if (filter === 'all') return USER_TRANSACTION_HISTORY;
    return USER_TRANSACTION_HISTORY.filter(transaction => {
      switch(filter) {
        case 'buys': return transaction.type === 'buy';
        case 'sells': return transaction.type === 'sell';
        case 'sends': return transaction.type === 'send';
        case 'receives': return transaction.type === 'receive';
        case 'deposits': return transaction.type === 'deposit';
        default: return true;
      }
    });
  };

  return (
    <div className="modal-overlay">
      <div className="history-modal">
        <div className="modal-header">
          <h3>Transaction History</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* History Filters */}
          <div className="history-filters">
            {['all', 'buys', 'sells', 'sends', 'receives', 'deposits'].map(filter => (
              <button
                key={filter}
                className={`filter-btn ${historyFilter === filter ? 'active' : ''}`}
                onClick={() => setHistoryFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          <div className="transactions-list">
            {getFilteredTransactions(historyFilter).map(transaction => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
            
            {getFilteredTransactions(historyFilter).length === 0 && (
              <div className="no-transactions">
                <p>No transactions found for the selected filter</p>
              </div>
            )}
          </div>
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

// Apply for New Card Modal Component
const ApplyCardModal = ({ onClose }) => {
  const [cardType, setCardType] = useState('debit');
  const [applicationStep, setApplicationStep] = useState(1);
  const [applicationData, setApplicationData] = useState({
    cardType: 'debit',
    annualIncome: '',
    employmentStatus: '',
    monthlySpending: '',
    reason: ''
  });

  const handleInputChange = (field, value) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNextStep = () => {
    if (applicationStep < 3) {
      setApplicationStep(applicationStep + 1);
    }
  };

  const handleSubmitApplication = () => {
    alert('🎉 Card application submitted successfully! You will receive an update within 2-3 business days.');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="apply-card-modal">
        <div className="modal-header">
          <h3>Apply for New Card</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="application-progress">
          <div className={`progress-step ${applicationStep >= 1 ? 'active' : ''}`}>1</div>
          <div className={`progress-step ${applicationStep >= 2 ? 'active' : ''}`}>2</div>
          <div className={`progress-step ${applicationStep >= 3 ? 'active' : ''}`}>3</div>
        </div>

        <div className="modal-content">
          {applicationStep === 1 && (
            <div className="application-step">
              <h4>Choose Card Type</h4>
              
              <div className="card-type-options">
                <div 
                  className={`card-type-option ${cardType === 'debit' ? 'selected' : ''}`}
                  onClick={() => {
                    setCardType('debit');
                    handleInputChange('cardType', 'debit');
                  }}
                >
                  <div className="card-icon">💳</div>
                  <div className="card-type-info">
                    <h5>Akka Debit Card</h5>
                    <p>Spend your balance instantly</p>
                    <span className="card-benefit">No fees • Instant approval</span>
                  </div>
                </div>

                <div 
                  className={`card-type-option ${cardType === 'credit' ? 'selected' : ''}`}
                  onClick={() => {
                    setCardType('credit');
                    handleInputChange('cardType', 'credit');
                  }}
                >
                  <div className="card-icon">💎</div>
                  <div className="card-type-info">
                    <h5>Akka Credit Card</h5>
                    <p>Build credit with rewards</p>
                    <span className="card-benefit">1% cashback • Credit building</span>
                  </div>
                </div>
              </div>

              <button className="next-step-btn" onClick={handleNextStep}>
                Continue Application
              </button>
            </div>
          )}

          {applicationStep === 2 && (
            <div className="application-step">
              <h4>Financial Information</h4>
              
              <div className="form-group">
                <label>Annual Income (EUR)</label>
                <select 
                  value={applicationData.annualIncome}
                  onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                >
                  <option value="">Select income range</option>
                  <option value="under-25k">Under €25,000</option>
                  <option value="25k-50k">€25,000 - €50,000</option>
                  <option value="50k-75k">€50,000 - €75,000</option>
                  <option value="75k-100k">€75,000 - €100,000</option>
                  <option value="over-100k">Over €100,000</option>
                </select>
              </div>

              <div className="form-group">
                <label>Employment Status</label>
                <select 
                  value={applicationData.employmentStatus}
                  onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                >
                  <option value="">Select employment status</option>
                  <option value="employed">Full-time employed</option>
                  <option value="self-employed">Self-employed</option>
                  <option value="part-time">Part-time employed</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              <div className="form-group">
                <label>Monthly Spending (EUR)</label>
                <input 
                  type="number"
                  placeholder="e.g. 1500"
                  value={applicationData.monthlySpending}
                  onChange={(e) => handleInputChange('monthlySpending', e.target.value)}
                />
              </div>

              <button className="next-step-btn" onClick={handleNextStep}>
                Continue
              </button>
            </div>
          )}

          {applicationStep === 3 && (
            <div className="application-step">
              <h4>Final Details</h4>
              
              <div className="form-group">
                <label>Why do you need this card?</label>
                <textarea 
                  placeholder="e.g. Travel, online shopping, business expenses..."
                  value={applicationData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  rows="4"
                />
              </div>

              <div className="application-summary">
                <h5>Application Summary</h5>
                <div className="summary-item">
                  <span>Card Type:</span>
                  <span>{applicationData.cardType === 'debit' ? 'Akka Debit Card' : 'Akka Credit Card'}</span>
                </div>
                <div className="summary-item">
                  <span>Annual Income:</span>
                  <span>{applicationData.annualIncome}</span>
                </div>
                <div className="summary-item">
                  <span>Employment:</span>
                  <span>{applicationData.employmentStatus}</span>
                </div>
              </div>

              <button className="submit-application-btn" onClick={handleSubmitApplication}>
                Submit Application
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Cards Overview Component
const CardsSection = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  
  const totalBalance = USER_CARDS.reduce((sum, card) => sum + card.balance, 0);
  const totalSpentThisMonth = USER_CARDS.reduce((sum, card) => sum + card.spent_this_month, 0);

  return (
    <div className="cards-section">
      <div className="cards-header">
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
        <button className="add-card-btn" onClick={() => setShowApplyModal(true)}>
          + Apply for New Card
        </button>
      </div>

      {/* Card Details Modal */}
      {selectedCard && (
        <CardDetailsModal 
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {/* Apply for New Card Modal */}
      {showApplyModal && (
        <ApplyCardModal 
          onClose={() => setShowApplyModal(false)}
        />
      )}
    </div>
  );
};

// Crypto Portfolio Modal Component
const CryptoPortfolioModal = ({ onClose, onSellCrypto }) => {
  const cryptoAddresses = {
    BTC: {
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      balance: DEMO_USER.crypto_portfolio.BTC.amount,
      value: DEMO_USER.crypto_portfolio.BTC.value,
      name: 'Bitcoin'
    },
    ETH: {
      address: '0x742d35Cc6634C0532925a3b8D87f2B08A1',
      balance: DEMO_USER.crypto_portfolio.ETH.amount,
      value: DEMO_USER.crypto_portfolio.ETH.value,
      name: 'Ethereum'
    },
    ADA: {
      address: 'addr1qxy2lpan99fcnr3qkm8uw5adyy7fx9382',
      balance: DEMO_USER.crypto_portfolio.ADA.amount,
      value: DEMO_USER.crypto_portfolio.ADA.value,
      name: 'Cardano'
    },
    DOT: {
      address: '13UVJyLnbVp77Z2t6rN2fD3UZEYfUq84Hs',
      balance: DEMO_USER.crypto_portfolio.DOT.amount,
      value: DEMO_USER.crypto_portfolio.DOT.value,
      name: 'Polkadot'
    },
    SOL: {
      address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6Z',
      balance: DEMO_USER.crypto_portfolio.SOL.amount,
      value: DEMO_USER.crypto_portfolio.SOL.value,
      name: 'Solana'
    }
  };

  // Filter crypto transactions
  const cryptoTransactions = USER_TRANSACTION_HISTORY.filter(transaction => 
    transaction.type === 'buy' || transaction.type === 'sell' || 
    (transaction.type === 'send' && transaction.crypto !== 'EUR')
  ).slice(0, 10);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copied to clipboard!`);
  };

  const handleSellCrypto = (symbol) => {
    // Close portfolio modal and open sell modal with pre-selected crypto
    onClose();
    if (onSellCrypto) {
      onSellCrypto(symbol);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="crypto-portfolio-modal">
        <div className="modal-header">
          <h3>My Crypto Portfolio</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* Portfolio Summary */}
          <div className="crypto-portfolio-summary">
            <div className="portfolio-total">
              <span className="portfolio-label">Total Portfolio Value</span>
              <span className="portfolio-amount">€{DEMO_USER.total_portfolio.toLocaleString()}</span>
            </div>
            <div className="portfolio-change">
              <span className="change-indicator positive">+2.23% (24h)</span>
            </div>
          </div>

          {/* Crypto Assets */}
          <div className="crypto-assets-section">
            <h4>Your Crypto Assets</h4>
            {Object.entries(cryptoAddresses).map(([symbol, crypto]) => (
              <div key={symbol} className="crypto-asset-item">
                <div className="crypto-asset-header">
                  <div className="crypto-info">
                    <div className={`crypto-icon ${symbol.toLowerCase()}`}>
                      {symbol.charAt(0)}
                    </div>
                    <div className="crypto-details">
                      <span className="crypto-name">{crypto.name} ({symbol})</span>
                      <span className="crypto-balance">{crypto.balance} {symbol}</span>
                    </div>
                  </div>
                  <div className="crypto-value">
                    <span className="value-eur">€{crypto.value.toLocaleString()}</span>
                    <button 
                      className="sell-crypto-btn"
                      onClick={() => handleSellCrypto(symbol)}
                    >
                      Sell
                    </button>
                  </div>
                </div>
                
                <div className="crypto-address-section">
                  <span className="address-label">Your {symbol} Address:</span>
                  <div className="address-container">
                    <span className="crypto-address">{crypto.address}</span>
                    <button 
                      className="copy-address-btn" 
                      onClick={() => copyToClipboard(crypto.address, `${symbol} Address`)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="crypto-actions-section">
            <button 
              className="crypto-action-btn buy"
              onClick={() => {
                onClose();
                // Could trigger buy modal here if needed
                alert('Buy More Crypto - will open Buy modal');
              }}
            >
              📈 Buy More Crypto
            </button>
            <button 
              className="crypto-action-btn sell"
              onClick={() => {
                onClose();
                if (onSellCrypto) {
                  onSellCrypto('BTC'); // Default to BTC for general sell
                }
              }}
            >
              📉 Sell Crypto
            </button>
            <button 
              className="crypto-action-btn send"
              onClick={() => {
                onClose();
                alert('Send Crypto - will open Send modal');
              }}
            >
              📤 Send Crypto
            </button>
          </div>

          {/* Crypto Transaction History */}
          <div className="crypto-history-section">
            <h4>Recent Crypto Transactions</h4>
            {cryptoTransactions.length > 0 ? (
              <div className="crypto-transactions-list">
                {cryptoTransactions.map(transaction => (
                  <div key={transaction.id} className="crypto-transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-type">
                        {transaction.type === 'buy' && '💳 Bought'} 
                        {transaction.type === 'sell' && '💰 Sold'}
                        {transaction.type === 'send' && '📤 Sent'}
                        {' '}{transaction.crypto}
                      </div>
                      <div className="transaction-date">{transaction.date}</div>
                    </div>
                    <div className="transaction-amount">
                      <div className="crypto-amount">{transaction.amount} {transaction.crypto}</div>
                      {transaction.eur_amount && (
                        <div className="eur-equivalent">€{transaction.eur_amount.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-transactions">
                <p>No recent crypto transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Bank Account Details Modal
const BankAccountModal = ({ currencyCode, onClose, userBalances, setShowSendModal, setShowReceiveModal }) => {
  const CURRENCY_BALANCES = getCurrencyBalances(userBalances);
  if (!currencyCode || !CURRENCY_BALANCES[currencyCode]) return null;
  
  const currency = CURRENCY_BALANCES[currencyCode];
  
  // Filter transactions for this specific currency
  const currencyTransactions = USER_TRANSACTION_HISTORY.filter(transaction => 
    transaction.crypto === currencyCode || 
    (currencyCode === 'EUR' && (transaction.type === 'sell' || transaction.type === 'deposit'))
  ).slice(0, 10); // Show last 10 transactions

  const bankInfo = currency.bank_info;

  return (
    <div className="modal-overlay">
      <div className="bank-account-modal-modern">
        <div className="modal-header-modern">
          <button className="back-btn" onClick={onClose}>
            ← Back
          </button>
          <h3>{currency.flag} {currency.name} Account</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="account-summary-section">
          {/* Account Holder Info */}
          <div className="account-holder-card">
            <div className="holder-avatar">
              <span>👤</span>
            </div>
            <div className="holder-details">
              <div className="holder-name">{bankInfo.account_name}</div>
              <div className="holder-id">Customer ID: AKK-{Math.random().toString().substr(2, 6)}</div>
            </div>
          </div>

          {/* Main Balance Display */}
          <div className="main-balance-card">
            <div className="balance-label">Available Balance</div>
            <div className="balance-amount">{currency.symbol}{currency.balance.toLocaleString()}</div>
            <div className="balance-subtitle">
              {currency.name} • Current Account
            </div>
            <div className="account-status-modern">
              <span className="status-indicator-modern active"></span>
              <span>Active Account</span>
            </div>
          </div>

          {/* Account Details Grid */}
          <div className="account-details-grid">
            <div className="detail-item-modern">
              <span className="detail-label">Bank Name</span>
              <span className="detail-value">{bankInfo.bank_name}</span>
            </div>
            <div className="detail-item-modern">
              <span className="detail-label">IBAN</span>
              <span className="detail-value">{bankInfo.iban}</span>
            </div>
            <div className="detail-item-modern">
              <span className="detail-label">Sort Code</span>
              <span className="detail-value">{bankInfo.sort_code}</span>
            </div>
            <div className="detail-item-modern">
              <span className="detail-label">BIC/SWIFT</span>
              <span className="detail-value">{bankInfo.bic}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="account-actions-modern">
          <button className="action-btn-modern transfer" onClick={() => {
            onClose();
            setShowSendModal(true);
          }}>
            <div className="action-icon">💸</div>
            <div className="action-text">
              <div className="action-title">Transfer Money</div>
              <div className="action-subtitle">Send to bank or wallet</div>
            </div>
          </button>
          
          <button className="action-btn-modern deposit" onClick={() => {
            onClose();
            setShowReceiveModal(true);
          }}>
            <div className="action-icon">💰</div>
            <div className="action-text">
              <div className="action-title">Add Funds</div>
              <div className="action-subtitle">Deposit or top up</div>
            </div>
          </button>
          
          <button className="action-btn-modern statement" onClick={() => {
            alert(`📄 Downloading ${currency.name} account statement...`);
          }}>
            <div className="action-icon">📄</div>
            <div className="action-text">
              <div className="action-title">Statement</div>
              <div className="action-subtitle">Download PDF</div>
            </div>
          </button>
        </div>

        {/* Recent Transactions Section */}
        <div className="recent-transactions-section">
          <div className="section-header-modern">
            <h4>Recent Transactions</h4>
            <span className="transaction-count">{currencyTransactions.length} transactions</span>
          </div>
          
          <div className="transactions-list-modern">
            {currencyTransactions.length > 0 ? (
              currencyTransactions.map((transaction, index) => (
                <div key={index} className="transaction-item-modern">
                  <div className="transaction-icon">
                    {transaction.type === 'buy' && '📈'}
                    {transaction.type === 'sell' && '📉'}
                    {transaction.type === 'send' && '📤'}
                    {transaction.type === 'receive' && '📥'}
                    {transaction.type === 'deposit' && '💰'}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-title">
                      {transaction.type === 'buy' && `Buy ${transaction.crypto}`}
                      {transaction.type === 'sell' && `Sell ${transaction.crypto}`}
                      {transaction.type === 'send' && `Send ${transaction.crypto}`}
                      {transaction.type === 'receive' && `Receive ${transaction.crypto}`}
                      {transaction.type === 'deposit' && `${currency.name} Deposit`}
                    </div>
                    <div className="transaction-subtitle">
                      {transaction.date} • #{transaction.id || `TX${Date.now()}`}
                    </div>
                  </div>
                  <div className="transaction-amount">
                    <div className={`amount ${transaction.type === 'buy' || transaction.type === 'deposit' ? 'positive' : 'negative'}`}>
                      {(transaction.type === 'buy' || transaction.type === 'deposit') ? '+' : '-'}
                      {currency.symbol}{(transaction.eur_amount || transaction.amount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-transactions-modern">
                <div className="empty-icon">📝</div>
                <div className="empty-title">No transactions yet</div>
                <div className="empty-subtitle">Your {currency.name} transaction history will appear here</div>
              </div>
            )}
          </div>
        </div>

        {/* Account Footer Info */}
        <div className="account-footer">
          <div className="footer-info">
            🔒 Your account is protected by bank-level security
          </div>
          <div className="footer-details">
            Account opened: January 2024 • Last login: Today
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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [profilePage, setProfilePage] = useState('main'); // main, personal, security, payment, docs, help, settings
  const [historyFilter, setHistoryFilter] = useState('all'); // all, buys, sells, sends, receives
  const [selectedCard, setSelectedCard] = useState(null);
  const [cryptoSearchQuery, setCryptoSearchQuery] = useState('');
  const [currentCurrencyIndex, setCurrentCurrencyIndex] = useState(0); // For sliding
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [selectedCurrencyAccount, setSelectedCurrencyAccount] = useState(null);
  const [showCryptoPortfolioModal, setShowCryptoPortfolioModal] = useState(false);
  const [showCryptoDetailsModal, setShowCryptoDetailsModal] = useState(false);
  const [selectedCryptoDetails, setSelectedCryptoDetails] = useState(null);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('English'); // Language state
  const [settingsChanged, setSettingsChanged] = useState(false); // Track if settings need saving
  const [showTransactionSuccess, setShowTransactionSuccess] = useState(false); // Show transaction success
  const [lastTransaction, setLastTransaction] = useState(null); // Store last transaction details
  const [userBalances, setUserBalances] = useState({ // State for user balances to force re-render
    eur: DEMO_USER.balance_eur,
    crypto_portfolio: { ...DEMO_USER.crypto_portfolio }
  });
  
  // Touch/swipe state for manual carousel
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const currencyKeys = Object.keys(getCurrencyBalances(userBalances));
  const totalSlides = currencyKeys.length + 1; // Include crypto portfolio

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
    // Use simulation instead of simple alert
    simulateBuyCrypto(crypto, amount, eurAmount);
    setShowBuyModal(false);
    setSelectedCrypto(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'profile') {
      setProfilePage('main');
    }
  };

  const handleCryptoDetails = (crypto, data) => {
    setSelectedCryptoDetails({ crypto, data });
    setShowCryptoDetailsModal(true);
  };

  const handleLogout = () => {
    logout();
  };

  const getFilteredTransactions = () => {
    switch(historyFilter) {
      case 'buys':
        return USER_TRANSACTION_HISTORY.filter(t => t.type === 'buy');
      case 'sells':
        return USER_TRANSACTION_HISTORY.filter(t => t.type === 'sell');
      case 'sends':
        return USER_TRANSACTION_HISTORY.filter(t => t.type === 'send');
      case 'receives':
        return USER_TRANSACTION_HISTORY.filter(t => t.type === 'receive');
      default:
        return USER_TRANSACTION_HISTORY;
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
  const currentCurrency = currencyKeys[currentCurrencyIndex];
  
  const nextCurrency = () => {
    if (currentCurrencyIndex < totalSlides - 1) {
      setCurrentCurrencyIndex(currentCurrencyIndex + 1);
    }
  };
  
  const prevCurrency = () => {
    if (currentCurrencyIndex > 0) {
      setCurrentCurrencyIndex(currentCurrencyIndex - 1);
    }
  };
  


  // Handle language change
  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    setSettingsChanged(true); // Mark settings as changed
  };

  // Save settings
  const saveSettings = () => {
    // Store in localStorage for persistence
    localStorage.setItem('akka_language', currentLanguage);
    setSettingsChanged(false);
    alert(`Settings saved! Language set to ${currentLanguage}. Full app translation coming soon!`);
  };

  // Simulate buying crypto and update portfolio
  const simulateBuyCrypto = (crypto, amount, eurAmount) => {
    // Update crypto portfolio
    if (DEMO_USER.crypto_portfolio[crypto.symbol]) {
      DEMO_USER.crypto_portfolio[crypto.symbol].amount += parseFloat(amount);
      DEMO_USER.crypto_portfolio[crypto.symbol].value += parseFloat(eurAmount);
    } else {
      // Add new crypto to portfolio
      DEMO_USER.crypto_portfolio[crypto.symbol] = {
        amount: parseFloat(amount),
        value: parseFloat(eurAmount)
      };
    }
    
    // Deduct EUR from balance
    DEMO_USER.balance_eur -= parseFloat(eurAmount);
    
    // Update state to force re-render
    setUserBalances({
      eur: DEMO_USER.balance_eur,
      crypto_portfolio: { ...DEMO_USER.crypto_portfolio }
    });
    
    // Add to transaction history
    const newTransaction = {
      id: Date.now(),
      type: 'buy',
      crypto: crypto.symbol,
      amount: parseFloat(amount),
      eur_amount: parseFloat(eurAmount),
      date: new Date().toLocaleString('en-GB', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).replace(',', ''),
      status: 'completed'
    };
    USER_TRANSACTION_HISTORY.unshift(newTransaction);
    
    // Set transaction success data
    setLastTransaction({
      ...newTransaction,
      action: 'purchased',
      currentBalance: DEMO_USER.crypto_portfolio[crypto.symbol].amount,
      currentEurBalance: DEMO_USER.balance_eur
    });
    
    // Show success modal
    setShowTransactionSuccess(true);
  };

  // Simulate selling crypto and update portfolio
  const simulateSellCrypto = (cryptoSymbol, amount, eurAmount) => {
    if (DEMO_USER.crypto_portfolio[cryptoSymbol]) {
      // Reduce crypto amount and value
      DEMO_USER.crypto_portfolio[cryptoSymbol].amount -= parseFloat(amount);
      DEMO_USER.crypto_portfolio[cryptoSymbol].value -= parseFloat(eurAmount);
      
      // If amount becomes 0 or negative, remove from portfolio
      if (DEMO_USER.crypto_portfolio[cryptoSymbol].amount <= 0) {
        delete DEMO_USER.crypto_portfolio[cryptoSymbol];
      }
      
      // Add EUR to balance
      DEMO_USER.balance_eur += parseFloat(eurAmount);
      
      // Update state to force re-render
      setUserBalances({
        eur: DEMO_USER.balance_eur,
        crypto_portfolio: { ...DEMO_USER.crypto_portfolio }
      });
      
      // Add to transaction history
      const newTransaction = {
        id: Date.now(),
        type: 'sell',
        crypto: cryptoSymbol,
        amount: parseFloat(amount),
        eur_amount: parseFloat(eurAmount),
        date: new Date().toLocaleString('en-GB', { 
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        }).replace(',', ''),
        status: 'completed'
      };
      USER_TRANSACTION_HISTORY.unshift(newTransaction);
      
      // Set transaction success data
      setLastTransaction({
        ...newTransaction,
        action: 'sold',
        currentBalance: DEMO_USER.crypto_portfolio[cryptoSymbol]?.amount || 0,
        currentEurBalance: DEMO_USER.balance_eur
      });
      
      // Show success modal
      setShowTransactionSuccess(true);
    }
  };

  // Simulate sending money
  const simulateSendMoney = (currency, amount, recipient) => {
    if (currency === 'EUR') {
      DEMO_USER.balance_eur -= parseFloat(amount);
    } else if (DEMO_USER.crypto_portfolio[currency]) {
      DEMO_USER.crypto_portfolio[currency].amount -= parseFloat(amount);
      // Recalculate value proportionally
      const ratio = DEMO_USER.crypto_portfolio[currency].amount / (DEMO_USER.crypto_portfolio[currency].amount + parseFloat(amount));
      DEMO_USER.crypto_portfolio[currency].value *= ratio;
    }
    
    // Update state to force re-render
    setUserBalances({
      eur: DEMO_USER.balance_eur,
      crypto_portfolio: { ...DEMO_USER.crypto_portfolio }
    });
    
    // Add to transaction history
    const newTransaction = {
      id: Date.now(),
      type: 'send',
      crypto: currency,
      amount: parseFloat(amount),
      recipient: recipient,
      date: new Date().toLocaleString('en-GB', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).replace(',', ''),
      status: 'completed'
    };
    USER_TRANSACTION_HISTORY.unshift(newTransaction);
    
    // Set transaction success data
    setLastTransaction({
      ...newTransaction,
      action: 'sent',
      currentBalance: currency === 'EUR' ? DEMO_USER.balance_eur : DEMO_USER.crypto_portfolio[currency]?.amount || 0,
      currentEurBalance: DEMO_USER.balance_eur
    });
    
    // Show success modal
    setShowTransactionSuccess(true);
  };

  // Handle selling crypto from portfolio
  const handleSellFromPortfolio = (cryptoSymbol) => {
    setSelectedCrypto({ symbol: cryptoSymbol, name: cryptoSymbol });
    setShowSellModal(true);
  };

  const handleCurrencyClick = (currencyCode) => {
    // Allow click if not in the middle of a swipe gesture
    // On mobile, touchStart might be briefly set, so we check if user is actually swiping
    const isActuallySwiping = touchStart && touchEnd && Math.abs(touchStart - touchEnd) > 50;
    
    if (!isActuallySwiping) {
      if (currencyCode === 'CRYPTO') {
        // Show crypto portfolio modal
        setShowCryptoPortfolioModal(true);
      } else {
        setSelectedCurrencyAccount(currencyCode);
        setShowBankAccountModal(true);
      }
    }
  };

  // Touch handlers for manual swipe implementation
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentCurrencyIndex < totalSlides - 1) {
      setCurrentCurrencyIndex(currentCurrencyIndex + 1);
    }
    if (isRightSwipe && currentCurrencyIndex > 0) {
      setCurrentCurrencyIndex(currentCurrencyIndex - 1);
    }
    
    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Initialize Swiper
  useEffect(() => {
    const initSwiper = () => {
      if (window.Swiper && !swiperInstance) {
        const swiper = new window.Swiper('.portfolio-swiper', {
          // Core settings for horizontal swiping only
          direction: 'horizontal',
          slidesPerView: 1,
          spaceBetween: 0,
          centeredSlides: true,
          speed: 300,
          effect: 'slide',
          loop: false,
          
          // Optimize touch/drag settings for horizontal swiping only
          touchRatio: 1,
          touchAngle: 30, // More restrictive angle for horizontal-only
          threshold: 10,
          grabCursor: true,
          simulateTouch: true,
          allowTouchMove: true,
          touchStartPreventDefault: false,
          resistance: true,
          resistanceRatio: 0.85,
          
          // Prevent vertical scrolling during horizontal swipe
          nested: false,
          passiveListeners: false,
          
          // Click handling during swipe
          preventClicks: false,
          preventClicksPropagation: false,
          slideToClickedSlide: false,
          allowSlideNext: true,
          allowSlidePrev: true,
          
          // Keyboard navigation
          keyboard: {
            enabled: true,
            onlyInViewport: true,
          },
          
          // Disable mouse wheel for horizontal-only swiping
          mousewheel: {
            enabled: false,
          },
          
          // Pagination dots
          pagination: {
            el: '.portfolio-pagination',
            clickable: true,
            bulletClass: 'portfolio-bullet',
            bulletActiveClass: 'portfolio-bullet-active',
          },
          
          // Navigation arrows
          navigation: {
            nextEl: '.portfolio-nav-next',
            prevEl: '.portfolio-nav-prev',
          },
          
          // Callbacks
          on: {
            slideChange: function() {
              setCurrentCurrencyIndex(this.activeIndex);
            },
            touchStart: function(swiper, event) {
              // Disable click during active touch/swipe
              swiper.allowClick = false;
              swiper.clickTimeout = setTimeout(() => {
                swiper.allowClick = true;
              }, 300);
            },
            touchEnd: function(swiper) {
              // Re-enable clicks after touch ends
              clearTimeout(swiper.clickTimeout);
              setTimeout(() => {
                swiper.allowClick = true;
              }, 200);
            },
            touchMove: function(swiper, event) {
              // Ensure only horizontal movement
              const touchAngle = Math.atan2(
                Math.abs(swiper.touches.diff.y),
                Math.abs(swiper.touches.diff.x)
              ) * 180 / Math.PI;
              
              if (touchAngle > 30) {
                // Prevent swiper from moving if angle is too vertical
                swiper.allowTouchMove = false;
                setTimeout(() => {
                  swiper.allowTouchMove = true;
                }, 100);
              }
            }
          },
        });
        
        setSwiperInstance(swiper);
      }
    };

    // Check if Swiper is loaded, if not wait a bit
    if (window.Swiper) {
      initSwiper();
    } else {
      const checkSwiper = setInterval(() => {
        if (window.Swiper) {
          initSwiper();
          clearInterval(checkSwiper);
        }
      }, 100);
      
      return () => clearInterval(checkSwiper);
    }
  }, [swiperInstance]);

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
            <div className="user-greeting">
              <span>Hello, {user.name.split(' ')[0]} 👋</span>
              <div className="verification-badge">
                <span className="verified-icon">✓</span>
                Verified
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="notification-btn" onClick={() => setShowHistoryModal(true)}>
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
        {activeTab === 'home' && (
          <div className="home-content">
            {/* Clean Currency Balance Carousel - No Container Box */}
            <div className="currency-slider-container">
              <div 
                className="currency-slide-wrapper"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="currency-slides"
                  style={{ transform: `translateX(-${currentCurrencyIndex * 100}%)` }}
                >
                  {/* Currency slides */}
                  {currencyKeys.map((currencyCode) => {
                    const currency = getCurrencyBalances(userBalances)[currencyCode];
                    return (
                      <div 
                        key={currencyCode} 
                        className="currency-slide"
                        onClick={() => handleCurrencyClick(currencyCode)}
                        onTouchEnd={(e) => {
                          // Prevent click if this was a swipe gesture
                          if (!touchStart || !touchEnd || Math.abs(touchStart - touchEnd) < 50) {
                            handleCurrencyClick(currencyCode);
                          }
                          e.preventDefault();
                        }}
                      >
                        <div className="clean-balance-card">
                          <div className="balance-header-clean">
                            <div className="currency-info-clean">
                              <span className="currency-flag-large">{currency.flag}</span>
                              <div className="currency-details-clean">
                                <span className="currency-name-clean">{currency.name} Balance</span>
                                <span className="currency-code-clean">{currencyCode}</span>
                              </div>
                            </div>
                            <div className="balance-change-clean">
                              <span className={`change-indicator ${currency.change_24h >= 0 ? 'positive' : 'negative'}`}>
                                {currency.change_24h >= 0 ? '+' : ''}{currency.change_24h}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="main-balance-clean">
                            <div className="balance-amount-clean">
                              {currency.symbol}{currency.balance.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Crypto portfolio slide */}
                  <div className="currency-slide">
                    <div 
                      className="clean-balance-card crypto"
                      onClick={() => handleCurrencyClick('CRYPTO')}
                      onTouchEnd={(e) => {
                        // Prevent click if this was a swipe gesture
                        if (!touchStart || !touchEnd || Math.abs(touchStart - touchEnd) < 50) {
                          handleCurrencyClick('CRYPTO');
                        }
                        e.preventDefault();
                      }}
                    >
                      <div className="balance-header-clean">
                        <div className="currency-info-clean">
                          <span className="currency-flag-large">₿</span>
                          <div className="currency-details-clean">
                            <span className="currency-name-clean">Total portfolio value</span>
                            <span className="currency-code-clean">CRYPTO</span>
                          </div>
                        </div>
                        <div className="balance-change-clean">
                          <span className="change-indicator positive">+2.23%</span>
                        </div>
                      </div>
                      
                      <div className="main-balance-clean">
                        <div className="balance-amount-clean">
                          €{DEMO_USER.total_portfolio.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pagination indicators */}
            <div className="currency-indicators-clean">
              {[...currencyKeys, 'CRYPTO'].map((_, index) => (
                <button
                  key={index}
                  className={`indicator-clean ${index === currentCurrencyIndex ? 'active' : ''}`}
                  onClick={() => setCurrentCurrencyIndex(index)}
                />
              ))}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="action-btn primary" onClick={() => {
                // Set default crypto to BTC for Quick Action Buy
                const defaultCrypto = cryptoPrices.BTC || { symbol: 'BTC', price: 120000, name: 'Bitcoin' };
                setSelectedCrypto(defaultCrypto);
                setShowBuyModal(true);
              }}>
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

            {/* Cards Section - Back to Middle Position */}
            <div className="home-cards-section">
              <div className="section-header">
                <h3>Your cards</h3>
                <button className="see-all-btn" onClick={() => handleTabChange('cards')}>View all</button>
              </div>
              <div className="cards-preview">
                {USER_CARDS.slice(0, 2).map(card => (
                  <div key={card.id} className="card-preview" onClick={() => setSelectedCard(card)}>
                    <div className="card-preview-header">
                      <span className="card-type-icon">💳</span>
                      <span className="card-name">{card.name}</span>
                    </div>
                    <div className="card-connection-preview">{card.description}</div>
                    <div className="card-balance-preview">€{card.balance.toLocaleString()}</div>
                    <div className="card-spent-preview">
                      Spent this month: €{card.spent_this_month.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio - Now After Cards (Middle-Down) */}
            <div className="home-portfolio">
              <div className="section-header">
                <h3>Your portfolio</h3>
                <button className="see-all-btn" onClick={() => handleTabChange('portfolio')}>View all</button>
              </div>
              <div className="portfolio-list">
                {Object.entries(DEMO_USER.crypto_portfolio).map(([crypto, data]) => (
                  <PortfolioItem key={crypto} crypto={crypto} data={data} onClick={() => handleCryptoDetails(crypto, data)} />
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
                {USER_TRANSACTION_HISTORY.slice(0, 3).map(transaction => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cards' && (
          <CardsSection />
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
                  <PortfolioItem 
                    key={crypto} 
                    crypto={crypto} 
                    data={data} 
                    onSell={handleSellFromPortfolio}
                  />
                ))}
              </div>
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
                      <select 
                        className="setting-select" 
                        value={currentLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                      >
                        <option value="English">English</option>
                        <option value="Türkçe">Türkçe</option>
                        <option value="Deutsch">Deutsch</option>
                        <option value="Español">Español</option>
                        <option value="Français">Français</option>
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

                  {/* Save Settings Button */}
                  {settingsChanged && (
                    <div className="settings-save-section">
                      <button className="save-settings-btn" onClick={saveSettings}>
                        💾 Save Settings
                      </button>
                    </div>
                  )}
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
          className={`nav-item ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => handleTabChange('cards')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z"/>
            <path d="M2 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/>
          </svg>
          <span>Cards</span>
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

      {/* Crypto Details Modal */}
      {showCryptoDetailsModal && selectedCryptoDetails && (
        <CryptoDetailsModal
          crypto={selectedCryptoDetails.crypto}
          data={selectedCryptoDetails.data}
          onClose={() => setShowCryptoDetailsModal(false)}
          onBuy={(crypto) => {
            setSelectedCrypto(crypto);
            setShowBuyModal(true);
          }}
          onSell={(crypto) => {
            setSelectedCrypto({ symbol: crypto });
            setShowSellModal(true);
          }}
          cryptoPrices={cryptoPrices}
        />
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <HistoryModal
          onClose={() => setShowHistoryModal(false)}
          historyFilter={historyFilter}
          setHistoryFilter={setHistoryFilter}
        />
      )}

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
          preselectedCrypto={selectedCrypto}
          onSellComplete={simulateSellCrypto}
        />
      )}

      {/* Send Modal */}
      {showSendModal && (
        <SendModal
          onClose={() => setShowSendModal(false)}
          onSendComplete={simulateSendMoney}
          userBalances={userBalances}
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
          userBalances={userBalances}
          setShowSendModal={setShowSendModal}
          setShowReceiveModal={setShowReceiveModal}
        />
      )}
      
      {showCryptoPortfolioModal && (
        <CryptoPortfolioModal 
          onClose={() => setShowCryptoPortfolioModal(false)}
          onSellCrypto={handleSellFromPortfolio}
        />
      )}

      {/* Transaction Success Modal */}
      {showTransactionSuccess && (
        <TransactionSuccessModal
          transaction={lastTransaction}
          onClose={() => setShowTransactionSuccess(false)}
        />
      )}
    </div>
  );
};

// Transaction Success Modal Component
const TransactionSuccessModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const getSuccessMessage = () => {
    switch (transaction.type) {
      case 'buy':
        return `Successfully purchased ${transaction.amount} ${transaction.crypto}!`;
      case 'sell':
        return `Successfully sold ${transaction.amount} ${transaction.crypto}!`;
      case 'send':
        return `Successfully sent ${transaction.amount} ${transaction.crypto}!`;
      default:
        return 'Transaction completed successfully!';
    }
  };

  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'buy': return '🟢';
      case 'sell': return '🔴';
      case 'send': return '📤';
      default: return '✅';
    }
  };

  const getBalanceInfo = () => {
    if (transaction.type === 'buy' || transaction.type === 'sell') {
      return (
        <>
          <div className="balance-update">
            <span className="balance-label">{transaction.crypto} Balance:</span>
            <span className="balance-value">{transaction.currentBalance} {transaction.crypto}</span>
          </div>
          <div className="balance-update">
            <span className="balance-label">EUR Balance:</span>
            <span className="balance-value">€{transaction.currentEurBalance.toFixed(2)}</span>
          </div>
        </>
      );
    } else if (transaction.type === 'send') {
      return (
        <div className="balance-update">
          <span className="balance-label">Remaining {transaction.crypto} Balance:</span>
          <span className="balance-value">{transaction.currentBalance} {transaction.crypto}</span>
        </div>
      );
    }
  };

  return (
    <div className="modal-overlay">
      <div className="transaction-success-modal enhanced">
        <div className="success-header">
          <div className="success-icon-large">{getTransactionIcon()}</div>
          <h3>Transaction Successful!</h3>
          <p className="success-subtitle">{getSuccessMessage()}</p>
        </div>
        
        <div className="success-content">
          <div className="transaction-card">
            <div className="transaction-details">
              <div className="detail-row">
                <span className="detail-label">Transaction ID:</span>
                <span className="detail-value">#{transaction.id || 'TX' + Date.now()}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value highlight">{transaction.amount} {transaction.crypto}</span>
              </div>
              
              {transaction.eur_amount && (
                <div className="detail-row">
                  <span className="detail-label">Value:</span>
                  <span className="detail-value highlight">€{transaction.eur_amount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="detail-row">
                <span className="detail-label">Date & Time:</span>
                <span className="detail-value">{transaction.date}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value success-status">✓ Completed</span>
              </div>
              
              {transaction.recipient && (
                <div className="detail-row">
                  <span className="detail-label">Recipient:</span>
                  <span className="detail-value">{transaction.recipient}</span>
                </div>
              )}
            </div>

            <div className="current-balances">
              <h5>📊 Updated Balances</h5>
              {getBalanceInfo()}
            </div>
          </div>
          
          <div className="success-actions">
            <button className="btn-secondary modern" onClick={onClose}>
              📱 View Portfolio
            </button>
            <button className="btn-primary modern" onClick={onClose}>
              💱 Continue Trading
            </button>
          </div>
          
          <div className="transaction-footer">
            <p>🔒 Your funds are secure • Transaction processed instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasscodeRequired, setIsPasscodeRequired] = useState(false);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('akka_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsPasscodeRequired(true); // Require passcode after login
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('akka_user', JSON.stringify(userData));
    setIsPasscodeRequired(true); // Require passcode after successful login
  };

  const signup = (userData) => {
    setUser(userData);
    localStorage.setItem('akka_user', JSON.stringify(userData));
    setIsPasscodeRequired(true); // Require passcode after successful signup
  };

  const logout = () => {
    setUser(null);
    setIsPasscodeRequired(false);
    localStorage.removeItem('akka_user');
  };

  const verifyPasscode = (passcode) => {
    // In a real app, this would verify against a stored/encrypted passcode
    const correctPasscode = '123456'; // Demo passcode
    if (passcode === correctPasscode) {
      setIsPasscodeRequired(false);
      return true;
    }
    return false;
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    isPasscodeRequired,
    verifyPasscode
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
  const { user, login, signup, loading, isPasscodeRequired } = useAuth();

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

  // Show passcode entry if user is logged in but passcode is required
  if (user && isPasscodeRequired) {
    return <PasscodeEntry />;
  }

  // Show main app if user is authenticated and passcode is verified
  if (user && !isPasscodeRequired) {
    return <MainApp />;
  }

  // Show login/signup if no user
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