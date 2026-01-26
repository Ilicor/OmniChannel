// Mock Data for Freshdesk Clone

export const channels = [
  { id: 'all', name: 'All Channels', icon: 'Inbox', count: 47 },
  { id: 'email', name: 'Email', icon: 'Mail', count: 23 },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'MessageCircle', count: 12 },
  { id: 'facebook', name: 'Facebook', icon: 'Facebook', count: 8 },
  { id: 'chat', name: 'Live Chat', icon: 'MessageSquare', count: 4 }
];

export const agents = [
  { id: 'agent1', name: 'Maria Santos', email: 'maria@postaruba.com', avatar: 'MS', status: 'online', assignedTickets: 12, role: 'Senior Agent' },
  { id: 'agent2', name: 'Carlos Rodriguez', email: 'carlos@postaruba.com', avatar: 'CR', status: 'online', assignedTickets: 8, role: 'Agent' },
  { id: 'agent3', name: 'Ana Croes', email: 'ana@postaruba.com', avatar: 'AC', status: 'away', assignedTickets: 15, role: 'Team Lead' },
  { id: 'agent4', name: 'David Kelly', email: 'david@postaruba.com', avatar: 'DK', status: 'offline', assignedTickets: 5, role: 'Agent' },
  { id: 'agent5', name: 'Sofia Maduro', email: 'sofia@postaruba.com', avatar: 'SM', status: 'online', assignedTickets: 10, role: 'Agent' }
];

export const conversations = [
  {
    id: 'conv1',
    customer: { name: 'John Peterson', email: 'john.peterson@email.com', avatar: 'JP' },
    channel: 'email',
    subject: 'Package delivery delay - Order #45892',
    lastMessage: 'I ordered a package 5 days ago and it still hasn\'t arrived. Can you help me track it?',
    timestamp: '2 min ago',
    status: 'open',
    priority: 'high',
    assignedTo: 'agent1',
    unread: true,
    messages: [
      { id: 'm1', sender: 'customer', text: 'Hello, I ordered a package 5 days ago and it still hasn\'t arrived. Can you help me track it?', timestamp: '10:30 AM' },
      { id: 'm2', sender: 'agent', text: 'Hi John, I apologize for the delay. Let me check the status of your order #45892.', timestamp: '10:32 AM' },
      { id: 'm3', sender: 'customer', text: 'Thank you. I really need it by Friday.', timestamp: '10:33 AM' }
    ]
  },
  {
    id: 'conv2',
    customer: { name: 'Sarah Williams', email: 'sarah.w@gmail.com', avatar: 'SW' },
    channel: 'whatsapp',
    subject: 'Billing inquiry',
    lastMessage: 'Why was I charged twice for the same shipment?',
    timestamp: '15 min ago',
    status: 'open',
    priority: 'medium',
    assignedTo: 'agent2',
    unread: true,
    messages: [
      { id: 'm1', sender: 'customer', text: 'Hi, I noticed I was charged twice for shipment #78234. Can you look into this?', timestamp: '10:15 AM' },
      { id: 'm2', sender: 'agent', text: 'Hello Sarah, I\'ll investigate this immediately. Can you share the payment confirmation?', timestamp: '10:18 AM' },
      { id: 'm3', sender: 'customer', text: 'Why was I charged twice for the same shipment?', timestamp: '10:25 AM' }
    ]
  },
  {
    id: 'conv3',
    customer: { name: 'Michael Brown', email: 'mbrown@company.com', avatar: 'MB' },
    channel: 'facebook',
    subject: 'New service inquiry',
    lastMessage: 'What are your international shipping rates?',
    timestamp: '1 hour ago',
    status: 'pending',
    priority: 'low',
    assignedTo: null,
    unread: false,
    messages: [
      { id: 'm1', sender: 'customer', text: 'Hello! I\'m interested in your international shipping services. What are your rates to Europe?', timestamp: '9:30 AM' }
    ]
  },
  {
    id: 'conv4',
    customer: { name: 'Emma Davis', email: 'emma.davis@business.com', avatar: 'ED' },
    channel: 'chat',
    subject: 'Account access issue',
    lastMessage: 'I can\'t log into my business account',
    timestamp: '2 hours ago',
    status: 'resolved',
    priority: 'high',
    assignedTo: 'agent3',
    unread: false,
    messages: [
      { id: 'm1', sender: 'customer', text: 'I can\'t log into my business account. It says my password is wrong but I\'m sure it\'s correct.', timestamp: '8:30 AM' },
      { id: 'm2', sender: 'agent', text: 'I\'ve sent a password reset link to your email. Please check and let me know if you need further assistance.', timestamp: '8:35 AM' },
      { id: 'm3', sender: 'customer', text: 'Got it, thank you so much!', timestamp: '8:40 AM' }
    ]
  },
  {
    id: 'conv5',
    customer: { name: 'Robert Johnson', email: 'rjohnson@mail.com', avatar: 'RJ' },
    channel: 'email',
    subject: 'Damaged package complaint',
    lastMessage: 'The package arrived completely damaged',
    timestamp: '3 hours ago',
    status: 'open',
    priority: 'urgent',
    assignedTo: 'agent1',
    unread: false,
    messages: [
      { id: 'm1', sender: 'customer', text: 'My package arrived completely damaged. The contents are broken. I need a refund or replacement immediately.', timestamp: '7:30 AM' },
      { id: 'm2', sender: 'agent', text: 'I\'m so sorry to hear this, Robert. Can you please send photos of the damaged package?', timestamp: '7:35 AM' },
      { id: 'm3', sender: 'customer', text: 'Here are the photos. [3 images attached]', timestamp: '7:40 AM' }
    ]
  },
  {
    id: 'conv6',
    customer: { name: 'Lisa Chen', email: 'lisa.chen@tech.com', avatar: 'LC' },
    channel: 'whatsapp',
    subject: 'Bulk shipping quote request',
    lastMessage: 'Need pricing for 500 packages monthly',
    timestamp: '4 hours ago',
    status: 'pending',
    priority: 'medium',
    assignedTo: 'agent5',
    unread: false,
    messages: [
      { id: 'm1', sender: 'customer', text: 'Hi, our company needs to ship approximately 500 packages per month. Can we get a bulk discount?', timestamp: '6:30 AM' }
    ]
  }
];

export const autoResponses = [
  { id: 'ar1', name: 'Welcome Message', trigger: 'first_contact', message: 'Hello! Thank you for contacting Post Aruba support. An agent will be with you shortly.', active: true },
  { id: 'ar2', name: 'After Hours', trigger: 'outside_hours', message: 'Our office is currently closed. We\'ll respond during business hours (Mon-Fri, 8AM-6PM).', active: true },
  { id: 'ar3', name: 'Tracking Request', trigger: 'keyword:track', message: 'To track your package, please provide your tracking number and we\'ll look it up for you.', active: true },
  { id: 'ar4', name: 'Rate Inquiry', trigger: 'keyword:price,rate,cost', message: 'Thank you for your interest! Our rates depend on package size and destination. An agent will provide a detailed quote.', active: false }
];

export const chatFlows = [
  {
    id: 'flow1',
    name: 'Package Tracking Flow',
    description: 'Automated flow for package tracking inquiries',
    active: true,
    steps: [
      { id: 's1', type: 'message', content: 'Hi! Would you like to track a package?' },
      { id: 's2', type: 'input', content: 'Please enter your tracking number' },
      { id: 's3', type: 'action', content: 'Lookup tracking info' },
      { id: 's4', type: 'condition', content: 'Package found?' },
      { id: 's5', type: 'message', content: 'Here is your package status...' }
    ],
    createdAt: '2024-01-15',
    usageCount: 342
  },
  {
    id: 'flow2',
    name: 'New Customer Onboarding',
    description: 'Welcome flow for new customers',
    active: true,
    steps: [
      { id: 's1', type: 'message', content: 'Welcome to Post Aruba!' },
      { id: 's2', type: 'options', content: 'What can we help you with?' },
      { id: 's3', type: 'route', content: 'Route to appropriate department' }
    ],
    createdAt: '2024-02-01',
    usageCount: 156
  },
  {
    id: 'flow3',
    name: 'Complaint Handling',
    description: 'Process for handling customer complaints',
    active: false,
    steps: [
      { id: 's1', type: 'message', content: 'We\'re sorry to hear about your issue.' },
      { id: 's2', type: 'input', content: 'Please describe the problem' },
      { id: 's3', type: 'action', content: 'Create complaint ticket' },
      { id: 's4', type: 'route', content: 'Escalate to supervisor' }
    ],
    createdAt: '2024-02-10',
    usageCount: 89
  }
];

export const statistics = {
  totalTickets: 1247,
  openTickets: 47,
  resolvedToday: 23,
  avgResponseTime: '4.2 min',
  customerSatisfaction: 94,
  ticketsByChannel: [
    { channel: 'Email', count: 523, percentage: 42 },
    { channel: 'WhatsApp', count: 387, percentage: 31 },
    { channel: 'Facebook', count: 212, percentage: 17 },
    { channel: 'Live Chat', count: 125, percentage: 10 }
  ],
  weeklyTrend: [
    { day: 'Mon', tickets: 45 },
    { day: 'Tue', tickets: 52 },
    { day: 'Wed', tickets: 38 },
    { day: 'Thu', tickets: 61 },
    { day: 'Fri', tickets: 48 },
    { day: 'Sat', tickets: 22 },
    { day: 'Sun', tickets: 15 }
  ]
};
