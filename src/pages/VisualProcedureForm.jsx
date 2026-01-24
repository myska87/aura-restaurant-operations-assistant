import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { createPageUrl } from '../utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AIProcedureAssistant from '../components/procedures/AIProcedureAssistant';
import { motion } from 'framer-motion';
import CoreModuleProtectionWarning from '@/components/system/CoreModuleProtection';
import ModuleSaveLogger from '@/components/system/ModuleSaveLogger';

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
    status: 'draft',
    is_published: false
  });
  
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingStepPhotos, setUploadingStepPhotos] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [saveMessage, setSaveMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [notifyStaff, setNotifyStaff] = useState(false);

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

  const { data: procedure, isLoading } = useQuery({
    queryKey: ['visual-procedure', procedureId],
    queryFn: async () => {
      const results = await base44.entities.SOP.filter({ id: procedureId });
      return results;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (procedure && procedure[0]) {
      setFormData({
        ...formData,
        ...procedure[0],
        steps: procedure[0].steps || [{ step_number: 1, step_title: '', instruction_text: '', photo_url: '', video_url: '', duration_seconds: 30 }],
        tips_warnings: procedure[0].tips_warnings || [],
        ingredients_tools: procedure[0].ingredients_tools || []
      });
    }
  }, [procedure]);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (!formData.title || formData.title.trim() === '') return;
    
    const autoSaveInterval = setInterval(async () => {
      setAutoSaving(true);
      try {
        const autoSaveData = {
          ...formData,
          auto_saved_at: new Date().toISOString(),
          last_updated_by_id: user?.id,
          last_updated_by_name: user?.full_name || user?.email
        };

        if (isEditing && procedureId) {
          await base44.entities.SOP.update(procedureId, autoSaveData);
        } else if (formData.id) {
          await base44.entities.SOP.update(formData.id, autoSaveData);
        } else {
          const created = await base44.entities.SOP.create(autoSaveData);
          setFormData({ ...autoSaveData, id: created.id });
        }
        
        setLastSaved(new Date());
        queryClient.invalidateQueries({ queryKey: ['visualProcedures'] });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setAutoSaving(false);
      }
    }, 10000);

    return () => clearInterval(autoSaveInterval);
  }, [formData, isEditing, procedureId, user, queryClient]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      try {
        if (isEditing) {
          return await base44.entities.SOP.update(procedureId, data);
        } else {
          return await base44.entities.SOP.create(data);
        }
      } catch (error) {
        console.error('Save error:', error);
        throw new Error(`Failed to save procedure: ${error.message}`);
      }
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['visualProcedures'] });
      
      // Log save to audit trail
      await ModuleSaveLogger.logSave('VisualProcedures', isEditing ? 'update' : 'create', formData, user?.id);
      
      setSaveMessage({ type: 'success', text: 'Procedure saved successfully!' });
      base44.analytics.track({
        eventName: 'procedure_saved',
        properties: { procedure_id: data.id, is_new: !isEditing }
      });
      setTimeout(() => {
        navigate(createPageUrl('VisualProcedures'));
      }, 1500);
    },
    onError: (error) => {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to save procedure. Please try again.' });
      console.error('Procedure save failed:', error);
    }
  });

  const validateForm = () => {
    const errors = [];
    if (!formData.title?.trim()) errors.push('Title is required');
    if (!formData.category) errors.push('Category is required');
    if (!formData.station) errors.push('Station is required');
    if (!formData.intro_description?.trim()) errors.push('Introduction description is required');
    if (!formData.steps || formData.steps.length === 0) errors.push('At least one step is required');
    formData.steps.forEach((step, idx) => {
      if (!step.step_title?.trim()) errors.push(`Step ${idx + 1}: Title is required`);
      if (!step.instruction_text?.trim()) errors.push(`Step ${idx + 1}: Instruction is required`);
    });
    return errors;
  };

  const handleSubmit = (e, saveAsDraft = false) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0 && !saveAsDraft) {
      setValidationErrors(errors);
      setSaveMessage({ type: 'error', text: 'Please fix the errors below before publishing.' });
      return;
    }
    
    setValidationErrors([]);
    setSaveMessage(null);
    
    const saveData = {
      ...formData,
      status: saveAsDraft ? 'draft' : 'published',
      is_published: !saveAsDraft,
      published_date: !saveAsDraft ? new Date().toISOString() : formData.published_date,
      last_updated_by_id: user?.id,
      last_updated_by_name: user?.full_name || user?.email,
      version: formData.version || '1.0',
      notify_staff_on_update: notifyStaff && !saveAsDraft
    };

    // Send staff notifications if enabled
    if (!saveAsDraft && notifyStaff) {
      base44.entities.Notification.bulkCreate([
        {
          recipient_email: '*',
          title: isEditing ? 'Procedure Updated' : 'New Procedure Available',
          message: `${formData.title} has been ${isEditing ? 'updated and requires review' : 'published'}. Please review it at your earliest convenience.`,
          type: 'alert',
          category: 'sop',
          priority: 'high',
          action_url: createPageUrl(`VisualProcedureDetail?id=${formData.id || saveData.id}`)
        }
      ]).catch(err => console.log('Notification send failed:', err));
    }

    // Add version history if editing
    if (isEditing && procedure?.[0]) {
      const previousVersion = {
        version: procedure[0].version,
        updated_date: new Date().toISOString(),
        updated_by: user?.full_name || user?.email,
        changes_summary: saveAsDraft ? 'Saved as draft' : 'Published',
        data_snapshot: procedure[0]
      };
      saveData.previous_versions = [...(formData.previous_versions || []), previousVersion];
    }

    saveMutation.mutate(saveData);
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

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, cover_image_url: result.file_url });
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleStepPhotoUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStepPhotos({ ...uploadingStepPhotos, [index]: true });
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      updateStep(index, 'photo_url', result.file_url);
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploadingStepPhotos({ ...uploadingStepPhotos, [index]: false });
    }
  };

  const handleAIGenerated = (generatedData) => {
    setFormData({
      ...formData,
      ...generatedData,
      steps: generatedData.steps.map(step => ({
        ...step,
        photo_url: '',
        video_url: ''
      }))
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Auto-save Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {autoSaving && (
            <Badge variant="outline" className="animate-pulse">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Auto-saving...
            </Badge>
          )}
          {lastSaved && !autoSaving && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </Badge>
          )}
          {formData.status && (
            <Badge className={formData.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}>
              {formData.status === 'published' ? '✓ Published' : '📝 Draft'}
            </Badge>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`flex items-center gap-2 p-4 rounded-lg ${
            saveMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{saveMessage.text}</span>
        </motion.div>
      )}

      {validationErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <h3 className="font-semibold text-red-900">Please fix these errors:</h3>
          </div>
          <ul className="space-y-1 ml-7">
            {validationErrors.map((error, idx) => (
              <li key={idx} className="text-sm text-red-800">• {error}</li>
            ))}
          </ul>
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('VisualProcedures'))}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Visual Procedure' : 'Create Visual Procedure'}
        </h1>
      </div>

      {/* Core Module Protection */}
      <CoreModuleProtectionWarning moduleName="VisualProcedures" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI Assistant */}
        <AIProcedureAssistant onProcedureGenerated={handleAIGenerated} />

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
              <Label>Cover Image</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  placeholder="https://... or upload below"
                  className="flex-1"
                />
                <Button type="button" variant="outline" disabled={uploadingCover} onClick={() => document.getElementById('cover-upload').click()}>
                  {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverImageUpload}
                />
              </div>
              {formData.cover_image_url && (
                <img src={formData.cover_image_url} alt="Cover" className="mt-2 h-32 w-full object-cover rounded" />
              )}
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
                    <Label>Step Photo</Label>
                    <div className="flex gap-2">
                      <Input
                        value={step.photo_url}
                        onChange={(e) => updateStep(index, 'photo_url', e.target.value)}
                        placeholder="https://... or upload"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        disabled={uploadingStepPhotos[index]}
                        onClick={() => document.getElementById(`step-photo-${index}`).click()}
                      >
                        {uploadingStepPhotos[index] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </Button>
                      <input
                        id={`step-photo-${index}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleStepPhotoUpload(index, e)}
                      />
                    </div>
                    {step.photo_url && (
                      <img src={step.photo_url} alt={step.step_title} className="mt-2 h-20 w-full object-cover rounded" />
                    )}
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
        <div className="flex gap-3 justify-between">
          <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('VisualProcedures'))}>
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button 
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Publishing...' : 'Publish Procedure'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}