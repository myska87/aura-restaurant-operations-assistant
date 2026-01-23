import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  GraduationCap,
  FileText,
  FolderOpen,
  Package,
  ClipboardCheck,
  MessageSquare,
  Wrench,
  Bell,
  Menu as MenuIcon,
  X,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Leaf,
  ChefHat,
  TrendingUp,
  Shield,
  Heart,
  Trophy,
  AlertCircle,
  CookingPot,
  ArrowLeft,
  ListChecks,
  PlayCircle,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import QuickAccessToolbar from '@/components/ui/QuickAccessToolbar';
import ModeSelector from '@/components/ui/ModeSelector';

// OPERATE MODE - Service time
const operateNav = [
  { name: 'Operations', icon: PlayCircle, page: 'Operations', roles: ['all'] },
  { name: 'Dish Guides', icon: CookingPot, page: 'VisualDishGuides', roles: ['all'] },
  { name: 'Prep Tasks', icon: ChefHat, page: 'PrepWorkflow', roles: ['all'] },
  { name: 'Checklists', icon: ListChecks, page: 'DailyOperationsHub', roles: ['all'] },
  { name: 'Quality & Safety', icon: Shield, page: 'QualitySafety', roles: ['all'] },
];

// TRAIN MODE - Learning
const trainNav = [
  { name: 'Training Academy', icon: GraduationCap, page: 'TrainingAcademy', roles: ['all'] },
  { name: 'Dish Guides', icon: CookingPot, page: 'VisualDishGuides', roles: ['all'] },
  { name: 'Visual Procedures', icon: FileText, page: 'VisualProcedures', roles: ['all'] },
  { name: 'Documents & SOPs', icon: BookOpen, page: 'Documents', roles: ['all'] },
  { name: 'Leadership Path', icon: Trophy, page: 'LeadershipPathway', roles: ['all'] },
  { name: 'Culture', icon: Heart, page: 'Culture', roles: ['all'] },
];

// MANAGE MODE - Admin
const manageNav = [
  {
    title: 'Overview',
    items: [
      { name: 'Command Center', icon: LayoutDashboard, page: 'CommandCenter', roles: ['all'] },
      { name: 'Reports', icon: TrendingUp, page: 'Reports', roles: ['manager', 'owner', 'admin'] },
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: 'Menu Manager', icon: ChefHat, page: 'MenuManager', roles: ['all'] },
      { name: 'Operations History', icon: ClipboardCheck, page: 'OperationsHistory', roles: ['manager', 'owner', 'admin'] },
      { name: 'Equipment Health', icon: Wrench, page: 'EquipmentHealth', roles: ['all'] },
      { name: 'Assets', icon: Package, page: 'Assets', roles: ['all'] },
    ]
  },
  {
    title: 'Team',
    items: [
      { name: 'People', icon: Users, page: 'People', roles: ['all'] },
      { name: 'Shifts', icon: Calendar, page: 'Shifts', roles: ['all'] },
      { name: 'Performance', icon: TrendingUp, page: 'Performance', roles: ['manager', 'owner', 'admin'] },
      { name: 'Weekly Reports', icon: FileText, page: 'WeeklyManagerReports', roles: ['manager', 'owner', 'admin'] },
    ]
  },
  {
    title: 'Admin',
    items: [
      { name: 'Documents', icon: FolderOpen, page: 'Documents', roles: ['all'] },
      { name: 'Compliance Hub', icon: Shield, page: 'ComplianceHub', roles: ['manager', 'owner', 'admin'] },
      { name: 'Data Management', icon: Shield, page: 'DataManagement', roles: ['manager', 'owner', 'admin'] },
      { name: 'Announcements', icon: Bell, page: 'Announcements', roles: ['all'] },
      { name: 'Change Requests', icon: MessageSquare, page: 'ChangeRequests', roles: ['all'] },
    ]
  }
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState(() => localStorage.getItem('aura_mode') || 'operate');
  const navigate = useNavigate();
  const location = useLocation();

  const handleModeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem('aura_mode', newMode);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // First-login onboarding redirect
        if (userData && !userData.onboarding_completed && currentPageName !== 'OnboardingFlow') {
          navigate(createPageUrl('OnboardingFlow'));
        }
      } catch (e) {
        console.log('User not authenticated');
      }
    };
    loadUser();
  }, [currentPageName, navigate]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Notification.filter({ 
        recipient_email: user.email, 
        is_read: false 
      }, '-created_date', 10);
    },
    enabled: !!user?.email,
    refetchInterval: 30000
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  const NavContent = () => {
    // OPERATE MODE - Big buttons, simple
    if (mode === 'operate') {
      return (
        <div className="flex flex-col h-full bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900">
          <div className="p-6 border-b border-blue-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                <PlayCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SERVICE MODE</h1>
                <p className="text-xs text-blue-300/80">Operate Fast</p>
              </div>
            </div>
            <ModeSelector currentMode={mode} onModeChange={handleModeChange} />
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {operateNav
                .filter(item => item.roles.includes('all') || item.roles.includes(user?.role))
                .map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-base
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-white shadow-xl border-2 border-blue-400' 
                          : 'bg-blue-800/30 text-blue-100 hover:bg-blue-700/40'
                        }
                      `}
                    >
                      <item.icon className="w-6 h-6" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
            </div>
          </ScrollArea>
          {user && <UserSection />}
        </div>
      );
    }

    // TRAIN MODE - Learning focused
    if (mode === 'train') {
      return (
        <div className="flex flex-col h-full bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900">
          <div className="p-6 border-b border-amber-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LEARNING MODE</h1>
                <p className="text-xs text-amber-300/80">Train & Grow</p>
              </div>
            </div>
            <ModeSelector currentMode={mode} onModeChange={handleModeChange} />
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {trainNav
                .filter(item => item.roles.includes('all') || item.roles.includes(user?.role))
                .map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                        ${isActive 
                          ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/20 text-white shadow-lg border border-amber-400' 
                          : 'text-amber-100 hover:bg-amber-800/40'
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
            </div>
          </ScrollArea>
          {user && <UserSection />}
        </div>
      );
    }

    // MANAGE MODE - Full admin
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900">
        <div className="p-6 border-b border-emerald-800/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">MANAGE MODE</h1>
              <p className="text-xs text-emerald-300/80">Full Control</p>
            </div>
          </div>
          <ModeSelector currentMode={mode} onModeChange={handleModeChange} />
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-6">
            {manageNav.map((group) => (
              <div key={group.title}>
                <h3 className="px-4 mb-2 text-xs font-semibold text-emerald-400/60 uppercase tracking-wider">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items
                    .filter(item => item.roles.includes('all') || item.roles.includes(user?.role))
                    .map((item) => {
                      const isActive = currentPageName === item.page;
                      return (
                        <Link
                          key={item.page}
                          to={createPageUrl(item.page)}
                          onClick={() => setSidebarOpen(false)}
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
          </nav>
        </ScrollArea>
        {user && <UserSection />}
      </div>
    );
  };

  const UserSection = () => (
    <div className="p-4 border-t border-emerald-800/30">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-emerald-300/60 capitalize">{user?.role || 'Staff'}</p>
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
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return <NavContent />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <style>{`
        :root {
          --gold-primary: #D4AF37;
          --gold-light: #F4D03F;
          --green-primary: #2E7D32;
          --green-light: #4CAF50;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:overflow-y-auto shadow-2xl ${
        mode === 'operate' ? 'bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900' :
        mode === 'train' ? 'bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900' :
        'bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900'
      }`}>
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <MenuIcon className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className={`w-72 p-0 ${
                mode === 'operate' ? 'bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900' :
                mode === 'train' ? 'bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900' :
                'bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900'
              }`}>
                <NavContent />
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-slate-800">AURA</span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5 text-slate-600" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-3 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <ScrollArea className="h-64">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <DropdownMenuItem key={notif.id} className="p-3 cursor-pointer">
                        <div>
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-slate-500">{notif.message}</p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-72 right-0 z-40 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-300" />
          <h1 className="text-xl font-semibold text-slate-800 capitalize">
            {currentPageName?.replace(/([A-Z])/g, ' $1').trim() || 'Dashboard'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-slate-600" />
                {notifications.length > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {notifications.length}
                  </motion.span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 border-b flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {notifications.length > 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    {notifications.length} new
                  </Badge>
                )}
              </div>
              <ScrollArea className="h-80">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>All caught up!</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} className="p-4 cursor-pointer border-b last:border-0">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 min-h-screen pb-24">
        <div className="p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Quick Access Toolbar */}
      <QuickAccessToolbar />
      </div>
      );
      }