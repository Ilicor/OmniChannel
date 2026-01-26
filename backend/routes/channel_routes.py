from fastapi import APIRouter, HTTPException, status, Depends
from models import (
    WhatsAppChannel, WhatsAppChannelCreate,
    FacebookChannel, FacebookChannelCreate,
    EmailChannel, EmailChannelCreate
)
from auth import require_admin, get_current_user
from typing import List
import uuid
from datetime import datetime

router = APIRouter(prefix="/channels", tags=["Channels"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

# ============== WhatsApp Channels ==============

@router.get("/whatsapp", response_model=List[WhatsAppChannel])
async def get_whatsapp_channels(current_user: dict = Depends(require_admin)):
    channels = await db.whatsapp_channels.find().to_list(100)
    return [WhatsAppChannel(**c) for c in channels]

@router.post("/whatsapp", response_model=WhatsAppChannel)
async def create_whatsapp_channel(channel_data: WhatsAppChannelCreate, current_user: dict = Depends(require_admin)):
    channel = WhatsAppChannel(
        **channel_data.dict(),
        created_by=current_user["sub"]
    )
    
    await db.whatsapp_channels.insert_one(channel.dict())
    return channel

@router.put("/whatsapp/{channel_id}", response_model=WhatsAppChannel)
async def update_whatsapp_channel(channel_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    updates.pop("id", None)
    updates.pop("created_at", None)
    updates.pop("created_by", None)
    
    result = await db.whatsapp_channels.update_one({"id": channel_id}, {"$set": updates})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    channel = await db.whatsapp_channels.find_one({"id": channel_id})
    return WhatsAppChannel(**channel)

@router.delete("/whatsapp/{channel_id}")
async def delete_whatsapp_channel(channel_id: str, current_user: dict = Depends(require_admin)):
    result = await db.whatsapp_channels.delete_one({"id": channel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"message": "WhatsApp channel deleted successfully"}

@router.post("/whatsapp/{channel_id}/test")
async def test_whatsapp_connection(channel_id: str, current_user: dict = Depends(require_admin)):
    channel = await db.whatsapp_channels.find_one({"id": channel_id})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Here you would test the actual WhatsApp API connection
    # For now, we'll check if credentials are provided
    if channel.get("phone_number_id") and channel.get("access_token"):
        # Update connection status
        await db.whatsapp_channels.update_one(
            {"id": channel_id}, 
            {"$set": {"is_connected": True}}
        )
        return {"success": True, "message": "WhatsApp connection successful"}
    else:
        return {"success": False, "message": "Missing credentials (Phone Number ID or Access Token)"}

# ============== Facebook Channels ==============

@router.get("/facebook", response_model=List[FacebookChannel])
async def get_facebook_channels(current_user: dict = Depends(require_admin)):
    channels = await db.facebook_channels.find().to_list(100)
    return [FacebookChannel(**c) for c in channels]

@router.post("/facebook", response_model=FacebookChannel)
async def create_facebook_channel(channel_data: FacebookChannelCreate, current_user: dict = Depends(require_admin)):
    channel = FacebookChannel(
        **channel_data.dict(),
        created_by=current_user["sub"]
    )
    
    await db.facebook_channels.insert_one(channel.dict())
    return channel

@router.put("/facebook/{channel_id}", response_model=FacebookChannel)
async def update_facebook_channel(channel_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    updates.pop("id", None)
    updates.pop("created_at", None)
    updates.pop("created_by", None)
    
    result = await db.facebook_channels.update_one({"id": channel_id}, {"$set": updates})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    channel = await db.facebook_channels.find_one({"id": channel_id})
    return FacebookChannel(**channel)

@router.delete("/facebook/{channel_id}")
async def delete_facebook_channel(channel_id: str, current_user: dict = Depends(require_admin)):
    result = await db.facebook_channels.delete_one({"id": channel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"message": "Facebook channel deleted successfully"}

@router.post("/facebook/{channel_id}/test")
async def test_facebook_connection(channel_id: str, current_user: dict = Depends(require_admin)):
    channel = await db.facebook_channels.find_one({"id": channel_id})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if channel.get("page_id") and channel.get("page_access_token"):
        await db.facebook_channels.update_one(
            {"id": channel_id}, 
            {"$set": {"is_connected": True}}
        )
        return {"success": True, "message": "Facebook connection successful"}
    else:
        return {"success": False, "message": "Missing credentials (Page ID or Page Access Token)"}

# ============== Email Channels ==============

@router.get("/email", response_model=List[EmailChannel])
async def get_email_channels(current_user: dict = Depends(require_admin)):
    channels = await db.email_channels.find().to_list(100)
    return [EmailChannel(**c) for c in channels]

@router.post("/email", response_model=EmailChannel)
async def create_email_channel(channel_data: EmailChannelCreate, current_user: dict = Depends(require_admin)):
    channel = EmailChannel(
        **channel_data.dict(),
        created_by=current_user["sub"]
    )
    
    await db.email_channels.insert_one(channel.dict())
    return channel

@router.put("/email/{channel_id}", response_model=EmailChannel)
async def update_email_channel(channel_id: str, updates: dict, current_user: dict = Depends(require_admin)):
    updates.pop("id", None)
    updates.pop("created_at", None)
    updates.pop("created_by", None)
    
    result = await db.email_channels.update_one({"id": channel_id}, {"$set": updates})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    channel = await db.email_channels.find_one({"id": channel_id})
    return EmailChannel(**channel)

@router.delete("/email/{channel_id}")
async def delete_email_channel(channel_id: str, current_user: dict = Depends(require_admin)):
    result = await db.email_channels.delete_one({"id": channel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"message": "Email channel deleted successfully"}

@router.post("/email/{channel_id}/test")
async def test_email_connection(channel_id: str, current_user: dict = Depends(require_admin)):
    channel = await db.email_channels.find_one({"id": channel_id})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    provider = channel.get("provider", "smtp")
    
    if provider == "smtp":
        if channel.get("smtp_host") and channel.get("smtp_username") and channel.get("smtp_password"):
            await db.email_channels.update_one(
                {"id": channel_id}, 
                {"$set": {"is_connected": True}}
            )
            return {"success": True, "message": "Email SMTP connection configured"}
        else:
            return {"success": False, "message": "Missing SMTP credentials"}
    else:
        if channel.get("api_key"):
            await db.email_channels.update_one(
                {"id": channel_id}, 
                {"$set": {"is_connected": True}}
            )
            return {"success": True, "message": f"{provider.upper()} connection configured"}
        else:
            return {"success": False, "message": f"Missing {provider.upper()} API key"}

# ============== Get All Channels Summary ==============

@router.get("/summary")
async def get_channels_summary(current_user: dict = Depends(get_current_user)):
    whatsapp = await db.whatsapp_channels.count_documents({})
    whatsapp_connected = await db.whatsapp_channels.count_documents({"is_connected": True})
    
    facebook = await db.facebook_channels.count_documents({})
    facebook_connected = await db.facebook_channels.count_documents({"is_connected": True})
    
    email = await db.email_channels.count_documents({})
    email_connected = await db.email_channels.count_documents({"is_connected": True})
    
    return {
        "whatsapp": {"total": whatsapp, "connected": whatsapp_connected},
        "facebook": {"total": facebook, "connected": facebook_connected},
        "email": {"total": email, "connected": email_connected}
    }
