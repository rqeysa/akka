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

const RECENT_TRANSACTIONS = [
  { id: 1, type: 'buy', crypto: 'BTC', amount: 0.025, eur_amount: 2970.50, date: '2025-01-22 14:30', status: 'completed' },
  { id: 2, type: 'sell', crypto: 'ETH', amount: 0.5, eur_amount: 1670.00, date: '2025-01-22 12:15', status: 'completed' },
  { id: 3, type: 'deposit', crypto: 'EUR', amount: 500.00, date: '2025-01-21 18:45', status: 'completed' },
  { id: 4, type: 'buy', crypto: 'ADA', amount: 500, eur_amount: 575.00, date: '2025-01-21 16:20', status: 'pending' },
  { id: 5, type: 'withdraw', crypto: 'BTC', amount: 0.01, date: '2025-01-21 10:30', status: 'completed' }
];

const FEATURED_CRYPTOS = ['BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'MATIC', 'LINK', 'AVAX'];

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

  const handleLogout = () => {
    logout();
  };

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
            <div className="akka-logo-header">
              <div className="logo-icon"></div>
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
            <div className="user-avatar" onClick={() => setActiveTab('profile')}>
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
                  <div className="balance-amount">€{DEMO_USER.total_portfolio.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  <div className="balance-change positive">+€245.30 (+2.87%)</div>
                </div>
                
                <div className="balance-card secondary">
                  <div className="balance-label">EUR Balance</div>
                  <div className="balance-amount">€{DEMO_USER.balance_eur.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="action-btn primary" onClick={() => setActiveTab('market')}>
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

            {/* Portfolio */}
            <div className="home-portfolio">
              <div className="section-header">
                <h3>Your portfolio</h3>
                <button className="see-all-btn" onClick={() => setActiveTab('portfolio')}>View all</button>
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
                <button className="see-all-btn" onClick={() => setActiveTab('history')}>View all</button>
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

            <button className="logout-btn" onClick={handleLogout}>
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