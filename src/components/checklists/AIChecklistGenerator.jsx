import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { Sparkles, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const PURPOSE_OPTIONS = [
  { value: 'opening', label: 'Opening Checklist' },
  { value: 'closing', label: 'Closing Checklist' },
  { value: 'hygiene', label: 'Hygiene Check' },
  { value: 'audit', label: 'Audit' },
  { value: 'ccp', label: 'Critical Control Point' },
  { value: 'equipment', label: 'Equipment Check' },
  { value: 'safety', label: 'Safety Check' },
  { value: 'custom', label: 'Custom' }
];

const STATION_OPTIONS = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'foh', label: 'Front of House' },
  { value: 'bar', label: 'Bar' },
  { value: 'all', label: 'All Areas' },
  { value: 'custom', label: 'Custom' }
];

const BUSINESS_OPTIONS = [
  { value: 'cafe', label: 'Café' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'takeaway', label: 'Takeaway' },
  { value: 'franchise', label: 'Franchise' }
];

const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'midshift', label: 'Mid-Shift' },
  { value: 'endofday', label: 'End of Day' }
];

const COMPLIANCE_OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'eho', label: 'EHO-Ready' },
  { value: 'haccp', label: 'HACCP-Critical' }
];

const FOCUS_OPTIONS = [
  { value: 'hygiene', label: 'Hygiene' },
  { value: 'allergens', label: 'Allergens' },
  { value: 'temps', label: 'Temperatures' },
  { value: 'safety', label: 'Safety' },
  { value: 'service', label: 'Service Quality' }
];

export default function AIChecklistGenerator({ open, onClose, onGenerated, user }) {
  const [step, setStep] = useState('form'); // form, generating, review
  const [formData, setFormData] = useState({
    purpose: 'opening',
    station: 'all',
    business: 'restaurant',
    time: 'morning',
    compliance: 'eho',
    focus: []
  });
  const [generatedChecklist, setGeneratedChecklist] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedItems, setEditedItems] = useState([]);
  const [customPurpose, setCustomPurpose] = useState('');
  const [customStation, setCustomStation] = useState('');

  const handleFocusToggle = (focus) => {
    setFormData(prev => ({
      ...prev,
      focus: prev.focus.includes(focus)
        ? prev.focus.filter(f => f !== focus)
        : [...prev.focus, focus]
    }));
  };

  const generateChecklist = async () => {
    setIsGenerating(true);
    setStep('generating');

    const prompt = `Generate a professional operational checklist with the following specifications:

PURPOSE: ${formData.purpose === 'custom' ? customPurpose : formData.purpose}
STATION: ${formData.station === 'custom' ? customStation : formData.station}
BUSINESS TYPE: ${formData.business}
TIME: ${formData.time}
COMPLIANCE LEVEL: ${formData.compliance}
SPECIAL FOCUS: ${formData.focus.join(', ') || 'None'}

REQUIREMENTS:
- Create 4-5 logical sections with clear titles
- Each section should have 3-5 actionable questions
- Use Yes/No/N/A format
- Make wording compliance-friendly and specific
- Include safety and regulatory considerations
- Format as JSON with structure: {sections: [{title: string, items: [{question: string, type: 'yes_no_na'}]}]}

Generate a complete, production-ready checklist:`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string' },
                        type: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const title = `${formData.purpose === 'custom' ? customPurpose : formData.purpose.charAt(0).toUpperCase() + formData.purpose.slice(1)} Checklist`;
      
      setGeneratedChecklist({
        checklist_name: title,
        checklist_category: formData.purpose === 'custom' ? 'custom' : formData.purpose,
        assigned_station: formData.station === 'custom' ? customStation : formData.station,
        business_type: formData.business,
        compliance_level: formData.compliance,
        special_focus: formData.focus,
        sections: result.sections || [],
        items: [],
        created_by_ai: true,
        ai_model: 'base44-ai',
        version: '1.0'
      });

      setEditedItems(result.sections || []);
      setStep('review');
    } catch (error) {
      console.error('AI generation failed:', error);
      setStep('form');
      alert('Failed to generate checklist. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (publish) => {
    if (!generatedChecklist || !user) return;

    const checklistData = {
      ...generatedChecklist,
      items: editedItems,
      is_published: publish,
      created_by_name: `${user.full_name || user.email} (AI)`,
      created_by_email: user.email,
      created_at: new Date().toISOString()
    };

    try {
      const created = await base44.entities.ChecklistMaster.create(checklistData);
      onGenerated(created);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to save checklist:', error);
      alert('Failed to save checklist. Please try again.');
    }
  };

  const resetForm = () => {
    setStep('form');
    setFormData({
      purpose: 'opening',
      station: 'all',
      business: 'restaurant',
      time: 'morning',
      compliance: 'eho',
      focus: []
    });
    setGeneratedChecklist(null);
    setEditedItems([]);
    setCustomPurpose('');
    setCustomStation('');
  };

  const handleItemEdit = (sectionIdx, itemIdx, field, value) => {
    const newSections = [...editedItems];
    newSections[sectionIdx].items[itemIdx][field] = value;
    setEditedItems(newSections);
  };

  const handleAddItem = (sectionIdx) => {
    const newSections = [...editedItems];
    newSections[sectionIdx].items.push({ question: '', type: 'yes_no_na' });
    setEditedItems(newSections);
  };

  const handleRemoveItem = (sectionIdx, itemIdx) => {
    const newSections = [...editedItems];
    newSections[sectionIdx].items.splice(itemIdx, 1);
    setEditedItems(newSections);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            AI Checklist Generator
          </DialogTitle>
        </DialogHeader>

        {/* FORM STEP */}
        {step === 'form' && (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                AI will generate a professional checklist based on your specifications. You can review and edit every question before publishing.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Purpose *</label>
              <Select value={formData.purpose} onValueChange={(v) => setFormData({...formData, purpose: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.purpose === 'custom' && (
                <Textarea
                  placeholder="Describe your custom checklist purpose..."
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  className="mt-2 h-20"
                />
              )}
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Area / Station *</label>
              <Select value={formData.station} onValueChange={(v) => setFormData({...formData, station: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.station === 'custom' && (
                <Textarea
                  placeholder="Describe your custom station..."
                  value={customStation}
                  onChange={(e) => setCustomStation(e.target.value)}
                  className="mt-2 h-16"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Business Type *</label>
                <Select value={formData.business} onValueChange={(v) => setFormData({...formData, business: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Time of Day *</label>
                <Select value={formData.time} onValueChange={(v) => setFormData({...formData, time: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Compliance Level *</label>
              <Select value={formData.compliance} onValueChange={(v) => setFormData({...formData, compliance: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPLIANCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-3">Special Focus (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_OPTIONS.map(opt => (
                  <Badge
                    key={opt.value}
                    variant={formData.focus.includes(opt.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleFocusToggle(opt.value)}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={generateChecklist}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isGenerating || !customPurpose && formData.purpose === 'custom' || !customStation && formData.station === 'custom'}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
            </div>
          </div>
        )}

        {/* GENERATING STEP */}
        {step === 'generating' && (
          <div className="py-12 text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <Loader className="w-8 h-8 text-blue-500" />
            </motion.div>
            <p className="text-slate-600 font-medium">Generating your checklist...</p>
            <p className="text-sm text-slate-500">This may take a few seconds</p>
          </div>
        )}

        {/* REVIEW STEP */}
        {step === 'review' && generatedChecklist && (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-bold text-lg mb-2">{generatedChecklist.checklist_name}</h3>
              <div className="flex gap-2 mb-4 flex-wrap">
                <Badge>{generatedChecklist.checklist_category}</Badge>
                <Badge variant="outline">{generatedChecklist.assigned_station}</Badge>
                <Badge variant="outline">v{generatedChecklist.version}</Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">AI Generated</Badge>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900">
                Review all sections and questions below. Edit, add, or delete items as needed before publishing.
              </p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {editedItems.map((section, sectionIdx) => (
                <Card key={sectionIdx}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {section.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex gap-2 items-start pb-3 border-b last:border-0">
                        <div className="flex-1">
                          <Textarea
                            value={item.question}
                            onChange={(e) => handleItemEdit(sectionIdx, itemIdx, 'question', e.target.value)}
                            className="text-sm h-16 mb-2"
                            placeholder="Question text..."
                          />
                          <Select value={item.type} onValueChange={(v) => handleItemEdit(sectionIdx, itemIdx, 'type', v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes_no_na">Yes / No / N/A</SelectItem>
                              <SelectItem value="yes_no">Yes / No</SelectItem>
                              <SelectItem value="text">Text Input</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(sectionIdx, itemIdx)}
                          className="text-red-600 hover:text-red-700 h-8"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddItem(sectionIdx)}
                      className="w-full text-xs"
                    >
                      + Add Question
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep('form')} variant="outline" className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => handlePublish(false)}
                variant="outline"
                className="flex-1"
              >
                Save as Draft
              </Button>
              <Button 
                onClick={() => handlePublish(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Publish Now
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}