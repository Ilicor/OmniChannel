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
- [x] Login page with Post Aruba branding and logo
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

### Analytics & Agent Activity (Complete - Jan 2026)
- [x] Analytics Overview with Total Tickets, Open, Escalated, Resolved Today
- [x] Weekly ticket trend chart
- [x] Tickets by channel distribution
- [x] Customer Satisfaction Score display
- [x] **Agent Activity Tab** - View agent interactions per day or custom timeframe
- [x] Date range selector with quick filters (Today, Last 7 Days, Last 30 Days)
- [x] Agent performance table (Messages Sent, Assigned, Resolved, Open)

### Conversation Management (Complete - Jan 2026)
- [x] **Mark as Resolved button** - Prominent green button in conversation header
- [x] Reopen button for resolved conversations
- [x] **Auto-escalation** - Conversations unresolved >24 hours are auto-escalated
- [x] **Escalated styling** - Red border/background for escalated conversations in list

### Customer Satisfaction Survey (Complete - Jan 2026)
- [x] Settings page for survey configuration
- [x] Enable/disable satisfaction surveys toggle
- [x] **Auto-send on Resolve** - Automatically send survey when conversation is resolved
- [x] Customizable survey message
- [x] Add custom questions (rating, text, yes/no types)
- [x] Thank you message configuration
- [x] Preview of survey message

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

### Conversations
```json
{
  "id": "string",
  "customer": {...},
  "channel": "email|whatsapp|facebook|chat",
  "status": "open|pending|resolved",
  "priority": "low|medium|high|urgent",
  "assigned_to": "string",
  "messages": [...],
  "escalated": false,
  "escalated_at": "datetime",
  "resolved_at": "datetime",
  "resolved_by": "string",
  "satisfaction_survey_sent": false,
  "satisfaction_survey_sent_at": "datetime"
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

### Satisfaction Survey Settings
```json
{
  "enabled": false,
  "auto_send_on_resolve": true,
  "survey_message": "string",
  "questions": [{
    "id": "string",
    "question": "string",
    "type": "rating|text|yes_no",
    "required": true
  }],
  "thank_you_message": "string"
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Analytics
- `GET /api/analytics/` - Get analytics overview
- `GET /api/analytics/agent-activity` - Get agent activity with date range filtering

### Conversations
- `GET /api/conversations/` - List conversations
- `GET /api/conversations/{id}` - Get single conversation
- `PUT /api/conversations/{id}/status` - Update status (triggers satisfaction survey on resolve)
- `POST /api/conversations/{id}/messages` - Send message

### Settings
- `GET /api/settings/satisfaction-survey` - Get survey settings
- `PUT /api/settings/satisfaction-survey` - Update survey settings

### Automations
- `GET /api/automations/` - List all automations
- `POST /api/automations/` - Create automation
- `GET /api/automations/templates` - Get pre-built templates
- `PUT /api/automations/{id}` - Update automation
- `DELETE /api/automations/{id}` - Delete automation
- `PUT /api/automations/{id}/toggle` - Toggle active state

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
- Process and store customer satisfaction survey responses

### P3 - Low Priority
- Bulk automation import/export
- Automation analytics and reporting
- Mobile responsive improvements
- Export agent activity reports to CSV/Excel
