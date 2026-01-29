# Post Aruba Support Center - Product Requirements Document

## Original Problem Statement
Build a Freshdesk clone with the following features:
1. **Omnichannel Inbox:** Consolidate customer chats from WhatsApp, Email, and Facebook into a single inbox.
2. **Conversation Routing & Assignment:** Allow chats to be routed and assigned to specific customer service agents.
3. **Automation & Chat Flows:** Set up automatic responses, design chat flows with triggers and actions.
4. **Color Scheme:** Blue (#393d8a), Yellow (#eeb224), and Green (#30a34b).
5. **Authentication:** JWT-based custom auth (email/password).
6. **User Roles:** Admin (full access) and Agent (view/reply to assigned messages only).
7. **Channel Configuration:** Settings page for configuring WhatsApp, Facebook, and Email accounts.
8. **Default Admin:** ilienecorsen@postaruba.com / admin123

## Tech Stack
- **Frontend:** React, TailwindCSS, Shadcn/UI components
- **Backend:** FastAPI (Python)
- **Database:** MongoDB (async with motor)
- **Authentication:** JWT tokens

## What's Been Implemented

### Core Features (Complete)
- [x] JWT-based authentication system
- [x] Login page with Post Aruba branding
- [x] Role-based access control (Admin/Agent)
- [x] Default admin user creation on startup
- [x] Omnichannel inbox with conversation list
- [x] Conversation view with messaging
- [x] Agent management (add/view agents)
- [x] Channel configuration UI (WhatsApp, Facebook, Email)
- [x] Analytics dashboard
- [x] Settings page

### Automation Builder (Complete - Jan 2026)
- [x] Create automation rules with triggers and actions
- [x] Keyword-based triggers with match types (contains, exact, starts_with, regex)
- [x] Multiple trigger types: keyword, first_message, all_messages, no_agent_assigned, outside_hours
- [x] Action types: send_reply, lookup_customer, lookup_tracking, assign_agent, add_tag, set_priority, set_status, escalate_to_human
- [x] Pre-built automation templates (Welcome, Tracking, Pricing, Complaint, After Hours)
- [x] Toggle automation active/inactive
- [x] Edit and delete automations
- [x] Channel selection for automation rules

### Branding (Complete - Jan 2026)
- [x] Custom Post Aruba logo integrated on login page
- [x] Custom Post Aruba logo in sidebar
- [x] Blue/Yellow/Green color scheme throughout

## Database Schema

### Users
```json
{
  "id": "string",
  "email": "string",
  "name": "string", 
  "role": "admin|agent",
  "avatar": "string",
  "status": "online|away|offline",
  "assigned_tickets": 0,
  "hashed_password": "string",
  "is_active": true
}
```

### Automations
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "active": true,
  "trigger": {
    "type": "keyword|first_message|all_messages|no_agent_assigned|outside_hours",
    "keywords": ["string"],
    "match_type": "contains|exact|starts_with|regex",
    "case_sensitive": false
  },
  "actions": [
    {
      "type": "send_reply|lookup_customer|...",
      "message_template": "string"
    }
  ],
  "channels": ["all|email|whatsapp|facebook|chat"],
  "priority": 0,
  "times_triggered": 0
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Automations
- `GET /api/automations/` - List all automations
- `POST /api/automations/` - Create automation
- `GET /api/automations/templates` - Get pre-built templates
- `PUT /api/automations/{id}` - Update automation
- `DELETE /api/automations/{id}` - Delete automation
- `PUT /api/automations/{id}/toggle` - Toggle active state

### Conversations
- `GET /api/conversations/` - List conversations
- `GET /api/conversations/{id}` - Get single conversation
- `POST /api/conversations/{id}/messages` - Send message

## Known Limitations / MOCKED Features
- **Channel Integrations:** The channel configuration UI saves credentials to the database but does NOT connect to actual third-party APIs (WhatsApp Business API, Facebook Messenger API, Email SMTP/SendGrid). This is intentional per user request - actual integration to be built later.

## Credentials
- **Admin:** ilienecorsen@postaruba.com / admin123

## Prioritized Backlog

### P1 - High Priority
- Implement Database Lookups in Automations (Lookup Customer/Tracking actions with real database queries)
- Test Agent role functionality (login as agent, verify restricted permissions)

### P2 - Medium Priority  
- Full Channel Integration (WhatsApp, Facebook, Email APIs)
- Real-time message updates (WebSocket or polling)

### P3 - Low Priority
- Bulk automation import/export
- Automation analytics and reporting
- Mobile responsive improvements
