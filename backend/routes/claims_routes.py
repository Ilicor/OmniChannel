from fastapi import APIRouter, HTTPException, Depends, Query
from models import Claim, ClaimCreate, ClaimUpdate
from auth import get_current_user, require_admin
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/claims", tags=["Claims"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

@router.get("/", response_model=List[Claim])
async def get_claims(
    status: Optional[str] = None,
    claim_type: Optional[str] = None,
    assigned_to: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all claims with optional filtering"""
    query = {}
    
    if status:
        query["status"] = status
    if claim_type:
        query["claim_type"] = claim_type
    if assigned_to:
        query["assigned_to"] = assigned_to
    if priority:
        query["priority"] = priority
    
    # Agents can only see claims assigned to them
    if current_user.get("role") == "agent":
        query["assigned_to"] = current_user["sub"]
    
    claims = await db.claims.find(query).sort("created_at", -1).to_list(200)
    
    result = []
    for c in claims:
        c.pop('_id', None)
        result.append(c)
    
    return result

@router.get("/stats")
async def get_claims_stats(current_user: dict = Depends(get_current_user)):
    """Get claims statistics"""
    total = await db.claims.count_documents({})
    open_claims = await db.claims.count_documents({"status": "open"})
    investigating = await db.claims.count_documents({"status": "investigating"})
    pending = await db.claims.count_documents({"status": "pending_customer"})
    resolved = await db.claims.count_documents({"status": "resolved"})
    rejected = await db.claims.count_documents({"status": "rejected"})
    
    # By type
    types = {}
    for claim_type in ['damaged_package', 'lost_package', 'delayed_delivery', 'wrong_delivery', 'billing_issue', 'service_complaint', 'other']:
        count = await db.claims.count_documents({"claim_type": claim_type})
        types[claim_type] = count
    
    # By priority
    urgent = await db.claims.count_documents({"priority": "urgent", "status": {"$ne": "resolved"}})
    high = await db.claims.count_documents({"priority": "high", "status": {"$ne": "resolved"}})
    
    return {
        "total": total,
        "by_status": {
            "open": open_claims,
            "investigating": investigating,
            "pending_customer": pending,
            "resolved": resolved,
            "rejected": rejected
        },
        "by_type": types,
        "urgent_priority": urgent,
        "high_priority": high,
        "resolution_rate": round((resolved / total * 100) if total > 0 else 0, 1)
    }

@router.get("/{claim_id}")
async def get_claim(claim_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single claim by ID"""
    claim = await db.claims.find_one({"id": claim_id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Agents can only see claims assigned to them
    if current_user.get("role") == "agent" and claim.get("assigned_to") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    claim.pop('_id', None)
    return claim

@router.post("/", response_model=Claim)
async def create_claim(claim_data: ClaimCreate, current_user: dict = Depends(get_current_user)):
    """Create a new claim"""
    # Get user details for created_by
    user = await db.users.find_one({"id": current_user["sub"]})
    
    claim = Claim(
        **claim_data.dict(),
        created_by=current_user["sub"],
        created_by_name=user["name"] if user else current_user.get("name", "Unknown")
    )
    
    await db.claims.insert_one(claim.dict())
    
    return claim

@router.put("/{claim_id}", response_model=Claim)
async def update_claim(
    claim_id: str, 
    update_data: ClaimUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a claim"""
    claim = await db.claims.find_one({"id": claim_id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    update_dict = {"updated_at": datetime.utcnow()}
    
    if update_data.status is not None:
        update_dict["status"] = update_data.status
        # Set resolved_at if status is resolved
        if update_data.status == "resolved":
            update_dict["resolved_at"] = datetime.utcnow()
    
    if update_data.resolution_notes is not None:
        update_dict["resolution_notes"] = update_data.resolution_notes
    
    if update_data.assigned_to is not None:
        update_dict["assigned_to"] = update_data.assigned_to
        # Get assigned agent's name
        agent = await db.users.find_one({"id": update_data.assigned_to})
        if agent:
            update_dict["assigned_to_name"] = agent["name"]
    
    if update_data.priority is not None:
        update_dict["priority"] = update_data.priority
    
    await db.claims.update_one({"id": claim_id}, {"$set": update_dict})
    
    updated = await db.claims.find_one({"id": claim_id})
    updated.pop('_id', None)
    
    return updated

@router.delete("/{claim_id}")
async def delete_claim(claim_id: str, current_user: dict = Depends(require_admin)):
    """Delete a claim (admin only)"""
    result = await db.claims.delete_one({"id": claim_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    return {"message": "Claim deleted successfully"}
