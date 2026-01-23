import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Users, FileText, CheckCircle2, AlertCircle, Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ComplianceHub() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const isAdmin = ['admin', 'owner'].includes(user?.role);
  const isManager = ['manager', 'admin', 'owner'].includes(user?.role);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: isManager
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['allOnboardingTasks'],
    queryFn: () => base44.entities.OnboardingTask.list('order_index')
  });

  const { data: allCompletions = [] } = useQuery({
    queryKey: ['allCompletions'],
    queryFn: () => base44.entities.UserTaskCompletion.list('-completed_date')
  });

  const { data: allAcknowledgements = [] } = useQuery({
    queryKey: ['allAcknowledgements'],
    queryFn: () => base44.entities.DocumentAcknowledgement.list('-acknowledged_date')
  });

  const { data: complianceLogs = [] } = useQuery({
    queryKey: ['complianceLogs'],
    queryFn: () => base44.entities.ComplianceLog.list('-action_timestamp', 100),
    enabled: isAdmin
  });

  if (!isManager) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-600">Access restricted to managers and admins</p>
        </CardContent>
      </Card>
    );
  }

  const getUserCompletionRate = (userId) => {
    const userCompletions = allCompletions.filter(c => c.user_id === userId && c.completed);
    const userTasks = allTasks.filter(t => t.target_roles.includes('all') || t.target_roles.includes('staff'));
    return userTasks.length > 0 ? (userCompletions.length / userTasks.length) * 100 : 0;
  };

  const filteredUsers = allUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const overallCompletionRate = allUsers.length > 0
    ? allUsers.reduce((sum, u) => sum + getUserCompletionRate(u.id), 0) / allUsers.length
    : 0;

  const fullyOnboardedCount = allUsers.filter(u => getUserCompletionRate(u.id) === 100).length;
  const partialOnboardedCount = allUsers.filter(u => {
    const rate = getUserCompletionRate(u.id);
    return rate > 0 && rate < 100;
  }).length;
  const notStartedCount = allUsers.filter(u => getUserCompletionRate(u.id) === 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Onboarding Hub"
        description="Monitor training completion and document acknowledgements"
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Overall Completion</p>
                <p className="text-3xl font-bold text-emerald-600">{Math.round(overallCompletionRate)}%</p>
              </div>
              <Shield className="w-10 h-10 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Fully Onboarded</p>
                <p className="text-3xl font-bold text-green-600">{fullyOnboardedCount}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">In Progress</p>
                <p className="text-3xl font-bold text-amber-600">{partialOnboardedCount}</p>
              </div>
              <Users className="w-10 h-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Not Started</p>
                <p className="text-3xl font-bold text-red-600">{notStartedCount}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Team Compliance</TabsTrigger>
          <TabsTrigger value="documents">Document Tracking</TabsTrigger>
          {isAdmin && <TabsTrigger value="logs">Audit Logs</TabsTrigger>}
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Staff Completion Status</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.map(u => {
                  const rate = getUserCompletionRate(u.id);
                  const userCompletions = allCompletions.filter(c => c.user_id === u.id && c.completed).length;
                  
                  return (
                    <Card key={u.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">{u.full_name}</p>
                            <p className="text-sm text-slate-600">{u.email}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${rate === 100 ? 'bg-green-500' : rate > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{Math.round(rate)}%</span>
                            </div>
                          </div>
                          <Badge className={rate === 100 ? 'bg-green-100 text-green-700' : rate > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                            {userCompletions} / {allTasks.length} tasks
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Acknowledgement Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {allAcknowledgements.map(ack => (
                    <Card key={ack.id}>
                      <CardContent className="pt-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">{ack.user_name}</p>
                            <p className="text-sm text-slate-600">{ack.document_title}</p>
                            <div className="mt-2 flex gap-2">
                              {ack.viewed && <Badge className="bg-blue-100 text-blue-700">Viewed</Badge>}
                              {ack.acknowledged && <Badge className="bg-green-100 text-green-700">Acknowledged</Badge>}
                              {ack.signed && <Badge className="bg-purple-100 text-purple-700">Signed</Badge>}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500">
                            {ack.signed_date && format(new Date(ack.signed_date), 'PP')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Audit Log (Read-Only)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {complianceLogs.map(log => (
                      <Card key={log.id} className="bg-slate-50">
                        <CardContent className="pt-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-slate-700 text-white">{log.action_type}</Badge>
                                <p className="text-sm font-medium">{log.user_name}</p>
                              </div>
                              <p className="text-sm text-slate-700">{log.action_description}</p>
                              {log.reference_name && (
                                <p className="text-xs text-slate-500 mt-1">Reference: {log.reference_name}</p>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {format(new Date(log.action_timestamp), 'PPp')}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}