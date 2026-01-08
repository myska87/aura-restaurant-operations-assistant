import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  FolderOpen,
  FileText,
  FilePlus,
  Upload,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  Lock,
  Users,
  Shield,
  FileCheck,
  Signature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const categories = [
  { value: 'policies', label: 'Policies', icon: Shield },
  { value: 'hr', label: 'HR', icon: Users },
  { value: 'manuals', label: 'Manuals', icon: FileText },
  { value: 'quality', label: 'Quality', icon: FileCheck },
  { value: 'safety', label: 'Safety', icon: Lock },
  { value: 'other', label: 'Other', icon: FolderOpen }
];

const confidentialityLevels = [
  { value: 'public', label: 'Public', color: 'bg-green-100 text-green-700' },
  { value: 'staff_only', label: 'Staff Only', color: 'bg-blue-100 text-blue-700' },
  { value: 'managers_only', label: 'Managers Only', color: 'bg-amber-100 text-amber-700' },
  { value: 'owners_only', label: 'Owners Only', color: 'bg-red-100 text-red-700' }
];

export default function Documents() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [uploading, setUploading] = useState(false);

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

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date'),
  });

  const { data: signatures = [] } = useQuery({
    queryKey: ['documentSignatures'],
    queryFn: () => base44.entities.DocumentSignature.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      setShowForm(false);
      setEditingDoc(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      setShowForm(false);
      setEditingDoc(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['documents'])
  });

  const signMutation = useMutation({
    mutationFn: (docId) => base44.entities.DocumentSignature.create({
      document_id: docId,
      document_title: documents.find(d => d.id === docId)?.title,
      staff_id: user?.id || '',
      staff_name: user?.full_name || user?.email,
      staff_email: user?.email,
      signed_date: new Date().toISOString(),
      version_signed: documents.find(d => d.id === docId)?.version
    }),
    onSuccess: () => queryClient.invalidateQueries(['documentSignatures'])
  });

  const canViewDocument = (doc) => {
    if (!user) return false;
    if (doc.confidentiality === 'public') return true;
    if (doc.confidentiality === 'staff_only') return true;
    if (doc.confidentiality === 'managers_only') return ['manager', 'owner', 'admin'].includes(user.role);
    if (doc.confidentiality === 'owners_only') return ['owner', 'admin'].includes(user.role);
    return true;
  };

  const filteredDocuments = documents.filter(doc => {
    if (!canViewDocument(doc)) return false;
    const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getDocSignatures = (docId) => {
    return signatures.filter(s => s.document_id === docId);
  };

  const hasUserSigned = (docId) => {
    return signatures.some(s => s.document_id === docId && s.staff_email === user?.email);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    let fileUrl = editingDoc?.file_url;
    const fileInput = e.target.querySelector('input[type="file"]');
    if (fileInput?.files?.[0]) {
      const uploadedUrl = await handleFileUpload({ target: fileInput });
      if (uploadedUrl) fileUrl = uploadedUrl;
    }
    
    const data = {
      title: formData.get('title'),
      content: formData.get('content'),
      category: formData.get('category'),
      confidentiality: formData.get('confidentiality'),
      status: formData.get('status'),
      requires_signature: formData.get('requires_signature') === 'on',
      file_url: fileUrl,
      version: editingDoc?.version || '1.0'
    };
    
    if (editingDoc) {
      updateMutation.mutate({ id: editingDoc.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const statusColors = {
    draft: 'bg-amber-100 text-amber-700',
    published: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-slate-100 text-slate-600'
  };

  if (isLoading) return <LoadingSpinner message="Loading documents..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Manager"
        description={`${documents.length} documents`}
        action={() => { setEditingDoc(null); setShowForm(true); }}
        actionLabel="Add Document"
        actionIcon={FilePlus}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filterCategory} onValueChange={setFilterCategory}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents found"
          description="Start by adding your first document or policy."
          action={() => setShowForm(true)}
          actionLabel="Add Document"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredDocuments.map((doc, index) => {
              const categoryInfo = categories.find(c => c.value === doc.category);
              const CategoryIcon = categoryInfo?.icon || FileText;
              const confidentiality = confidentialityLevels.find(c => c.value === doc.confidentiality);
              const sigCount = getDocSignatures(doc.id).length;
              
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setViewingDoc(doc)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingDoc(doc); setShowForm(true); }}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        {doc.file_url && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(doc.file_url, '_blank'); }}>
                            <Download className="w-4 h-4 mr-2" /> Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(doc.id); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">{doc.title}</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={statusColors[doc.status]}>
                      {doc.status}
                    </Badge>
                    <Badge className={confidentiality?.color}>
                      {confidentiality?.label}
                    </Badge>
                    <Badge variant="outline">v{doc.version}</Badge>
                  </div>
                  
                  {doc.requires_signature && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <Signature className="w-3 h-3" />
                      {sigCount} signature(s)
                      {!hasUserSigned(doc.id) && (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                          Signature required
                        </Badge>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Document Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDoc ? 'Edit Document' : 'Add Document'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input name="title" defaultValue={editingDoc?.title} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select name="category" defaultValue={editingDoc?.category || 'policies'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editingDoc?.status || 'draft'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Confidentiality</Label>
              <Select name="confidentiality" defaultValue={editingDoc?.confidentiality || 'staff_only'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {confidentialityLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Content</Label>
              <Textarea name="content" defaultValue={editingDoc?.content} rows={8} placeholder="Document content..." />
            </div>
            
            <div>
              <Label>Upload File (PDF, DOCX)</Label>
              <Input type="file" accept=".pdf,.docx,.doc" />
              {editingDoc?.file_url && (
                <p className="text-xs text-slate-500 mt-1">Current file attached</p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Switch name="requires_signature" defaultChecked={editingDoc?.requires_signature} id="requires_signature" />
              <Label htmlFor="requires_signature">Requires staff signature</Label>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending || uploading}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700"
              >
                {uploading ? 'Uploading...' : editingDoc ? 'Update' : 'Add'} Document
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingDoc && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingDoc.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColors[viewingDoc.status]}>
                    {viewingDoc.status}
                  </Badge>
                  <Badge className={confidentialityLevels.find(c => c.value === viewingDoc.confidentiality)?.color}>
                    {confidentialityLevels.find(c => c.value === viewingDoc.confidentiality)?.label}
                  </Badge>
                  <Badge variant="outline">v{viewingDoc.version}</Badge>
                </div>
                
                {viewingDoc.content && (
                  <div className="bg-slate-50 rounded-xl p-4 whitespace-pre-wrap text-slate-600">
                    {viewingDoc.content}
                  </div>
                )}
                
                {viewingDoc.file_url && (
                  <Button variant="outline" onClick={() => window.open(viewingDoc.file_url, '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Attachment
                  </Button>
                )}
                
                {viewingDoc.requires_signature && !hasUserSigned(viewingDoc.id) && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-amber-800 font-medium mb-3">This document requires your signature</p>
                    <Button 
                      onClick={() => signMutation.mutate(viewingDoc.id)}
                      disabled={signMutation.isPending}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Signature className="w-4 h-4 mr-2" />
                      Sign Document
                    </Button>
                  </div>
                )}
                
                {viewingDoc.requires_signature && hasUserSigned(viewingDoc.id) && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <p className="text-emerald-800 flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      You have signed this document
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setViewingDoc(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}