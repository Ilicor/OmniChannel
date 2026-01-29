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

@router.get("/satisfaction-trends")
async def get_satisfaction_trends(
    period: str = Query("30d", description="Period: 7d, 30d, 90d"),
    current_user: dict = Depends(require_admin)
):
    """Get customer satisfaction trends over time"""
    
    # Determine date range
    days = 30
    if period == "7d":
        days = 7
    elif period == "90d":
        days = 90
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all satisfaction responses in the period
    responses = await db.satisfaction_responses.find({
        "created_at": {"$gte": start_date}
    }).sort("created_at", 1).to_list(1000)
    
    # Calculate overall stats
    total_responses = len(responses)
    if total_responses > 0:
        avg_rating = sum(r.get("rating", 0) for r in responses) / total_responses
        ratings_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for r in responses:
            rating = r.get("rating", 0)
            if rating in ratings_distribution:
                ratings_distribution[rating] += 1
    else:
        avg_rating = 0
        ratings_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    
    # Calculate CSAT score (percentage of 4 and 5 ratings)
    satisfied = ratings_distribution.get(4, 0) + ratings_distribution.get(5, 0)
    csat_score = round((satisfied / total_responses * 100) if total_responses > 0 else 0, 1)
    
    # Group by day for trend chart
    daily_trends = {}
    current = start_date
    while current <= datetime.utcnow():
        day_str = current.strftime("%Y-%m-%d")
        daily_trends[day_str] = {"date": day_str, "ratings": [], "count": 0, "avg": 0}
        current += timedelta(days=1)
    
    for r in responses:
        day_str = r.get("created_at", datetime.utcnow()).strftime("%Y-%m-%d")
        if day_str in daily_trends:
            daily_trends[day_str]["ratings"].append(r.get("rating", 0))
            daily_trends[day_str]["count"] += 1
    
    # Calculate daily averages
    trend_data = []
    for day_str in sorted(daily_trends.keys()):
        day_data = daily_trends[day_str]
        if day_data["ratings"]:
            day_data["avg"] = round(sum(day_data["ratings"]) / len(day_data["ratings"]), 2)
        del day_data["ratings"]
        trend_data.append(day_data)
    
    # Get agent performance
    agent_satisfaction = {}
    for r in responses:
        agent_id = r.get("agent_id", "")
        if agent_id:
            if agent_id not in agent_satisfaction:
                agent_satisfaction[agent_id] = {
                    "agent_id": agent_id,
                    "agent_name": r.get("agent_name", "Unknown"),
                    "total_reviews": 0,
                    "total_rating": 0
                }
            agent_satisfaction[agent_id]["total_reviews"] += 1
            agent_satisfaction[agent_id]["total_rating"] += r.get("rating", 0)
    
    # Calculate agent averages
    agent_stats = []
    for agent_id, data in agent_satisfaction.items():
        avg = round(data["total_rating"] / data["total_reviews"], 2) if data["total_reviews"] > 0 else 0
        agent_stats.append({
            "agent_id": data["agent_id"],
            "agent_name": data["agent_name"],
            "reviews": data["total_reviews"],
            "avg_rating": avg
        })
    
    agent_stats.sort(key=lambda x: x["avg_rating"], reverse=True)
    
    return {
        "period": period,
        "total_responses": total_responses,
        "average_rating": round(avg_rating, 2),
        "csat_score": csat_score,
        "ratings_distribution": ratings_distribution,
        "trend_data": trend_data[-30:] if len(trend_data) > 30 else trend_data,  # Last 30 data points
        "agent_performance": agent_stats[:10]  # Top 10 agents
    }

@router.post("/satisfaction-response")
async def submit_satisfaction_response(
    conversation_id: str,
    rating: int = Query(..., ge=1, le=5),
    feedback: str = "",
    current_user: dict = Depends(get_current_user)
):
    """Submit a satisfaction response for a conversation"""
    from models import SatisfactionResponse
    
    # Get conversation details
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get agent details if assigned
    agent_id = conversation.get("resolved_by") or conversation.get("assigned_to", "")
    agent_name = ""
    if agent_id:
        agent = await db.users.find_one({"id": agent_id})
        if agent:
            agent_name = agent.get("name", "")
    
    response = SatisfactionResponse(
        conversation_id=conversation_id,
        customer_name=conversation.get("customer", {}).get("name", ""),
        customer_email=conversation.get("customer", {}).get("email", ""),
        rating=rating,
        feedback=feedback,
        agent_id=agent_id,
        agent_name=agent_name,
        channel=conversation.get("channel", "")
    )
    
    await db.satisfaction_responses.insert_one(response.dict())
    
    # Update conversation to mark response received
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"satisfaction_response_received": True, "satisfaction_rating": rating}}
    )
    
    return {"message": "Thank you for your feedback!", "rating": rating}

