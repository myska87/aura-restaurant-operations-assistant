import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import {
  Plus,
  GripVertical,
  Trash2,
  Save,
  ArrowLeft,
  Eye,
  CheckCircle,
  Type,
  Camera,
  FileSignature,
  Hash,
  Calendar,
  List,
  Upload,
  AlignLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const QUESTION_TYPES = [
  { id: 'yes_no_na', label: 'Yes/No/N.A.', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'text', label: 'Text Field', icon: Type, color: 'bg-blue-100 text-blue-700' },
  { id: 'photo', label: 'Photo Upload', icon: Camera, color: 'bg-purple-100 text-purple-700' },
  { id: 'signature', label: 'Signature', icon: FileSignature, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'numeric', label: 'Number', icon: Hash, color: 'bg-amber-100 text-amber-700' },
  { id: 'date', label: 'Date/Time', icon: Calendar, color: 'bg-pink-100 text-pink-700' },
  { id: 'dropdown', label: 'Dropdown', icon: List, color: 'bg-cyan-100 text-cyan-700' },
  { id: 'file', label: 'File Upload', icon: Upload, color: 'bg-orange-100 text-orange-700' },
  { id: 'section_header', label: 'Section Header', icon: AlignLeft, color: 'bg-slate-100 text-slate-700' }
];

export default function ChecklistBuilder() {
  const [user, setUser] = useState(null);
  const [checklistId, setChecklistId] = useState(null);
  const [formData, setFormData] = useState({
    checklist_name: '',
    checklist_category: 'custom',
    version: '1.0',
    assigned_station: 'all',
    frequency: 'daily',
    items: [],
    is_published: false
  });
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    
    // Check if editing existing checklist
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) setChecklistId(id);
  }, []);

  const { data: existingChecklist, isLoading } = useQuery({
    queryKey: ['checklist', checklistId],
    queryFn: async () => {
      const results = await base44.entities.ChecklistMaster.filter({ id: checklistId });
      return results?.[0] || null;
    },
    enabled: !!checklistId
  });

  useEffect(() => {
    if (existingChecklist && existingChecklist.items) {
      setFormData({
        ...existingChecklist,
        items: existingChecklist.items || []
      });
    }
  }, [existingChecklist]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        created_by_name: user?.full_name || user?.email,
        created_by_email: user?.email
      };

      if (checklistId) {
        return base44.entities.ChecklistMaster.update(checklistId, payload);
      } else {
        return base44.entities.ChecklistMaster.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['checklists-library']);
      navigate(createPageUrl('ChecklistLibrary'));
    }
  });

  const addQuestion = (type) => {
    const currentItems = formData.items || [];
    const newItem = {
      item_id: `item_${Date.now()}`,
      question_type: type,
      question_text: '',
      required: true,
      auto_fail: false,
      dropdown_options: [],
      order: currentItems.length
    };

    setFormData({
      ...formData,
      items: [...currentItems, newItem]
    });
    setShowQuestionPicker(false);
  };

  const updateQuestion = (index, updates) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], ...updates };
    setFormData({ ...formData, items: newItems });
  };

  const deleteQuestion = (index) => {
    const newItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(formData.items || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const reorderedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setFormData({ ...formData, items: reorderedItems });
  };

  const handleSave = (publish = false) => {
    if (!formData.checklist_name.trim()) {
      alert('Please enter a checklist name');
      return;
    }
    if (formData.items.length === 0) {
      alert('Please add at least one question');
      return;
    }

    saveMutation.mutate({ ...formData, is_published: publish });
  };

  if (!user || isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('ChecklistLibrary'))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saveMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Checklist Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Checklist Name *</Label>
            <Input
              value={formData.checklist_name}
              onChange={(e) => setFormData({ ...formData, checklist_name: e.target.value })}
              placeholder="e.g., Morning Opening Checklist"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Category *</Label>
              <Select
                value={formData.checklist_category}
                onValueChange={(v) => setFormData({ ...formData, checklist_category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="opening">Opening</SelectItem>
                  <SelectItem value="closing">Closing</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                  <SelectItem value="hygiene">Hygiene</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assigned Station</Label>
              <Select
                value={formData.assigned_station}
                onValueChange={(v) => setFormData({ ...formData, assigned_station: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stations</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="front">Front of House</SelectItem>
                  <SelectItem value="manager">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(v) => setFormData({ ...formData, frequency: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="one_time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Version</Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="1.0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Questions ({formData.items?.length || 0})</CardTitle>
            <Button
              onClick={() => setShowQuestionPicker(!showQuestionPicker)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question Type Picker */}
          {showQuestionPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg"
            >
              {QUESTION_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => addQuestion(type.id)}
                    className={`p-3 rounded-lg ${type.color} hover:opacity-80 transition-opacity text-left`}
                  >
                    <Icon className="w-5 h-5 mb-2" />
                    <p className="font-semibold text-sm">{type.label}</p>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Questions List */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {(formData.items || []).map((item, index) => (
                    <Draggable key={item.item_id} draggableId={item.item_id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-white border-2 border-slate-200 rounded-lg p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div {...provided.dragHandleProps} className="mt-2 cursor-grab">
                              <GripVertical className="w-5 h-5 text-slate-400" />
                            </div>

                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge className="capitalize">
                                  {item.question_type.replace('_', ' ')}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => deleteQuestion(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {item.question_type === 'section_header' ? (
                                <Input
                                  value={item.section_header || ''}
                                  onChange={(e) => updateQuestion(index, { section_header: e.target.value })}
                                  placeholder="Section Header Text..."
                                  className="font-bold"
                                />
                              ) : (
                                <>
                                  <Textarea
                                    value={item.question_text}
                                    onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                                    placeholder="Enter your question..."
                                    rows={2}
                                  />

                                  {item.question_type === 'dropdown' && (
                                    <div>
                                      <Label className="text-xs">Dropdown Options (comma-separated)</Label>
                                      <Input
                                        value={item.dropdown_options?.join(', ') || ''}
                                        onChange={(e) => updateQuestion(index, {
                                          dropdown_options: e.target.value.split(',').map(o => o.trim())
                                        })}
                                        placeholder="Option 1, Option 2, Option 3"
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={item.required}
                                        onCheckedChange={(checked) => updateQuestion(index, { required: checked })}
                                      />
                                      <Label className="text-sm">Required</Label>
                                    </div>

                                    {item.question_type === 'yes_no_na' && (
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={item.auto_fail}
                                          onCheckedChange={(checked) => updateQuestion(index, { auto_fail: checked })}
                                        />
                                        <Label className="text-sm">Auto-fail if "No"</Label>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {(!formData.items || formData.items.length === 0) && (
            <div className="text-center py-12 text-slate-500">
              <p className="mb-4">No questions added yet</p>
              <Button onClick={() => setShowQuestionPicker(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Question
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}