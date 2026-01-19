import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { createPageUrl } from '../utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function VisualProcedureForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const procedureId = urlParams.get('id');
  const isEditing = !!procedureId;

  const [formData, setFormData] = useState({
    title: '',
    category: 'food_prep',
    estimated_time_minutes: 10,
    applicable_roles: ['all_staff'],
    station: 'general',
    intro_description: '',
    cover_image_url: '',
    ingredients_tools: [],
    steps: [{ step_number: 1, step_title: '', instruction_text: '', photo_url: '', video_url: '', duration_seconds: 30 }],
    tips_warnings: [],
    version: '1.0',
    is_published: true
  });

  const { data: procedure, isLoading } = useQuery({
    queryKey: ['visual-procedure', procedureId],
    queryFn: () => base44.entities.Visual_Procedures_v1.filter({ id: procedureId }),
    enabled: isEditing,
  });

  useEffect(() => {
    if (procedure && procedure[0]) {
      setFormData(procedure[0]);
    }
  }, [procedure]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isEditing) {
        return base44.entities.Visual_Procedures_v1.update(procedureId, data);
      } else {
        return base44.entities.Visual_Procedures_v1.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['visual-procedures']);
      navigate(createPageUrl('VisualProcedures'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { 
        step_number: formData.steps.length + 1, 
        step_title: '', 
        instruction_text: '', 
        photo_url: '', 
        video_url: '', 
        duration_seconds: 30 
      }]
    });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index).map((step, i) => ({
      ...step,
      step_number: i + 1
    }));
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const addTipWarning = () => {
    setFormData({
      ...formData,
      tips_warnings: [...formData.tips_warnings, { type: 'hygiene', text: '' }]
    });
  };

  const removeTipWarning = (index) => {
    setFormData({
      ...formData,
      tips_warnings: formData.tips_warnings.filter((_, i) => i !== index)
    });
  };

  const updateTipWarning = (index, field, value) => {
    const newTips = [...formData.tips_warnings];
    newTips[index] = { ...newTips[index], [field]: value };
    setFormData({ ...formData, tips_warnings: newTips });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('VisualProcedures'))}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Visual Procedure' : 'Create Visual Procedure'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food_prep">Food Prep</SelectItem>
                    <SelectItem value="hygiene">Hygiene</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="waste">Waste</SelectItem>
                    <SelectItem value="opening">Opening</SelectItem>
                    <SelectItem value="closing">Closing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Station</Label>
                <Select value={formData.station} onValueChange={(value) => setFormData({ ...formData, station: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="hot_line">Hot Line</SelectItem>
                    <SelectItem value="grill">Grill</SelectItem>
                    <SelectItem value="chai_station">Chai Station</SelectItem>
                    <SelectItem value="fryer">Fryer</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                    <SelectItem value="cold_prep">Cold Prep</SelectItem>
                    <SelectItem value="wash_area">Wash Area</SelectItem>
                    <SelectItem value="store_room">Store Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Estimated Time (minutes)</Label>
              <Input
                type="number"
                value={formData.estimated_time_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_time_minutes: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label>Introduction / Why This Matters</Label>
              <Textarea
                value={formData.intro_description}
                onChange={(e) => setFormData({ ...formData, intro_description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Cover Image URL</Label>
              <Input
                value={formData.cover_image_url}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Steps</span>
              <Button type="button" onClick={addStep} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.steps.map((step, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Step {step.step_number}</h4>
                  {formData.steps.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div>
                  <Label>Step Title</Label>
                  <Input
                    value={step.step_title}
                    onChange={(e) => updateStep(index, 'step_title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Instruction</Label>
                  <Textarea
                    value={step.instruction_text}
                    onChange={(e) => updateStep(index, 'instruction_text', e.target.value)}
                    rows={2}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Photo URL</Label>
                    <Input
                      value={step.photo_url}
                      onChange={(e) => updateStep(index, 'photo_url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      value={step.duration_seconds}
                      onChange={(e) => updateStep(index, 'duration_seconds', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tips & Warnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tips & Warnings</span>
              <Button type="button" onClick={addTipWarning} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Tip
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.tips_warnings.map((tip, index) => (
              <div key={index} className="flex gap-3">
                <Select value={tip.type} onValueChange={(value) => updateTipWarning(index, 'type', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hygiene">Hygiene</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="common_mistake">Common Mistake</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={tip.text}
                  onChange={(e) => updateTipWarning(index, 'text', e.target.value)}
                  placeholder="Tip text..."
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeTipWarning(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('VisualProcedures'))}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Procedure'}
          </Button>
        </div>
      </form>
    </div>
  );
}