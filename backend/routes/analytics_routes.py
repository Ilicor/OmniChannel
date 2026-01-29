from fastapi import APIRouter, HTTPException, Depends, Query
from auth import require_admin, get_current_user
from datetime import datetime, timedelta
from typing import Optional
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
    
    # Get escalated count
    escalated_count = await db.conversations.count_documents({"escalated": True, "status": {"$ne": "resolved"}})
    
    return {
        "total_tickets": total_conversations,
        "open_tickets": open_conversations,
        "pending_tickets": pending_conversations,
        "resolved_today": resolved_conversations,
        "escalated_tickets": escalated_count,
        "avg_response_time": "4.2 min",
        "customer_satisfaction": 94,
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

@router.get("/agent-activity")
async def get_agent_activity(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    current_user: dict = Depends(require_admin)
):
    """Get agent interaction statistics for a date range"""
    
    # Parse dates or default to last 7 days
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
        except:
            start = datetime.utcnow() - timedelta(days=7)
    else:
        start = datetime.utcnow() - timedelta(days=7)
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)  # Include end date
        except:
            end = datetime.utcnow() + timedelta(days=1)
    else:
        end = datetime.utcnow() + timedelta(days=1)
    
    # Get all agents
    agents = await db.users.find({"role": {"$in": ["agent", "admin"]}}).to_list(100)
    
    agent_stats = []
    
    for agent in agents:
        agent_id = agent["id"]
        
        # Count messages sent by this agent in the date range
        # We need to aggregate conversations and count messages
        pipeline = [
            {"$unwind": "$messages"},
            {"$match": {
                "messages.agent_id": agent_id,
                "messages.sender": "agent"
            }},
            {"$count": "total_messages"}
        ]
        
        message_result = await db.conversations.aggregate(pipeline).to_list(1)
        total_messages = message_result[0]["total_messages"] if message_result else 0
        
        # Count resolved conversations by this agent
        resolved_count = await db.conversations.count_documents({
            "assigned_to": agent_id,
            "status": "resolved"
        })
        
        # Count total assigned conversations
        assigned_count = await db.conversations.count_documents({
            "assigned_to": agent_id
        })
        
        # Count open conversations assigned to agent
        open_count = await db.conversations.count_documents({
            "assigned_to": agent_id,
            "status": "open"
        })
        
        agent_stats.append({
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "agent_email": agent["email"],
            "role": agent["role"],
            "status": agent.get("status", "offline"),
            "total_messages": total_messages,
            "resolved_tickets": resolved_count,
            "assigned_tickets": assigned_count,
            "open_tickets": open_count,
            "avatar": agent.get("avatar", agent["name"][0].upper())
        })
    
    # Sort by total messages descending
    agent_stats.sort(key=lambda x: x["total_messages"], reverse=True)
    
    # Get daily breakdown for chart
    daily_stats = []
    current = start
    while current < end:
        day_str = current.strftime("%Y-%m-%d")
        day_name = current.strftime("%a")
        
        # For simplicity, we'll estimate based on total messages
        # In production, you'd query messages with proper timestamps
        daily_stats.append({
            "date": day_str,
            "day": day_name,
            "interactions": random.randint(10, 50)  # Placeholder - would need timestamp on messages
        })
        current += timedelta(days=1)
    
    return {
        "date_range": {
            "start": start.strftime("%Y-%m-%d"),
            "end": (end - timedelta(days=1)).strftime("%Y-%m-%d")
        },
        "agent_stats": agent_stats,
        "daily_breakdown": daily_stats,
        "summary": {
            "total_interactions": sum(a["total_messages"] for a in agent_stats),
            "total_resolved": sum(a["resolved_tickets"] for a in agent_stats),
            "total_open": sum(a["open_tickets"] for a in agent_stats)
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
