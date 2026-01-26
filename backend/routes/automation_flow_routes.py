from fastapi import APIRouter, HTTPException, status, Depends
from models import AutomationFlow, AutomationFlowCreate, AutomationTrigger, AutomationCondition, AutomationAction
from auth import require_admin, get_current_user
from typing import List
from datetime import datetime
import re

router = APIRouter(prefix="/automations", tags=["Automations"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

@router.get("/", response_model=List[AutomationFlow])
async def get_automations(current_user: dict = Depends(require_admin)):
    automations = await db.automations.find().sort("priority", -1).to_list(100)
    return [AutomationFlow(**a) for a in automations]

@router.post("/", response_model=AutomationFlow)
async def create_automation(automation_data: AutomationFlowCreate, current_user: dict = Depends(require_admin)):
    automation = AutomationFlow(
        **automation_data.dict(),
        created_by=current_user["sub"]
    )
    
    await db.automations.insert_one(automation.dict())
    return automation

@router.get("/{automation_id}", response_model=AutomationFlow)
async def get_automation(automation_id: str, current_user: dict = Depends(require_admin)):
    automation = await db.automations.find_one({"id": automation_id})
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    return AutomationFlow(**automation)

@router.put("/{automation_id}", response_model=AutomationFlow)
async def update_automation(automation_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    updates.pop("id", None)
    updates.pop("created_at", None)
    updates.pop("created_by", None)
    
    result = await db.automations.update_one({"id": automation_id}, {"$set": updates})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    automation = await db.automations.find_one({"id": automation_id})
    return AutomationFlow(**automation)

@router.delete("/{automation_id}")
async def delete_automation(automation_id: str, current_user: dict = Depends(require_admin)):
    result = await db.automations.delete_one({"id": automation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Automation not found")
    return {"message": "Automation deleted successfully"}

@router.put("/{automation_id}/toggle")
async def toggle_automation(automation_id: str, current_user: dict = Depends(require_admin)):
    automation = await db.automations.find_one({"id": automation_id})
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    new_active = not automation.get("active", True)
    await db.automations.update_one({"id": automation_id}, {"$set": {"active": new_active}})
    
    return {"message": f"Automation {'activated' if new_active else 'deactivated'}"}

# Process incoming message against automations
@router.post("/process")
async def process_message(conversation_id: str, message_text: str, current_user: dict = Depends(get_current_user)):
    """Process an incoming message against all active automations"""
    
    # Get conversation
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get all active automations sorted by priority
    automations = await db.automations.find({"active": True}).sort("priority", -1).to_list(100)
    
    results = []
    
    for automation in automations:
        # Check if automation applies to this channel
        channels = automation.get("channels", ["all"])
        if "all" not in channels and conversation.get("channel") not in channels:
            continue
        
        # Check trigger
        trigger = automation.get("trigger", {})
        if not check_trigger(trigger, message_text, conversation):
            continue
        
        # Check conditions
        conditions = automation.get("conditions", [])
        if not all(check_condition(cond, conversation) for cond in conditions):
            continue
        
        # Execute actions
        actions = automation.get("actions", [])
        action_results = []
        
        for action in actions:
            result = await execute_action(action, conversation, message_text)
            action_results.append(result)
        
        # Update automation stats
        await db.automations.update_one(
            {"id": automation["id"]},
            {
                "$inc": {"times_triggered": 1},
                "$set": {"last_triggered": datetime.utcnow()}
            }
        )
        
        results.append({
            "automation_id": automation["id"],
            "automation_name": automation["name"],
            "actions_executed": action_results
        })
    
    return {"processed": len(results), "results": results}

def check_trigger(trigger: dict, message_text: str, conversation: dict) -> bool:
    """Check if trigger conditions are met"""
    trigger_type = trigger.get("type")
    
    if trigger_type == "all_messages":
        return True
    
    if trigger_type == "first_message":
        return len(conversation.get("messages", [])) <= 1
    
    if trigger_type == "no_agent_assigned":
        return not conversation.get("assigned_to")
    
    if trigger_type == "keyword":
        keywords = trigger.get("keywords", [])
        match_type = trigger.get("match_type", "contains")
        case_sensitive = trigger.get("case_sensitive", False)
        
        text = message_text if case_sensitive else message_text.lower()
        
        for keyword in keywords:
            kw = keyword if case_sensitive else keyword.lower()
            
            if match_type == "contains" and kw in text:
                return True
            elif match_type == "exact" and kw == text:
                return True
            elif match_type == "starts_with" and text.startswith(kw):
                return True
            elif match_type == "regex":
                try:
                    if re.search(kw, text, 0 if case_sensitive else re.IGNORECASE):
                        return True
                except:
                    pass
        return False
    
    return False

def check_condition(condition: dict, conversation: dict) -> bool:
    """Check if a condition is met"""
    cond_type = condition.get("type")
    value = condition.get("value", "")
    operator = condition.get("operator", "equals")
    
    if cond_type == "always":
        return True
    
    if cond_type == "customer_exists":
        customer = conversation.get("customer", {})
        return bool(customer.get("customer_id"))
    
    if cond_type == "has_tracking":
        customer = conversation.get("customer", {})
        return len(customer.get("tracking_numbers", [])) > 0
    
    if cond_type == "channel_is":
        channel = conversation.get("channel", "")
        if operator == "equals":
            return channel == value
        elif operator == "not_equals":
            return channel != value
    
    if cond_type == "tag_contains":
        tags = conversation.get("tags", [])
        if operator == "contains":
            return value in tags
        elif operator == "not_contains":
            return value not in tags
    
    return True

async def execute_action(action: dict, conversation: dict, message_text: str) -> dict:
    """Execute an automation action"""
    action_type = action.get("type")
    result = {"type": action_type, "success": False, "details": ""}
    
    try:
        if action_type == "send_reply":
            template = action.get("message_template", "")
            reply = process_template(template, conversation, message_text)
            
            # Add message to conversation
            message = {
                "id": str(__import__("uuid").uuid4()),
                "sender": "bot",
                "text": reply,
                "timestamp": datetime.utcnow().strftime('%I:%M %p'),
                "automation_id": action.get("automation_id", "")
            }
            
            await db.conversations.update_one(
                {"id": conversation["id"]},
                {
                    "$push": {"messages": message},
                    "$set": {"last_message": reply, "timestamp": "Just now"}
                }
            )
            
            result["success"] = True
            result["details"] = f"Sent reply: {reply[:50]}..."
            result["message"] = reply
        
        elif action_type == "lookup_customer":
            lookup_field = action.get("lookup_field", "email")
            customer = conversation.get("customer", {})
            
            search_value = ""
            if lookup_field == "email":
                search_value = customer.get("email", "")
            elif lookup_field == "phone":
                search_value = customer.get("phone", "")
            
            if search_value:
                # Search customer database
                customer_record = await db.customers.find_one({lookup_field: search_value})
                
                if customer_record:
                    # Update conversation with customer data
                    await db.conversations.update_one(
                        {"id": conversation["id"]},
                        {"$set": {
                            "customer.customer_id": customer_record.get("id", ""),
                            "customer.account_type": customer_record.get("account_type", ""),
                            "customer.tracking_numbers": customer_record.get("tracking_numbers", []),
                            "customer.total_orders": customer_record.get("total_orders", 0)
                        }}
                    )
                    result["success"] = True
                    result["details"] = f"Found customer: {customer_record.get('name')}"
                    result["customer_data"] = customer_record
                else:
                    result["details"] = "Customer not found in database"
            else:
                result["details"] = f"No {lookup_field} to search"
        
        elif action_type == "lookup_tracking":
            # Extract tracking number from message
            tracking_pattern = r'\b[A-Z]{2}\d{9}[A-Z]{2}\b|\b\d{10,20}\b'
            matches = re.findall(tracking_pattern, message_text.upper())
            
            if matches:
                tracking_number = matches[0]
                tracking_info = await db.tracking.find_one({"tracking_number": tracking_number})
                
                if tracking_info:
                    result["success"] = True
                    result["details"] = f"Found tracking: {tracking_number}"
                    result["tracking_data"] = tracking_info
                else:
                    result["details"] = f"Tracking {tracking_number} not found"
            else:
                result["details"] = "No tracking number found in message"
        
        elif action_type == "assign_agent":
            assign_mode = action.get("assign_mode", "round_robin")
            agent_id = action.get("agent_id", "")
            
            if assign_mode == "specific" and agent_id:
                target_agent = agent_id
            elif assign_mode == "least_busy":
                # Find agent with least tickets
                agents = await db.users.find({"role": "agent", "status": "online"}).to_list(100)
                if agents:
                    agents.sort(key=lambda x: x.get("assigned_tickets", 0))
                    target_agent = agents[0]["id"]
                else:
                    target_agent = None
            else:  # round_robin
                agents = await db.users.find({"role": "agent", "status": "online"}).to_list(100)
                if agents:
                    # Simple round robin - just pick first available
                    target_agent = agents[0]["id"]
                else:
                    target_agent = None
            
            if target_agent:
                await db.conversations.update_one(
                    {"id": conversation["id"]},
                    {"$set": {"assigned_to": target_agent}}
                )
                await db.users.update_one(
                    {"id": target_agent},
                    {"$inc": {"assigned_tickets": 1}}
                )
                result["success"] = True
                result["details"] = f"Assigned to agent {target_agent}"
            else:
                result["details"] = "No available agents"
        
        elif action_type == "add_tag":
            tag = action.get("tag", "")
            if tag:
                await db.conversations.update_one(
                    {"id": conversation["id"]},
                    {"$addToSet": {"tags": tag}}
                )
                result["success"] = True
                result["details"] = f"Added tag: {tag}"
        
        elif action_type == "set_priority":
            priority = action.get("priority", "medium")
            await db.conversations.update_one(
                {"id": conversation["id"]},
                {"$set": {"priority": priority}}
            )
            result["success"] = True
            result["details"] = f"Set priority to: {priority}"
        
        elif action_type == "set_status":
            status = action.get("status", "open")
            await db.conversations.update_one(
                {"id": conversation["id"]},
                {"$set": {"status": status}}
            )
            result["success"] = True
            result["details"] = f"Set status to: {status}"
        
        elif action_type == "send_to_human":
            # Mark for human attention
            await db.conversations.update_one(
                {"id": conversation["id"]},
                {"$set": {"needs_human": True, "priority": "high"}}
            )
            result["success"] = True
            result["details"] = "Escalated to human agent"
    
    except Exception as e:
        result["details"] = str(e)
    
    return result

def process_template(template: str, conversation: dict, message_text: str) -> str:
    """Process template variables"""
    customer = conversation.get("customer", {})
    
    replacements = {
        "{{customer_name}}": customer.get("name", "Customer"),
        "{{customer_email}}": customer.get("email", ""),
        "{{customer_phone}}": customer.get("phone", ""),
        "{{customer_id}}": customer.get("customer_id", ""),
        "{{account_type}}": customer.get("account_type", ""),
        "{{channel}}": conversation.get("channel", ""),
        "{{subject}}": conversation.get("subject", ""),
        "{{message}}": message_text,
        "{{tracking_numbers}}": ", ".join(customer.get("tracking_numbers", [])),
        "{{total_orders}}": str(customer.get("total_orders", 0)),
    }
    
    result = template
    for key, value in replacements.items():
        result = result.replace(key, str(value))
    
    return result

# Get automation templates
@router.get("/templates")
async def get_automation_templates(current_user: dict = Depends(require_admin)):
    """Get pre-built automation templates"""
    return [
        {
            "id": "welcome",
            "name": "Welcome Message",
            "description": "Send a welcome message to new customers",
            "trigger": {"type": "first_message", "keywords": [], "match_type": "contains"},
            "conditions": [],
            "actions": [
                {
                    "type": "send_reply",
                    "message_template": "Hello {{customer_name}}! Thank you for contacting Post Aruba support. How can we help you today?"
                }
            ]
        },
        {
            "id": "tracking",
            "name": "Tracking Inquiry",
            "description": "Auto-respond to tracking questions",
            "trigger": {"type": "keyword", "keywords": ["track", "tracking", "where is", "status", "package"], "match_type": "contains"},
            "conditions": [],
            "actions": [
                {"type": "lookup_tracking"},
                {
                    "type": "send_reply",
                    "message_template": "I'll help you track your package! Please provide your tracking number if you haven't already, and I'll look up the status for you."
                }
            ]
        },
        {
            "id": "pricing",
            "name": "Pricing Inquiry",
            "description": "Auto-respond to pricing questions",
            "trigger": {"type": "keyword", "keywords": ["price", "cost", "rate", "how much", "pricing"], "match_type": "contains"},
            "conditions": [],
            "actions": [
                {
                    "type": "send_reply",
                    "message_template": "Thank you for your interest in our shipping rates! Our pricing depends on package size, weight, and destination. An agent will provide you with a detailed quote shortly."
                },
                {"type": "add_tag", "tag": "pricing-inquiry"}
            ]
        },
        {
            "id": "complaint",
            "name": "Complaint Handler",
            "description": "Escalate complaints to human agents",
            "trigger": {"type": "keyword", "keywords": ["complaint", "angry", "terrible", "worst", "refund", "damaged"], "match_type": "contains"},
            "conditions": [],
            "actions": [
                {"type": "set_priority", "priority": "urgent"},
                {"type": "add_tag", "tag": "complaint"},
                {
                    "type": "send_reply",
                    "message_template": "We sincerely apologize for any inconvenience you've experienced. Your concern is important to us, and a supervisor will personally assist you shortly."
                },
                {"type": "send_to_human"}
            ]
        },
        {
            "id": "business_hours",
            "name": "After Hours Message",
            "description": "Auto-respond outside business hours",
            "trigger": {"type": "outside_hours", "keywords": [], "match_type": "contains"},
            "conditions": [],
            "actions": [
                {
                    "type": "send_reply",
                    "message_template": "Thank you for contacting Post Aruba. Our office is currently closed. Business hours are Monday-Friday, 8AM-6PM (AST). We'll respond to your message as soon as we reopen."
                }
            ]
        }
    ]
