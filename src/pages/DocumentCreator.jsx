import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, FileDown, Eye, Share2 } from 'lucide-react';
import DocumentEditor from '@/components/document/DocumentEditor';
import DocumentPropertiesPanel from '@/components/document/DocumentPropertiesPanel';
import DocumentVersionHistory from '@/components/document/DocumentVersionHistory';
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
    const docData = {
      title,
      content,
      category,
      visibility,
      tags,
      version: documentId ? existingDocument?.version : '1.0',
      status,
      author_id: user.id,
      author_name: user.full_name || user.email
    };

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
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
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
          <DocumentEditor
            content={content}
            onContentChange={setContent}
            isSaving={isSaving}
          />

          {/* Properties Panel */}
          <DocumentPropertiesPanel
            title={title}
            category={category}
            version={version}
            visibility={visibility}
            tags={tags}
            author={user?.full_name || user?.email}
            createdDate={existingDocument?.created_date}
            lastEditedDate={existingDocument?.updated_date}
            status={status}
            onTitleChange={setTitle}
            onCategoryChange={setCategory}
            onVisibilityChange={setVisibility}
            onTagAdd={handleAddTag}
            onTagRemove={handleRemoveTag}
          />
        </div>
      </div>
    </motion.div>
  );
}