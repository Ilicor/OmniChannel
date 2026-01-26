from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime
import uuid

# User/Agent Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: Literal['admin', 'agent'] = 'agent'

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    avatar: str = ""
    status: Literal['online', 'away', 'offline'] = 'offline'
    assigned_tickets: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class UserResponse(User):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Channel Configuration Models
class WhatsAppChannel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone_number: str
    phone_number_id: str = ""
    access_token: str = ""
    webhook_verify_token: str = Field(default_factory=lambda: str(uuid.uuid4())[:16])
    is_connected: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""

class WhatsAppChannelCreate(BaseModel):
    name: str
    phone_number: str
    phone_number_id: str = ""
    access_token: str = ""

class FacebookChannel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    page_name: str
    page_id: str = ""
    page_access_token: str = ""
    app_secret: str = ""
    webhook_verify_token: str = Field(default_factory=lambda: str(uuid.uuid4())[:16])
    is_connected: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""

class FacebookChannelCreate(BaseModel):
    name: str
    page_name: str
    page_id: str = ""
    page_access_token: str = ""
    app_secret: str = ""

class EmailChannel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email_address: str
    provider: Literal['smtp', 'sendgrid', 'mailgun', 'aws_ses'] = 'smtp'
    # SMTP settings
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    # API-based settings
    api_key: str = ""
    is_connected: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""

class EmailChannelCreate(BaseModel):
    name: str
    email_address: str
    provider: Literal['smtp', 'sendgrid', 'mailgun', 'aws_ses'] = 'smtp'
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    api_key: str = ""

# Conversation Models
class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender: Literal['customer', 'agent']
    text: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().strftime('%I:%M %p'))
    agent_id: Optional[str] = None

class Customer(BaseModel):
    name: str
    email: str
    avatar: str = ""
    phone: str = ""
    location: str = ""

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer: Customer
    channel: Literal['email', 'whatsapp', 'facebook', 'chat']
    channel_id: str = ""  # Reference to specific channel configuration
    subject: str
    last_message: str
    timestamp: str = ""
    status: Literal['open', 'pending', 'resolved'] = 'open'
    priority: Literal['urgent', 'high', 'medium', 'low'] = 'medium'
    assigned_to: Optional[str] = None
    unread: bool = True
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConversationCreate(BaseModel):
    customer: Customer
    channel: Literal['email', 'whatsapp', 'facebook', 'chat']
    channel_id: str = ""
    subject: str
    priority: Literal['urgent', 'high', 'medium', 'low'] = 'medium'

class MessageCreate(BaseModel):
    text: str

# Auto Response Models
class AutoResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    trigger: str  # 'first_contact', 'outside_hours', 'keyword:word1,word2'
    message: str
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""

class AutoResponseCreate(BaseModel):
    name: str
    trigger: str
    message: str
    active: bool = True

# Chat Flow Models
class FlowStep(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: Literal['message', 'input', 'action', 'condition', 'options', 'route']
    content: str

class ChatFlow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    active: bool = True
    steps: List[FlowStep] = []
    usage_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""

class ChatFlowCreate(BaseModel):
    name: str
    description: str = ""
    active: bool = True
    steps: List[FlowStep] = []

# Settings Models
class GeneralSettings(BaseModel):
    company_name: str = "Post Aruba"
    support_email: str = "support@postaruba.com"
    timezone: str = "America/Aruba"
    language: str = "en"

class NotificationSettings(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    sound_alerts: bool = True

class SecuritySettings(BaseModel):
    two_factor_auth: bool = False
    session_timeout: int = 30

class BusinessHoursSettings(BaseModel):
    start_time: str = "08:00"
    end_time: str = "18:00"
    work_days: List[str] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

class AppSettings(BaseModel):
    id: str = "app_settings"
    general: GeneralSettings = GeneralSettings()
    notifications: NotificationSettings = NotificationSettings()
    security: SecuritySettings = SecuritySettings()
    business_hours: BusinessHoursSettings = BusinessHoursSettings()
