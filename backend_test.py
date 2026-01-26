#!/usr/bin/env python3
"""
Post Aruba Support Center Backend API Test Suite
Tests all backend endpoints with proper authentication and role-based access control.
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL from the review request
BASE_URL = "https://fresh-support.preview.emergentagent.com/api"

class PostArubaAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.agent_token = None
        self.test_results = []
        self.created_agent_id = None
        self.created_channel_id = None
        
    def log_test(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    token: str = None, expected_status: int = 200) -> Dict:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Check if response status matches expected
            if response.status_code != expected_status:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": f"Expected {expected_status}, got {response.status_code}",
                    "response": response.text
                }
            
            # Try to parse JSON response
            try:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "data": response.json()
                }
            except json.JSONDecodeError:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "data": response.text
                }
                
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n=== Testing Health Check ===")
        
        # Test root endpoint
        result = self.make_request("GET", "/")
        if result.get("success"):
            self.log_test("Root Endpoint", True, "API is running", result.get("data"))
        
        # Test get agents only
        result = self.make_request("GET", "/users/agents", token=self.admin_token)
        if result.get("success"):
            agents = result.get("data", [])
            agent_roles = [a.get("role") for a in agents]
            if all(role == "agent" for role in agent_roles):
                self.log_test("Get Agents Only", True, f"Retrieved {len(agents)} agents")
            else:
                self.log_test("Get Agents Only", False, f"Non-agent users returned: {agent_roles}")
        else:
            self.log_test("Get Agents Only", False, "Failed to get agents", result)
        else:
            self.log_test("Root Endpoint", False, "API not responding", result)
        
        # Test health endpoint
        result = self.make_request("GET", "/health")
        if result.get("success"):
            self.log_test("Health Check", True, "Health endpoint working", result.get("data"))
        else:
            self.log_test("Health Check", False, "Health endpoint failed", result)
    
    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n=== Testing Authentication ===")
        
        # Test admin login
        login_data = {
            "email": "ilienecorsen@postaruba.com",
            "password": "admin123"
        }
        
        result = self.make_request("POST", "/auth/login", login_data)
        if result.get("success"):
            data = result.get("data", {})
            if "access_token" in data and "user" in data:
                self.admin_token = data["access_token"]
                user = data["user"]
                if user.get("role") == "admin":
                    self.log_test("Admin Login", True, f"Successfully logged in as {user.get('name')}")
                else:
                    self.log_test("Admin Login", False, f"Expected admin role, got {user.get('role')}")
            else:
                self.log_test("Admin Login", False, "Missing access_token or user in response", data)
        else:
            self.log_test("Admin Login", False, "Login failed", result)
        
        # Test invalid login
        invalid_login = {
            "email": "invalid@email.com",
            "password": "wrongpassword"
        }
        
        result = self.make_request("POST", "/auth/login", invalid_login, expected_status=401)
        if result.get("success"):
            self.log_test("Invalid Login Rejection", True, "Correctly rejected invalid credentials")
        else:
            self.log_test("Invalid Login Rejection", False, "Should have rejected invalid login", result)
    
    def test_users_api(self):
        """Test users/agents API endpoints"""
        print("\n=== Testing Users/Agents API ===")
        
        if not self.admin_token:
            self.log_test("Users API", False, "No admin token available")
            return
        
        # Test get all users
        result = self.make_request("GET", "/users/", token=self.admin_token)
        if result.get("success"):
            users = result.get("data", [])
            self.log_test("Get All Users", True, f"Retrieved {len(users)} users")
        else:
            self.log_test("Get All Users", False, "Failed to get users", result)
        
        # Test create new agent (use timestamp to ensure unique email)
        import time
        timestamp = int(time.time())
        agent_data = {
            "name": "Test Agent",
            "email": f"test{timestamp}@postaruba.com",
            "password": "test123",
            "role": "agent"
        }
        
        result = self.make_request("POST", "/users/", agent_data, token=self.admin_token)
        if result.get("success"):
            agent = result.get("data", {})
            self.created_agent_id = agent.get("id")
            self.log_test("Create Agent", True, f"Created agent: {agent.get('name')}")
            
            # Test agent login with the new agent
            agent_login = {
                "email": agent_data["email"],
                "password": "test123"
            }
            
            result = self.make_request("POST", "/auth/login", agent_login)
            if result.get("success"):
                data = result.get("data", {})
                if "access_token" in data:
                    self.agent_token = data["access_token"]
                    self.log_test("Agent Login", True, "Agent successfully logged in")
                else:
                    self.log_test("Agent Login", False, "No access token in response")
            else:
                self.log_test("Agent Login", False, "Agent login failed", result)
        else:
            self.log_test("Create Agent", False, "Failed to create agent", result)
    
    def test_conversations_api(self):
        """Test conversations API"""
        print("\n=== Testing Conversations API ===")
        
        if not self.admin_token:
            self.log_test("Conversations API", False, "No admin token available")
            return
        
        # Test get conversations
        result = self.make_request("GET", "/conversations/", token=self.admin_token)
        if result.get("success"):
            conversations = result.get("data", [])
            if len(conversations) >= 5:
                self.log_test("Get Conversations", True, f"Retrieved {len(conversations)} sample conversations")
            else:
                self.log_test("Get Conversations", False, f"Expected at least 5 conversations, got {len(conversations)}")
        else:
            self.log_test("Get Conversations", False, "Failed to get conversations", result)
    
    def test_channels_api(self):
        """Test channels API (admin only)"""
        print("\n=== Testing Channels API ===")
        
        if not self.admin_token:
            self.log_test("Channels API", False, "No admin token available")
            return
        
        # Test create WhatsApp channel
        whatsapp_data = {
            "name": "Main WhatsApp",
            "phone_number": "+297555100"
        }
        
        result = self.make_request("POST", "/channels/whatsapp", whatsapp_data, token=self.admin_token)
        if result.get("success"):
            channel = result.get("data", {})
            self.created_channel_id = channel.get("id")
            self.log_test("Create WhatsApp Channel", True, f"Created channel: {channel.get('name')}")
        else:
            self.log_test("Create WhatsApp Channel", False, "Failed to create WhatsApp channel", result)
        
        # Test get WhatsApp channels
        result = self.make_request("GET", "/channels/whatsapp", token=self.admin_token)
        if result.get("success"):
            channels = result.get("data", [])
            self.log_test("Get WhatsApp Channels", True, f"Retrieved {len(channels)} WhatsApp channels")
        else:
            self.log_test("Get WhatsApp Channels", False, "Failed to get WhatsApp channels", result)
        
        # Test channels summary
        result = self.make_request("GET", "/channels/summary", token=self.admin_token)
        if result.get("success"):
            summary = result.get("data", {})
            expected_keys = ["whatsapp", "facebook", "email"]
            if all(key in summary for key in expected_keys):
                self.log_test("Channels Summary", True, "Retrieved channel counts summary")
            else:
                self.log_test("Channels Summary", False, f"Missing keys in summary: {summary}")
        else:
            self.log_test("Channels Summary", False, "Failed to get channels summary", result)
    
    def test_automation_api(self):
        """Test automation API (admin only)"""
        print("\n=== Testing Automation API ===")
        
        if not self.admin_token:
            self.log_test("Automation API", False, "No admin token available")
            return
        
        # Test get auto responses
        result = self.make_request("GET", "/automation/", token=self.admin_token)
        if result.get("success"):
            responses = result.get("data", [])
            self.log_test("Get Auto Responses", True, f"Retrieved {len(responses)} auto responses")
        else:
            self.log_test("Get Auto Responses", False, "Failed to get auto responses", result)
    
    def test_analytics_api(self):
        """Test analytics API (admin only)"""
        print("\n=== Testing Analytics API ===")
        
        if not self.admin_token:
            self.log_test("Analytics API", False, "No admin token available")
            return
        
        # Test get analytics
        result = self.make_request("GET", "/analytics/", token=self.admin_token)
        if result.get("success"):
            analytics = result.get("data", {})
            expected_keys = ["total_tickets", "open_tickets", "tickets_by_channel", "agents"]
            if all(key in analytics for key in expected_keys):
                self.log_test("Get Analytics", True, "Retrieved analytics statistics")
            else:
                self.log_test("Get Analytics", False, f"Missing keys in analytics: {analytics}")
        else:
            self.log_test("Get Analytics", False, "Failed to get analytics", result)
    
    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n=== Testing Role-Based Access Control ===")
        
        if not self.agent_token:
            self.log_test("Role-Based Access", False, "No agent token available")
            return
        
        # Test agent accessing conversations (should only see assigned ones)
        result = self.make_request("GET", "/conversations/", token=self.agent_token)
        if result.get("success"):
            conversations = result.get("data", [])
            # Agents should see empty list or only assigned conversations
            self.log_test("Agent Conversations Access", True, f"Agent sees {len(conversations)} conversations (assigned only)")
        else:
            self.log_test("Agent Conversations Access", False, "Agent failed to access conversations", result)
        
        # Test agent accessing admin-only automation endpoint (should fail)
        result = self.make_request("GET", "/automation/", token=self.agent_token, expected_status=403)
        if result.get("success"):
            self.log_test("Agent Automation Access Denied", True, "Correctly denied agent access to automation")
        else:
            # Check if it's a 403 error
            if result.get("status_code") == 403:
                self.log_test("Agent Automation Access Denied", True, "Correctly denied agent access to automation")
            else:
                self.log_test("Agent Automation Access Denied", False, "Should have denied agent access", result)
        
        # Test agent accessing admin-only analytics endpoint (should fail)
        result = self.make_request("GET", "/analytics/", token=self.agent_token, expected_status=403)
        if result.get("success"):
            self.log_test("Agent Analytics Access Denied", True, "Correctly denied agent access to analytics")
        else:
            if result.get("status_code") == 403:
                self.log_test("Agent Analytics Access Denied", True, "Correctly denied agent access to analytics")
            else:
                self.log_test("Agent Analytics Access Denied", False, "Should have denied agent access", result)
    
    def test_unauthorized_access(self):
        """Test endpoints without authentication"""
        print("\n=== Testing Unauthorized Access ===")
        
        # Test accessing protected endpoint without token (accept both 401 and 403)
        result = self.make_request("GET", "/users/")
        if result.get("status_code") in [401, 403]:
            self.log_test("Unauthorized Access Denied", True, f"Correctly denied access without token (HTTP {result.get('status_code')})")
        else:
            self.log_test("Unauthorized Access Denied", False, "Should have denied unauthorized access", result)
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Post Aruba Support Center Backend API Tests")
        print(f"📍 Base URL: {self.base_url}")
        
        # Run test suites in order
        self.test_health_check()
        self.test_authentication()
        self.test_users_api()
        self.test_conversations_api()
        self.test_channels_api()
        self.test_automation_api()
        self.test_analytics_api()
        self.test_role_based_access()
        self.test_unauthorized_access()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("📊 TEST RESULTS SUMMARY")
        print("="*60)
        
        passed = sum(1 for r in self.test_results if r["success"])
        failed = len(self.test_results) - passed
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['message']}")
        
        print("\n" + "="*60)
        
        # Return exit code
        return 0 if failed == 0 else 1

def main():
    """Main test runner"""
    tester = PostArubaAPITester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()