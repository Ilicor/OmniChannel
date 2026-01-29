"""
Backend tests for Claims Management and Satisfaction Trends features
Tests CRUD operations for claims and satisfaction trends analytics
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "ilienecorsen@postaruba.com"
ADMIN_PASSWORD = "admin123"


class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestClaimsStats:
    """Claims statistics endpoint tests"""
    
    def test_get_claims_stats(self, auth_headers):
        """Test getting claims statistics"""
        response = requests.get(f"{BASE_URL}/api/claims/stats", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get claims stats: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "total" in data
        assert "by_status" in data
        assert "by_type" in data
        assert "resolution_rate" in data
        
        # Verify status breakdown
        assert "open" in data["by_status"]
        assert "investigating" in data["by_status"]
        assert "pending_customer" in data["by_status"]
        assert "resolved" in data["by_status"]
        assert "rejected" in data["by_status"]


class TestClaimsCRUD:
    """Claims CRUD operations tests"""
    
    def test_create_claim(self, auth_headers):
        """Test creating a new claim"""
        claim_data = {
            "customer_name": f"TEST_Customer_{uuid.uuid4().hex[:8]}",
            "customer_email": "test.customer@example.com",
            "customer_phone": "+297 555-0100",
            "claim_type": "damaged_package",
            "tracking_number": f"PA{uuid.uuid4().hex[:8].upper()}",
            "description": "Package arrived with visible damage to the box and contents",
            "priority": "high"
        }
        
        response = requests.post(f"{BASE_URL}/api/claims/", json=claim_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create claim: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["customer_name"] == claim_data["customer_name"]
        assert data["customer_email"] == claim_data["customer_email"]
        assert data["claim_type"] == "damaged_package"
        assert data["status"] == "open"
        assert data["priority"] == "high"
        
        return data["id"]
    
    def test_get_claims_list(self, auth_headers):
        """Test getting list of claims"""
        response = requests.get(f"{BASE_URL}/api/claims/", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get claims: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_claims_with_status_filter(self, auth_headers):
        """Test filtering claims by status"""
        response = requests.get(f"{BASE_URL}/api/claims/", params={"status": "open"}, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        for claim in data:
            assert claim["status"] == "open"
    
    def test_get_claims_with_type_filter(self, auth_headers):
        """Test filtering claims by type"""
        response = requests.get(f"{BASE_URL}/api/claims/", params={"claim_type": "damaged_package"}, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        for claim in data:
            assert claim["claim_type"] == "damaged_package"
    
    def test_get_claims_with_priority_filter(self, auth_headers):
        """Test filtering claims by priority"""
        response = requests.get(f"{BASE_URL}/api/claims/", params={"priority": "high"}, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        for claim in data:
            assert claim["priority"] == "high"
    
    def test_create_and_get_claim(self, auth_headers):
        """Test creating a claim and retrieving it by ID"""
        # Create claim
        claim_data = {
            "customer_name": f"TEST_GetClaim_{uuid.uuid4().hex[:8]}",
            "customer_email": "getclaim@example.com",
            "claim_type": "lost_package",
            "tracking_number": f"PA{uuid.uuid4().hex[:8].upper()}",
            "description": "Package has not arrived after 2 weeks",
            "priority": "urgent"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/claims/", json=claim_data, headers=auth_headers)
        assert create_response.status_code == 200
        created_claim = create_response.json()
        claim_id = created_claim["id"]
        
        # Get claim by ID
        get_response = requests.get(f"{BASE_URL}/api/claims/{claim_id}", headers=auth_headers)
        assert get_response.status_code == 200
        
        fetched_claim = get_response.json()
        assert fetched_claim["id"] == claim_id
        assert fetched_claim["customer_name"] == claim_data["customer_name"]
        assert fetched_claim["claim_type"] == "lost_package"
        assert fetched_claim["priority"] == "urgent"
    
    def test_update_claim_status(self, auth_headers):
        """Test updating claim status"""
        # Create claim first
        claim_data = {
            "customer_name": f"TEST_UpdateStatus_{uuid.uuid4().hex[:8]}",
            "customer_email": "updatestatus@example.com",
            "claim_type": "delayed_delivery",
            "description": "Delivery is 5 days late",
            "priority": "medium"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/claims/", json=claim_data, headers=auth_headers)
        assert create_response.status_code == 200
        claim_id = create_response.json()["id"]
        
        # Update status to investigating
        update_response = requests.put(
            f"{BASE_URL}/api/claims/{claim_id}",
            json={"status": "investigating"},
            headers=auth_headers
        )
        assert update_response.status_code == 200
        
        updated_claim = update_response.json()
        assert updated_claim["status"] == "investigating"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/claims/{claim_id}", headers=auth_headers)
        assert get_response.json()["status"] == "investigating"
    
    def test_update_claim_resolution(self, auth_headers):
        """Test resolving a claim with notes"""
        # Create claim
        claim_data = {
            "customer_name": f"TEST_Resolve_{uuid.uuid4().hex[:8]}",
            "customer_email": "resolve@example.com",
            "claim_type": "billing_issue",
            "description": "Charged twice for same shipment",
            "priority": "high"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/claims/", json=claim_data, headers=auth_headers)
        assert create_response.status_code == 200
        claim_id = create_response.json()["id"]
        
        # Resolve with notes
        update_response = requests.put(
            f"{BASE_URL}/api/claims/{claim_id}",
            json={
                "status": "resolved",
                "resolution_notes": "Refund processed for duplicate charge. Customer notified via email."
            },
            headers=auth_headers
        )
        assert update_response.status_code == 200
        
        resolved_claim = update_response.json()
        assert resolved_claim["status"] == "resolved"
        assert "Refund processed" in resolved_claim["resolution_notes"]
        assert resolved_claim["resolved_at"] is not None
    
    def test_update_claim_assignment(self, auth_headers):
        """Test assigning a claim to an agent"""
        # First get list of users to find an agent
        users_response = requests.get(f"{BASE_URL}/api/users/", headers=auth_headers)
        assert users_response.status_code == 200
        users = users_response.json()
        
        # Find admin user
        admin_user = next((u for u in users if u["role"] == "admin"), None)
        assert admin_user is not None, "No admin user found"
        
        # Create claim
        claim_data = {
            "customer_name": f"TEST_Assign_{uuid.uuid4().hex[:8]}",
            "customer_email": "assign@example.com",
            "claim_type": "service_complaint",
            "description": "Poor customer service experience",
            "priority": "medium"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/claims/", json=claim_data, headers=auth_headers)
        assert create_response.status_code == 200
        claim_id = create_response.json()["id"]
        
        # Assign to admin
        update_response = requests.put(
            f"{BASE_URL}/api/claims/{claim_id}",
            json={"assigned_to": admin_user["id"]},
            headers=auth_headers
        )
        assert update_response.status_code == 200
        
        assigned_claim = update_response.json()
        assert assigned_claim["assigned_to"] == admin_user["id"]
        assert assigned_claim["assigned_to_name"] == admin_user["name"]
    
    def test_get_nonexistent_claim(self, auth_headers):
        """Test getting a claim that doesn't exist"""
        response = requests.get(f"{BASE_URL}/api/claims/nonexistent-id-12345", headers=auth_headers)
        assert response.status_code == 404
    
    def test_create_claim_all_types(self, auth_headers):
        """Test creating claims with all different types"""
        claim_types = [
            'damaged_package', 'lost_package', 'delayed_delivery',
            'wrong_delivery', 'billing_issue', 'service_complaint', 'other'
        ]
        
        for claim_type in claim_types:
            claim_data = {
                "customer_name": f"TEST_Type_{claim_type}_{uuid.uuid4().hex[:6]}",
                "customer_email": f"{claim_type}@example.com",
                "claim_type": claim_type,
                "description": f"Test claim for type: {claim_type}",
                "priority": "low"
            }
            
            response = requests.post(f"{BASE_URL}/api/claims/", json=claim_data, headers=auth_headers)
            assert response.status_code == 200, f"Failed to create claim type {claim_type}: {response.text}"
            assert response.json()["claim_type"] == claim_type


class TestSatisfactionTrends:
    """Satisfaction Trends analytics tests"""
    
    def test_get_satisfaction_trends_default(self, auth_headers):
        """Test getting satisfaction trends with default period (30d)"""
        response = requests.get(f"{BASE_URL}/api/analytics/satisfaction-trends", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get satisfaction trends: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "period" in data
        assert "total_responses" in data
        assert "average_rating" in data
        assert "csat_score" in data
        assert "ratings_distribution" in data
        assert "trend_data" in data
        
        # Verify ratings distribution structure
        ratings_dist = data["ratings_distribution"]
        for rating in [1, 2, 3, 4, 5]:
            assert str(rating) in ratings_dist or rating in ratings_dist
    
    def test_get_satisfaction_trends_7d(self, auth_headers):
        """Test getting satisfaction trends for 7 days"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/satisfaction-trends",
            params={"period": "7d"},
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "7d"
    
    def test_get_satisfaction_trends_30d(self, auth_headers):
        """Test getting satisfaction trends for 30 days"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/satisfaction-trends",
            params={"period": "30d"},
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "30d"
    
    def test_get_satisfaction_trends_90d(self, auth_headers):
        """Test getting satisfaction trends for 90 days"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/satisfaction-trends",
            params={"period": "90d"},
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "90d"
    
    def test_satisfaction_trends_has_agent_performance(self, auth_headers):
        """Test that satisfaction trends includes agent performance data"""
        response = requests.get(f"{BASE_URL}/api/analytics/satisfaction-trends", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "agent_performance" in data
        assert isinstance(data["agent_performance"], list)


class TestAnalyticsOverview:
    """General analytics endpoint tests"""
    
    def test_get_analytics_overview(self, auth_headers):
        """Test getting analytics overview"""
        response = requests.get(f"{BASE_URL}/api/analytics/", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get analytics: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "total_tickets" in data
        assert "open_tickets" in data
        assert "resolved_today" in data
        assert "tickets_by_channel" in data
        assert "weekly_trend" in data
    
    def test_get_agent_activity(self, auth_headers):
        """Test getting agent activity"""
        response = requests.get(f"{BASE_URL}/api/analytics/agent-activity", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get agent activity: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "date_range" in data
        assert "agent_stats" in data
        assert "summary" in data
        
        # Verify summary structure
        assert "total_interactions" in data["summary"]
        assert "total_resolved" in data["summary"]
        assert "total_open" in data["summary"]


class TestClaimsCleanup:
    """Cleanup test data after tests"""
    
    def test_cleanup_test_claims(self, auth_headers):
        """Delete all TEST_ prefixed claims"""
        # Get all claims
        response = requests.get(f"{BASE_URL}/api/claims/", headers=auth_headers)
        if response.status_code == 200:
            claims = response.json()
            for claim in claims:
                if claim.get("customer_name", "").startswith("TEST_"):
                    delete_response = requests.delete(
                        f"{BASE_URL}/api/claims/{claim['id']}",
                        headers=auth_headers
                    )
                    # Admin should be able to delete
                    assert delete_response.status_code in [200, 204, 403], f"Unexpected status: {delete_response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
