import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, QrCode, Link as LinkIcon, Copy, CheckCircle, Download, Send } from 'lucide-react';
import { format, addDays } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Invitations() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '',
    role: 'user',
    message: '',
    method: 'email'
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

  const { data: invitations = [] } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => base44.entities.Invitation.list('-created_date', 100),
    enabled: !!user
  });

  const createInvitationMutation = useMutation({
    mutationFn: async (data) => {
      const inviteCode = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const appUrl = window.location.origin;
      const inviteLink = `${appUrl}/accept-invite/${inviteCode}`;
      
      // Generate QR code using canvas
      const qrData = await generateQRCode(inviteLink);
      
      const invitation = await base44.entities.Invitation.create({
        email: data.email,
        invited_by: user.email,
        invited_by_name: user.full_name || user.email,
        role: data.role,
        invitation_code: inviteCode,
        invitation_link: inviteLink,
        qr_code_data: qrData,
        expires_at: addDays(new Date(), 7).toISOString(),
        message: data.message
      });

      // Send email if method is email
      if (data.method === 'email') {
        await base44.integrations.Core.SendEmail({
          to: data.email,
          subject: `You're invited to join ${user.full_name || 'our team'} on AURA`,
          body: `
Hello!

${user.full_name || user.email} has invited you to join the AURA Restaurant Operations platform.

${data.message ? `Personal message: "${data.message}"` : ''}

Click here to accept your invitation:
${inviteLink}

This invitation expires in 7 days.

Best regards,
AURA Team
          `
        });
      }

      return invitation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['invitations']);
      setShowDialog(false);
      setSelectedInvite(data);
      setFormData({ email: '', role: 'user', message: '', method: 'email' });
    }
  });

  const generateQRCode = async (text) => {
    const canvas = document.createElement('canvas');
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Simple QR code placeholder - just encode text
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    ctx.font = '10px monospace';
    ctx.fillText(text.substr(0, 40), 10, 100);
    
    return canvas.toDataURL();
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = (invite) => {
    const a = document.createElement('a');
    a.href = invite.qr_code_data;
    a.download = `invitation-${invite.email}.png`;
    a.click();
  };

  if (!user) return <LoadingSpinner />;

  const canManage = ['admin', 'manager', 'owner'].includes(user.role);

  if (!canManage) {
    return (
      <div className="py-12 text-center">
        <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
        <p className="text-slate-600">Only administrators can send invitations.</p>
      </div>
    );
  }

  const pendingInvites = invitations.filter(i => i.status === 'pending');
  const acceptedInvites = invitations.filter(i => i.status === 'accepted');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Invitations"
        description="Invite new members via email, QR code, or shareable link"
        action={() => setShowDialog(true)}
        actionLabel="Send Invitation"
        actionIcon={Send}
      />

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invitations.length}</p>
                <p className="text-xs text-slate-500">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingInvites.length}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{acceptedInvites.length}</p>
                <p className="text-xs text-slate-500">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invitations.map(invite => (
              <Card key={invite.id} className="bg-slate-50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold">{invite.email}</p>
                        <Badge className={
                          invite.status === 'accepted' ? 'bg-emerald-600' :
                          invite.status === 'expired' ? 'bg-slate-600' :
                          'bg-amber-600'
                        }>
                          {invite.status}
                        </Badge>
                        <Badge variant="outline">{invite.role}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        Invited by {invite.invited_by_name} • {format(new Date(invite.created_date), 'MMM d, HH:mm')}
                      </p>
                      {invite.status === 'pending' && (
                        <p className="text-xs text-amber-700 mt-1">
                          Expires {format(new Date(invite.expires_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    {invite.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(invite.invitation_link)}
                        >
                          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInvite(invite)}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {invitations.length === 0 && (
              <p className="text-center text-slate-500 py-8">No invitations sent yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Invitation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send New Invitation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Email Address</label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Role</label>
              <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Delivery Method</label>
              <Select value={formData.method} onValueChange={(v) => setFormData({...formData, method: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="link">🔗 Link Only</SelectItem>
                  <SelectItem value="qr">📱 QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Personal Message (Optional)</label>
              <Textarea
                placeholder="Add a personal welcome message..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={3}
              />
            </div>

            <Button
              onClick={() => createInvitationMutation.mutate(formData)}
              disabled={!formData.email || createInvitationMutation.isPending}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!selectedInvite} onOpenChange={() => setSelectedInvite(null)}>
        <DialogContent>
          {selectedInvite && (
            <>
              <DialogHeader>
                <DialogTitle>Invitation Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-48 h-48 mx-auto bg-white p-4 rounded-xl border-2">
                    {selectedInvite.qr_code_data && (
                      <img src={selectedInvite.qr_code_data} alt="QR Code" className="w-full h-full" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-3">Scan to accept invitation</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Invitation Link</p>
                  <div className="flex gap-2">
                    <Input value={selectedInvite.invitation_link} readOnly className="text-xs" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(selectedInvite.invitation_link)}
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => downloadQR(selectedInvite)}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}