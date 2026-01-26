import React, { useState, useEffect } from 'react';
import { 
  Plus, Zap, Trash2, Edit2, Play, Pause, ChevronRight, ChevronDown,
  MessageSquare, Search, Database, UserPlus, Tag, AlertTriangle,
  Clock, Send, ArrowRight, Copy, Loader2, CheckCircle, XCircle,
  FileText, Settings2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Checkbox } from '../ui/checkbox';
import { 
  getAutomations, createAutomation, updateAutomation, deleteAutomation, 
  toggleAutomation, getAutomationTemplates 
} from '../../services/api';

const triggerTypes = [
  { value: 'keyword', label: 'Keyword Match', icon: Search, description: 'Trigger when message contains specific keywords' },
  { value: 'first_message', label: 'First Message', icon: MessageSquare, description: 'Trigger on first customer message' },
  { value: 'all_messages', label: 'All Messages', icon: Send, description: 'Trigger on every incoming message' },
  { value: 'no_agent_assigned', label: 'No Agent Assigned', icon: UserPlus, description: 'Trigger when no agent is handling the conversation' },
  { value: 'outside_hours', label: 'Outside Business Hours', icon: Clock, description: 'Trigger outside of business hours' }
];

const actionTypes = [
  { value: 'send_reply', label: 'Send Reply', icon: Send, description: 'Send an automatic message to the customer' },
  { value: 'lookup_customer', label: 'Lookup Customer', icon: Database, description: 'Search customer database for information' },
  { value: 'lookup_tracking', label: 'Lookup Tracking', icon: Search, description: 'Search for tracking information in message' },
  { value: 'assign_agent', label: 'Assign Agent', icon: UserPlus, description: 'Automatically assign an agent' },
  { value: 'add_tag', label: 'Add Tag', icon: Tag, description: 'Add a tag to the conversation' },
  { value: 'set_priority', label: 'Set Priority', icon: AlertTriangle, description: 'Change conversation priority' },
  { value: 'set_status', label: 'Set Status', icon: Settings2, description: 'Change conversation status' },
  { value: 'send_to_human', label: 'Escalate to Human', icon: UserPlus, description: 'Escalate to human agent attention' }
];

const conditionTypes = [
  { value: 'always', label: 'Always (No Condition)', description: 'Always execute' },
  { value: 'customer_exists', label: 'Customer in Database', description: 'Check if customer exists in system' },
  { value: 'has_tracking', label: 'Has Tracking Numbers', description: 'Check if customer has tracking numbers' },
  { value: 'channel_is', label: 'Channel Is', description: 'Check conversation channel' },
  { value: 'tag_contains', label: 'Tag Contains', description: 'Check if conversation has a tag' }
];

const AutomationBuilder = () => {
  const [automations, setAutomations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Editor state
  const [editorData, setEditorData] = useState({
    name: '',
    description: '',
    active: true,
    trigger: { type: 'keyword', keywords: [], match_type: 'contains', case_sensitive: false },
    conditions: [],
    actions: [],
    channels: ['all'],
    priority: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [automationsData, templatesData] = await Promise.all([
        getAutomations(),
        getAutomationTemplates()
      ]);
      setAutomations(automationsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditorData({
      name: '',
      description: '',
      active: true,
      trigger: { type: 'keyword', keywords: [], match_type: 'contains', case_sensitive: false },
      conditions: [],
      actions: [],
      channels: ['all'],
      priority: 0
    });
    setSelectedAutomation(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (automation) => {
    setEditorData({
      name: automation.name,
      description: automation.description || '',
      active: automation.active,
      trigger: automation.trigger,
      conditions: automation.conditions || [],
      actions: automation.actions || [],
      channels: automation.channels || ['all'],
      priority: automation.priority || 0
    });
    setSelectedAutomation(automation);
    setIsEditorOpen(true);
  };

  const handleUseTemplate = (template) => {
    setEditorData({
      name: template.name,
      description: template.description,
      active: true,
      trigger: template.trigger,
      conditions: template.conditions || [],
      actions: template.actions || [],
      channels: ['all'],
      priority: 0
    });
    setSelectedAutomation(null);
    setIsTemplateOpen(false);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editorData.name) {
      alert('Please enter a name for the automation');
      return;
    }
    if (editorData.actions.length === 0) {
      alert('Please add at least one action');
      return;
    }

    setSaving(true);
    try {
      if (selectedAutomation) {
        await updateAutomation(selectedAutomation.id, editorData);
      } else {
        await createAutomation(editorData);
      }
      await loadData();
      setIsEditorOpen(false);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save automation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this automation?')) return;
    try {
      await deleteAutomation(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleAutomation(id);
      await loadData();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  // Add action to editor
  const addAction = (type) => {
    const newAction = { type };
    
    if (type === 'send_reply') {
      newAction.message_template = '';
    } else if (type === 'assign_agent') {
      newAction.assign_mode = 'round_robin';
      newAction.agent_id = '';
    } else if (type === 'add_tag') {
      newAction.tag = '';
    } else if (type === 'set_priority') {
      newAction.priority = 'medium';
    } else if (type === 'set_status') {
      newAction.status = 'open';
    } else if (type === 'lookup_customer') {
      newAction.lookup_field = 'email';
    }
    
    setEditorData({
      ...editorData,
      actions: [...editorData.actions, newAction]
    });
  };

  const updateAction = (index, updates) => {
    const newActions = [...editorData.actions];
    newActions[index] = { ...newActions[index], ...updates };
    setEditorData({ ...editorData, actions: newActions });
  };

  const removeAction = (index) => {
    setEditorData({
      ...editorData,
      actions: editorData.actions.filter((_, i) => i !== index)
    });
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
      {/* Automation List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Automations</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsTemplateOpen(true)}
              >
                <FileText className="w-4 h-4 mr-1" />
                Templates
              </Button>
              <Button 
                size="sm" 
                className="bg-[#eeb224] hover:bg-[#eeb224]/90"
                onClick={handleCreateNew}
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500">Create rules to automate customer responses</p>
        </div>

        {/* Info Card */}
        <div className="p-4 bg-gradient-to-r from-[#393d8a] to-[#30a34b] m-4 rounded-xl text-white">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Smart Automations</h3>
              <p className="text-sm text-white/80">
                Set up rules like "If customer mentions tracking, lookup their package and reply with status"
              </p>
            </div>
          </div>
        </div>

        {/* Automation List */}
        <div className="flex-1 overflow-y-auto">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className={cn(
                "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all",
                selectedAutomation?.id === automation.id && "bg-[#393d8a]/5 border-l-4 border-l-[#393d8a]"
              )}
              onClick={() => handleEdit(automation)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    automation.active ? "bg-[#30a34b]/10" : "bg-gray-100"
                  )}>
                    <Zap className={cn(
                      "w-4 h-4",
                      automation.active ? "text-[#30a34b]" : "text-gray-400"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{automation.name}</h3>
                    <p className="text-xs text-gray-500">
                      {automation.trigger?.type === 'keyword' 
                        ? `Keywords: ${automation.trigger.keywords?.slice(0, 3).join(', ')}${automation.trigger.keywords?.length > 3 ? '...' : ''}`
                        : triggerTypes.find(t => t.value === automation.trigger?.type)?.label || 'Unknown trigger'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={automation.active}
                  onCheckedChange={() => {
                    handleToggle(automation.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1">
                  {(automation.actions || []).slice(0, 3).map((action, idx) => {
                    const actionType = actionTypes.find(a => a.value === action.type);
                    const Icon = actionType?.icon || Zap;
                    return (
                      <div key={idx} className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center" title={actionType?.label}>
                        <Icon className="w-3 h-3 text-gray-600" />
                      </div>
                    );
                  })}
                  {(automation.actions || []).length > 3 && (
                    <span className="text-xs text-gray-400">+{automation.actions.length - 3}</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {automation.times_triggered || 0} triggers
                </span>
              </div>
            </div>
          ))}

          {automations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No automations yet</p>
              <p className="text-sm">Create your first automation or use a template</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Panel or Empty State */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!isEditorOpen ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Smart Automations</h3>
              <p className="text-gray-500 mb-6">
                Create rules to automatically respond to customers, lookup information, assign agents, and more.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setIsTemplateOpen(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
                <Button className="bg-[#393d8a] hover:bg-[#393d8a]/90" onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <AutomationEditor
            data={editorData}
            setData={setEditorData}
            onSave={handleSave}
            onCancel={() => setIsEditorOpen(false)}
            onDelete={selectedAutomation ? () => handleDelete(selectedAutomation.id) : null}
            saving={saving}
            isEditing={!!selectedAutomation}
            addAction={addAction}
            updateAction={updateAction}
            removeAction={removeAction}
          />
        )}
      </div>

      {/* Templates Dialog */}
      <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Automation Templates</DialogTitle>
            <DialogDescription>
              Start with a pre-built template and customize it to your needs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-[#393d8a] cursor-pointer transition-all"
                onClick={() => handleUseTemplate(template)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                </div>
                <div className="flex gap-2 mt-3">
                  {(template.actions || []).map((action, idx) => {
                    const actionType = actionTypes.find(a => a.value === action.type);
                    return (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {actionType?.label || action.type}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Editor Component
const AutomationEditor = ({ 
  data, setData, onSave, onCancel, onDelete, saving, isEditing,
  addAction, updateAction, removeAction 
}) => {
  const [keywordInput, setKeywordInput] = useState('');

  const addKeyword = () => {
    if (keywordInput.trim() && !data.trigger.keywords.includes(keywordInput.trim())) {
      setData({
        ...data,
        trigger: {
          ...data.trigger,
          keywords: [...data.trigger.keywords, keywordInput.trim()]
        }
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword) => {
    setData({
      ...data,
      trigger: {
        ...data.trigger,
        keywords: data.trigger.keywords.filter(k => k !== keyword)
      }
    });
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {isEditing ? 'Edit Automation' : 'New Automation'}
        </h2>
        <div className="flex gap-2">
          {onDelete && (
            <Button variant="outline" className="text-red-500" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button className="bg-[#393d8a] hover:bg-[#393d8a]/90" onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Automation
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <Label>Automation Name</Label>
            <Input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="e.g., Tracking Inquiry Response"
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="What does this automation do?"
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch
              checked={data.active}
              onCheckedChange={(checked) => setData({ ...data, active: checked })}
            />
          </div>
        </div>
      </div>

      {/* Trigger */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-[#eeb224] rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
          When this happens (Trigger)
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label>Trigger Type</Label>
            <Select
              value={data.trigger.type}
              onValueChange={(value) => setData({
                ...data,
                trigger: { ...data.trigger, type: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {triggerTypes.map((trigger) => (
                  <SelectItem key={trigger.value} value={trigger.value}>
                    <div className="flex items-center gap-2">
                      <trigger.icon className="w-4 h-4" />
                      {trigger.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {triggerTypes.find(t => t.value === data.trigger.type)?.description}
            </p>
          </div>

          {data.trigger.type === 'keyword' && (
            <>
              <div>
                <Label>Keywords (message must contain any of these)</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Enter keyword and press Add"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" variant="outline" onClick={addKeyword}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.trigger.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="gap-1">
                      {keyword}
                      <button onClick={() => removeKeyword(keyword)} className="ml-1 hover:text-red-500">×</button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Match Type</Label>
                  <Select
                    value={data.trigger.match_type}
                    onValueChange={(value) => setData({
                      ...data,
                      trigger: { ...data.trigger, match_type: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="exact">Exact Match</SelectItem>
                      <SelectItem value="starts_with">Starts With</SelectItem>
                      <SelectItem value="regex">Regex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    checked={data.trigger.case_sensitive}
                    onCheckedChange={(checked) => setData({
                      ...data,
                      trigger: { ...data.trigger, case_sensitive: checked }
                    })}
                  />
                  <Label className="!mt-0">Case Sensitive</Label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-[#30a34b] rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
          Do these actions (in order)
        </h3>

        <div className="space-y-3">
          {data.actions.map((action, index) => (
            <ActionCard
              key={index}
              action={action}
              index={index}
              onUpdate={(updates) => updateAction(index, updates)}
              onRemove={() => removeAction(index)}
            />
          ))}

          {data.actions.length === 0 && (
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-500">
              No actions added yet. Add an action below.
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" />
                Add Action
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              {actionTypes.map((actionType) => (
                <DropdownMenuItem
                  key={actionType.value}
                  onClick={() => addAction(actionType.value)}
                  className="flex items-start gap-2 py-2"
                >
                  <actionType.icon className="w-4 h-4 mt-0.5 text-gray-500" />
                  <div>
                    <div className="font-medium">{actionType.label}</div>
                    <div className="text-xs text-gray-500">{actionType.description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Channels */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Apply to Channels</h3>
        <div className="flex flex-wrap gap-2">
          {['all', 'email', 'whatsapp', 'facebook', 'chat'].map((channel) => (
            <label
              key={channel}
              className={cn(
                "px-4 py-2 rounded-lg border cursor-pointer transition-all",
                data.channels.includes(channel)
                  ? "bg-[#393d8a] text-white border-[#393d8a]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={data.channels.includes(channel)}
                onChange={(e) => {
                  if (channel === 'all') {
                    setData({ ...data, channels: e.target.checked ? ['all'] : [] });
                  } else {
                    const newChannels = e.target.checked
                      ? [...data.channels.filter(c => c !== 'all'), channel]
                      : data.channels.filter(c => c !== channel);
                    setData({ ...data, channels: newChannels });
                  }
                }}
              />
              {channel === 'all' ? 'All Channels' : channel.charAt(0).toUpperCase() + channel.slice(1)}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// Action Card Component
const ActionCard = ({ action, index, onUpdate, onRemove }) => {
  const actionType = actionTypes.find(a => a.value === action.type);
  const Icon = actionType?.icon || Zap;

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white border border-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
            {index + 1}
          </div>
          <Icon className="w-4 h-4 text-[#393d8a]" />
          <span className="font-medium text-gray-900">{actionType?.label}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={onRemove}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {action.type === 'send_reply' && (
        <div>
          <Label className="text-xs">Message Template</Label>
          <Textarea
            value={action.message_template || ''}
            onChange={(e) => onUpdate({ message_template: e.target.value })}
            placeholder="Hello {{customer_name}}! Thank you for contacting us..."
            rows={3}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Variables: {'{{customer_name}}'}, {'{{customer_email}}'}, {'{{tracking_numbers}}'}, {'{{channel}}'}
          </p>
        </div>
      )}

      {action.type === 'lookup_customer' && (
        <div>
          <Label className="text-xs">Search By</Label>
          <Select
            value={action.lookup_field || 'email'}
            onValueChange={(value) => onUpdate({ lookup_field: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email Address</SelectItem>
              <SelectItem value="phone">Phone Number</SelectItem>
              <SelectItem value="customer_id">Customer ID</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {action.type === 'assign_agent' && (
        <div>
          <Label className="text-xs">Assignment Mode</Label>
          <Select
            value={action.assign_mode || 'round_robin'}
            onValueChange={(value) => onUpdate({ assign_mode: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round_robin">Round Robin (rotate agents)</SelectItem>
              <SelectItem value="least_busy">Least Busy Agent</SelectItem>
              <SelectItem value="specific">Specific Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {action.type === 'add_tag' && (
        <div>
          <Label className="text-xs">Tag Name</Label>
          <Input
            value={action.tag || ''}
            onChange={(e) => onUpdate({ tag: e.target.value })}
            placeholder="e.g., tracking-inquiry"
            className="mt-1"
          />
        </div>
      )}

      {action.type === 'set_priority' && (
        <div>
          <Label className="text-xs">Priority Level</Label>
          <Select
            value={action.priority || 'medium'}
            onValueChange={(value) => onUpdate({ priority: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {action.type === 'set_status' && (
        <div>
          <Label className="text-xs">Status</Label>
          <Select
            value={action.status || 'open'}
            onValueChange={(value) => onUpdate({ status: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default AutomationBuilder;
