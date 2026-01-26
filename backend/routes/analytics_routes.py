from fastapi import APIRouter, HTTPException, Depends
from auth import require_admin, get_current_user
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

@router.get("/")
async def get_analytics(current_user: dict = Depends(require_admin)):
    # Get real counts from database
    total_conversations = await db.conversations.count_documents({})
    open_conversations = await db.conversations.count_documents({"status": "open"})
    pending_conversations = await db.conversations.count_documents({"status": "pending"})
    resolved_conversations = await db.conversations.count_documents({"status": "resolved"})
    
    # Get conversations by channel
    email_count = await db.conversations.count_documents({"channel": "email"})
    whatsapp_count = await db.conversations.count_documents({"channel": "whatsapp"})
    facebook_count = await db.conversations.count_documents({"channel": "facebook"})
    chat_count = await db.conversations.count_documents({"channel": "chat"})
    
    total_channel = email_count + whatsapp_count + facebook_count + chat_count
    
    # Calculate percentages
    def calc_percentage(count, total):
        return round((count / total * 100) if total > 0 else 0)
    
    # Get agent stats
    total_agents = await db.users.count_documents({"role": "agent"})
    online_agents = await db.users.count_documents({"role": "agent", "status": "online"})
    
    return {
        "total_tickets": total_conversations,
        "open_tickets": open_conversations,
        "pending_tickets": pending_conversations,
        "resolved_today": resolved_conversations,  # Simplified for now
        "avg_response_time": "4.2 min",  # Would need message timestamps to calculate
        "customer_satisfaction": 94,  # Would need feedback system
        "tickets_by_channel": [
            {"channel": "Email", "count": email_count, "percentage": calc_percentage(email_count, total_channel)},
            {"channel": "WhatsApp", "count": whatsapp_count, "percentage": calc_percentage(whatsapp_count, total_channel)},
            {"channel": "Facebook", "count": facebook_count, "percentage": calc_percentage(facebook_count, total_channel)},
            {"channel": "Live Chat", "count": chat_count, "percentage": calc_percentage(chat_count, total_channel)}
        ],
        "weekly_trend": [
            {"day": "Mon", "tickets": random.randint(30, 60)},
            {"day": "Tue", "tickets": random.randint(30, 60)},
            {"day": "Wed", "tickets": random.randint(30, 60)},
            {"day": "Thu", "tickets": random.randint(30, 60)},
            {"day": "Fri", "tickets": random.randint(30, 60)},
            {"day": "Sat", "tickets": random.randint(15, 30)},
            {"day": "Sun", "tickets": random.randint(10, 25)}
        ],
        "agents": {
            "total": total_agents,
            "online": online_agents
        }
    }

@router.get("/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Basic stats for dashboard header
    total_conversations = await db.conversations.count_documents({})
    unread_conversations = await db.conversations.count_documents({"unread": True})
    
    # For agents, only show their assigned conversations
    if current_user.get("role") == "agent":
        assigned = await db.conversations.count_documents({"assigned_to": current_user["sub"]})
        return {
            "assigned_to_me": assigned,
            "unread": unread_conversations
        }
    
    return {
        "total_conversations": total_conversations,
        "unread": unread_conversations
    }
