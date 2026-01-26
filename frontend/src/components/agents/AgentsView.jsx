import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Filter, Users, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../ui/dialog';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { getUsers, createUser, updateUserStatus, deleteUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400'
};

const AgentsView = () => {
  const { user: currentUser } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', email: '', password: '', role: 'agent' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await getUsers();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddAgent = async () => {
    if (!newAgent.name || !newAgent.email || !newAgent.password) return;
    
    setCreating(true);
    try {
      await createUser(newAgent);
      await loadAgents();
      setNewAgent({ name: '', email: '', password: '', role: 'agent' });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert(error.response?.data?.detail || 'Failed to create agent');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (agentId, newStatus) => {
    try {
      await updateUserStatus(agentId, newStatus);
      await loadAgents();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to remove this agent?')) return;
    
    try {
      await deleteUser(agentId);
      await loadAgents();
    } catch (error) {
      console.error('Failed to delete agent:', error);
      alert(error.response?.data?.detail || 'Failed to delete agent');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#393d8a]" />
      </div>
    );
  }

  const onlineCount = agents.filter(a => a.status === 'online').length;
  const awayCount = agents.filter(a => a.status === 'away').length;
  const totalTickets = agents.reduce((sum, a) => sum + (a.assigned_tickets || 0), 0);

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
            <p className="text-gray-500 mt-1">Manage your support team members</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#eeb224] hover:bg-[#eeb224]/90 text-white">
                <Plus className="w-4 h-4" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Agent</DialogTitle>
                <DialogDescription>
                  Add a new team member to your support team.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter agent name"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="agent@postaruba.com"
                    value={newAgent.email}
                    onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={newAgent.password}
                    onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newAgent.role}
                    onValueChange={(value) => setNewAgent({ ...newAgent, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddAgent} 
                  className="bg-[#393d8a] hover:bg-[#393d8a]/90"
                  disabled={creating}
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Agent
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#393d8a]/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-[#393d8a]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Online Now</p>
                <p className="text-2xl font-bold text-[#30a34b]">{onlineCount}</p>
              </div>
              <div className="w-12 h-12 bg-[#30a34b]/10 rounded-xl flex items-center justify-center">
                <div className="w-3 h-3 bg-[#30a34b] rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Away</p>
                <p className="text-2xl font-bold text-[#eeb224]">{awayCount}</p>
              </div>
              <div className="w-12 h-12 bg-[#eeb224]/10 rounded-xl flex items-center justify-center">
                <div className="w-3 h-3 bg-[#eeb224] rounded-full" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tickets</p>
                <p className="text-2xl font-bold text-[#393d8a]">{totalTickets}</p>
              </div>
              <div className="w-12 h-12 bg-[#393d8a]/10 rounded-xl flex items-center justify-center">
                <Filter className="w-6 h-6 text-[#393d8a]" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="away">Away</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-[#393d8a] rounded-full flex items-center justify-center text-white font-semibold">
                      {agent.avatar || agent.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white",
                      statusColors[agent.status]
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{agent.role}</p>
                  </div>
                </div>
                {agent.id !== currentUser?.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(agent.id, 'online')}>
                        Set Online
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(agent.id, 'away')}>
                        Set Away
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(agent.id, 'offline')}>
                        Set Offline
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteAgent(agent.id)}
                      >
                        Remove Agent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="text-sm text-gray-500 mb-4">{agent.email}</div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Assigned Tickets</p>
                  <p className="text-lg font-bold text-[#393d8a]">{agent.assigned_tickets || 0}</p>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium capitalize",
                  agent.status === 'online' ? 'bg-green-100 text-green-700' :
                  agent.status === 'away' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {agent.status}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No agents found</h3>
            <p className="text-gray-500">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsView;
