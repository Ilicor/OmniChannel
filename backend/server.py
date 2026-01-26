from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from auth import get_password_hash

# Import routes
from routes import auth_routes, user_routes, channel_routes, conversation_routes
from routes import automation_routes, flow_routes, analytics_routes, settings_routes
from routes import automation_flow_routes

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'post_aruba_support')]

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Set database for all routes
auth_routes.set_db(db)
user_routes.set_db(db)
channel_routes.set_db(db)
conversation_routes.set_db(db)
automation_routes.set_db(db)
flow_routes.set_db(db)
analytics_routes.set_db(db)
settings_routes.set_db(db)

async def create_default_admin():
    """Create default admin user if not exists"""
    existing = await db.users.find_one({"email": "ilienecorsen@postaruba.com"})
    if not existing:
        admin_user = {
            "id": "admin-001",
            "email": "ilienecorsen@postaruba.com",
            "name": "Iliene Corsen",
            "role": "admin",
            "avatar": "IC",
            "status": "offline",
            "assigned_tickets": 0,
            "hashed_password": get_password_hash("admin123"),
            "is_active": True
        }
        await db.users.insert_one(admin_user)
        logger.info("Default admin user created: ilienecorsen@postaruba.com")
    else:
        logger.info("Default admin user already exists")

async def create_sample_data():
    """Create sample data for demonstration"""
    # Check if we already have conversations
    conv_count = await db.conversations.count_documents({})
    if conv_count > 0:
        return
    
    # Sample conversations
    sample_conversations = [
        {
            "id": "conv-001",
            "customer": {
                "name": "John Peterson",
                "email": "john.peterson@email.com",
                "avatar": "JP",
                "phone": "+297 555-0123",
                "location": "Oranjestad, Aruba"
            },
            "channel": "email",
            "subject": "Package delivery delay - Order #45892",
            "last_message": "I ordered a package 5 days ago and it still hasn't arrived. Can you help me track it?",
            "timestamp": "2 min ago",
            "status": "open",
            "priority": "high",
            "assigned_to": None,
            "unread": True,
            "messages": [
                {"id": "m1", "sender": "customer", "text": "Hello, I ordered a package 5 days ago and it still hasn't arrived. Can you help me track it?", "timestamp": "10:30 AM"}
            ]
        },
        {
            "id": "conv-002",
            "customer": {
                "name": "Sarah Williams",
                "email": "sarah.w@gmail.com",
                "avatar": "SW",
                "phone": "+297 555-0456",
                "location": "San Nicolas, Aruba"
            },
            "channel": "whatsapp",
            "subject": "Billing inquiry",
            "last_message": "Why was I charged twice for the same shipment?",
            "timestamp": "15 min ago",
            "status": "open",
            "priority": "medium",
            "assigned_to": None,
            "unread": True,
            "messages": [
                {"id": "m1", "sender": "customer", "text": "Hi, I noticed I was charged twice for shipment #78234. Can you look into this?", "timestamp": "10:15 AM"}
            ]
        },
        {
            "id": "conv-003",
            "customer": {
                "name": "Michael Brown",
                "email": "mbrown@company.com",
                "avatar": "MB",
                "phone": "+1 555-0789",
                "location": "Miami, FL"
            },
            "channel": "facebook",
            "subject": "New service inquiry",
            "last_message": "What are your international shipping rates?",
            "timestamp": "1 hour ago",
            "status": "pending",
            "priority": "low",
            "assigned_to": None,
            "unread": False,
            "messages": [
                {"id": "m1", "sender": "customer", "text": "Hello! I'm interested in your international shipping services. What are your rates to Europe?", "timestamp": "9:30 AM"}
            ]
        },
        {
            "id": "conv-004",
            "customer": {
                "name": "Emma Davis",
                "email": "emma.davis@business.com",
                "avatar": "ED",
                "phone": "+297 555-0321",
                "location": "Noord, Aruba"
            },
            "channel": "chat",
            "subject": "Account access issue",
            "last_message": "I can't log into my business account",
            "timestamp": "2 hours ago",
            "status": "open",
            "priority": "high",
            "assigned_to": None,
            "unread": False,
            "messages": [
                {"id": "m1", "sender": "customer", "text": "I can't log into my business account. It says my password is wrong but I'm sure it's correct.", "timestamp": "8:30 AM"}
            ]
        },
        {
            "id": "conv-005",
            "customer": {
                "name": "Robert Johnson",
                "email": "rjohnson@mail.com",
                "avatar": "RJ",
                "phone": "+297 555-0654",
                "location": "Paradera, Aruba"
            },
            "channel": "email",
            "subject": "Damaged package complaint",
            "last_message": "The package arrived completely damaged",
            "timestamp": "3 hours ago",
            "status": "open",
            "priority": "urgent",
            "assigned_to": None,
            "unread": False,
            "messages": [
                {"id": "m1", "sender": "customer", "text": "My package arrived completely damaged. The contents are broken. I need a refund or replacement immediately.", "timestamp": "7:30 AM"}
            ]
        }
    ]
    
    await db.conversations.insert_many(sample_conversations)
    logger.info("Sample conversations created")
    
    # Sample auto responses
    sample_auto_responses = [
        {
            "id": "ar-001",
            "name": "Welcome Message",
            "trigger": "first_contact",
            "message": "Hello! Thank you for contacting Post Aruba support. An agent will be with you shortly.",
            "active": True,
            "created_by": "admin-001"
        },
        {
            "id": "ar-002",
            "name": "After Hours",
            "trigger": "outside_hours",
            "message": "Our office is currently closed. We'll respond during business hours (Mon-Fri, 8AM-6PM).",
            "active": True,
            "created_by": "admin-001"
        },
        {
            "id": "ar-003",
            "name": "Tracking Request",
            "trigger": "keyword:track,tracking,where is",
            "message": "To track your package, please provide your tracking number and we'll look it up for you.",
            "active": True,
            "created_by": "admin-001"
        }
    ]
    
    await db.auto_responses.insert_many(sample_auto_responses)
    logger.info("Sample auto responses created")
    
    # Sample chat flows
    sample_flows = [
        {
            "id": "flow-001",
            "name": "Package Tracking Flow",
            "description": "Automated flow for package tracking inquiries",
            "active": True,
            "steps": [
                {"id": "s1", "type": "message", "content": "Hi! Would you like to track a package?"},
                {"id": "s2", "type": "input", "content": "Please enter your tracking number"},
                {"id": "s3", "type": "action", "content": "Lookup tracking info"},
                {"id": "s4", "type": "condition", "content": "Package found?"},
                {"id": "s5", "type": "message", "content": "Here is your package status..."}
            ],
            "usage_count": 342,
            "created_by": "admin-001"
        },
        {
            "id": "flow-002",
            "name": "New Customer Onboarding",
            "description": "Welcome flow for new customers",
            "active": True,
            "steps": [
                {"id": "s1", "type": "message", "content": "Welcome to Post Aruba!"},
                {"id": "s2", "type": "options", "content": "What can we help you with?"},
                {"id": "s3", "type": "route", "content": "Route to appropriate department"}
            ],
            "usage_count": 156,
            "created_by": "admin-001"
        }
    ]
    
    await db.chat_flows.insert_many(sample_flows)
    logger.info("Sample chat flows created")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Post Aruba Support Center...")
    await create_default_admin()
    await create_sample_data()
    yield
    # Shutdown
    client.close()
    logger.info("Post Aruba Support Center shutdown complete")

# Create the main app
app = FastAPI(
    title="Post Aruba Support Center",
    description="Omnichannel customer support platform",
    version="1.0.0",
    lifespan=lifespan
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check
@api_router.get("/")
async def root():
    return {"message": "Post Aruba Support Center API", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include all route modules
api_router.include_router(auth_routes.router)
api_router.include_router(user_routes.router)
api_router.include_router(channel_routes.router)
api_router.include_router(conversation_routes.router)
api_router.include_router(automation_routes.router)
api_router.include_router(flow_routes.router)
api_router.include_router(analytics_routes.router)
api_router.include_router(settings_routes.router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
