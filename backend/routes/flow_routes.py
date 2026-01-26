from fastapi import APIRouter, HTTPException, status, Depends
from models import ChatFlow, ChatFlowCreate, FlowStep
from auth import require_admin, get_current_user
from typing import List
from datetime import datetime

router = APIRouter(prefix="/flows", tags=["Chat Flows"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

@router.get("/", response_model=List[ChatFlow])
async def get_chat_flows(current_user: dict = Depends(require_admin)):
    flows = await db.chat_flows.find().to_list(100)
    return [ChatFlow(**f) for f in flows]

@router.post("/", response_model=ChatFlow)
async def create_chat_flow(flow_data: ChatFlowCreate, current_user: dict = Depends(require_admin)):
    flow = ChatFlow(
        **flow_data.dict(),
        created_by=current_user["sub"]
    )
    
    await db.chat_flows.insert_one(flow.dict())
    return flow

@router.get("/{flow_id}", response_model=ChatFlow)
async def get_chat_flow(flow_id: str, current_user: dict = Depends(require_admin)):
    flow = await db.chat_flows.find_one({"id": flow_id})
    if not flow:
        raise HTTPException(status_code=404, detail="Chat flow not found")
    return ChatFlow(**flow)

@router.put("/{flow_id}", response_model=ChatFlow)
async def update_chat_flow(flow_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    updates.pop("id", None)
    updates.pop("created_at", None)
    updates.pop("created_by", None)
    
    result = await db.chat_flows.update_one({"id": flow_id}, {"$set": updates})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Chat flow not found")
    
    flow = await db.chat_flows.find_one({"id": flow_id})
    return ChatFlow(**flow)

@router.delete("/{flow_id}")
async def delete_chat_flow(flow_id: str, current_user: dict = Depends(require_admin)):
    result = await db.chat_flows.delete_one({"id": flow_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat flow not found")
    return {"message": "Chat flow deleted successfully"}

@router.put("/{flow_id}/toggle")
async def toggle_chat_flow(flow_id: str, current_user: dict = Depends(require_admin)):
    flow = await db.chat_flows.find_one({"id": flow_id})
    if not flow:
        raise HTTPException(status_code=404, detail="Chat flow not found")
    
    new_active = not flow.get("active", True)
    await db.chat_flows.update_one({"id": flow_id}, {"$set": {"active": new_active}})
    
    return {"message": f"Chat flow {'activated' if new_active else 'deactivated'}"}

@router.post("/{flow_id}/steps", response_model=FlowStep)
async def add_flow_step(flow_id: str, step_data: FlowStep, current_user: dict = Depends(require_admin)):
    flow = await db.chat_flows.find_one({"id": flow_id})
    if not flow:
        raise HTTPException(status_code=404, detail="Chat flow not found")
    
    await db.chat_flows.update_one(
        {"id": flow_id},
        {"$push": {"steps": step_data.dict()}}
    )
    
    return step_data

@router.put("/{flow_id}/steps/{step_id}")
async def update_flow_step(flow_id: str, step_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    result = await db.chat_flows.update_one(
        {"id": flow_id, "steps.id": step_id},
        {"$set": {
            "steps.$.type": updates.get("type"),
            "steps.$.content": updates.get("content")
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Flow or step not found")
    
    return {"message": "Step updated successfully"}

@router.delete("/{flow_id}/steps/{step_id}")
async def delete_flow_step(flow_id: str, step_id: str, current_user: dict = Depends(require_admin)):
    result = await db.chat_flows.update_one(
        {"id": flow_id},
        {"$pull": {"steps": {"id": step_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Flow or step not found")
    
    return {"message": "Step deleted successfully"}
