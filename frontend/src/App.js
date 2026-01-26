import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layout Components
import Sidebar from "./components/layout/Sidebar";

// Inbox Components
import ConversationList from "./components/inbox/ConversationList";
import ConversationView from "./components/inbox/ConversationView";
import CustomerPanel from "./components/inbox/CustomerPanel";

// Other Views
import AgentsView from "./components/agents/AgentsView";
import AutomationView from "./components/automation/AutomationView";
import FlowsView from "./components/flows/FlowsView";
import AnalyticsView from "./components/analytics/AnalyticsView";
import SettingsView from "./components/settings/SettingsView";

// Mock Data
import { 
  channels, 
  conversations as mockConversations, 
  agents as mockAgents,
  autoResponses,
  chatFlows,
  statistics
} from "./data/mockData";

function App() {
  const [activeView, setActiveView] = useState('inbox');
  const [activeChannel, setActiveChannel] = useState('all');
  const [conversations, setConversations] = useState(mockConversations);
  const [agents, setAgents] = useState(mockAgents);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Filter conversations by channel
  const filteredConversations = activeChannel === 'all' 
    ? conversations 
    : conversations.filter(conv => conv.channel === activeChannel);

  // Handle agent assignment
  const handleAssignAgent = (conversationId, agentId) => {
    setConversations(conversations.map(conv => 
      conv.id === conversationId ? { ...conv, assignedTo: agentId } : conv
    ));
    
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation({ ...selectedConversation, assignedTo: agentId });
    }
  };

  // Render current view
  const renderView = () => {
    switch (activeView) {
      case 'inbox':
        return (
          <div className="flex flex-1 h-screen overflow-hidden">
            <ConversationList
              conversations={filteredConversations}
              selectedConversation={selectedConversation}
              setSelectedConversation={setSelectedConversation}
              agents={agents}
            />
            <ConversationView
              conversation={selectedConversation}
              agents={agents}
              onAssignAgent={handleAssignAgent}
            />
            <CustomerPanel conversation={selectedConversation} />
          </div>
        );
      
      case 'agents':
        return <AgentsView agents={agents} />;
      
      case 'automation':
        return <AutomationView autoResponses={autoResponses} />;
      
      case 'flows':
        return <FlowsView chatFlows={chatFlows} />;
      
      case 'analytics':
        return <AnalyticsView statistics={statistics} />;
      
      case 'settings':
        return <SettingsView />;
      
      default:
        return null;
    }
  };

  return (
    <div className="App flex bg-gray-50">
      <Sidebar
        channels={channels}
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

export default App;
