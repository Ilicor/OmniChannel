import React from 'react';
import { Mail, MessageCircle, MessageSquare, Facebook, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScrollArea } from '../ui/scroll-area';

const channelIcons = {
  email: Mail,
  whatsapp: MessageCircle,
  facebook: Facebook,
  chat: MessageSquare
};

const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

const statusColors = {
  open: 'text-green-600 bg-green-50',
  pending: 'text-yellow-600 bg-yellow-50',
  resolved: 'text-gray-500 bg-gray-100'
};

const ConversationList = ({ 
  conversations, 
  selectedConversation, 
  setSelectedConversation,
  agents 
}) => {
  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : 'Unassigned';
  };

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <span className="px-2.5 py-1 bg-[#FF8800]/10 text-[#FF8800] rounded-full text-sm font-medium">
            {conversations.length} active
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5C0F8B]/20 focus:border-[#5C0F8B] transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-gray-100">
          {conversations.map((conv) => {
            const ChannelIcon = channelIcons[conv.channel] || Mail;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={cn(
                  "w-full p-4 text-left transition-all duration-200 hover:bg-gray-50",
                  selectedConversation?.id === conv.id && "bg-[#5C0F8B]/5 border-l-4 border-[#5C0F8B]"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                      conv.unread ? "bg-[#5C0F8B]" : "bg-gray-400"
                    )}>
                      {conv.customer.avatar}
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm"
                    )}>
                      <ChannelIcon className="w-3 h-3 text-gray-600" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "font-medium text-gray-900 truncate",
                        conv.unread && "font-semibold"
                      )}>
                        {conv.customer.name}
                      </span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{conv.timestamp}</span>
                      </div>
                    </div>
                    
                    <p className={cn(
                      "text-sm text-gray-600 truncate mb-2",
                      conv.unread && "text-gray-900 font-medium"
                    )}>
                      {conv.lastMessage}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                          statusColors[conv.status]
                        )}>
                          {conv.status}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className={cn("w-2 h-2 rounded-full", priorityColors[conv.priority])} />
                          <span className="text-xs text-gray-500 capitalize">{conv.priority}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 truncate max-w-[100px]">
                        {getAgentName(conv.assignedTo)}
                      </span>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {conv.unread && (
                    <div className="w-2.5 h-2.5 bg-[#FF8800] rounded-full mt-2 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
