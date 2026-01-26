import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Clock, ThumbsUp,
  Mail, MessageCircle, Facebook, MessageSquare,
  ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAnalytics } from '../../services/api';

const channelIcons = {
  Email: Mail,
  WhatsApp: MessageCircle,
  Facebook: Facebook,
  'Live Chat': MessageSquare
};

const channelColors = {
  Email: 'bg-blue-500',
  WhatsApp: 'bg-green-500',
  Facebook: 'bg-indigo-500',
  'Live Chat': 'bg-orange-500'
};

const AnalyticsView = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getAnalytics();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#393d8a]" />
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Failed to load analytics</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tickets',
      value: statistics.total_tickets?.toLocaleString() || '0',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'bg-[#393d8a]'
    },
    {
      title: 'Open Tickets',
      value: statistics.open_tickets || 0,
      change: '-5%',
      trend: 'down',
      icon: Mail,
      color: 'bg-[#eeb224]'
    },
    {
      title: 'Resolved Today',
      value: statistics.resolved_today || 0,
      change: '+8%',
      trend: 'up',
      icon: ThumbsUp,
      color: 'bg-[#30a34b]'
    },
    {
      title: 'Avg Response Time',
      value: statistics.avg_response_time || '0 min',
      change: '-15%',
      trend: 'down',
      icon: Clock,
      color: 'bg-[#393d8a]'
    }
  ];

  const maxTickets = Math.max(...(statistics.weekly_trend || []).map(d => d.tickets), 1);

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor your support team's performance</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    stat.color
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
                    stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.title}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Weekly Trend Chart */}
          <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-6">Weekly Ticket Trend</h3>
            <div className="flex items-end justify-between h-48 gap-4">
              {(statistics.weekly_trend || []).map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-[#393d8a] to-[#30a34b] rounded-t-lg transition-all duration-500 hover:opacity-80"
                    style={{ height: `${(day.tickets / maxTickets) * 100}%`, minHeight: '8px' }}
                  />
                  <span className="text-xs text-gray-500 font-medium">{day.day}</span>
                  <span className="text-xs font-semibold text-gray-700">{day.tickets}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-6">Tickets by Channel</h3>
            <div className="space-y-4">
              {(statistics.tickets_by_channel || []).map((channel, index) => {
                const Icon = channelIcons[channel.channel] || Mail;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          channelColors[channel.channel]
                        )}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{channel.channel}</span>
                      </div>
                      <span className="text-sm text-gray-500">{channel.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", channelColors[channel.channel])}
                        style={{ width: `${channel.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Customer Satisfaction Score</h3>
              <p className="text-gray-500 text-sm">Based on post-interaction surveys</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-5xl font-bold text-[#393d8a]">{statistics.customer_satisfaction || 0}%</p>
                <p className="text-sm text-gray-500 mt-1">CSAT Score</p>
              </div>
              <div className="w-32 h-32 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(statistics.customer_satisfaction || 0) * 3.52} 352`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#393d8a" />
                      <stop offset="100%" stopColor="#30a34b" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ThumbsUp className="w-8 h-8 text-[#393d8a]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
