#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Akka Fintech
Tests all API endpoints, CoinMarketCap integration, database operations, and error handling
"""

import requests
import json
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE_URL}")

class BackendTester:
    def __init__(self):
        self.test_results = []
        self.created_user_id = None
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        try:
            response = requests.get(f"{API_BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Akka" in data["message"]:
                    self.log_test("Root Endpoint", True, "API is accessible and returns welcome message", data)
                    return True
                else:
                    self.log_test("Root Endpoint", False, "Unexpected response format", data)
                    return False
            else:
                self.log_test("Root Endpoint", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Connection error: {str(e)}")
            return False

    def test_crypto_prices_default(self):
        """Test GET /api/crypto/prices with default symbols"""
        try:
            response = requests.get(f"{API_BASE_URL}/crypto/prices")
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if "prices" not in data or "timestamp" not in data:
                    self.log_test("Crypto Prices (Default)", False, "Missing required fields in response", data)
                    return False
                
                prices = data["prices"]
                
                # Check if we have price data
                if not prices:
                    self.log_test("Crypto Prices (Default)", False, "No price data returned", data)
                    return False
                
                # Check if we have expected cryptocurrencies
                expected_cryptos = ["BTC", "ETH"]
                found_cryptos = [crypto for crypto in expected_cryptos if crypto in prices]
                
                if not found_cryptos:
                    self.log_test("Crypto Prices (Default)", False, "No expected cryptocurrencies found", data)
                    return False
                
                # Check price data structure for first crypto
                first_crypto = list(prices.keys())[0]
                crypto_data = prices[first_crypto]
                required_fields = ["symbol", "name", "price", "change_24h", "market_cap", "volume_24h"]
                
                missing_fields = [field for field in required_fields if field not in crypto_data]
                if missing_fields:
                    self.log_test("Crypto Prices (Default)", False, f"Missing fields in crypto data: {missing_fields}", crypto_data)
                    return False
                
                # Check if prices are realistic (not mock data)
                btc_price = prices.get("BTC", {}).get("price", 0)
                is_real_data = btc_price > 10000 and btc_price != 42000.0  # 42000 is the mock price
                
                details = f"Found {len(prices)} cryptocurrencies. BTC price: ${btc_price:,.2f}"
                if is_real_data:
                    details += " (Real CoinMarketCap data detected)"
                else:
                    details += " (Mock/fallback data detected)"
                
                self.log_test("Crypto Prices (Default)", True, details, {"crypto_count": len(prices), "btc_price": btc_price, "is_real_data": is_real_data})
                return True
                
            else:
                self.log_test("Crypto Prices (Default)", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Crypto Prices (Default)", False, f"Request error: {str(e)}")
            return False

    def test_crypto_prices_custom(self):
        """Test GET /api/crypto/prices with custom symbols"""
        try:
            custom_symbols = "BTC,ETH,ADA"
            response = requests.get(f"{API_BASE_URL}/crypto/prices?symbols={custom_symbols}")
            
            if response.status_code == 200:
                data = response.json()
                prices = data.get("prices", {})
                
                # Check if we got the requested symbols
                requested_symbols = custom_symbols.split(",")
                found_symbols = [symbol for symbol in requested_symbols if symbol in prices]
                
                if len(found_symbols) >= 2:  # At least 2 out of 3 should work
                    self.log_test("Crypto Prices (Custom)", True, f"Found {len(found_symbols)} out of {len(requested_symbols)} requested symbols", {"found": found_symbols})
                    return True
                else:
                    self.log_test("Crypto Prices (Custom)", False, f"Only found {len(found_symbols)} out of {len(requested_symbols)} symbols", data)
                    return False
            else:
                self.log_test("Crypto Prices (Custom)", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Crypto Prices (Custom)", False, f"Request error: {str(e)}")
            return False

    def test_crypto_trending(self):
        """Test GET /api/crypto/trending"""
        try:
            response = requests.get(f"{API_BASE_URL}/crypto/trending")
            
            if response.status_code == 200:
                data = response.json()
                
                if "trending" not in data:
                    self.log_test("Crypto Trending", False, "Missing 'trending' field in response", data)
                    return False
                
                trending = data["trending"]
                
                if not isinstance(trending, list) or len(trending) == 0:
                    self.log_test("Crypto Trending", False, "Trending should be a non-empty list", data)
                    return False
                
                # Check if trending cryptos are sorted by market cap
                market_caps = [crypto.get("market_cap", 0) for crypto in trending]
                is_sorted = all(market_caps[i] >= market_caps[i+1] for i in range(len(market_caps)-1))
                
                details = f"Found {len(trending)} trending cryptocurrencies"
                if is_sorted:
                    details += " (properly sorted by market cap)"
                else:
                    details += " (not sorted by market cap)"
                
                self.log_test("Crypto Trending", True, details, {"count": len(trending), "sorted": is_sorted})
                return True
                
            else:
                self.log_test("Crypto Trending", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Crypto Trending", False, f"Request error: {str(e)}")
            return False

    def test_create_user(self):
        """Test POST /api/users"""
        try:
            user_data = {
                "email": "alice.johnson@example.com",
                "name": "Alice Johnson"
            }
            
            response = requests.post(f"{API_BASE_URL}/users", json=user_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["id", "email", "name", "eur_balance", "try_balance", "crypto_portfolio", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Create User", False, f"Missing fields: {missing_fields}", data)
                    return False
                
                # Validate data
                if data["email"] != user_data["email"] or data["name"] != user_data["name"]:
                    self.log_test("Create User", False, "User data doesn't match input", data)
                    return False
                
                # Store user ID for later tests
                self.created_user_id = data["id"]
                
                self.log_test("Create User", True, f"User created with ID: {self.created_user_id}", {"user_id": self.created_user_id})
                return True
                
            else:
                self.log_test("Create User", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Create User", False, f"Request error: {str(e)}")
            return False

    def test_get_user(self):
        """Test GET /api/users/{user_id}"""
        if not self.created_user_id:
            self.log_test("Get User", False, "No user ID available (create user test must pass first)")
            return False
            
        try:
            response = requests.get(f"{API_BASE_URL}/users/{self.created_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify it's the same user
                if data.get("id") == self.created_user_id and data.get("email") == "alice.johnson@example.com":
                    self.log_test("Get User", True, f"Successfully retrieved user: {data['name']}", {"user_id": self.created_user_id})
                    return True
                else:
                    self.log_test("Get User", False, "Retrieved user data doesn't match", data)
                    return False
                    
            elif response.status_code == 404:
                self.log_test("Get User", False, "User not found in database", response.text)
                return False
            else:
                self.log_test("Get User", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get User", False, f"Request error: {str(e)}")
            return False

    def test_crypto_swap(self):
        """Test POST /api/swap"""
        if not self.created_user_id:
            self.log_test("Crypto Swap", False, "No user ID available (create user test must pass first)")
            return False
            
        try:
            swap_data = {
                "user_id": self.created_user_id,
                "from_currency": "BTC",
                "to_currency": "ETH",
                "amount": 0.1
            }
            
            response = requests.post(f"{API_BASE_URL}/swap", json=swap_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["success", "transaction_id", "exchange_rate", "receive_amount", "fee_percentage"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Crypto Swap", False, f"Missing fields: {missing_fields}", data)
                    return False
                
                if data.get("success") != True:
                    self.log_test("Crypto Swap", False, "Swap not successful", data)
                    return False
                
                # Validate exchange rate and amounts
                exchange_rate = data.get("exchange_rate", 0)
                receive_amount = data.get("receive_amount", 0)
                
                if exchange_rate <= 0 or receive_amount <= 0:
                    self.log_test("Crypto Swap", False, "Invalid exchange rate or receive amount", data)
                    return False
                
                details = f"Swapped 0.1 BTC to {receive_amount:.6f} ETH (rate: {exchange_rate:.4f})"
                self.log_test("Crypto Swap", True, details, data)
                return True
                
            else:
                self.log_test("Crypto Swap", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Crypto Swap", False, f"Request error: {str(e)}")
            return False

    def test_exchange_rates(self):
        """Test GET /api/exchange-rates"""
        try:
            response = requests.get(f"{API_BASE_URL}/exchange-rates")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected exchange rates
                expected_rates = ["EUR_TRY", "USD_EUR", "USD_TRY"]
                missing_rates = [rate for rate in expected_rates if rate not in data]
                
                if missing_rates:
                    self.log_test("Exchange Rates", False, f"Missing exchange rates: {missing_rates}", data)
                    return False
                
                # Check if timestamp is present
                if "timestamp" not in data:
                    self.log_test("Exchange Rates", False, "Missing timestamp", data)
                    return False
                
                # Validate rates are positive numbers
                invalid_rates = []
                for rate_name in expected_rates:
                    rate_value = data.get(rate_name, 0)
                    if not isinstance(rate_value, (int, float)) or rate_value <= 0:
                        invalid_rates.append(rate_name)
                
                if invalid_rates:
                    self.log_test("Exchange Rates", False, f"Invalid rate values: {invalid_rates}", data)
                    return False
                
                details = f"EUR/TRY: {data['EUR_TRY']}, USD/EUR: {data['USD_EUR']}, USD/TRY: {data['USD_TRY']}"
                self.log_test("Exchange Rates", True, details, data)
                return True
                
            else:
                self.log_test("Exchange Rates", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Exchange Rates", False, f"Request error: {str(e)}")
            return False

    def test_error_handling(self):
        """Test error handling with invalid inputs"""
        tests_passed = 0
        total_tests = 0
        
        # Test 1: Invalid user ID
        total_tests += 1
        try:
            response = requests.get(f"{API_BASE_URL}/users/invalid-user-id")
            if response.status_code == 404:
                tests_passed += 1
                print("    ✅ Invalid user ID returns 404")
            else:
                print(f"    ❌ Invalid user ID returned {response.status_code}, expected 404")
        except Exception as e:
            print(f"    ❌ Error testing invalid user ID: {e}")
        
        # Test 2: Invalid swap request (missing fields)
        total_tests += 1
        try:
            invalid_swap = {"user_id": "test", "amount": 100}  # Missing required fields
            response = requests.post(f"{API_BASE_URL}/swap", json=invalid_swap)
            if response.status_code in [400, 422]:  # Bad request or validation error
                tests_passed += 1
                print("    ✅ Invalid swap request returns error")
            else:
                print(f"    ❌ Invalid swap returned {response.status_code}, expected 400/422")
        except Exception as e:
            print(f"    ❌ Error testing invalid swap: {e}")
        
        # Test 3: Invalid crypto symbols
        total_tests += 1
        try:
            response = requests.get(f"{API_BASE_URL}/crypto/prices?symbols=INVALID,FAKE")
            if response.status_code == 200:
                data = response.json()
                # Should return empty prices or fallback data
                if "prices" in data:
                    tests_passed += 1
                    print("    ✅ Invalid crypto symbols handled gracefully")
                else:
                    print("    ❌ Invalid crypto symbols response missing prices field")
            else:
                print(f"    ❌ Invalid crypto symbols returned {response.status_code}")
        except Exception as e:
            print(f"    ❌ Error testing invalid crypto symbols: {e}")
        
        success = tests_passed == total_tests
        details = f"Passed {tests_passed}/{total_tests} error handling tests"
        self.log_test("Error Handling", success, details)
        return success

    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("AKKA FINTECH BACKEND API TESTING")
        print("=" * 60)
        print()
        
        # Test sequence
        tests = [
            ("Root Endpoint", self.test_root_endpoint),
            ("Crypto Prices (Default)", self.test_crypto_prices_default),
            ("Crypto Prices (Custom)", self.test_crypto_prices_custom),
            ("Crypto Trending", self.test_crypto_trending),
            ("Create User", self.test_create_user),
            ("Get User", self.test_get_user),
            ("Crypto Swap", self.test_crypto_swap),
            ("Exchange Rates", self.test_exchange_rates),
            ("Error Handling", self.test_error_handling)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            if test_func():
                passed += 1
        
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        print()
        
        # Detailed results
        print("DETAILED RESULTS:")
        print("-" * 40)
        for result in self.test_results:
            status = "✅ PASS" if result["success"] else "❌ FAIL"
            print(f"{status} {result['test']}")
            if result["details"]:
                print(f"    {result['details']}")
        
        print()
        
        # CoinMarketCap Integration Analysis
        crypto_tests = [r for r in self.test_results if "Crypto" in r["test"] and r["success"]]
        if crypto_tests:
            print("COINMARKETCAP INTEGRATION ANALYSIS:")
            print("-" * 40)
            
            # Check if we detected real data
            real_data_detected = False
            for result in crypto_tests:
                if result.get("response_data", {}).get("is_real_data"):
                    real_data_detected = True
                    break
            
            if real_data_detected:
                print("✅ CoinMarketCap API is working - Real cryptocurrency data detected")
                print("   API Key: 3a519d7b-a49f-4788-a8e6-fa6bed104640 is valid")
            else:
                print("⚠️  CoinMarketCap API may be using fallback data")
                print("   Either API key is invalid or rate limited")
                print("   API Key: 3a519d7b-a49f-4788-a8e6-fa6bed104640")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)