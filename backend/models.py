from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any
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
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
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
    sender: Literal['customer', 'agent', 'bot']
    text: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().strftime('%I:%M %p'))
    agent_id: Optional[str] = None
    automation_id: Optional[str] = None  # Track which automation sent this

class Customer(BaseModel):
    name: str
    email: str
    avatar: str = ""
    phone: str = ""
    location: str = ""
    # Additional customer data fields for database lookup
    customer_id: str = ""
    account_type: str = ""
    tracking_numbers: List[str] = []
    last_order_date: str = ""
    total_orders: int = 0

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer: Customer
    channel: Literal['email', 'whatsapp', 'facebook', 'chat']
    channel_id: str = ""
    subject: str
    last_message: str
    timestamp: str = ""
    status: Literal['open', 'pending', 'resolved'] = 'open'
    priority: Literal['urgent', 'high', 'medium', 'low'] = 'medium'
    assigned_to: Optional[str] = None
    unread: bool = True
    messages: List[Message] = []
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConversationCreate(BaseModel):
    customer: Customer
    channel: Literal['email', 'whatsapp', 'facebook', 'chat']
    channel_id: str = ""
    subject: str
    priority: Literal['urgent', 'high', 'medium', 'low'] = 'medium'

class MessageCreate(BaseModel):
    text: str

# ============== ENHANCED AUTOMATION MODELS ==============

# Trigger types for automations
class AutomationTrigger(BaseModel):
    type: Literal['keyword', 'first_message', 'all_messages', 'no_agent_assigned', 'outside_hours']
    keywords: List[str] = []  # For keyword trigger
    match_type: Literal['contains', 'exact', 'starts_with', 'regex'] = 'contains'
    case_sensitive: bool = False

# Condition types
class AutomationCondition(BaseModel):
    type: Literal['customer_exists', 'has_tracking', 'channel_is', 'tag_contains', 'always']
    value: str = ""  # The value to check against
    operator: Literal['equals', 'not_equals', 'contains', 'not_contains'] = 'equals'

# Action types
class AutomationAction(BaseModel):
    type: Literal['send_reply', 'lookup_customer', 'lookup_tracking', 'assign_agent', 'add_tag', 'set_priority', 'set_status', 'send_to_human']
    # For send_reply
    message_template: str = ""  # Can include variables like {{customer_name}}, {{tracking_status}}
    # For assign_agent
    agent_id: str = ""
    assign_mode: Literal['specific', 'round_robin', 'least_busy'] = 'round_robin'
    # For add_tag
    tag: str = ""
    # For set_priority
    priority: Literal['urgent', 'high', 'medium', 'low'] = 'medium'
    # For set_status
    status: Literal['open', 'pending', 'resolved'] = 'open'
    # For database lookup
    lookup_field: Literal['email', 'phone', 'tracking_number', 'customer_id'] = 'email'
    # Delay before action (in seconds)
    delay: int = 0

# Complete Automation Flow
class AutomationFlow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    active: bool = True
    # Trigger that starts the automation
    trigger: AutomationTrigger
    # Conditions that must be met (AND logic)
    conditions: List[AutomationCondition] = []
    # Actions to perform in sequence
    actions: List[AutomationAction] = []
    # Channels this automation applies to
    channels: List[Literal['email', 'whatsapp', 'facebook', 'chat', 'all']] = ['all']
    # Priority (higher = runs first)
    priority: int = 0
    # Stats
    times_triggered: int = 0
    last_triggered: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""

class AutomationFlowCreate(BaseModel):
    name: str
    description: str = ""
    active: bool = True
    trigger: AutomationTrigger
    conditions: List[AutomationCondition] = []
    actions: List[AutomationAction] = []
    channels: List[Literal['email', 'whatsapp', 'facebook', 'chat', 'all']] = ['all']
    priority: int = 0

# Auto Response Models (simplified version - keeping for backward compatibility)
class AutoResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    trigger: str
    message: str
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""

class AutoResponseCreate(BaseModel):
    name: str
    trigger: str
    message: str
    active: bool = True

# Legacy Chat Flow Models (for backward compatibility)
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

# Customer Database for lookups
class CustomerRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    phone: str = ""
    account_type: Literal['individual', 'business', 'vip'] = 'individual'
    tracking_numbers: List[str] = []
    address: str = ""
    city: str = ""
    country: str = ""
    notes: str = ""
    total_orders: int = 0
    last_order_date: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Tracking information
class TrackingInfo(BaseModel):
    tracking_number: str
    status: Literal['pending', 'in_transit', 'out_for_delivery', 'delivered', 'exception'] = 'pending'
    carrier: str = "Post Aruba"
    origin: str = ""
    destination: str = ""
    estimated_delivery: str = ""
    last_update: str = ""
    last_location: str = ""
    history: List[Dict[str, str]] = []

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
