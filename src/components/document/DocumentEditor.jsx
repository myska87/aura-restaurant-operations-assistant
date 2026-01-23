import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

const formats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block', 'list', 'align', 'link', 'image'
];

export default function DocumentEditor({ content, onContentChange, isSaving }) {
  const [lastSaved, setLastSaved] = useState(new Date());

  useEffect(() => {
    if (!isSaving) {
      setLastSaved(new Date());
    }
  }, [isSaving]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Editor Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Editor Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        <ReactQuill
          value={content}
          onChange={onContentChange}
          modules={modules}
          formats={formats}
          theme="snow"
          placeholder="Start typing your document..."
          className="h-full quill-editor"
        />
      </motion.div>

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