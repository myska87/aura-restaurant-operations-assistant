import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Lock, Upload, Download, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PrivateDocumentVault({ staffId, staffName, user }) {
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('contract');
  const [docName, setDocName] = useState('');
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [visibleToManager, setVisibleToManager] = useState(false);
  const [visibleToStaff, setVisibleToStaff] = useState(false);
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isManager = user?.role === 'manager' || isAdmin;

  const { data: documents = [] } = useQuery({
    queryKey: ['staffPrivateDocs', staffId],
    queryFn: async () => {
      const docs = await base44.entities.StaffPrivateDocument.filter({ staff_id: staffId });
      return docs.filter(doc => {
        if (isAdmin) return true;
        if (isManager) return doc.visible_to_manager;
        return false;
      });
    },
    enabled: !!staffId && (isAdmin || isManager)
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.StaffPrivateDocument.create({
        ...data,
        file_url
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staffPrivateDocs']);
      base44.entities.StaffAuditLog.create({
        staff_id: staffId,
        staff_name: staffName,
        action_type: 'document_uploaded',
        action_description: `Private document uploaded: ${docName}`,
        performed_by_id: user?.id,
        performed_by_name: user?.full_name,
        performed_by_role: user?.role,
        action_date: new Date().toISOString()
      });
      setShowUpload(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => base44.entities.StaffPrivateDocument.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries(['staffPrivateDocs']);
      base44.entities.StaffAuditLog.create({
        staff_id: staffId,
        staff_name: staffName,
        action_type: 'document_deleted',
        action_description: `Private document deleted`,
        performed_by_id: user?.id,
        performed_by_name: user?.full_name,
        performed_by_role: user?.role,
        action_date: new Date().toISOString()
      });
    }
  });

  const resetForm = () => {
    setFile(null);
    setDocName('');
    setNotes('');
    setExpiryDate('');
    setVisibleToManager(false);
    setVisibleToStaff(false);
  };

  const handleUpload = () => {
    if (!file || !docName) return;
    uploadMutation.mutate({
      staff_id: staffId,
      staff_name: staffName,
      document_type: docType,
      document_name: docName,
      uploaded_date: new Date().toISOString(),
      uploaded_by_id: user?.id,
      uploaded_by_name: user?.full_name,
      notes,
      expiry_date: expiryDate || null,
      visible_to_manager: visibleToManager,
      visible_to_staff: visibleToStaff
    });
  };

  const handleDocumentAccess = async (docId, docName) => {
    await base44.entities.StaffAuditLog.create({
      staff_id: staffId,
      staff_name: staffName,
      action_type: 'document_accessed',
      action_description: `Accessed private document: ${docName}`,
      performed_by_id: user?.id,
      performed_by_name: user?.full_name,
      performed_by_role: user?.role,
      action_date: new Date().toISOString()
    });
  };

  if (!isAdmin && !isManager) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-900">
            <Lock className="w-5 h-5" />
            Private Documents (Admin Only)
          </CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => setShowUpload(true)} className="bg-red-600 hover:bg-red-700">
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-900">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Highly confidential - Access is logged
        </div>
        
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">No private documents</p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <Card key={doc.id}>
                <CardContent className="pt-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{doc.document_name}</p>
                        <Badge className="bg-red-100 text-red-700">{doc.document_type}</Badge>
                      </div>
                      <p className="text-xs text-slate-600">Uploaded {format(new Date(doc.uploaded_date), 'PP')} by {doc.uploaded_by_name}</p>
                      {doc.expiry_date && (
                        <p className="text-xs text-amber-600 mt-1">Expires: {format(new Date(doc.expiry_date), 'PP')}</p>
                      )}
                      {doc.notes && (
                        <p className="text-xs text-slate-700 mt-2">{doc.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleDocumentAccess(doc.id, doc.document_name);
                          window.open(doc.file_url, '_blank');
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate(doc.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Private Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="id_document">ID Document</SelectItem>
                  <SelectItem value="right_to_work">Right to Work</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="performance_note">Performance Note</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Document Name</Label>
              <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g., Employment Contract 2024" />
            </div>

            <div>
              <Label>File</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files[0])} />
            </div>

            <div>
              <Label>Expiry Date (Optional)</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>

            <div>
              <Label>Private Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Visible to Managers</Label>
              <Switch checked={visibleToManager} onCheckedChange={setVisibleToManager} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Visible to Staff Member</Label>
              <Switch checked={visibleToStaff} onCheckedChange={setVisibleToStaff} />
            </div>

            <Button onClick={handleUpload} disabled={!file || !docName} className="w-full">
              Upload Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}