import React, { useState, useEffect } from 'react';
import { 
  Plus, GitBranch, Play, Edit2, Trash2, 
  MessageSquare, Settings2, ArrowRight, GitMerge,
  ChevronRight, MoreVertical, Copy, Zap, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { getChatFlows, createChatFlow, toggleChatFlow, deleteChatFlow } from '../../services/api';

const stepIcons = {
  message: MessageSquare,
  input: Settings2,
  action: Zap,
  condition: GitMerge,
  options: ArrowRight,
  route: GitBranch
};

const stepColors = {
  message: 'bg-blue-100 text-blue-700 border-blue-200',
  input: 'bg-purple-100 text-purple-700 border-purple-200',
  action: 'bg-orange-100 text-orange-700 border-orange-200',
  condition: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  options: 'bg-green-100 text-green-700 border-green-200',
  route: 'bg-pink-100 text-pink-700 border-pink-200'
};

const FlowsView = () => {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFlow, setNewFlow] = useState({
    name: '',
    description: '',
    active: true
  });

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const data = await getChatFlows();
      setFlows(data);
      if (data.length > 0 && !selectedFlow) {
        setSelectedFlow(data[0]);
      }
    } catch (error) {
      console.error('Failed to load flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await toggleChatFlow(id);
      await loadFlows();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleAddFlow = async () => {
    if (!newFlow.name) return;
    
    setCreating(true);
    try {
      const flow = await createChatFlow({
        name: newFlow.name,
        description: newFlow.description,
        active: newFlow.active,
        steps: [
          { id: 's1', type: 'message', content: 'Welcome! How can I help you today?' }
        ]
      });
      
      await loadFlows();
      setSelectedFlow(flow);
      setNewFlow({ name: '', description: '', active: true });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFlow = async (id) => {
    if (!window.confirm('Delete this flow?')) return;
    try {
      await deleteChatFlow(id);
      if (selectedFlow?.id === id) {
        setSelectedFlow(null);
      }
      await loadFlows();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#393d8a]" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 flex">
      {/* Flow List Panel */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Chat Flows</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1 bg-[#eeb224] hover:bg-[#eeb224]/90">
                  <Plus className="w-4 h-4" />
                  New Flow
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Flow</DialogTitle>
                  <DialogDescription>
                    Design an automated conversation flow for your customers.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="flow-name">Flow Name</Label>
                    <Input
                      id="flow-name"
                      placeholder="e.g., Order Support Flow"
                      value={newFlow.name}
                      onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this flow does..."
                      value={newFlow.description}
                      onChange={(e) => setNewFlow({ ...newFlow, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="flow-active">Activate immediately</Label>
                    <Switch
                      id="flow-active"
                      checked={newFlow.active}
                      onCheckedChange={(checked) => setNewFlow({ ...newFlow, active: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddFlow} 
                    className="bg-[#393d8a] hover:bg-[#393d8a]/90"
                    disabled={creating}
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Create Flow
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-gray-500">Design automated conversation paths</p>
        </div>

        {/* Flow Items */}
        <div className="flex-1 overflow-y-auto">
          {flows.map((flow) => (
            <div
              key={flow.id}
              onClick={() => setSelectedFlow(flow)}
              className={cn(
                "p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50",
                selectedFlow?.id === flow.id && "bg-[#393d8a]/5 border-l-4 border-l-[#393d8a]"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    flow.active ? "bg-[#393d8a]/10" : "bg-gray-100"
                  )}>
                    <GitBranch className={cn(
                      "w-4 h-4",
                      flow.active ? "text-[#393d8a]" : "text-gray-400"
                    )} />
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-medium",
                      flow.active ? "text-gray-900" : "text-gray-500"
                    )}>
                      {flow.name}
                    </h3>
                    <p className="text-xs text-gray-500">{(flow.steps || []).length} steps</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Flow
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFlow(flow.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{flow.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Used {flow.usage_count || 0} times</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  flow.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  {flow.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
          
          {flows.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No flows yet. Create your first one!
            </div>
          )}
        </div>
      </div>

      {/* Flow Designer Panel */}
      <div className="flex-1 p-6">
        {selectedFlow ? (
          <div>
            {/* Flow Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedFlow.name}</h2>
                  <p className="text-gray-500 mt-1">{selectedFlow.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <Switch
                      checked={selectedFlow.active}
                      onCheckedChange={() => handleToggleActive(selectedFlow.id)}
                    />
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Play className="w-4 h-4" />
                    Test Flow
                  </Button>
                  <Button className="gap-2 bg-[#393d8a] hover:bg-[#393d8a]/90">
                    <Edit2 className="w-4 h-4" />
                    Edit Flow
                  </Button>
                </div>
              </div>
            </div>

            {/* Flow Steps Visualization */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-6">Flow Steps</h3>
              <div className="space-y-4">
                {(selectedFlow.steps || []).map((step, index) => {
                  const StepIcon = stepIcons[step.type] || MessageSquare;
                  return (
                    <div key={step.id} className="flex items-center gap-4">
                      {/* Step Number */}
                      <div className="w-8 h-8 bg-[#393d8a] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      
                      {/* Step Card */}
                      <div className={cn(
                        "flex-1 p-4 rounded-xl border flex items-center gap-4",
                        stepColors[step.type]
                      )}>
                        <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                          <StepIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                            {step.type}
                          </span>
                          <p className="font-medium">{step.content}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Arrow to next */}
                      {index < (selectedFlow.steps || []).length - 1 && (
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  );
                })}

                {/* Add Step Button */}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed border-2 gap-2 py-6 mt-4"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Select a flow to edit</h3>
              <p className="text-gray-500">Choose a flow from the list or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowsView;
