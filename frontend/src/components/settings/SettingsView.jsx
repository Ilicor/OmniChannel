import React, { useState, useEffect } from 'react';
import { 
  Save, Bell, Lock, Globe, Palette, Clock, Building, ChevronRight,
  Plus, Trash2, Edit2, CheckCircle, XCircle, Loader2, MessageCircle,
  Facebook, Mail, ExternalLink, Copy, Eye, EyeOff, ThumbsUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  getWhatsAppChannels, createWhatsAppChannel, updateWhatsAppChannel, deleteWhatsAppChannel, testWhatsAppChannel,
  getFacebookChannels, createFacebookChannel, updateFacebookChannel, deleteFacebookChannel, testFacebookChannel,
  getEmailChannels, createEmailChannel, updateEmailChannel, deleteEmailChannel, testEmailChannel,
  getSettings, updateGeneralSettings, updateNotificationSettings, updateSecuritySettings, updateBusinessHoursSettings,
  getSatisfactionSettings, updateSatisfactionSettings
} from '../../services/api';

const settingsSections = [
  { id: 'general', label: 'General', icon: Building },
  { id: 'channels', label: 'Channels', icon: Globe },
  { id: 'satisfaction', label: 'Customer Satisfaction', icon: ThumbsUp },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'business-hours', label: 'Business Hours', icon: Clock },
  { id: 'appearance', label: 'Appearance', icon: Palette }
];

const SettingsView = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    general: { company_name: 'Post Aruba', support_email: 'support@postaruba.com', timezone: 'America/Aruba', language: 'en' },
    notifications: { email_notifications: true, push_notifications: true, sound_alerts: true },
    security: { two_factor_auth: false, session_timeout: 30 },
    business_hours: { start_time: '08:00', end_time: '18:00', work_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }
  });

  // Channel states
  const [whatsappChannels, setWhatsappChannels] = useState([]);
  const [facebookChannels, setFacebookChannels] = useState([]);
  const [emailChannels, setEmailChannels] = useState([]);
  
  // Dialog states
  const [channelDialog, setChannelDialog] = useState({ open: false, type: null, editing: null });
  const [showSecrets, setShowSecrets] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, whatsapp, facebook, email] = await Promise.all([
        getSettings(),
        getWhatsAppChannels(),
        getFacebookChannels(),
        getEmailChannels()
      ]);
      setSettings(settingsData);
      setWhatsappChannels(whatsapp);
      setFacebookChannels(facebook);
      setEmailChannels(email);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      switch (activeSection) {
        case 'general':
          await updateGeneralSettings(settings.general);
          break;
        case 'notifications':
          await updateNotificationSettings(settings.notifications);
          break;
        case 'security':
          await updateSecuritySettings(settings.security);
          break;
        case 'business-hours':
          await updateBusinessHoursSettings(settings.business_hours);
          break;
      }
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleSecret = (key) => {
    setShowSecrets({ ...showSecrets, [key]: !showSecrets[key] });
  };

  // Channel management functions
  const handleSaveChannel = async (type, data) => {
    try {
      if (channelDialog.editing) {
        switch (type) {
          case 'whatsapp':
            await updateWhatsAppChannel(channelDialog.editing.id, data);
            break;
          case 'facebook':
            await updateFacebookChannel(channelDialog.editing.id, data);
            break;
          case 'email':
            await updateEmailChannel(channelDialog.editing.id, data);
            break;
        }
      } else {
        switch (type) {
          case 'whatsapp':
            await createWhatsAppChannel(data);
            break;
          case 'facebook':
            await createFacebookChannel(data);
            break;
          case 'email':
            await createEmailChannel(data);
            break;
        }
      }
      await loadData();
      setChannelDialog({ open: false, type: null, editing: null });
    } catch (error) {
      console.error('Failed to save channel:', error);
      alert('Failed to save channel');
    }
  };

  const handleDeleteChannel = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;
    try {
      switch (type) {
        case 'whatsapp':
          await deleteWhatsAppChannel(id);
          break;
        case 'facebook':
          await deleteFacebookChannel(id);
          break;
        case 'email':
          await deleteEmailChannel(id);
          break;
      }
      await loadData();
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
  };

  const handleTestChannel = async (type, id) => {
    try {
      let result;
      switch (type) {
        case 'whatsapp':
          result = await testWhatsAppChannel(id);
          break;
        case 'facebook':
          result = await testFacebookChannel(id);
          break;
        case 'email':
          result = await testEmailChannel(id);
          break;
      }
      alert(result.message);
      await loadData();
    } catch (error) {
      alert('Connection test failed');
    }
  };

  const renderChannelsSection = () => (
    <div className="space-y-8">
      {/* WhatsApp Channels */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">WhatsApp Business</h3>
              <p className="text-sm text-gray-500">{whatsappChannels.length} channel(s) configured</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="gap-2 bg-[#30a34b] hover:bg-[#30a34b]/90"
            onClick={() => setChannelDialog({ open: true, type: 'whatsapp', editing: null })}
          >
            <Plus className="w-4 h-4" />
            Add WhatsApp
          </Button>
        </div>
        
        <div className="space-y-3">
          {whatsappChannels.map((channel) => (
            <ChannelCard 
              key={channel.id}
              channel={channel}
              type="whatsapp"
              icon={<MessageCircle className="w-4 h-4 text-green-600" />}
              onEdit={() => setChannelDialog({ open: true, type: 'whatsapp', editing: channel })}
              onDelete={() => handleDeleteChannel('whatsapp', channel.id)}
              onTest={() => handleTestChannel('whatsapp', channel.id)}
            />
          ))}
          {whatsappChannels.length === 0 && (
            <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">No WhatsApp channels configured</p>
          )}
        </div>
      </div>

      {/* Facebook Channels */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Facebook className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Facebook Messenger</h3>
              <p className="text-sm text-gray-500">{facebookChannels.length} channel(s) configured</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setChannelDialog({ open: true, type: 'facebook', editing: null })}
          >
            <Plus className="w-4 h-4" />
            Add Facebook
          </Button>
        </div>
        
        <div className="space-y-3">
          {facebookChannels.map((channel) => (
            <ChannelCard 
              key={channel.id}
              channel={channel}
              type="facebook"
              icon={<Facebook className="w-4 h-4 text-blue-600" />}
              onEdit={() => setChannelDialog({ open: true, type: 'facebook', editing: channel })}
              onDelete={() => handleDeleteChannel('facebook', channel.id)}
              onTest={() => handleTestChannel('facebook', channel.id)}
            />
          ))}
          {facebookChannels.length === 0 && (
            <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">No Facebook channels configured</p>
          )}
        </div>
      </div>

      {/* Email Channels */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email</h3>
              <p className="text-sm text-gray-500">{emailChannels.length} channel(s) configured</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="gap-2 bg-[#eeb224] hover:bg-[#eeb224]/90"
            onClick={() => setChannelDialog({ open: true, type: 'email', editing: null })}
          >
            <Plus className="w-4 h-4" />
            Add Email
          </Button>
        </div>
        
        <div className="space-y-3">
          {emailChannels.map((channel) => (
            <ChannelCard 
              key={channel.id}
              channel={channel}
              type="email"
              icon={<Mail className="w-4 h-4 text-orange-600" />}
              onEdit={() => setChannelDialog({ open: true, type: 'email', editing: channel })}
              onDelete={() => handleDeleteChannel('email', channel.id)}
              onTest={() => handleTestChannel('email', channel.id)}
            />
          ))}
          {emailChannels.length === 0 && (
            <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">No Email channels configured</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={settings.general?.company_name || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, company_name: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input
                  type="email"
                  value={settings.general?.support_email || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, support_email: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={settings.general?.timezone || 'America/Aruba'}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    general: { ...settings.general, timezone: value }
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Aruba">America/Aruba (AST)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    <SelectItem value="Europe/Amsterdam">Europe/Amsterdam (CET)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select
                  value={settings.general?.language || 'en'}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    general: { ...settings.general, language: value }
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="nl">Dutch</SelectItem>
                    <SelectItem value="pa">Papiamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'channels':
        return renderChannelsSection();

      case 'notifications':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
            {[
              { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
              { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive browser push notifications' },
              { key: 'sound_alerts', label: 'Sound Alerts', desc: 'Play sound for new messages' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <Switch
                  checked={settings.notifications?.[item.key] ?? true}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, [item.key]: checked }
                  })}
                />
              </div>
            ))}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <Switch
                checked={settings.security?.two_factor_auth ?? false}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  security: { ...settings.security, two_factor_auth: checked }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Select
                value={String(settings.security?.session_timeout || 30)}
                onValueChange={(value) => setSettings({
                  ...settings,
                  security: { ...settings.security, session_timeout: parseInt(value) }
                })}
              >
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'business-hours':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Hours</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opening Time</Label>
                <Input
                  type="time"
                  value={settings.business_hours?.start_time || '08:00'}
                  onChange={(e) => setSettings({
                    ...settings,
                    business_hours: { ...settings.business_hours, start_time: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Closing Time</Label>
                <Input
                  type="time"
                  value={settings.business_hours?.end_time || '18:00'}
                  onChange={(e) => setSettings({
                    ...settings,
                    business_hours: { ...settings.business_hours, end_time: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Working Days</Label>
              <div className="flex gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <button
                    key={day}
                    onClick={() => {
                      const days = settings.business_hours?.work_days || [];
                      const newDays = days.includes(day)
                        ? days.filter(d => d !== day)
                        : [...days, day];
                      setSettings({
                        ...settings,
                        business_hours: { ...settings.business_hours, work_days: newDays }
                      });
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      (settings.business_hours?.work_days || []).includes(day)
                        ? "bg-[#393d8a] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance Settings</h3>
            <p className="text-gray-500">Brand colors are set to Post Aruba theme: Blue (#393d8a), Yellow (#eeb224), Green (#30a34b)</p>
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-[#393d8a] rounded-lg" title="#393d8a" />
              <div className="w-16 h-16 bg-[#eeb224] rounded-lg" title="#eeb224" />
              <div className="w-16 h-16 bg-[#30a34b] rounded-lg" title="#30a34b" />
            </div>
          </div>
        );

      default:
        return null;
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
      {/* Settings Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>
        <nav className="p-2">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors mb-1",
                  activeSection === section.id
                    ? "bg-[#393d8a]/10 text-[#393d8a]"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  activeSection === section.id && "rotate-90"
                )} />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6">
        <div className="max-w-3xl">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            {renderSection()}
          </div>
          {activeSection !== 'channels' && (
            <div className="mt-6 flex justify-end">
              <Button 
                className="gap-2 bg-[#eeb224] hover:bg-[#eeb224]/90"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Channel Dialogs */}
      <ChannelDialog 
        open={channelDialog.open}
        type={channelDialog.type}
        editing={channelDialog.editing}
        onClose={() => setChannelDialog({ open: false, type: null, editing: null })}
        onSave={handleSaveChannel}
      />
    </div>
  );
};

// Channel Card Component
const ChannelCard = ({ channel, type, icon, onEdit, onDelete, onTest }) => (
  <div className="p-4 border border-gray-200 rounded-lg bg-white">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{channel.name}</p>
            {channel.is_connected ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <XCircle className="w-3 h-3" /> Not connected
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {type === 'whatsapp' && channel.phone_number}
            {type === 'facebook' && channel.page_name}
            {type === 'email' && channel.email_address}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onTest}>
          Test
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
);

// Channel Dialog Component
const ChannelDialog = ({ open, type, editing, onClose, onSave }) => {
  const [data, setData] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setData(editing);
    } else {
      setData({
        name: '',
        phone_number: '',
        phone_number_id: '',
        access_token: '',
        page_name: '',
        page_id: '',
        page_access_token: '',
        app_secret: '',
        email_address: '',
        provider: 'smtp',
        smtp_host: '',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        smtp_use_tls: true,
        api_key: ''
      });
    }
    setShowSecrets({});
  }, [editing, open]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(type, data);
    setSaving(false);
  };

  const toggleSecret = (key) => setShowSecrets({ ...showSecrets, [key]: !showSecrets[key] });

  const renderFields = () => {
    switch (type) {
      case 'whatsapp':
        return (
          <>
            <div className="space-y-2">
              <Label>Channel Name</Label>
              <Input value={data.name || ''} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="e.g., Main WhatsApp" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={data.phone_number || ''} onChange={(e) => setData({ ...data, phone_number: e.target.value })} placeholder="+297 555-0100" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number ID (from Meta)</Label>
              <Input value={data.phone_number_id || ''} onChange={(e) => setData({ ...data, phone_number_id: e.target.value })} placeholder="Enter Phone Number ID" />
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <div className="relative">
                <Input 
                  type={showSecrets.access_token ? 'text' : 'password'} 
                  value={data.access_token || ''} 
                  onChange={(e) => setData({ ...data, access_token: e.target.value })} 
                  placeholder="Enter Access Token"
                  className="pr-10"
                />
                <button type="button" onClick={() => toggleSecret('access_token')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showSecrets.access_token ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Webhook URL:</strong> {window.location.origin}/api/webhooks/whatsapp/{data.id || '[channel-id]'}
              </p>
              <p className="text-xs text-blue-600 mt-1">Verify Token: {data.webhook_verify_token || 'Will be generated'}</p>
            </div>
          </>
        );

      case 'facebook':
        return (
          <>
            <div className="space-y-2">
              <Label>Channel Name</Label>
              <Input value={data.name || ''} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="e.g., Main Facebook Page" />
            </div>
            <div className="space-y-2">
              <Label>Page Name</Label>
              <Input value={data.page_name || ''} onChange={(e) => setData({ ...data, page_name: e.target.value })} placeholder="Post Aruba" />
            </div>
            <div className="space-y-2">
              <Label>Page ID</Label>
              <Input value={data.page_id || ''} onChange={(e) => setData({ ...data, page_id: e.target.value })} placeholder="Enter Page ID" />
            </div>
            <div className="space-y-2">
              <Label>Page Access Token</Label>
              <div className="relative">
                <Input 
                  type={showSecrets.page_access_token ? 'text' : 'password'} 
                  value={data.page_access_token || ''} 
                  onChange={(e) => setData({ ...data, page_access_token: e.target.value })} 
                  className="pr-10"
                />
                <button type="button" onClick={() => toggleSecret('page_access_token')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showSecrets.page_access_token ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>App Secret</Label>
              <div className="relative">
                <Input 
                  type={showSecrets.app_secret ? 'text' : 'password'} 
                  value={data.app_secret || ''} 
                  onChange={(e) => setData({ ...data, app_secret: e.target.value })} 
                  className="pr-10"
                />
                <button type="button" onClick={() => toggleSecret('app_secret')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showSecrets.app_secret ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
          </>
        );

      case 'email':
        return (
          <>
            <div className="space-y-2">
              <Label>Channel Name</Label>
              <Input value={data.name || ''} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="e.g., Support Email" />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={data.email_address || ''} onChange={(e) => setData({ ...data, email_address: e.target.value })} placeholder="support@postaruba.com" />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={data.provider || 'smtp'} onValueChange={(value) => setData({ ...data, provider: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                  <SelectItem value="aws_ses">AWS SES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {data.provider === 'smtp' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input value={data.smtp_host || ''} onChange={(e) => setData({ ...data, smtp_host: e.target.value })} placeholder="smtp.gmail.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input type="number" value={data.smtp_port || 587} onChange={(e) => setData({ ...data, smtp_port: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>SMTP Username</Label>
                  <Input value={data.smtp_username || ''} onChange={(e) => setData({ ...data, smtp_username: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Password</Label>
                  <div className="relative">
                    <Input 
                      type={showSecrets.smtp_password ? 'text' : 'password'} 
                      value={data.smtp_password || ''} 
                      onChange={(e) => setData({ ...data, smtp_password: e.target.value })} 
                      className="pr-10"
                    />
                    <button type="button" onClick={() => toggleSecret('smtp_password')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showSecrets.smtp_password ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input 
                    type={showSecrets.api_key ? 'text' : 'password'} 
                    value={data.api_key || ''} 
                    onChange={(e) => setData({ ...data, api_key: e.target.value })} 
                    className="pr-10"
                  />
                  <button type="button" onClick={() => toggleSecret('api_key')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showSecrets.api_key ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    const action = editing ? 'Edit' : 'Add';
    switch (type) {
      case 'whatsapp': return `${action} WhatsApp Channel`;
      case 'facebook': return `${action} Facebook Channel`;
      case 'email': return `${action} Email Channel`;
      default: return 'Channel';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Configure your {type} channel settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {renderFields()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#393d8a] hover:bg-[#393d8a]/90">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {editing ? 'Update' : 'Create'} Channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsView;
