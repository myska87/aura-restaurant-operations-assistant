import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu as MenuIcon, ArrowLeft, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import QuickAccessToolbar from '@/components/ui/QuickAccessToolbar';
import { ModeProvider, useMode, MODES } from '@/components/modes/ModeContext';
import ModeSelector from '@/components/modes/ModeSelector';
import ErrorBoundary from '@/components/ErrorBoundary';
import RouteGuard from '@/components/RouteGuard';
import NavContent from '@/components/NavContent';

function LayoutContent({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { currentMode } = useMode();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        // Not authenticated
      }
    };
    loadUser();
  }, [currentPageName]);

  // Redirect Dashboard to mode's home page
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

  const NotificationDropdown = ({ align = 'end', scrollHeight = 'h-80' }) => (
    <DropdownMenu>
      <DropdownMenuContent align={align} className="w-80">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              {notifications.length} new
            </Badge>
          )}
        </div>
        <ScrollArea className={scrollHeight}>
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
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <style>{`
        :root {
          --gold-primary: #D4AF37;
          --gold-light: #F4D03F;
          --green-primary: #2E7D32;
          --green-light: #4CAF50;
        }
        header { pointer-events: auto !important; }
        header button, header [role="button"], header a, header [role="menu"] {
          pointer-events: auto !important;
        }
        main > * { position: relative; z-index: 1; }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:overflow-y-auto bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 shadow-2xl">
        <NavContent
          user={user}
          currentPageName={currentPageName}
          onCloseSidebar={() => {}}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[9999] bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm pointer-events-auto">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900">
                <NavContent
                  user={user}
                  currentPageName={currentPageName}
                  onCloseSidebar={() => setSidebarOpen(false)}
                  onLogout={handleLogout}
                />
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-slate-800">AURA</span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <Button variant="ghost" size="icon" className="relative" asChild>
                <DropdownMenu>
                  <DropdownMenuContent align="end" className="w-80">
                    <ScrollArea className="h-64">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">No new notifications</div>
                      ) : notifications.map((notif) => (
                        <DropdownMenuItem key={notif.id} className="p-3 cursor-pointer">
                          <div>
                            <p className="font-medium text-sm">{notif.title}</p>
                            <p className="text-xs text-slate-500">{notif.message}</p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Button>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuContent align="end" className="w-80">
                <ScrollArea className="h-64">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">No new notifications</div>
                  ) : notifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} className="p-3 cursor-pointer">
                      <div>
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-xs text-slate-500">{notif.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="relative" onClick={() => {}}>
              <Bell className="w-5 h-5 text-slate-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Button>
          </div>
        </div>
        <div className="px-4 pb-3">
          <ModeSelector user={user} />
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-72 right-0 z-[9999] h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm items-center justify-between px-8 pointer-events-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-300" />
          <h1 className="text-xl font-semibold text-slate-800 capitalize">
            {currentPageName?.replace(/([A-Z])/g, ' $1').trim() || 'Dashboard'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <ModeSelector user={user} />
          <DropdownMenu>
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
                ) : notifications.map((notif) => (
                  <DropdownMenuItem key={notif.id} className="p-4 cursor-pointer border-b last:border-0">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
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
        </div>
      </header>

      {/* Main Content */}
      <main
        className="lg:pl-72 min-h-screen pb-24"
        style={{ paddingTop: window.innerWidth < 1024 ? '120px' : '64px' }}
      >
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