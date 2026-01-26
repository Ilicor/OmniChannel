import React from 'react';
import { 
  Inbox, Mail, MessageCircle, MessageSquare, Facebook, 
  Users, Settings, BarChart3, Zap, GitBranch, LogOut,
  ChevronDown, Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';

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
  const navItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'agents', label: 'Agents', icon: Users },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'flows', label: 'Chat Flows', icon: GitBranch },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-[#0F3252] text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF8800] rounded-lg flex items-center justify-center">
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
                  ? "bg-[#FF8800] text-white shadow-lg shadow-[#FF8800]/30"
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
                      ? "bg-[#5C0F8B]/80 text-white"
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
          <div className="w-9 h-9 bg-[#5C0F8B] rounded-full flex items-center justify-center text-sm font-semibold">
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin Staff</p>
            <p className="text-xs text-white/50 truncate">admin@postaruba.com</p>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <LogOut className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
