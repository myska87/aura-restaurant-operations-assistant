import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Link2, ListChecks } from 'lucide-react';
import SmartLinkSelector from './SmartLinkSelector';

const formats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block', 'list', 'align', 'link', 'image'
];

export default function DocumentEditor({ content, onContentChange, isSaving, documentId }) {
  const [lastSaved, setLastSaved] = useState(new Date());
  const [showLinkSelector, setShowLinkSelector] = useState(false);
  const quillRef = useRef(null);

  useEffect(() => {
    if (!isSaving) {
      setLastSaved(new Date());
    }
  }, [isSaving]);

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ]
    },
  };

  const insertChecklist = () => {
    const checklistId = `checklist-${Date.now()}`;
    const checklistHTML = `
      <div class="checklist-block" data-checklist-id="${checklistId}" style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; border-left: 4px solid #3b82f6;">
        <div style="font-weight: 600; margin-bottom: 0.5rem; color: #1e40af;">Checklist</div>
        <div class="checklist-item" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <input type="checkbox" style="width: 16px; height: 16px; cursor: pointer;" />
          <span contenteditable="true" style="flex: 1;">Item 1</span>
        </div>
        <div class="checklist-item" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <input type="checkbox" style="width: 16px; height: 16px; cursor: pointer;" />
          <span contenteditable="true" style="flex: 1;">Item 2</span>
        </div>
      </div>
    `;
    
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      if (range) {
        editor.clipboard.dangerouslyPasteHTML(range.index, checklistHTML);
      }
    }
  };

  const handleLinkSelect = (type, item) => {
    const linkText = type === 'menu' ? item.name : 
                     type === 'prep' ? item.component_name :
                     type === 'training' ? item.course_name :
                     item.title;
    
    const linkHTML = `<a href="#" data-link-type="${type}" data-link-id="${item.id}" style="color: #059669; text-decoration: underline; font-weight: 500;">${linkText}</a>`;
    
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      if (range) {
        editor.clipboard.dangerouslyPasteHTML(range.index, linkHTML);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Editor Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Saving...
              </span>
            ) : (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
          </span>
          <div className="h-4 w-px bg-slate-300" />
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowLinkSelector(true)}
            className="h-7"
          >
            <Link2 className="w-3 h-3 mr-1" />
            Link Entity
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={insertChecklist}
            className="h-7"
          >
            <ListChecks className="w-3 h-3 mr-1" />
            Add Checklist
          </Button>
        </div>
      </div>

      {/* Editor Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        <ReactQuill
          ref={quillRef}
          value={content}
          onChange={onContentChange}
          modules={modules}
          formats={formats}
          theme="snow"
          placeholder="Start typing your document..."
          className="h-full quill-editor"
        />
      </motion.div>

      <SmartLinkSelector
        open={showLinkSelector}
        onClose={() => setShowLinkSelector(false)}
        onLinkSelect={handleLinkSelect}
      />

      <style>{`
        .quill-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .quill-editor .ql-container {
          flex: 1;
          font-size: 1rem;
          line-height: 1.6;
        }
        .quill-editor .ql-editor {
          padding: 2rem;
          min-height: 600px;
        }
        .quill-editor .ql-editor.ql-blank::before {
          color: #9CA3AF;
          font-style: italic;
        }
        .quill-editor .ql-toolbar {
          border: none;
          border-bottom: 1px solid #E5E7EB;
          background: #F9FAFB;
        }
        .quill-editor .ql-toolbar button:hover,
        .quill-editor .ql-toolbar button.ql-active {
          color: #059669;
        }
        .quill-editor .ql-editor img {
          cursor: move;
          max-width: 100%;
          height: auto;
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }
        .quill-editor .ql-editor img:hover {
          border-color: #059669;
        }
        .quill-editor .ql-editor img.ql-selected {
          border-color: #059669;
          outline: 2px solid #059669;
        }
      `}</style>
    </div>
  );
}