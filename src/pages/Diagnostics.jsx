import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Copy, User, Cpu, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useMode } from '@/components/modes/ModeContext';

export default function Diagnostics() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const { currentMode } = useMode();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Check if user has access
  const hasAccess = user?.role === 'manager' || user?.role === 'owner' || user?.role === 'admin';

  const { data: errorLogs = [] } = useQuery({
    queryKey: ['appErrorLogs'],
    queryFn: () => base44.entities.AppErrorLog.list('-created_date', 10),
    enabled: hasAccess
  });

  const queryCache = queryClient.getQueryCache();
  const allQueries = queryCache.getAll();
  const activeQueries = allQueries.filter(q => q.state.fetchStatus === 'fetching').length;
  const failedQueries = allQueries.filter(q => q.state.status === 'error').length;

  const copyDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      user: {
        email: user?.email,
        role: user?.role,
        full_name: user?.full_name
      },
      mode: currentMode,
      page: window.location.pathname,
      queries: {
        total: allQueries.length,
        active: activeQueries,
        failed: failedQueries
      },
      recent_errors: errorLogs.slice(0, 5).map(e => ({
        page: e.page_name,
        message: e.error_message,
        time: e.created_date
      })),
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language
      }
    };

    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-600">Diagnostics panel is only available to managers and admins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Diagnostics</h1>
          <p className="text-slate-600 mt-1">Quick debugging and system health check</p>
        </div>
        <Button
          onClick={copyDebugInfo}
          variant="outline"
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          <Copy className="w-4 h-4 mr-2" />
          {copied ? 'Copied!' : 'Copy Debug Info'}
        </Button>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Current User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="font-semibold text-slate-900">{user.full_name || 'Unknown'}</p>
                <p className="text-sm text-slate-600">{user.email}</p>
                <Badge className="mt-1 capitalize">{user.role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Current Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Cpu className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900 text-lg capitalize">{currentMode || 'Unknown'}</p>
                <p className="text-sm text-slate-600">Active mode</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">React Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Queries:</span>
                <span className="font-semibold">{allQueries.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Active:</span>
                <Badge variant="outline" className="bg-blue-50">{activeQueries}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Failed:</span>
                <Badge variant={failedQueries > 0 ? 'destructive' : 'outline'}>
                  {failedQueries}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Recent Errors (Last 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errorLogs.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
              <p className="text-slate-600">No errors logged recently</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errorLogs.map((error) => (
                <div
                  key={error.id}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="destructive" className="text-xs">
                          {error.page_name || 'Unknown Page'}
                        </Badge>
                        {error.user_email && (
                          <span className="text-xs text-slate-600">{error.user_email}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        {error.error_message}
                      </p>
                      <p className="text-xs text-slate-600">
                        {format(new Date(error.created_date), 'dd MMM yyyy, HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                  {error.error_stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-900">
                        Show stack trace
                      </summary>
                      <pre className="mt-2 p-2 bg-slate-900 text-slate-100 rounded text-xs overflow-auto max-h-32">
                        {error.error_stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Browser Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-600">Browser Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">User Agent:</span>
              <span className="font-mono text-xs text-slate-900 max-w-md truncate">
                {navigator.userAgent}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Language:</span>
              <span className="font-semibold text-slate-900">{navigator.language}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Current Path:</span>
              <span className="font-mono text-xs text-slate-900">{window.location.pathname}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}