import React, { useState } from 'react';
import { Search, Plus, MoreVertical, Filter, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
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

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400'
};

const AgentsView = ({ agents: initialAgents }) => {
  const [agents, setAgents] = useState(initialAgents);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', email: '', role: 'Agent' });

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddAgent = () => {
    if (!newAgent.name || !newAgent.email) return;
    
    const agent = {
      id: `agent${agents.length + 1}`,
      ...newAgent,
      avatar: newAgent.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      status: 'offline',
      assignedTickets: 0
    };
    
    setAgents([...agents, agent]);
    setNewAgent({ name: '', email: '', role: 'Agent' });
    setIsAddDialogOpen(false);
  };

  const handleStatusChange = (agentId, newStatus) => {
    setAgents(agents.map(a => 
      a.id === agentId ? { ...a, status: newStatus } : a
    ));
  };

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
              <Button className="gap-2 bg-[#FF8800] hover:bg-[#FF8800]/90">
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
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newAgent.role}
                    onValueChange={(value) => setNewAgent({ ...newAgent, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agent">Agent</SelectItem>
                      <SelectItem value="Senior Agent">Senior Agent</SelectItem>
                      <SelectItem value="Team Lead">Team Lead</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAgent} className="bg-[#5C0F8B] hover:bg-[#5C0F8B]/90">
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
              <div className="w-12 h-12 bg-[#5C0F8B]/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-[#5C0F8B]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Online Now</p>
                <p className="text-2xl font-bold text-green-600">
                  {agents.filter(a => a.status === 'online').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Away</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {agents.filter(a => a.status === 'away').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tickets</p>
                <p className="text-2xl font-bold text-[#FF8800]">
                  {agents.reduce((sum, a) => sum + a.assignedTickets, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#FF8800]/10 rounded-xl flex items-center justify-center">
                <Filter className="w-6 h-6 text-[#FF8800]" />
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
                    <div className="w-12 h-12 bg-[#0F3252] rounded-full flex items-center justify-center text-white font-semibold">
                      {agent.avatar}
                    </div>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white",
                      statusColors[agent.status]
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-500">{agent.role}</p>
                  </div>
                </div>
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
                    <DropdownMenuItem className="text-red-600">Remove Agent</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="text-sm text-gray-500 mb-4">{agent.email}</div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Assigned Tickets</p>
                  <p className="text-lg font-bold text-[#5C0F8B]">{agent.assignedTickets}</p>
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
      </div>
    </div>
  );
};

export default AgentsView;
