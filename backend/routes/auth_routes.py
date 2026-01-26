from fastapi import APIRouter, HTTPException, status, Depends
from models import UserCreate, UserLogin, User, UserInDB, UserResponse, Token
from auth import get_password_hash, verify_password, create_access_token, get_current_user, require_admin
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled"
        )
    
    # Update user status to online
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"status": "online"}})
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    )
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        avatar=user.get("avatar", ""),
        status="online",
        assigned_tickets=user.get("assigned_tickets", 0),
        is_active=user.get("is_active", True)
    )
    
    return Token(access_token=access_token, user=user_response)

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": current_user["sub"]}, {"$set": {"status": "offline"}})
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["sub"]})
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

@router.put("/status")
async def update_status(status: str, current_user: dict = Depends(get_current_user)):
    if status not in ["online", "away", "offline"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.users.update_one({"id": current_user["sub"]}, {"$set": {"status": status}})
    return {"message": f"Status updated to {status}"}
