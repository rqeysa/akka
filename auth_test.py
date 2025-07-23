#!/usr/bin/env python3
"""
Authentication Endpoints Testing for Akka Fintech
Tests the newly added auth functionality: signup and login
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

print(f"Testing authentication endpoints at: {API_BASE_URL}")

class AuthTester:
    def __init__(self):
        self.test_results = []
        
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

    def test_auth_signup(self):
        """Test POST /api/auth/signup"""
        try:
            signup_data = {
                "name": "Emma Rodriguez",
                "email": "emma.rodriguez@example.com",
                "password": "SecurePass123!"
            }
            
            response = requests.post(f"{API_BASE_URL}/auth/signup", json=signup_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if "success" not in data or "user" not in data:
                    self.log_test("Auth Signup", False, "Missing required fields in response", data)
                    return False
                
                if not data.get("success"):
                    self.log_test("Auth Signup", False, "Signup not successful", data)
                    return False
                
                user = data["user"]
                
                # Check user data structure
                required_fields = ["id", "name", "email", "verified", "balance_eur", "balance_try", "crypto_portfolio", "created_at"]
                missing_fields = [field for field in required_fields if field not in user]
                
                if missing_fields:
                    self.log_test("Auth Signup", False, f"Missing user fields: {missing_fields}", user)
                    return False
                
                # Validate user data
                if user["name"] != signup_data["name"] or user["email"] != signup_data["email"]:
                    self.log_test("Auth Signup", False, "User data doesn't match signup input", user)
                    return False
                
                # Check that password is not in response (security)
                if "password" in user:
                    self.log_test("Auth Signup", False, "Password should not be in response", user)
                    return False
                
                details = f"User {user['name']} created successfully with ID: {user['id']}"
                self.log_test("Auth Signup", True, details, {"user_id": user["id"], "email": user["email"]})
                return True
                
            else:
                self.log_test("Auth Signup", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Auth Signup", False, f"Request error: {str(e)}")
            return False

    def test_auth_login(self):
        """Test POST /api/auth/login"""
        try:
            login_data = {
                "email": "john.doe@example.com",
                "password": "MyPassword123"
            }
            
            response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if "success" not in data or "user" not in data:
                    self.log_test("Auth Login", False, "Missing required fields in response", data)
                    return False
                
                if not data.get("success"):
                    self.log_test("Auth Login", False, "Login not successful", data)
                    return False
                
                user = data["user"]
                
                # Check user data structure
                required_fields = ["id", "name", "email", "verified", "balance_eur", "balance_try", "crypto_portfolio"]
                missing_fields = [field for field in required_fields if field not in user]
                
                if missing_fields:
                    self.log_test("Auth Login", False, f"Missing user fields: {missing_fields}", user)
                    return False
                
                # Validate user data
                if user["email"] != login_data["email"]:
                    self.log_test("Auth Login", False, "User email doesn't match login input", user)
                    return False
                
                # Check that password is not in response (security)
                if "password" in user:
                    self.log_test("Auth Login", False, "Password should not be in response", user)
                    return False
                
                # Check if user has realistic balances and portfolio (mock data)
                has_balances = user.get("balance_eur", 0) > 0 or user.get("balance_try", 0) > 0
                has_portfolio = bool(user.get("crypto_portfolio", {}))
                
                details = f"User {user['name']} logged in successfully"
                if has_balances:
                    details += f" (EUR: €{user['balance_eur']:.2f}, TRY: ₺{user['balance_try']:.2f})"
                if has_portfolio:
                    portfolio_count = len(user['crypto_portfolio'])
                    details += f" (Portfolio: {portfolio_count} assets)"
                
                self.log_test("Auth Login", True, details, {"user_id": user["id"], "email": user["email"], "has_balances": has_balances, "has_portfolio": has_portfolio})
                return True
                
            else:
                self.log_test("Auth Login", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Auth Login", False, f"Request error: {str(e)}")
            return False

    def test_auth_logout(self):
        """Test POST /api/auth/logout"""
        try:
            response = requests.post(f"{API_BASE_URL}/auth/logout")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if "success" not in data or "message" not in data:
                    self.log_test("Auth Logout", False, "Missing required fields in response", data)
                    return False
                
                if not data.get("success"):
                    self.log_test("Auth Logout", False, "Logout not successful", data)
                    return False
                
                details = f"Logout successful: {data['message']}"
                self.log_test("Auth Logout", True, details, data)
                return True
                
            else:
                self.log_test("Auth Logout", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Auth Logout", False, f"Request error: {str(e)}")
            return False

    def run_auth_tests(self):
        """Run all authentication tests"""
        print("=" * 60)
        print("AKKA FINTECH AUTHENTICATION TESTING")
        print("=" * 60)
        print()
        
        # Test sequence
        tests = [
            ("Auth Signup", self.test_auth_signup),
            ("Auth Login", self.test_auth_login),
            ("Auth Logout", self.test_auth_logout)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            if test_func():
                passed += 1
        
        print("=" * 60)
        print("AUTHENTICATION TEST SUMMARY")
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
        return passed == total

if __name__ == "__main__":
    tester = AuthTester()
    success = tester.run_auth_tests()
    exit(0 if success else 1)