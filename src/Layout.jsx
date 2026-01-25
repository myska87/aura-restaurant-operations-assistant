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
        Thermometer,
        History,
        BarChart3,
        Droplet
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
import { ModeProvider, useMode, MODES } from '@/components/modes/ModeContext';
import ModeSelector from '@/components/modes/ModeSelector';
import ErrorBoundary from '@/components/ErrorBoundary';
import RouteGuard from '@/components/RouteGuard';

const navGroups = [
  {
    title: 'Live Operations',
    items: [
      { name: 'Command Center', icon: LayoutDashboard, page: 'CommandCenter', roles: ['all'], modes: ['manage'] },
      { name: 'Daily Operations Hub', icon: ClipboardCheck, page: 'DailyOperationsHub', roles: ['all'], modes: ['operate'] },
      { name: 'Cleaning & Hygiene', icon: Droplet, page: 'CleaningHygieneHub', roles: ['all'], modes: ['operate'] },
      { name: 'Sign-Off Log', icon: Shield, page: 'CleaningSignOffLog', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Live Food Safety', icon: Shield, page: 'LiveFoodSafety', roles: ['all'], modes: ['operate'] },
      { name: 'Shift Handover', icon: MessageSquare, page: 'ShiftHandovers', roles: ['all'], modes: ['operate'] },
      { name: 'Equipment Status', icon: Wrench, page: 'EquipmentHealth', roles: ['all'], modes: ['operate'] },

      { name: 'Menu Manager', icon: ChefHat, page: 'MenuManager', roles: ['all'], modes: ['operate'] },
      { name: 'Checklist Library', icon: ClipboardCheck, page: 'ChecklistLibrary', roles: ['all'], modes: ['operate'] },
      { name: 'Operations Reports', icon: BarChart3, page: 'OperationsReports', roles: ['all'], modes: ['operate', 'manage'] },
      { name: 'Visual Procedures', icon: FileText, page: 'VisualProcedures', roles: ['all'], modes: ['operate'] },
      { name: 'Visual Dish Guides', icon: CookingPot, page: 'VisualDishGuides', roles: ['all'], modes: ['operate'] },
      { name: 'Quality & Safety', icon: Shield, page: 'QualitySafety', roles: ['all'], modes: ['operate'] },
      { name: 'Incident Records', icon: AlertCircle, page: 'IncidentCenter', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Chemical Safety', icon: Wrench, page: 'ChemicalDashboard', roles: ['all'], modes: ['operate'] },
    ]
  },
  {
    title: 'Team Development',
    items: [
      { name: 'Training Academy', icon: GraduationCap, page: 'TrainingAcademy', roles: ['all'], modes: ['train'] },
      { name: 'Leadership Path', icon: Trophy, page: 'LeadershipPathway', roles: ['all'], modes: ['train'] },
      { name: 'Culture', icon: Heart, page: 'Culture', roles: ['all'], modes: ['train'] },
      { name: 'People', icon: Users, page: 'People', roles: ['all'], modes: ['train'] },
    ]
  },
  {
    title: 'Management & Control',
    items: [
      { name: 'Reports', icon: TrendingUp, page: 'Reports', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Audit Center', icon: FileText, page: 'AuditCenter', roles: ['all'], modes: ['manage'] },
      { name: 'Inspector Mode', icon: Shield, page: 'InspectorMode', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Compliance Hub', icon: Shield, page: 'ComplianceHub', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Data Management', icon: Shield, page: 'DataManagement', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Restaurant Info', icon: Settings, page: 'GlobalInfo', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Meetings', icon: Calendar, page: 'Meetings', roles: ['all'], modes: ['manage'] },
      { name: 'Shifts', icon: Calendar, page: 'Shifts', roles: ['all'], modes: ['manage'] },
      { name: 'Performance', icon: TrendingUp, page: 'Performance', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Assets & Equipment', icon: Package, page: 'Assets', roles: ['all'], modes: ['manage'] },
      { name: 'Weekly Manager Reports', icon: FileText, page: 'WeeklyManagerReports', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Documents', icon: FolderOpen, page: 'Documents', roles: ['all'], modes: ['manage'] },
      { name: 'Announcements', icon: Bell, page: 'Announcements', roles: ['all'], modes: ['manage'] },
      { name: 'Change Requests', icon: MessageSquare, page: 'ChangeRequests', roles: ['all'], modes: ['manage'] },
    ]
  }
];

function LayoutContent({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentMode } = useMode();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log('User not authenticated');
      }
    };
    loadUser();
  }, [currentPageName, navigate]);

  // Development warning: detect if any element is covering the header
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const checkHeaderCoverage = () => {
        const headers = document.querySelectorAll('header');
        headers.forEach(header => {
          const headerRect = header.getBoundingClientRect();
          const centerX = headerRect.left + headerRect.width / 2;
          const centerY = headerRect.top + headerRect.height / 2;
          const elementAtPoint = document.elementFromPoint(centerX, centerY);

          if (elementAtPoint && !header.contains(elementAtPoint)) {
            console.warn(
              '⚠️ HEADER COVERAGE WARNING: Element is covering the header area:',
              elementAtPoint,
              '\nThis may block mode selector interactions.',
              '\nEnsure page content has z-index < 9999'
            );
          }
        });
      };

      const timer = setTimeout(checkHeaderCoverage, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPageName]);

  // Redirect to mode home if on Dashboard
  useEffect(() => {
    if (currentPageName === 'Dashboard' && user) {
      if (currentMode === MODES.OPERATE) {
        navigate(createPageUrl('OperateHome'));
      } else if (currentMode === MODES.TRAIN) {
        navigate(createPageUrl('TrainHome'));
      } else if (currentMode === MODES.MANAGE) {
        navigate(createPageUrl('ManageHome'));
      }
    }
  }, [currentMode, currentPageName, navigate, user]);

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
    // Filter nav groups based on current mode
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
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <style>{`
        :root {
          --gold-primary: #D4AF37;
          --gold-light: #F4D03F;
          --green-primary: #2E7D32;
          --green-light: #4CAF50;
        }

        /* CRITICAL: Prevent any page content from blocking header interactions */
        header {
          pointer-events: auto !important;
        }

        /* Ensure all header interactive elements are clickable */
        header button,
        header [role="button"],
        header a,
        header [role="menu"] {
          pointer-events: auto !important;
        }

        /* Page content must never have z-index >= header */
        main > * {
          position: relative;
          z-index: 1;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:overflow-y-auto bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 shadow-2xl">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      {/* IMPORTANT: All interactive elements in mobile header MUST have pointer-events enabled */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[9999] bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm pointer-events-auto">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2 pointer-events-auto">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden pointer-events-auto">
                  <MenuIcon className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900">
                <NavContent />
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="hover:bg-slate-100 pointer-events-auto"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            </div>

            <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-slate-800">AURA</span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
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
          <div className="px-4 pb-3 pointer-events-auto">
          <ModeSelector user={user} />
          </div>
          </header>

      {/* Desktop Header */}
      {/* IMPORTANT: All interactive elements in this header MUST have pointer-events enabled */}
      {/* NEVER wrap buttons/selectors in click-intercepting containers */}
      <header className="hidden lg:flex fixed top-0 left-72 right-0 z-[9999] h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm items-center justify-between px-8 pointer-events-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="hover:bg-slate-100 pointer-events-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-300" />
          <h1 className="text-xl font-semibold text-slate-800 capitalize">
            {currentPageName?.replace(/([A-Z])/g, ' $1').trim() || 'Dashboard'}
          </h1>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <ModeSelector user={user} />
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
      <main className="lg:pl-72 pt-16 lg:pt-16 min-h-screen pb-24" style={{ paddingTop: window.innerWidth < 1024 ? '120px' : '64px' }}>
        <div className="p-4 md:p-6 lg:p-8">
          <RouteGuard currentPageName={currentPageName}>
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
          </RouteGuard>
        </div>
      </main>

      {/* Quick Access Toolbar */}
      <QuickAccessToolbar />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ErrorBoundary currentPageName={currentPageName}>
      <ModeProvider>
        <LayoutContent children={children} currentPageName={currentPageName} />
      </ModeProvider>
    </ErrorBoundary>
  );
}