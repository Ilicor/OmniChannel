import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import LoginPage from "./pages/LoginPage";

// Layout Components
import Sidebar from "./components/layout/Sidebar";

// Inbox Components
import ConversationList from "./components/inbox/ConversationList";
import ConversationView from "./components/inbox/ConversationView";
import CustomerPanel from "./components/inbox/CustomerPanel";

// Other Views
import AgentsView from "./components/agents/AgentsView";
import AutomationBuilder from "./components/automation/AutomationBuilder";
import FlowsView from "./components/flows/FlowsView";
import AnalyticsView from "./components/analytics/AnalyticsView";
import SettingsView from "./components/settings/SettingsView";

// API
import { getConversations, getUsers } from "./services/api";
import { Loader2 } from "lucide-react";

const channels = [
  { id: 'all', name: 'All Channels', icon: 'Inbox', count: 0 },
  { id: 'email', name: 'Email', icon: 'Mail', count: 0 },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'MessageCircle', count: 0 },
  { id: 'facebook', name: 'Facebook', icon: 'Facebook', count: 0 },
  { id: 'chat', name: 'Live Chat', icon: 'MessageSquare', count: 0 }
];

function AppContent() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [activeView, setActiveView] = useState('inbox');
  const [activeChannel, setActiveChannel] = useState('all');
  const [conversations, setConversations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channelCounts, setChannelCounts] = useState(channels);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [convData, usersData] = await Promise.all([
        getConversations(activeChannel),
        getUsers()
      ]);
      
      setConversations(convData);
      setAgents(usersData);
      
      // Update channel counts
      if (activeChannel === 'all') {
        const counts = channels.map(ch => ({
          ...ch,
          count: ch.id === 'all' 
            ? convData.length 
            : convData.filter(c => c.channel === ch.id).length
        }));
        setChannelCounts(counts);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeChannel]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#393d8a]" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Render current view
  const renderView = () => {
    switch (activeView) {
      case 'inbox':
        return (
          <div className="flex flex-1 h-screen overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              setSelectedConversation={setSelectedConversation}
              agents={agents}
              loading={loading}
            />
            <ConversationView
              conversation={selectedConversation}
              agents={agents}
              onUpdate={loadData}
            />
            <CustomerPanel conversation={selectedConversation} />
          </div>
        );
      
      case 'agents':
        return <AgentsView />;
      
      case 'automation':
        return <AutomationBuilder />;
      
      case 'flows':
        return <FlowsView />;
      
      case 'analytics':
        return <AnalyticsView />;
      
      case 'settings':
        return <SettingsView />;
      
      default:
        return null;
    }
  };

  return (
    <div className="App flex bg-gray-50">
      <Sidebar
        channels={channelCounts}
        activeChannel={activeChannel}
        setActiveChannel={setActiveChannel}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <main className="ml-64 flex-1 flex">
        {renderView()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
