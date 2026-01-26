import React, { useState, useEffect } from 'react';
import { 
  Send, Paperclip, Smile, MoreVertical, Phone, Video,
  User, Clock, Tag, ChevronDown, Star, Archive,
  MessageCircle, Facebook, MessageSquare, Mail
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
import { useAuth } from '../../context/AuthContext';
import { sendMessage, assignConversation, updateConversationStatus } from '../../services/api';

const channelIcons = {
  email: Mail,
  whatsapp: MessageCircle,
  facebook: Facebook,
  chat: MessageSquare
};

const ConversationView = ({ conversation, agents, onUpdate }) => {
  const { user, isAdmin } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages || []);
    }
  }, [conversation]);

  const ChannelIcon = channelIcons[conversation?.channel] || Mail;
  const assignedAgent = agents.find(a => a.id === (conversation?.assigned_to || conversation?.assignedTo));

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;
    
    setSending(true);
    try {
      const message = await sendMessage(conversation.id, newMessage);
      setMessages([...messages, message]);
      setNewMessage('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAssignAgent = async (agentId) => {
    if (!conversation) return;
    try {
      await assignConversation(conversation.id, agentId);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to assign:', error);
      alert(error.response?.data?.detail || 'Failed to assign agent');
    }
  };

  const handleStatusChange = async (status) => {
    if (!conversation) return;
    try {
      await updateConversationStatus(conversation.id, status);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Check if current user can reply
  const canReply = () => {
    if (isAdmin()) return true;
    return conversation?.assigned_to === user?.id || conversation?.assignedTo === user?.id;
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
              <div className="w-12 h-12 bg-[#393d8a] rounded-full flex items-center justify-center text-white font-semibold">
                {conversation.customer?.avatar || conversation.customer?.name?.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <ChannelIcon className="w-3.5 h-3.5 text-gray-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{conversation.customer?.name}</h3>
              <p className="text-sm text-gray-500">{conversation.customer?.email}</p>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange('resolved')}>Mark as resolved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('pending')}>Mark as pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('open')}>Reopen</DropdownMenuItem>
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
            {isAdmin() && (
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
                      onClick={() => handleAssignAgent(agent.id)}
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
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={cn(
                "flex",
                msg.sender === 'agent' ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                "max-w-md px-4 py-3 rounded-2xl",
                msg.sender === 'agent'
                  ? 'bg-[#393d8a] text-white rounded-br-md'
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
      {canReply() ? (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-end gap-3 max-w-3xl mx-auto">
            <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#393d8a]/20 focus-within:border-[#393d8a] transition-all">
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
              disabled={sending || !newMessage.trim()}
              className="h-12 w-12 rounded-full bg-[#eeb224] hover:bg-[#eeb224]/90 shadow-lg shadow-[#eeb224]/30"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-200 bg-yellow-50 text-center">
          <p className="text-yellow-700 text-sm">
            This conversation is not assigned to you. Contact an admin to be assigned.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConversationView;
