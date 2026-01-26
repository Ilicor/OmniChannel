import React, { useState } from 'react';
import { 
  Send, Paperclip, Smile, MoreVertical, Phone, Video,
  User, Mail, Clock, Tag, ChevronDown, Star, Archive,
  MessageCircle, Facebook, MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const channelIcons = {
  email: Mail,
  whatsapp: MessageCircle,
  facebook: Facebook,
  chat: MessageSquare
};

const ConversationView = ({ conversation, agents, onAssignAgent }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(conversation?.messages || []);

  const ChannelIcon = channelIcons[conversation?.channel] || Mail;
  const assignedAgent = agents.find(a => a.id === conversation?.assignedTo);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: `m${messages.length + 1}`,
      sender: 'agent',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No conversation selected</h3>
          <p className="text-gray-500">Choose a conversation from the list to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-[#5C0F8B] rounded-full flex items-center justify-center text-white font-semibold">
                {conversation.customer.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <ChannelIcon className="w-3.5 h-3.5 text-gray-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{conversation.customer.name}</h3>
              <p className="text-sm text-gray-500">{conversation.customer.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-full">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Star className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Archive className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Mark as resolved</DropdownMenuItem>
                <DropdownMenuItem>Add to spam</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Delete conversation</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Subject and metadata */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{conversation.subject}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {conversation.priority} priority
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {conversation.timestamp}
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  {assignedAgent ? assignedAgent.name : 'Assign Agent'}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {agents.map((agent) => (
                  <DropdownMenuItem 
                    key={agent.id}
                    onClick={() => onAssignAgent(conversation.id, agent.id)}
                    className="gap-2"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      agent.status === 'online' ? 'bg-green-500' : 
                      agent.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    )} />
                    {agent.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.sender === 'agent' ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                "max-w-md px-4 py-3 rounded-2xl",
                msg.sender === 'agent'
                  ? 'bg-[#5C0F8B] text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
              )}>
                <p className="text-sm">{msg.text}</p>
                <p className={cn(
                  "text-xs mt-1",
                  msg.sender === 'agent' ? 'text-white/70' : 'text-gray-500'
                )}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#5C0F8B]/20 focus-within:border-[#5C0F8B] transition-all">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-sm"
            />
            <div className="flex items-center justify-between px-3 pb-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700">
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleSendMessage}
            className="h-12 w-12 rounded-full bg-[#FF8800] hover:bg-[#FF8800]/90 shadow-lg shadow-[#FF8800]/30"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationView;
