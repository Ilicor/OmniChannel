from fastapi import APIRouter, HTTPException, status, Depends
from models import UserCreate, User, UserInDB, UserResponse
from auth import get_password_hash, require_admin, get_current_user
from typing import List
import uuid
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

@router.post("/", response_model=UserResponse)
async def create_user(user_data: UserCreate, current_user: dict = Depends(require_admin)):
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_id = str(uuid.uuid4())
    avatar = ''.join([n[0].upper() for n in user_data.name.split()[:2]])
    
    user_dict = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "avatar": avatar,
        "status": "offline",
        "assigned_tickets": 0,
        "hashed_password": get_password_hash(user_data.password),
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    await db.users.insert_one(user_dict)
    
    return UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        avatar=avatar,
        status="offline",
        assigned_tickets=0,
        is_active=True
    )

@router.get("/", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    users = await db.users.find().to_list(1000)
    return [
        UserResponse(
            id=u["id"],
            email=u["email"],
            name=u["name"],
            role=u["role"],
            avatar=u.get("avatar", ""),
            status=u.get("status", "offline"),
            assigned_tickets=u.get("assigned_tickets", 0),
            is_active=u.get("is_active", True)
        )
        for u in users
    ]

@router.get("/agents", response_model=List[UserResponse])
async def get_agents(current_user: dict = Depends(get_current_user)):
    users = await db.users.find({"role": "agent"}).to_list(1000)
    return [
        UserResponse(
            id=u["id"],
            email=u["email"],
            name=u["name"],
            role=u["role"],
            avatar=u.get("avatar", ""),
            status=u.get("status", "offline"),
            assigned_tickets=u.get("assigned_tickets", 0),
            is_active=u.get("is_active", True)
        )
        for u in users
    ]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        avatar=user.get("avatar", ""),
        status=user.get("status", "offline"),
        assigned_tickets=user.get("assigned_tickets", 0),
        is_active=user.get("is_active", True)
    )

@router.put("/{user_id}")
async def update_user(user_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    # Remove sensitive fields
    updates.pop("hashed_password", None)
    updates.pop("id", None)
    
    if "password" in updates:
        updates["hashed_password"] = get_password_hash(updates.pop("password"))
    
    result = await db.users.update_one({"id": user_id}, {"$set": updates})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    # Don't allow deleting yourself
    if user_id == current_user["sub"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

@router.put("/{user_id}/status")
async def update_user_status(user_id: str, status: str, current_user: dict = Depends(require_admin)):
    if status not in ["online", "away", "offline"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"Status updated to {status}"}

@router.put("/{user_id}/toggle-active")
async def toggle_user_active(user_id: str, current_user: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.get("is_active", True)
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": new_status}})
    
    return {"message": f"User {'activated' if new_status else 'deactivated'} successfully"}
