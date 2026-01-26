import React from 'react';
import { 
  Inbox, Mail, MessageCircle, MessageSquare, Facebook, 
  Users, Settings, BarChart3, Zap, LogOut,
  ChevronDown, Shield
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const iconMap = {
  Inbox: Inbox,
  Mail: Mail,
  MessageCircle: MessageCircle,
  MessageSquare: MessageSquare,
  Facebook: Facebook
};

const Sidebar = ({ 
  channels, 
  activeChannel, 
  setActiveChannel, 
  activeView, 
  setActiveView 
}) => {
  const { user, logout, isAdmin } = useAuth();

  // Navigation items based on role
  const getNavItems = () => {
    const baseItems = [
      { id: 'inbox', label: 'Inbox', icon: Inbox }
    ];

    if (isAdmin()) {
      return [
        ...baseItems,
        { id: 'agents', label: 'Agents', icon: Users },
        { id: 'automation', label: 'Automation', icon: Zap },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings }
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-[#393d8a] text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#eeb224] rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Post Aruba</h1>
            <p className="text-xs text-white/60">Support Center</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                activeView === item.id
                  ? "bg-[#eeb224] text-white shadow-lg shadow-[#eeb224]/30"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Channel Filter Section - Only show when in inbox view */}
        {activeView === 'inbox' && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3 px-3">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Channels</span>
              <ChevronDown className="w-4 h-4 text-white/50" />
            </div>
            {channels.map((channel) => {
              const Icon = iconMap[channel.icon] || Inbox;
              return (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200",
                    activeChannel === channel.id
                      ? "bg-[#30a34b]/80 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{channel.name}</span>
                  </div>
                  {channel.count > 0 && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      activeChannel === channel.id
                        ? "bg-white/20"
                        : "bg-white/10"
                    )}>
                      {channel.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-[#30a34b] rounded-full flex items-center justify-center text-sm font-semibold">
              {user?.avatar || user?.name?.charAt(0) || 'U'}
            </div>
            {isAdmin() && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#eeb224] rounded-full flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-white/50 truncate capitalize">{user?.role || 'agent'}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
