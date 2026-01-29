"""
Backend API Tests for New Features:
1. Analytics - Overview and Agent Activity
2. Mark as Resolved - Conversation status updates
3. Customer Satisfaction Survey - Settings and auto-send
4. Auto-escalation - Conversations older than 24 hours
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

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
    """Authentication tests"""
    
    def test_login_admin(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"


class TestAnalyticsOverview:
    """Analytics Overview endpoint tests"""
    
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
    
    def test_get_analytics_overview(self):
        """Test fetching analytics overview - Total Tickets, Open, Escalated, Resolved"""
        response = requests.get(f"{BASE_URL}/api/analytics/", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields exist
        assert "total_tickets" in data
        assert "open_tickets" in data
        assert "escalated_tickets" in data
        assert "resolved_today" in data
        assert "tickets_by_channel" in data
        assert "weekly_trend" in data
        
        # Verify data types
        assert isinstance(data["total_tickets"], int)
        assert isinstance(data["open_tickets"], int)
        assert isinstance(data["escalated_tickets"], int)
        assert isinstance(data["resolved_today"], int)
        assert isinstance(data["tickets_by_channel"], list)
        assert isinstance(data["weekly_trend"], list)
    
    def test_analytics_requires_admin(self):
        """Test that analytics requires admin role"""
        response = requests.get(f"{BASE_URL}/api/analytics/")
        assert response.status_code in [401, 403]


class TestAgentActivity:
    """Agent Activity analytics tests"""
    
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
    
    def test_get_agent_activity_default_range(self):
        """Test fetching agent activity with default date range (last 7 days)"""
        response = requests.get(f"{BASE_URL}/api/analytics/agent-activity", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "date_range" in data
        assert "agent_stats" in data
        assert "daily_breakdown" in data
        assert "summary" in data
        
        # Verify date range
        assert "start" in data["date_range"]
        assert "end" in data["date_range"]
        
        # Verify summary fields
        assert "total_interactions" in data["summary"]
        assert "total_resolved" in data["summary"]
        assert "total_open" in data["summary"]
    
    def test_get_agent_activity_custom_range(self):
        """Test fetching agent activity with custom date range"""
        today = datetime.utcnow()
        start_date = (today - timedelta(days=30)).strftime("%Y-%m-%d")
        end_date = today.strftime("%Y-%m-%d")
        
        response = requests.get(
            f"{BASE_URL}/api/analytics/agent-activity",
            params={"start_date": start_date, "end_date": end_date},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify date range matches request
        assert data["date_range"]["start"] == start_date
        assert data["date_range"]["end"] == end_date
    
    def test_agent_stats_structure(self):
        """Test agent stats have correct structure"""
        response = requests.get(f"{BASE_URL}/api/analytics/agent-activity", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data["agent_stats"]) > 0:
            agent = data["agent_stats"][0]
            # Verify agent stat fields
            assert "agent_id" in agent
            assert "agent_name" in agent
            assert "agent_email" in agent
            assert "total_messages" in agent
            assert "resolved_tickets" in agent
            assert "assigned_tickets" in agent
            assert "open_tickets" in agent
            assert "status" in agent


class TestConversationStatus:
    """Conversation status update tests - Mark as Resolved"""
    
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
    
    def test_get_conversations(self):
        """Test fetching conversations list"""
        response = requests.get(f"{BASE_URL}/api/conversations/", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_update_conversation_status_to_resolved(self):
        """Test marking a conversation as resolved"""
        # First get a conversation
        response = requests.get(f"{BASE_URL}/api/conversations/", headers=self.headers)
        assert response.status_code == 200
        conversations = response.json()
        
        if len(conversations) == 0:
            pytest.skip("No conversations available for testing")
        
        # Find an open conversation
        open_conv = None
        for conv in conversations:
            if conv.get("status") in ["open", "pending"]:
                open_conv = conv
                break
        
        if not open_conv:
            pytest.skip("No open conversations available")
        
        conv_id = open_conv["id"]
        
        # Mark as resolved
        response = requests.put(
            f"{BASE_URL}/api/conversations/{conv_id}/status",
            params={"status": "resolved"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Verify status changed
        get_response = requests.get(f"{BASE_URL}/api/conversations/{conv_id}", headers=self.headers)
        assert get_response.status_code == 200
        updated_conv = get_response.json()
        assert updated_conv["status"] == "resolved"
        
        # Reopen for other tests
        requests.put(
            f"{BASE_URL}/api/conversations/{conv_id}/status",
            params={"status": "open"},
            headers=self.headers
        )
    
    def test_update_conversation_status_invalid(self):
        """Test updating with invalid status"""
        # Get a conversation
        response = requests.get(f"{BASE_URL}/api/conversations/", headers=self.headers)
        conversations = response.json()
        
        if len(conversations) == 0:
            pytest.skip("No conversations available")
        
        conv_id = conversations[0]["id"]
        
        # Try invalid status
        response = requests.put(
            f"{BASE_URL}/api/conversations/{conv_id}/status",
            params={"status": "invalid_status"},
            headers=self.headers
        )
        assert response.status_code == 400
    
    def test_reopen_resolved_conversation(self):
        """Test reopening a resolved conversation"""
        # Get conversations
        response = requests.get(f"{BASE_URL}/api/conversations/", headers=self.headers)
        conversations = response.json()
        
        if len(conversations) == 0:
            pytest.skip("No conversations available")
        
        conv_id = conversations[0]["id"]
        
        # First resolve it
        requests.put(
            f"{BASE_URL}/api/conversations/{conv_id}/status",
            params={"status": "resolved"},
            headers=self.headers
        )
        
        # Then reopen
        response = requests.put(
            f"{BASE_URL}/api/conversations/{conv_id}/status",
            params={"status": "open"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Verify
        get_response = requests.get(f"{BASE_URL}/api/conversations/{conv_id}", headers=self.headers)
        assert get_response.json()["status"] == "open"


class TestSatisfactionSurveySettings:
    """Customer Satisfaction Survey settings tests"""
    
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
    
    def test_get_satisfaction_settings(self):
        """Test fetching satisfaction survey settings"""
        response = requests.get(f"{BASE_URL}/api/settings/satisfaction-survey", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify settings structure
        assert "enabled" in data
        assert "auto_send_on_resolve" in data
        assert "survey_message" in data
        assert "questions" in data
        assert "thank_you_message" in data
    
    def test_update_satisfaction_settings_enable(self):
        """Test enabling satisfaction survey"""
        settings = {
            "enabled": True,
            "auto_send_on_resolve": True,
            "survey_message": "TEST: How would you rate your experience? (1-5)",
            "questions": [],
            "thank_you_message": "Thank you for your feedback!"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/settings/satisfaction-survey",
            json=settings,
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/settings/satisfaction-survey", headers=self.headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["enabled"] == True
        assert data["auto_send_on_resolve"] == True
    
    def test_update_satisfaction_settings_disable(self):
        """Test disabling satisfaction survey"""
        settings = {
            "enabled": False,
            "auto_send_on_resolve": False,
            "survey_message": "Default message",
            "questions": [],
            "thank_you_message": "Thanks!"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/settings/satisfaction-survey",
            json=settings,
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Verify
        get_response = requests.get(f"{BASE_URL}/api/settings/satisfaction-survey", headers=self.headers)
        data = get_response.json()
        assert data["enabled"] == False
    
    def test_update_satisfaction_with_custom_questions(self):
        """Test adding custom questions to survey"""
        settings = {
            "enabled": True,
            "auto_send_on_resolve": True,
            "survey_message": "Please rate your experience",
            "questions": [
                {
                    "id": "q_test_1",
                    "question": "How satisfied are you with our service?",
                    "type": "rating",
                    "required": True
                },
                {
                    "id": "q_test_2",
                    "question": "Would you recommend us?",
                    "type": "yes_no",
                    "required": False
                }
            ],
            "thank_you_message": "Thank you!"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/settings/satisfaction-survey",
            json=settings,
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Verify questions saved
        get_response = requests.get(f"{BASE_URL}/api/settings/satisfaction-survey", headers=self.headers)
        data = get_response.json()
        assert len(data["questions"]) == 2
        assert data["questions"][0]["question"] == "How satisfied are you with our service?"
        assert data["questions"][1]["type"] == "yes_no"


class TestEscalation:
    """Auto-escalation tests"""
    
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
    
    def test_escalated_field_in_conversations(self):
        """Test that conversations have escalated field"""
        response = requests.get(f"{BASE_URL}/api/conversations/", headers=self.headers)
        assert response.status_code == 200
        conversations = response.json()
        
        if len(conversations) > 0:
            # Check that escalated field exists
            conv = conversations[0]
            assert "escalated" in conv
            assert isinstance(conv["escalated"], bool)
    
    def test_filter_escalated_conversations(self):
        """Test filtering for escalated conversations"""
        response = requests.get(
            f"{BASE_URL}/api/conversations/",
            params={"escalated": True},
            headers=self.headers
        )
        assert response.status_code == 200
        conversations = response.json()
        
        # All returned should be escalated
        for conv in conversations:
            assert conv.get("escalated") == True
    
    def test_escalated_count_in_analytics(self):
        """Test that escalated count appears in analytics"""
        response = requests.get(f"{BASE_URL}/api/analytics/", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "escalated_tickets" in data
        assert isinstance(data["escalated_tickets"], int)
        assert data["escalated_tickets"] >= 0


class TestSatisfactionSurveyOnResolve:
    """Test satisfaction survey auto-send on resolve"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and enable survey before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            
            # Enable satisfaction survey
            settings = {
                "enabled": True,
                "auto_send_on_resolve": True,
                "survey_message": "TEST SURVEY: Rate your experience 1-5",
                "questions": [],
                "thank_you_message": "Thanks!"
            }
            requests.put(
                f"{BASE_URL}/api/settings/satisfaction-survey",
                json=settings,
                headers=self.headers
            )
        else:
            pytest.skip("Authentication failed")
    
    def test_resolve_triggers_survey_message(self):
        """Test that resolving a conversation adds survey message"""
        # Get an open conversation
        response = requests.get(f"{BASE_URL}/api/conversations/", headers=self.headers)
        conversations = response.json()
        
        open_conv = None
        for conv in conversations:
            if conv.get("status") in ["open", "pending"]:
                open_conv = conv
                break
        
        if not open_conv:
            pytest.skip("No open conversations available")
        
        conv_id = open_conv["id"]
        initial_message_count = len(open_conv.get("messages", []))
        
        # Mark as resolved
        response = requests.put(
            f"{BASE_URL}/api/conversations/{conv_id}/status",
            params={"status": "resolved"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Check conversation for survey message
        get_response = requests.get(f"{BASE_URL}/api/conversations/{conv_id}", headers=self.headers)
        updated_conv = get_response.json()
        
        # Should have satisfaction_survey_sent flag
        assert updated_conv.get("satisfaction_survey_sent") == True
        
        # Should have more messages (survey message added)
        assert len(updated_conv.get("messages", [])) > initial_message_count
        
        # Check last message is from bot
        messages = updated_conv.get("messages", [])
        if len(messages) > 0:
            last_msg = messages[-1]
            assert last_msg.get("sender") == "bot"
            assert "survey" in last_msg.get("automation_id", "").lower() or "rate" in last_msg.get("text", "").lower()
        
        # Reopen for other tests
        requests.put(
            f"{BASE_URL}/api/conversations/{conv_id}/status",
            params={"status": "open"},
            headers=self.headers
        )


class TestGeneralSettings:
    """General settings tests"""
    
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
    
    def test_get_settings(self):
        """Test fetching all settings"""
        response = requests.get(f"{BASE_URL}/api/settings/", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify settings structure
        assert "general" in data or "id" in data
    
    def test_settings_require_admin(self):
        """Test that settings require admin role"""
        response = requests.get(f"{BASE_URL}/api/settings/")
        assert response.status_code in [401, 403]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
