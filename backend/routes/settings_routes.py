from fastapi import APIRouter, HTTPException, Depends
from models import AppSettings, GeneralSettings, NotificationSettings, SecuritySettings, BusinessHoursSettings
from auth import require_admin

router = APIRouter(prefix="/settings", tags=["Settings"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

@router.get("/", response_model=AppSettings)
async def get_settings(current_user: dict = Depends(require_admin)):
    settings = await db.settings.find_one({"id": "app_settings"})
    if not settings:
        # Create default settings
        default_settings = AppSettings()
        await db.settings.insert_one(default_settings.dict())
        return default_settings
    return AppSettings(**settings)

@router.put("/general")
async def update_general_settings(settings: GeneralSettings, current_user: dict = Depends(require_admin)):
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": {"general": settings.dict()}},
        upsert=True
    )
    return {"message": "General settings updated"}

@router.put("/notifications")
async def update_notification_settings(settings: NotificationSettings, current_user: dict = Depends(require_admin)):
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": {"notifications": settings.dict()}},
        upsert=True
    )
    return {"message": "Notification settings updated"}

@router.put("/security")
async def update_security_settings(settings: SecuritySettings, current_user: dict = Depends(require_admin)):
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": {"security": settings.dict()}},
        upsert=True
    )
    return {"message": "Security settings updated"}

@router.put("/business-hours")
async def update_business_hours_settings(settings: BusinessHoursSettings, current_user: dict = Depends(require_admin)):
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": {"business_hours": settings.dict()}},
        upsert=True
    )
    return {"message": "Business hours settings updated"}
