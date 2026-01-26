import React, { useState } from 'react';
import { Plus, Zap, Clock, MessageSquare, Search, ToggleLeft, ToggleRight, Edit2, Trash2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const triggerTypes = {
  first_contact: { label: 'First Contact', icon: MessageSquare, color: 'bg-blue-100 text-blue-700' },
  outside_hours: { label: 'Outside Hours', icon: Clock, color: 'bg-purple-100 text-purple-700' },
  keyword: { label: 'Keyword Match', icon: Search, color: 'bg-orange-100 text-orange-700' }
};

const AutomationView = ({ autoResponses: initialResponses }) => {
  const [responses, setResponses] = useState(initialResponses);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState(null);
  const [newResponse, setNewResponse] = useState({
    name: '',
    trigger: 'first_contact',
    keywords: '',
    message: '',
    active: true
  });

  const handleToggleActive = (id) => {
    setResponses(responses.map(r => 
      r.id === id ? { ...r, active: !r.active } : r
    ));
  };

  const handleAddResponse = () => {
    if (!newResponse.name || !newResponse.message) return;
    
    let trigger = newResponse.trigger;
    if (trigger === 'keyword' && newResponse.keywords) {
      trigger = `keyword:${newResponse.keywords}`;
    }
    
    const response = {
      id: `ar${responses.length + 1}`,
      name: newResponse.name,
      trigger,
      message: newResponse.message,
      active: newResponse.active
    };
    
    setResponses([...responses, response]);
    setNewResponse({ name: '', trigger: 'first_contact', keywords: '', message: '', active: true });
    setIsAddDialogOpen(false);
  };

  const handleDeleteResponse = (id) => {
    setResponses(responses.filter(r => r.id !== id));
  };

  const getTriggerInfo = (trigger) => {
    if (trigger.startsWith('keyword:')) {
      return { ...triggerTypes.keyword, keywords: trigger.replace('keyword:', '') };
    }
    return triggerTypes[trigger] || triggerTypes.first_contact;
  };

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Automation</h1>
            <p className="text-gray-500 mt-1">Set up automatic responses for common inquiries</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#FF8800] hover:bg-[#FF8800]/90">
                <Plus className="w-4 h-4" />
                Add Response
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Auto Response</DialogTitle>
                <DialogDescription>
                  Set up an automatic response for specific triggers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="response-name">Response Name</Label>
                  <Input
                    id="response-name"
                    placeholder="e.g., Welcome Message"
                    value={newResponse.name}
                    onChange={(e) => setNewResponse({ ...newResponse, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trigger">Trigger Type</Label>
                  <Select
                    value={newResponse.trigger}
                    onValueChange={(value) => setNewResponse({ ...newResponse, trigger: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_contact">First Contact</SelectItem>
                      <SelectItem value="outside_hours">Outside Business Hours</SelectItem>
                      <SelectItem value="keyword">Keyword Match</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newResponse.trigger === 'keyword' && (
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (comma separated)</Label>
                    <Input
                      id="keywords"
                      placeholder="e.g., track, tracking, where is"
                      value={newResponse.keywords}
                      onChange={(e) => setNewResponse({ ...newResponse, keywords: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="message">Response Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter the automatic response message..."
                    value={newResponse.message}
                    onChange={(e) => setNewResponse({ ...newResponse, message: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Active by default</Label>
                  <Switch
                    id="active"
                    checked={newResponse.active}
                    onCheckedChange={(checked) => setNewResponse({ ...newResponse, active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddResponse} className="bg-[#5C0F8B] hover:bg-[#5C0F8B]/90">
                  Create Response
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-[#5C0F8B] to-[#0F3252] rounded-xl p-6 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Automate Your Customer Support</h3>
              <p className="text-white/80 text-sm">
                Set up automatic responses to handle common inquiries instantly. 
                Reduce response time and improve customer satisfaction.
              </p>
            </div>
          </div>
        </div>

        {/* Auto Responses List */}
        <div className="space-y-4">
          {responses.map((response) => {
            const triggerInfo = getTriggerInfo(response.trigger);
            const TriggerIcon = triggerInfo.icon;
            
            return (
              <div
                key={response.id}
                className={cn(
                  "bg-white rounded-xl p-5 shadow-sm border transition-all duration-200",
                  response.active ? "border-gray-100" : "border-gray-200 opacity-60"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      triggerInfo.color
                    )}>
                      <TriggerIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{response.name}</h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          triggerInfo.color
                        )}>
                          {triggerInfo.label}
                        </span>
                        {triggerInfo.keywords && (
                          <span className="text-xs text-gray-500">
                            Keywords: {triggerInfo.keywords}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-2 bg-gray-50 p-3 rounded-lg">
                        "{response.message}"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteResponse(response.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Switch
                      checked={response.active}
                      onCheckedChange={() => handleToggleActive(response.id)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {responses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No auto responses yet</h3>
            <p className="text-gray-500">Create your first automatic response to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationView;
