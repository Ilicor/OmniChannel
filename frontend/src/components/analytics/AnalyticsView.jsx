import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, Users, Clock, ThumbsUp,
  Mail, MessageCircle, Facebook, MessageSquare,
  ArrowUpRight, ArrowDownRight, Loader2, Calendar,
  AlertTriangle, CheckCircle, BarChart3, Star
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { getAnalytics, getAgentActivity, getSatisfactionTrends } from '../../services/api';

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
  const [agentActivity, setAgentActivity] = useState(null);
  const [satisfactionData, setSatisfactionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [satisfactionLoading, setSatisfactionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [satisfactionPeriod, setSatisfactionPeriod] = useState('30d');
  
  // Date range for agent activity
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

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

  const loadAgentActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const data = await getAgentActivity(startDate, endDate);
      setAgentActivity(data);
    } catch (error) {
      console.error('Failed to load agent activity:', error);
    } finally {
      setActivityLoading(false);
    }
  }, [startDate, endDate]);

  const loadSatisfactionTrends = useCallback(async () => {
    setSatisfactionLoading(true);
    try {
      const data = await getSatisfactionTrends(satisfactionPeriod);
      setSatisfactionData(data);
    } catch (error) {
      console.error('Failed to load satisfaction trends:', error);
    } finally {
      setSatisfactionLoading(false);
    }
  }, [satisfactionPeriod]);

  useEffect(() => {
    if (activeTab === 'agents') {
      loadAgentActivity();
    } else if (activeTab === 'satisfaction') {
      loadSatisfactionTrends();
    }
  }, [activeTab, loadAgentActivity, loadSatisfactionTrends]);

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
      title: 'Escalated',
      value: statistics.escalated_tickets || 0,
      change: statistics.escalated_tickets > 0 ? 'Needs attention' : 'All good',
      trend: statistics.escalated_tickets > 0 ? 'up' : 'down',
      icon: AlertTriangle,
      color: statistics.escalated_tickets > 0 ? 'bg-red-500' : 'bg-gray-400'
    },
    {
      title: 'Resolved Today',
      value: statistics.resolved_today || 0,
      change: '+8%',
      trend: 'up',
      icon: CheckCircle,
      color: 'bg-[#30a34b]'
    }
  ];

  const maxTickets = Math.max(...(statistics.weekly_trend || []).map(d => d.tickets), 1);

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500 mt-1">Monitor your support team's performance</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === 'overview' 
                  ? "bg-[#393d8a] text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === 'agents' 
                  ? "bg-[#393d8a] text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              Agent Activity
            </button>
            <button
              onClick={() => setActiveTab('satisfaction')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === 'satisfaction' 
                  ? "bg-[#393d8a] text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              Satisfaction Trends
            </button>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <>
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
          </>
        ) : (
          /* Agent Activity Tab */
          <div className="space-y-6">
            {/* Date Range Selector */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label className="text-sm text-gray-600">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-sm text-gray-600">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={loadAgentActivity}
                  className="bg-[#393d8a] hover:bg-[#393d8a]/90"
                  disabled={activityLoading}
                >
                  {activityLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Apply
                    </>
                  )}
                </Button>
                
                {/* Quick Date Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setStartDate(today.toISOString().split('T')[0]);
                      setEndDate(today.toISOString().split('T')[0]);
                    }}
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today);
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      setStartDate(weekAgo.toISOString().split('T')[0]);
                      setEndDate(today.toISOString().split('T')[0]);
                    }}
                  >
                    Last 7 Days
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today);
                      monthAgo.setDate(monthAgo.getDate() - 30);
                      setStartDate(monthAgo.toISOString().split('T')[0]);
                      setEndDate(today.toISOString().split('T')[0]);
                    }}
                  >
                    Last 30 Days
                  </Button>
                </div>
              </div>
            </div>

            {activityLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#393d8a]" />
              </div>
            ) : agentActivity ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#393d8a] rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-600 font-medium">Total Interactions</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{agentActivity.summary?.total_interactions || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#30a34b] rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-600 font-medium">Resolved</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{agentActivity.summary?.total_resolved || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#eeb224] rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-600 font-medium">Open</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{agentActivity.summary?.total_open || 0}</p>
                  </div>
                </div>

                {/* Agent Activity Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#393d8a]" />
                      Agent Performance
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {agentActivity.date_range?.start} to {agentActivity.date_range?.end}
                    </p>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Messages Sent</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolved</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Open</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(agentActivity.agent_stats || []).map((agent, index) => (
                        <tr key={agent.agent_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold",
                                index === 0 ? "bg-[#393d8a]" : "bg-gray-400"
                              )}>
                                {agent.avatar}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{agent.agent_name}</p>
                                <p className="text-sm text-gray-500">{agent.agent_email}</p>
                              </div>
                              {agent.role === 'admin' && (
                                <span className="px-2 py-0.5 bg-[#eeb224]/10 text-[#eeb224] text-xs font-medium rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              agent.status === 'online' ? 'bg-green-100 text-green-700' :
                              agent.status === 'away' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            )}>
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full mr-1.5",
                                agent.status === 'online' ? 'bg-green-500' :
                                agent.status === 'away' ? 'bg-yellow-500' :
                                'bg-gray-400'
                              )} />
                              {agent.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-lg font-semibold text-[#393d8a]">{agent.total_messages}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-gray-900">{agent.assigned_tickets}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-[#30a34b] font-medium">{agent.resolved_tickets}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={cn(
                              "font-medium",
                              agent.open_tickets > 5 ? "text-red-500" : "text-gray-600"
                            )}>
                              {agent.open_tickets}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {(!agentActivity.agent_stats || agentActivity.agent_stats.length === 0) && (
                    <div className="p-8 text-center text-gray-500">
                      No agent activity data for the selected period
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center text-gray-500">
                Select a date range and click Apply to view agent activity
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsView;
