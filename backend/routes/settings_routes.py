from fastapi import APIRouter, HTTPException, Depends
from models import AppSettings, GeneralSettings, NotificationSettings, SecuritySettings, BusinessHoursSettings
from auth import require_admin
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/settings", tags=["Settings"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

# Satisfaction Survey Models
class SatisfactionQuestion(BaseModel):
    id: str
    question: str
    type: str = "rating"  # rating, text, yes_no
    required: bool = True

class SatisfactionSurveySettings(BaseModel):
    enabled: bool = False
    auto_send_on_resolve: bool = True
    survey_message: str = "Thank you for contacting Post Aruba Support! We'd love to hear your feedback. How would you rate your experience? Please reply with a number from 1-5 (1=Poor, 5=Excellent)"
    questions: List[SatisfactionQuestion] = []
    thank_you_message: str = "Thank you for your feedback! We appreciate your time."

@router.get("/", response_model=AppSettings)
async def get_settings(current_user: dict = Depends(require_admin)):
    settings = await db.settings.find_one({"id": "app_settings"})
    if not settings:
        # Create default settings
        default_settings = AppSettings()
        await db.settings.insert_one(default_settings.dict())
        return default_settings
    return AppSettings(**settings)

@router.get("/satisfaction-survey")
async def get_satisfaction_settings(current_user: dict = Depends(require_admin)):
    settings = await db.settings.find_one({"id": "app_settings"})
    if not settings or "satisfaction_survey" not in settings:
        return SatisfactionSurveySettings().dict()
    return settings.get("satisfaction_survey", SatisfactionSurveySettings().dict())

@router.put("/satisfaction-survey")
async def update_satisfaction_settings(
    survey_settings: SatisfactionSurveySettings,
    current_user: dict = Depends(require_admin)
):
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": {"satisfaction_survey": survey_settings.dict()}},
        upsert=True
    )
    return {"message": "Satisfaction survey settings updated"}

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
