import React from 'react';
import { Mail, Phone, MapPin, Clock, Calendar, Tag, MessageSquare, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

const CustomerPanel = ({ conversation }) => {
  if (!conversation) return null;

  const customer = conversation.customer || {};

  const customerHistory = [
    { id: 1, type: 'ticket', subject: 'Previous shipping inquiry', date: 'Jan 15, 2024', status: 'resolved' },
    { id: 2, type: 'ticket', subject: 'Rate request', date: 'Dec 3, 2023', status: 'resolved' },
    { id: 3, type: 'call', subject: 'Phone support call', date: 'Nov 20, 2023', status: 'completed' }
  ];

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Customer Info Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-[#393d8a] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                {customer.avatar || customer.name?.charAt(0) || '?'}
              </div>
              <h3 className="font-semibold text-gray-900">{customer.name || 'Unknown'}</h3>
              <p className="text-sm text-gray-500">Customer since Jan 2023</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{customer.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{customer.phone || '+297 555-0123'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{customer.location || 'Oranjestad, Aruba'}</span>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4 gap-2">
              <ExternalLink className="w-4 h-4" />
              View Full Profile
            </Button>
          </div>

          {/* Customer Tags */}
          <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#393d8a]" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-[#393d8a]/10 text-[#393d8a] rounded-full text-xs font-medium">
                VIP Customer
              </span>
              <span className="px-2.5 py-1 bg-[#eeb224]/10 text-[#eeb224] rounded-full text-xs font-medium">
                Business Account
              </span>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                International
              </span>
            </div>
          </div>

          {/* Customer Stats */}
          <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#393d8a]" />
              Interaction Stats
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#393d8a]">12</p>
                <p className="text-xs text-gray-500">Total Tickets</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#eeb224]">4.8</p>
                <p className="text-xs text-gray-500">Avg Rating</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#30a34b]">2h</p>
                <p className="text-xs text-gray-500">Avg Response</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-700">98%</p>
                <p className="text-xs text-gray-500">Resolved</p>
              </div>
            </div>
          </div>

          {/* Previous Interactions */}
          <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#393d8a]" />
              Recent History
            </h4>
            <div className="space-y-3">
              {customerHistory.map((item) => (
                <div 
                  key={item.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">{item.subject}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      item.status === 'resolved' || item.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    )}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default CustomerPanel;
