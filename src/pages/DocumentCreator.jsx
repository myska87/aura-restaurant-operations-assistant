import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, FileDown, Eye, Share2, X, Copy, Check } from 'lucide-react';
import DocumentEditor from '@/components/document/DocumentEditor';
import DocumentPropertiesPanel from '@/components/document/DocumentPropertiesPanel';
import DocumentVersionHistory from '@/components/document/DocumentVersionHistory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AUTO_SAVE_INTERVAL = 10000; // 10 seconds

export default function DocumentCreator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const autoSaveTimer = useRef(null);

  const documentId = searchParams.get('id');
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Document state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('policies');
  const [visibility, setVisibility] = useState('staff_only');
  const [tags, setTags] = useState([]);
  const [version, setVersion] = useState('1.0');
  const [status, setStatus] = useState('draft');
  const [showPreview, setShowPreview] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requiresReacknowledgement, setRequiresReacknowledgement] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [nextReviewDate, setNextReviewDate] = useState('');

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  // Load existing document
  const { data: existingDocument, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => base44.entities.Document.list().then(
      docs => docs.find(d => d.id === documentId)
    ),
    enabled: !!documentId
  });

  useEffect(() => {
    if (existingDocument) {
      setTitle(existingDocument.title);
      setContent(existingDocument.content || '');
      setCategory(existingDocument.category);
      setVisibility(existingDocument.visibility);
      setTags(existingDocument.tags || []);
      setVersion(existingDocument.version);
      setStatus(existingDocument.status);
      setRequiresReacknowledgement(existingDocument.requires_reacknowledgement || false);
      setRequiresSignature(existingDocument.requires_signature || false);
      setNextReviewDate(existingDocument.next_review_date || '');
    }
  }, [existingDocument]);

  // Save/Update mutation
  const saveDocumentMutation = useMutation({
    mutationFn: async (docData) => {
      if (documentId) {
        return base44.entities.Document.update(documentId, docData);
      } else {
        return base44.entities.Document.create(docData);
      }
    },
    onSuccess: (savedDoc) => {
      queryClient.invalidateQueries(['documents']);
      setIsSaving(false);
      if (!documentId) {
        navigate(`/app/DocumentCreator?id=${savedDoc.id}`);
      }
    }
  });

  // Auto-save effect
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      if (title && content && user) {
        handleSave();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [title, content, category, visibility, tags]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    // Auto-increment version if content changed
    let newVersion = documentId ? existingDocument?.version : '1.0';
    if (documentId && existingDocument?.content !== content) {
      const [major, minor] = (existingDocument?.version || '1.0').split('.').map(Number);
      newVersion = `${major}.${minor + 1}`;
    }
    
    const docData = {
      title,
      content,
      category,
      visibility,
      tags,
      version: newVersion,
      status,
      author_id: user.id,
      author_name: user.full_name || user.email,
      requires_reacknowledgement: requiresReacknowledgement,
      requires_signature: requiresSignature,
      next_review_date: nextReviewDate || null
    };

    // Create version snapshot
    if (documentId && existingDocument?.content !== content) {
      await base44.entities.DocumentVersion.create({
        document_id: documentId,
        document_title: title,
        version_number: newVersion,
        content_snapshot: content,
        change_summary: 'Content updated',
        created_by_id: user.id,
        created_by_name: user.full_name || user.email,
        change_type: 'content_update'
      });

      // Log audit
      await base44.entities.AuditLog.create({
        action: 'document_edited',
        entity_type: 'Document',
        entity_id: documentId,
        user_id: user.id,
        user_name: user.full_name || user.email,
        details: `Document "${title}" updated to version ${newVersion}`,
        timestamp: new Date().toISOString()
      });
    }

    // If updating and requires_reacknowledgement is enabled, flag all existing acknowledgements
    if (documentId && requiresReacknowledgement && existingDocument?.content !== content) {
      const existingAcks = await base44.entities.DocumentAcknowledgement.filter({ document_id: documentId });
      for (const ack of existingAcks) {
        await base44.entities.DocumentAcknowledgement.update(ack.id, { requires_reacknowledgement: true });
      }
    }

    // Create review task if review date is set
    if (nextReviewDate) {
      const reviewDate = new Date(nextReviewDate);
      const taskDate = new Date(reviewDate);
      taskDate.setDate(taskDate.getDate() - 7); // 7 days before review
      
      if (taskDate > new Date()) {
        await base44.entities.Task.create({
          title: `Review Document: ${title}`,
          category: 'admin',
          description: `Document review required by ${reviewDate.toLocaleDateString()}`,
          due_date: taskDate.toISOString().split('T')[0],
          assigned_to: user.email,
          status: 'pending',
          priority: 'medium'
        });
      }
    }

    saveDocumentMutation.mutate(docData);
  };

  const handleAddTag = (newTag) => {
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
  };

  const handleRemoveTag = (idx) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const handleCopyShareLink = () => {
    if (documentId) {
      const shareLink = `${window.location.origin}/app/Documents?share=${documentId}`;
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen bg-white overflow-hidden"
    >
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/app/Documents')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-slate-900 max-w-md truncate">
              {title || 'Untitled Document'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {documentId && <DocumentVersionHistory documentId={documentId} currentVersion={version} />}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Close Preview' : 'Preview'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowShare(true)}
              disabled={!documentId}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title || !content}
              className="bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Editor Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {showPreview ? (
            // Preview Mode
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="max-w-4xl mx-auto p-8">
                <div className="mb-8 pb-8 border-b border-slate-200">
                  <h1 className="text-4xl font-bold text-slate-900 mb-4">{title}</h1>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
              </div>
            </div>
          ) : (
            <DocumentEditor
              content={content}
              onContentChange={setContent}
              isSaving={isSaving}
              documentId={documentId}
            />
          )}

          {/* Properties Panel */}
          {!showPreview && <DocumentPropertiesPanel
            title={title}
            category={category}
            version={version}
            visibility={visibility}
            tags={tags}
            author={user?.full_name || user?.email}
            createdDate={existingDocument?.created_date}
            lastEditedDate={existingDocument?.updated_date}
            status={status}
            onStatusChange={setStatus}
            requiresReacknowledgement={requiresReacknowledgement}
            requiresSignature={requiresSignature}
            nextReviewDate={nextReviewDate}
            onTitleChange={setTitle}
            onCategoryChange={setCategory}
            onVisibilityChange={setVisibility}
            onTagAdd={handleAddTag}
            onTagRemove={handleRemoveTag}
            onRequiresReacknowledgementChange={setRequiresReacknowledgement}
            onRequiresSignatureChange={setRequiresSignature}
            onNextReviewDateChange={setNextReviewDate}
          />}
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Who can access?</label>
              <Badge className="bg-blue-100 text-blue-800">{visibility === 'public' ? '🌐 Public' : visibility === 'staff_only' ? '👥 Staff Only' : visibility === 'managers_only' ? '👔 Managers Only' : '🔒 Owners Only'}</Badge>
              <p className="text-xs text-slate-500 mt-2">Set visibility in the properties panel to change access level.</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={documentId ? `${window.location.origin}/app/Documents?share=${documentId}` : ''}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                />
                <Button
                  size="sm"
                  onClick={handleCopyShareLink}
                  className={copied ? 'bg-emerald-600' : 'bg-blue-600'}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Share this link with your team members.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}