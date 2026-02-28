import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard, Users, Calendar, GraduationCap, FileText, FolderOpen,
  Package, ClipboardCheck, MessageSquare, Wrench, Bell, ChevronDown,
  LogOut, Settings, User, Leaf, ChefHat, TrendingUp, Shield, Heart,
  Trophy, AlertCircle, CookingPot, BarChart3, Droplet, BookOpen, Zap
} from 'lucide-react';
import { useMode } from '@/components/modes/ModeContext';

const navGroups = [
  {
    title: 'Live Operations',
    items: [
      { name: 'Command Center',      icon: LayoutDashboard, page: 'CommandCenter',       roles: ['all'],                        modes: ['manage'] },
      { name: 'Daily Ops Hub',        icon: Zap,             page: 'DailyOperationsHub',  roles: ['all'],                        modes: ['operate'] },
      { name: 'Cleaning & Hygiene',   icon: Droplet,         page: 'CleaningHygieneHub',  roles: ['all'],                        modes: ['operate'] },
      { name: 'Sign-Off Log',         icon: Shield,          page: 'CleaningSignOffLog',  roles: ['manager', 'owner', 'admin'],  modes: ['manage'] },
      { name: 'Live Food Safety',     icon: Shield,          page: 'LiveFoodSafety',      roles: ['all'],                        modes: ['operate'] },
      { name: 'Shift Handover',       icon: MessageSquare,   page: 'ShiftHandovers',      roles: ['all'],                        modes: ['operate'] },
      { name: 'Equipment Status',     icon: Wrench,          page: 'EquipmentHealth',     roles: ['all'],                        modes: ['operate'] },
      { name: 'Kitchen Runsheet',     icon: ClipboardCheck,  page: 'KitchenRunsheet',     roles: ['all'],                        modes: ['operate'] },
      { name: 'Menu Manager',         icon: ChefHat,         page: 'MenuManager',         roles: ['all'],                        modes: ['operate'] },
      { name: 'Checklist Library',    icon: ClipboardCheck,  page: 'ChecklistLibrary',    roles: ['all'],                        modes: ['operate'] },
      { name: 'Operations Reports',   icon: BarChart3,       page: 'OperationsReports',   roles: ['all'],                        modes: ['operate', 'manage'] },
      { name: 'Visual Procedures',    icon: FileText,        page: 'VisualProcedures',    roles: ['all'],                        modes: ['operate'] },
      { name: 'Visual Dish Guides',   icon: CookingPot,      page: 'VisualDishGuides',    roles: ['all'],                        modes: ['operate'] },
      { name: 'Quality & Safety',     icon: Shield,          page: 'QualitySafety',       roles: ['all'],                        modes: ['operate'] },
      { name: 'Incident Records',     icon: AlertCircle,     page: 'IncidentCenter',      roles: ['manager', 'owner', 'admin'],  modes: ['manage'] },
      { name: 'Chemical Safety',      icon: Wrench,          page: 'ChemicalDashboard',   roles: ['all'],                        modes: ['operate'] },
    ]
  },
  {
    title: 'Team Development',
    items: [
      { name: 'Training Home',    icon: GraduationCap, page: 'TrainHome',         roles: ['all'], modes: ['train'] },
      { name: 'Training Academy', icon: BookOpen,      page: 'TrainingAcademy',   roles: ['all'], modes: ['train'] },
      { name: 'Leadership Path',  icon: Trophy,        page: 'LeadershipPathway', roles: ['all'], modes: ['train'] },
      { name: 'Culture',          icon: Heart,         page: 'Culture',           roles: ['all'], modes: ['train'] },
      { name: 'Welcome & Vision', icon: TrendingUp,    page: 'WelcomeVision',     roles: ['all'], modes: ['train'] },
      { name: 'Raving Fans',      icon: Trophy,        page: 'RavingFans',        roles: ['all'], modes: ['train'] },
    ]
  },
  {
    title: 'Management & Control',
    items: [
      { name: 'People',                 icon: Users,        page: 'People',               roles: ['all'],                        modes: ['manage'] },
      { name: 'Reports',                icon: TrendingUp,   page: 'Reports',              roles: ['manager', 'owner', 'admin'],  modes: ['manage'] },
      { name: 'Audit Center',           icon: FileText,     page: 'AuditCenter',          roles: ['all'],                        modes: ['manage'] },
      { name: 'Inspector Mode',         icon: Shield,       page: 'InspectorMode',        roles: ['manager', 'owner', 'admin'],  modes: ['manage'] },
      { name: 'Compliance Hub',         icon: Shield,       page: 'ComplianceHub',        roles: ['manager', 'owner', 'admin'],  modes: ['manage'] },
      { name: 'Data Management',        icon: Shield,       page: 'DataManagement',       roles: ['manager', 'owner', 'admin'],  modes: ['manage'] },
      { name: 'Restaurant Info',        icon: Settings,     page: 'GlobalInfo',           roles: ['manager', 'owner', 'admin'],  modes: ['manage'] },
      { name: 'Meetings',               icon: Calendar,     page: 'Meetings',             roles: ['all'],                        modes: ['manage'] },
      { name: 'Shifts',                 icon: Calendar,     page: 'Shifts',               roles: ['all'],                        modes: ['manage'] },
      { name: 'Performance',            icon: TrendingUp,   page: 'Performance',          roles: ['manager', 'owner', 'admin'],  modes: ['manage'] },
      { name: 'Assets & Equipment',     icon: Package,      page: 'Assets',               roles: ['all'],                        modes: ['manage'] },
      { name: 'Weekly Manager Reports', icon: FileText,     page: 'WeeklyManagerReports', roles: ['manager', 'owner', 'admin'],  modes: ['manage'] },
      { name: 'Documents',              icon: FolderOpen,   page: 'Documents',            roles: ['all'],                        modes: ['manage'] },
      { name: 'Announcements',          icon: Bell,         page: 'Announcements',        roles: ['all'],                        modes: ['manage'] },
      { name: 'Change Requests',        icon: MessageSquare,page: 'ChangeRequests',       roles: ['all'],                        modes: ['manage'] },
    ]
  }
];

export default function NavContent({ user, currentPageName, onCloseSidebar, onLogout }) {
  const { currentMode } = useMode();

  const filteredNavGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        (item.roles.includes('all') || item.roles.includes(user?.role)) &&
        (item.modes?.includes(currentMode))
      )
    }))
    .filter(group => group.items.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-emerald-800/30">
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AURA</h1>
            <p className="text-[10px] text-emerald-300/80 uppercase tracking-widest">Restaurant Ops</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4" key={currentMode}>
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="px-3 space-y-6"
        >
          {filteredNavGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-4 mb-2 text-xs font-semibold text-emerald-400/60 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={onCloseSidebar}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-400 shadow-lg shadow-amber-500/10'
                          : 'text-emerald-100/70 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : ''}`} />
                      <span className="font-medium text-sm">{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.nav>
      </ScrollArea>

      {/* User Section */}
      {user && (
        <div className="p-4 border-t border-emerald-800/30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white truncate">{user.full_name || 'User'}</p>
                  <p className="text-xs text-emerald-300/60 capitalize">{user.role || 'Staff'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-emerald-300/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('Profile')} className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('Settings')} className="flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}