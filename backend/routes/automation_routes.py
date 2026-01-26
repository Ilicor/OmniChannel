from fastapi import APIRouter, HTTPException, status, Depends
from models import AutoResponse, AutoResponseCreate
from auth import require_admin, get_current_user
from typing import List
from datetime import datetime

router = APIRouter(prefix="/automation", tags=["Automation"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

@router.get("/", response_model=List[AutoResponse])
async def get_auto_responses(current_user: dict = Depends(require_admin)):
    responses = await db.auto_responses.find().to_list(100)
    return [AutoResponse(**r) for r in responses]

@router.post("/", response_model=AutoResponse)
async def create_auto_response(response_data: AutoResponseCreate, current_user: dict = Depends(require_admin)):
    response = AutoResponse(
        **response_data.dict(),
        created_by=current_user["sub"]
    )
    
    await db.auto_responses.insert_one(response.dict())
    return response

@router.put("/{response_id}", response_model=AutoResponse)
async def update_auto_response(response_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    updates.pop("id", None)
    updates.pop("created_at", None)
    updates.pop("created_by", None)
    
    result = await db.auto_responses.update_one({"id": response_id}, {"$set": updates})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Auto response not found")
    
    response = await db.auto_responses.find_one({"id": response_id})
    return AutoResponse(**response)

@router.delete("/{response_id}")
async def delete_auto_response(response_id: str, current_user: dict = Depends(require_admin)):
    result = await db.auto_responses.delete_one({"id": response_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Auto response not found")
    return {"message": "Auto response deleted successfully"}

@router.put("/{response_id}/toggle")
async def toggle_auto_response(response_id: str, current_user: dict = Depends(require_admin)):
    response = await db.auto_responses.find_one({"id": response_id})
    if not response:
        raise HTTPException(status_code=404, detail="Auto response not found")
    
    new_active = not response.get("active", True)
    await db.auto_responses.update_one({"id": response_id}, {"$set": {"active": new_active}})
    
    return {"message": f"Auto response {'activated' if new_active else 'deactivated'}"}
