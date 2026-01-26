import React, { useState } from 'react';
import { 
  Save, Bell, Lock, Globe, Palette, Users, Mail, 
  Shield, Clock, Building, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const settingsSections = [
  { id: 'general', label: 'General', icon: Building },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'channels', label: 'Channels', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'business-hours', label: 'Business Hours', icon: Clock },
  { id: 'appearance', label: 'Appearance', icon: Palette }
];

const SettingsView = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    companyName: 'Post Aruba',
    supportEmail: 'support@postaruba.com',
    timezone: 'America/Aruba',
    language: 'en',
    emailNotifications: true,
    pushNotifications: true,
    soundAlerts: true,
    autoAssign: true,
    twoFactorAuth: false,
    sessionTimeout: '30',
    businessHoursStart: '08:00',
    businessHoursEnd: '18:00',
    workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    primaryColor: '#5C0F8B',
    accentColor: '#FF8800'
  });

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => handleSettingChange('companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) => handleSettingChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Aruba">America/Aruba (AST)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/Amsterdam">Europe/Amsterdam (CET)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Default Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => handleSettingChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive browser push notifications</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Sound Alerts</p>
                  <p className="text-sm text-gray-500">Play sound for new messages</p>
                </div>
                <Switch
                  checked={settings.soundAlerts}
                  onCheckedChange={(checked) => handleSettingChange('soundAlerts', checked)}
                />
              </div>
            </div>
          </div>
        );

      case 'channels':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Configuration</h3>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-500">support@postaruba.com</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Connected</span>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">WhatsApp Business</p>
                      <p className="text-sm text-gray-500">+297 555-0100</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Connected</span>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Facebook Messenger</p>
                      <p className="text-sm text-gray-500">Post Aruba Page</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Connected</span>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Select
                  value={settings.sessionTimeout}
                  onValueChange={(value) => handleSettingChange('sessionTimeout', value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'business-hours':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Hours</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Opening Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={settings.businessHoursStart}
                  onChange={(e) => handleSettingChange('businessHoursStart', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Closing Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={settings.businessHoursEnd}
                  onChange={(e) => handleSettingChange('businessHoursEnd', e.target.value)}
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
                      const newDays = settings.workDays.includes(day)
                        ? settings.workDays.filter(d => d !== day)
                        : [...settings.workDays, day];
                      handleSettingChange('workDays', newDays);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      settings.workDays.includes(day)
                        ? "bg-[#5C0F8B] text-white"
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                  />
                  <Input
                    value={settings.accentColor}
                    onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
                    ? "bg-[#5C0F8B]/10 text-[#5C0F8B]"
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
          <div className="mt-6 flex justify-end">
            <Button className="gap-2 bg-[#FF8800] hover:bg-[#FF8800]/90">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
