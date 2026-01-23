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
import { X, Tag, FileText, Link2, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

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
  requiresReacknowledgement = false,
  onRequiresReacknowledgementChange
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
          <CardTitle className="text-sm">Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
          {status && (
            <Badge className={
              status === 'published' ? 'bg-emerald-100 text-emerald-800' :
              status === 'draft' ? 'bg-amber-100 text-amber-800' :
              'bg-slate-100 text-slate-800'
            }>
              {status}
            </Badge>
          )}
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
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-xs font-semibold">Require Re-Read on Update</Label>
              <p className="text-xs text-slate-600 mt-1">All users must re-acknowledge when document changes</p>
            </div>
            <Switch
              checked={requiresReacknowledgement}
              onCheckedChange={onRequiresReacknowledgementChange}
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
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
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
        </CardContent>
      </Card>
    </div>
  );
}