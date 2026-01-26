"""
Backend API Tests for Automation Builder Feature
Tests: Authentication, Automation CRUD, Templates, Toggle
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "ilienecorsen@postaruba.com"
ADMIN_PASSWORD = "admin123"


class TestHealthCheck:
    """Health check tests - run first"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success_admin(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        assert response.status_code == 401


class TestAutomationTemplates:
    """Automation templates endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_get_templates(self):
        """Test fetching automation templates"""
        response = requests.get(f"{BASE_URL}/api/automations/templates", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify template structure
        template = data[0]
        assert "id" in template
        assert "name" in template
        assert "description" in template
        assert "trigger" in template
        assert "actions" in template
    
    def test_templates_require_auth(self):
        """Test that templates endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/automations/templates")
        assert response.status_code in [401, 403]


class TestAutomationCRUD:
    """Automation CRUD operations tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_get_automations_empty_or_list(self):
        """Test fetching automations list"""
        response = requests.get(f"{BASE_URL}/api/automations/", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_automation_with_keyword_trigger(self):
        """Test creating automation with keyword trigger and send_reply action"""
        automation_data = {
            "name": "TEST_Keyword Automation",
            "description": "Test automation for keyword matching",
            "active": True,
            "trigger": {
                "type": "keyword",
                "keywords": ["test", "hello", "help"],
                "match_type": "contains",
                "case_sensitive": False
            },
            "conditions": [],
            "actions": [
                {
                    "type": "send_reply",
                    "message_template": "This is a test reply message"
                }
            ],
            "channels": ["all"],
            "priority": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/automations/", json=automation_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["name"] == automation_data["name"]
        assert data["description"] == automation_data["description"]
        assert data["active"] == True
        assert data["trigger"]["type"] == "keyword"
        assert "test" in data["trigger"]["keywords"]
        assert len(data["actions"]) == 1
        assert data["actions"][0]["type"] == "send_reply"
        
        # Store ID for cleanup
        self.created_automation_id = data["id"]
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/automations/{data['id']}", headers=self.headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == automation_data["name"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/automations/{data['id']}", headers=self.headers)
    
    def test_create_automation_validation_no_name(self):
        """Test that automation requires a name"""
        automation_data = {
            "description": "Test without name",
            "active": True,
            "trigger": {"type": "keyword", "keywords": ["test"]},
            "actions": [{"type": "send_reply", "message_template": "Test"}],
            "channels": ["all"]
        }
        
        response = requests.post(f"{BASE_URL}/api/automations/", json=automation_data, headers=self.headers)
        # Should fail validation
        assert response.status_code in [400, 422]
    
    def test_update_automation(self):
        """Test updating an existing automation"""
        # First create an automation
        create_data = {
            "name": "TEST_Update Automation",
            "description": "Original description",
            "active": True,
            "trigger": {"type": "keyword", "keywords": ["original"], "match_type": "contains"},
            "conditions": [],
            "actions": [{"type": "send_reply", "message_template": "Original message"}],
            "channels": ["all"],
            "priority": 0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/automations/", json=create_data, headers=self.headers)
        assert create_response.status_code == 200
        automation_id = create_response.json()["id"]
        
        # Update the automation
        update_data = {
            "name": "TEST_Updated Automation",
            "description": "Updated description",
            "trigger": {"type": "keyword", "keywords": ["updated", "new"], "match_type": "contains"},
            "actions": [{"type": "send_reply", "message_template": "Updated message"}]
        }
        
        update_response = requests.put(f"{BASE_URL}/api/automations/{automation_id}", json=update_data, headers=self.headers)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == "TEST_Updated Automation"
        assert updated["description"] == "Updated description"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/automations/{automation_id}", headers=self.headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == "TEST_Updated Automation"
        assert "updated" in fetched["trigger"]["keywords"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/automations/{automation_id}", headers=self.headers)
    
    def test_delete_automation(self):
        """Test deleting an automation"""
        # First create an automation
        create_data = {
            "name": "TEST_Delete Automation",
            "description": "To be deleted",
            "active": True,
            "trigger": {"type": "keyword", "keywords": ["delete"], "match_type": "contains"},
            "conditions": [],
            "actions": [{"type": "send_reply", "message_template": "Delete me"}],
            "channels": ["all"],
            "priority": 0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/automations/", json=create_data, headers=self.headers)
        assert create_response.status_code == 200
        automation_id = create_response.json()["id"]
        
        # Delete the automation
        delete_response = requests.delete(f"{BASE_URL}/api/automations/{automation_id}", headers=self.headers)
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/automations/{automation_id}", headers=self.headers)
        assert get_response.status_code == 404
    
    def test_toggle_automation(self):
        """Test toggling automation active/inactive"""
        # First create an automation
        create_data = {
            "name": "TEST_Toggle Automation",
            "description": "Toggle test",
            "active": True,
            "trigger": {"type": "keyword", "keywords": ["toggle"], "match_type": "contains"},
            "conditions": [],
            "actions": [{"type": "send_reply", "message_template": "Toggle test"}],
            "channels": ["all"],
            "priority": 0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/automations/", json=create_data, headers=self.headers)
        assert create_response.status_code == 200
        automation_id = create_response.json()["id"]
        initial_active = create_response.json()["active"]
        
        # Toggle the automation
        toggle_response = requests.put(f"{BASE_URL}/api/automations/{automation_id}/toggle", headers=self.headers)
        assert toggle_response.status_code == 200
        
        # Verify toggle worked
        get_response = requests.get(f"{BASE_URL}/api/automations/{automation_id}", headers=self.headers)
        assert get_response.status_code == 200
        assert get_response.json()["active"] != initial_active
        
        # Toggle back
        toggle_response2 = requests.put(f"{BASE_URL}/api/automations/{automation_id}/toggle", headers=self.headers)
        assert toggle_response2.status_code == 200
        
        get_response2 = requests.get(f"{BASE_URL}/api/automations/{automation_id}", headers=self.headers)
        assert get_response2.json()["active"] == initial_active
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/automations/{automation_id}", headers=self.headers)
    
    def test_automations_require_auth(self):
        """Test that automation endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/automations/")
        assert response.status_code in [401, 403]
        
        response = requests.post(f"{BASE_URL}/api/automations/", json={"name": "test"})
        assert response.status_code in [401, 403]


class TestAutomationActionTypes:
    """Test different action types in automations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_create_automation_with_multiple_actions(self):
        """Test creating automation with multiple action types"""
        automation_data = {
            "name": "TEST_Multi Action Automation",
            "description": "Test with multiple actions",
            "active": True,
            "trigger": {"type": "keyword", "keywords": ["complaint"], "match_type": "contains"},
            "conditions": [],
            "actions": [
                {"type": "set_priority", "priority": "urgent"},
                {"type": "add_tag", "tag": "complaint"},
                {"type": "send_reply", "message_template": "We apologize for the inconvenience."},
                {"type": "send_to_human"}
            ],
            "channels": ["all"],
            "priority": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/automations/", json=automation_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["actions"]) == 4
        action_types = [a["type"] for a in data["actions"]]
        assert "set_priority" in action_types
        assert "add_tag" in action_types
        assert "send_reply" in action_types
        assert "send_to_human" in action_types
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/automations/{data['id']}", headers=self.headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
