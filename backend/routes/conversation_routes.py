from fastapi import APIRouter, HTTPException, status, Depends
from models import Conversation, ConversationCreate, Message, MessageCreate
from auth import get_current_user, require_admin
from typing import List, Optional
import uuid
from datetime import datetime, timedelta

router = APIRouter(prefix="/conversations", tags=["Conversations"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

async def check_and_escalate_conversations():
    """Check for conversations older than 24 hours and escalate them"""
    threshold = datetime.utcnow() - timedelta(hours=24)
    
    # Find unresolved conversations older than 24 hours that aren't already escalated
    await db.conversations.update_many(
        {
            "status": {"$in": ["open", "pending"]},
            "created_at": {"$lt": threshold},
            "escalated": {"$ne": True}
        },
        {
            "$set": {
                "escalated": True,
                "escalated_at": datetime.utcnow(),
                "priority": "urgent"
            }
        }
    )

@router.get("/")
async def get_conversations(
    channel: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    escalated: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    # Check and escalate old conversations
    await check_and_escalate_conversations()
    
    query = {}
    
    if channel and channel != 'all':
        query["channel"] = channel
    if status:
        query["status"] = status
    if assigned_to:
        query["assigned_to"] = assigned_to
    if escalated is not None:
        query["escalated"] = escalated
    
    # Agents can only see conversations assigned to them
    if current_user.get("role") == "agent":
        query["assigned_to"] = current_user["sub"]
    
    conversations = await db.conversations.find(query).sort("created_at", -1).to_list(100)
    
    # Return raw data, handle missing fields
    result = []
    for c in conversations:
        c.pop('_id', None)  # Remove MongoDB _id
        # Ensure required fields have defaults
        c.setdefault('channel_id', '')
        c.setdefault('created_at', datetime.utcnow())
        c.setdefault('escalated', False)
        c.setdefault('escalated_at', None)
        result.append(c)
    
    return result

@router.get("/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Agents can only see conversations assigned to them
    if current_user.get("role") == "agent" and conversation.get("assigned_to") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Conversation(**conversation)

@router.post("/", response_model=Conversation)
async def create_conversation(conv_data: ConversationCreate, current_user: dict = Depends(get_current_user)):
    conversation = Conversation(
        customer=conv_data.customer,
        channel=conv_data.channel,
        channel_id=conv_data.channel_id,
        subject=conv_data.subject,
        priority=conv_data.priority,
        last_message="",
        timestamp="Just now",
        messages=[]
    )
    
    await db.conversations.insert_one(conversation.dict())
    return conversation

@router.post("/{conversation_id}/messages", response_model=Message)
async def add_message(
    conversation_id: str, 
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Agents can only reply to conversations assigned to them
    if current_user.get("role") == "agent" and conversation.get("assigned_to") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="You are not assigned to this conversation")
    
    message = Message(
        sender="agent",
        text=message_data.text,
        agent_id=current_user["sub"]
    )
    
    await db.conversations.update_one(
        {"id": conversation_id},
        {
            "$push": {"messages": message.dict()},
            "$set": {
                "last_message": message_data.text,
                "timestamp": "Just now",
                "unread": False
            }
        }
    )
    
    return message

@router.put("/{conversation_id}/assign")
async def assign_conversation(
    conversation_id: str,
    agent_id: str,
    current_user: dict = Depends(require_admin)
):
    # Verify agent exists
    agent = await db.users.find_one({"id": agent_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    result = await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"assigned_to": agent_id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Update agent's ticket count
    await db.users.update_one(
        {"id": agent_id},
        {"$inc": {"assigned_tickets": 1}}
    )
    
    return {"message": f"Conversation assigned to {agent['name']}"}

@router.put("/{conversation_id}/status")
async def update_conversation_status(
    conversation_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    if status not in ["open", "pending", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Agents can only update conversations assigned to them
    if current_user.get("role") == "agent" and conversation.get("assigned_to") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"status": status}}
    )
    
    return {"message": f"Status updated to {status}"}

@router.put("/{conversation_id}/priority")
async def update_conversation_priority(
    conversation_id: str,
    priority: str,
    current_user: dict = Depends(require_admin)
):
    if priority not in ["urgent", "high", "medium", "low"]:
        raise HTTPException(status_code=400, detail="Invalid priority")
    
    result = await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"priority": priority}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {"message": f"Priority updated to {priority}"}

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: dict = Depends(require_admin)):
    result = await db.conversations.delete_one({"id": conversation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted successfully"}
