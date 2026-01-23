import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Tag, FileText, Link2, RefreshCw, FileSignature, CalendarClock, CheckSquare } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import ImageControlPanel from './ImageControlPanel';

const CATEGORIES = [
  { value: 'policies', label: 'Policies' },
  { value: 'hr', label: 'HR' },
  { value: 'manuals', label: 'Manuals' },
  { value: 'quality', label: 'Quality' },
  { value: 'safety', label: 'Safety' },
  { value: 'operations', label: 'Operations' },
  { value: 'training', label: 'Training' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'other', label: 'Other' }
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', icon: '🌐' },
  { value: 'staff_only', label: 'Staff Only', icon: '👥' },
  { value: 'managers_only', label: 'Managers Only', icon: '👔' },
  { value: 'owners_only', label: 'Owners Only', icon: '🔒' }
];

export default function DocumentPropertiesPanel({
  title,
  category,
  version,
  visibility,
  tags = [],
  author,
  createdDate,
  lastEditedDate,
  onTitleChange,
  onCategoryChange,
  onVisibilityChange,
  onTagAdd,
  onTagRemove,
  status,
  onStatusChange,
  requiresReacknowledgement = false,
  onRequiresReacknowledgementChange,
  requiresSignature = false,
  onRequiresSignatureChange,
  nextReviewDate = '',
  onNextReviewDateChange,
  selectedImage = null,
  onImageRotate,
  onImageAlign,
  onImageDelete,
  onImageSizeChange
}) {
  const [newTag, setNewTag] = React.useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      onTagAdd(newTag.trim());
      setNewTag('');
    }
  };

  return (
    <div className="w-72 bg-slate-50 border-l border-slate-200 overflow-y-auto space-y-4 p-4">
      {/* Title */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Document Title</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter document title..."
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Category & Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Category & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs font-semibold mb-1 block">Category</Label>
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1 block">Status</Label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Draft
                  </span>
                </SelectItem>
                <SelectItem value="under_review">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Under Review
                  </span>
                </SelectItem>
                <SelectItem value="approved">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Approved
                  </span>
                </SelectItem>
                <SelectItem value="archived">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Archived
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              Only approved documents can be assigned & signed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Visibility */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={visibility} onValueChange={onVisibilityChange}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISIBILITY_OPTIONS.map(vis => (
                <SelectItem key={vis.value} value={vis.value}>
                  {vis.icon} {vis.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Compliance Settings */}
      <Card className="border-amber-200 bg-amber-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-600" />
            Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-xs font-semibold">Require Re-Read on Update</Label>
              <p className="text-xs text-slate-600 mt-1">Users must re-acknowledge when document changes</p>
            </div>
            <Switch
              checked={requiresReacknowledgement}
              onCheckedChange={onRequiresReacknowledgementChange}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex-1">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <FileSignature className="w-3 h-3" />
                Requires Signature
              </Label>
              <p className="text-xs text-slate-600 mt-1">Policy document requiring digital signature</p>
            </div>
            <Switch
              checked={requiresSignature}
              onCheckedChange={onRequiresSignatureChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Review Schedule */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-blue-600" />
            Review Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="text-xs font-semibold">Next Review Date</Label>
            <p className="text-xs text-slate-600 mt-1 mb-2">Task created 7 days before review</p>
            <Input
              type="date"
              value={nextReviewDate}
              onChange={(e) => onNextReviewDateChange(e.target.value)}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Version */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Version Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Current Version</span>
            <Badge variant="outline">{version}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-600">
          {author && <div><span className="font-semibold">Author:</span> {author}</div>}
          {createdDate && <div><span className="font-semibold">Created:</span> {format(new Date(createdDate), 'MMM d, yyyy')}</div>}
          {lastEditedDate && <div><span className="font-semibold">Last Edited:</span> {format(new Date(lastEditedDate), 'MMM d, yyyy HH:mm')}</div>}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Keywords & Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add keyword..."
              className="text-xs"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button size="sm" onClick={handleAddTag} variant="outline">Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
                <button
                  onClick={() => onTagRemove(idx)}
                  className="ml-1 hover:text-slate-600"
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
          <p className="text-xs text-slate-500">Keywords improve search & discoverability</p>
        </CardContent>
      </Card>

      {/* Image Controls */}
      <ImageControlPanel
        selectedImage={selectedImage}
        onRotate={onImageRotate}
        onAlign={onImageAlign}
        onDelete={onImageDelete}
        onSizeChange={onImageSizeChange}
      />
    </div>
  );
}