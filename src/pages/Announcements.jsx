import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Megaphone,
  AlertTriangle,
  Info,
  Star,
  Bell,
  CheckCircle,
  Eye,
  Plus,
  Pin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

const priorityConfig = {
  low: { icon: Info, color: 'bg-blue-100 text-blue-700 border-blue-300', badgeColor: 'bg-blue-600' },
  medium: { icon: Bell, color: 'bg-slate-100 text-slate-700 border-slate-300', badgeColor: 'bg-slate-600' },
  high: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-700 border-amber-300', badgeColor: 'bg-amber-600' },
  urgent: { icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-300', badgeColor: 'bg-red-600' }
};

export default function Announcements() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [viewAnnouncement, setViewAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'medium',
    type: 'general',
    target_roles: [],
    requires_acknowledgment: false,
    is_pinned: false
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.filter({ status: 'published' }, '-publish_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setShowDialog(false);
      setFormData({
        title: '',
        message: '',
        priority: 'medium',
        type: 'general',
        target_roles: [],
        requires_acknowledgment: false,
        is_pinned: false
      });
    }
  });

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Announcement.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['announcements'])
  });

  const handleSubmit = () => {
    createMutation.mutate({
      ...formData,
      author_email: user?.email,
      author_name: user?.full_name || user?.email,
      publish_date: new Date().toISOString(),
      status: 'published',
      acknowledged_by: []
    });
  };

  const handleAcknowledge = (announcement) => {
    const alreadyAcknowledged = announcement.acknowledged_by?.some(a => a.email === user?.email);
    if (alreadyAcknowledged) return;

    const updatedAcknowledged = [
      ...(announcement.acknowledged_by || []),
      {
        email: user?.email,
        name: user?.full_name || user?.email,
        timestamp: new Date().toISOString()
      }
    ];

    acknowledgeMutation.mutate({
      id: announcement.id,
      data: {
        ...announcement,
        acknowledged_by: updatedAcknowledged
      }
    });
  };

  const visibleAnnouncements = announcements.filter(a => {
    if (!a.target_roles || a.target_roles.length === 0) return true;
    return a.target_roles.includes(user?.role);
  });

  const pinnedAnnouncements = visibleAnnouncements.filter(a => a.is_pinned);
  const regularAnnouncements = visibleAnnouncements.filter(a => !a.is_pinned);

  const canCreate = ['manager', 'owner', 'admin'].includes(user?.role);

  if (isLoading) return <LoadingSpinner message="Loading announcements..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Important updates and communications"
        action={canCreate ? () => setShowDialog(true) : undefined}
        actionLabel="New Announcement"
      />

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Pin className="w-4 h-4" />
            Pinned
          </h3>
          {pinnedAnnouncements.map(announcement => {
            const config = priorityConfig[announcement.priority] || priorityConfig.medium;
            const Icon = config.icon;
            const hasAcknowledged = announcement.acknowledged_by?.some(a => a.email === user?.email);

            return (
              <Card key={announcement.id} className={`${config.color} border-2`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Pin className="w-5 h-5 text-amber-600" />
                        <Badge className={config.badgeColor}>
                          {announcement.priority}
                        </Badge>
                        <Badge variant="outline">
                          {announcement.type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg mb-2">{announcement.title}</h3>
                      <p className="text-sm line-clamp-3 mb-3">{announcement.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>By: {announcement.author_name}</span>
                        <span>{format(new Date(announcement.publish_date), 'PPp')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewAnnouncement(announcement)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {announcement.requires_acknowledgment && !hasAcknowledged && (
                        <Button
                          size="sm"
                          onClick={() => handleAcknowledge(announcement)}
                          className="bg-emerald-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      {hasAcknowledged && (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Read
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Regular Announcements */}
      <div className="space-y-3">
        {regularAnnouncements.map((announcement, idx) => {
          const config = priorityConfig[announcement.priority] || priorityConfig.medium;
          const Icon = config.icon;
          const hasAcknowledged = announcement.acknowledged_by?.some(a => a.email === user?.email);

          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={hasAcknowledged ? 'opacity-75' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={config.badgeColor}>
                            {announcement.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {announcement.type?.replace('_', ' ')}
                          </Badge>
                          {hasAcknowledged && (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Read
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-base mb-1">{announcement.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {announcement.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>By: {announcement.author_name}</span>
                          <span>{format(new Date(announcement.publish_date), 'PPp')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewAnnouncement(announcement)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {announcement.requires_acknowledgment && !hasAcknowledged && (
                        <Button
                          size="sm"
                          onClick={() => handleAcknowledge(announcement)}
                          className="bg-emerald-600"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {visibleAnnouncements.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No announcements yet</p>
          </CardContent>
        </Card>
      )}

      {/* Create Announcement Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Announcement title..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Full announcement message..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="menu_update">Menu Update</SelectItem>
                    <SelectItem value="sop_change">SOP Change</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_acknowledgment}
                  onChange={(e) => setFormData({...formData, requires_acknowledgment: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Requires Acknowledgment</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({...formData, is_pinned: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Pin Announcement</span>
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-emerald-600">
                Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Announcement Dialog */}
      <Dialog open={!!viewAnnouncement} onOpenChange={() => setViewAnnouncement(null)}>
        <DialogContent className="max-w-2xl">
          {viewAnnouncement && (() => {
            const config = priorityConfig[viewAnnouncement.priority] || priorityConfig.medium;
            const Icon = config.icon;
            const hasAcknowledged = viewAnnouncement.acknowledged_by?.some(a => a.email === user?.email);

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <DialogTitle>{viewAnnouncement.title}</DialogTitle>
                  </div>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Badge className={config.badgeColor}>
                      {viewAnnouncement.priority}
                    </Badge>
                    <Badge variant="outline">
                      {viewAnnouncement.type?.replace('_', ' ')}
                    </Badge>
                    {viewAnnouncement.is_pinned && (
                      <Badge className="bg-amber-100 text-amber-700">
                        <Pin className="w-3 h-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-slate-700 whitespace-pre-wrap">{viewAnnouncement.message}</p>
                  </div>

                  <div className="text-sm text-slate-600 border-t pt-4">
                    <p>Posted by: <span className="font-semibold">{viewAnnouncement.author_name}</span></p>
                    <p>Date: <span className="font-semibold">{format(new Date(viewAnnouncement.publish_date), 'PPpp')}</span></p>
                  </div>

                  {viewAnnouncement.requires_acknowledgment && (
                    <div className="bg-slate-50 p-4 rounded-lg">
                      {hasAcknowledged ? (
                        <div className="text-emerald-700 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          <span>You have acknowledged this announcement</span>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            handleAcknowledge(viewAnnouncement);
                            setViewAnnouncement(null);
                          }}
                          className="w-full bg-emerald-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Acknowledge & Close
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}