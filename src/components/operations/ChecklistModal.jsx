import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Circle, AlertTriangle, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function ChecklistModal({ 
  open, 
  onClose, 
  checklist, 
  existingCompletion,
  onItemToggle,
  onComplete,
  loading,
  user
}) {
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState({});

  useEffect(() => {
    if (existingCompletion?.answers) {
      const answerMap = {};
      const noteMap = {};
      existingCompletion.answers.forEach(item => {
        answerMap[item.item_id] = item.answer;
        if (item.notes) noteMap[item.item_id] = item.notes;
      });
      setAnswers(answerMap);
      setNotes(noteMap);
    }
  }, [existingCompletion]);

  if (!checklist) return null;

  const items = checklist.items || [];
  const totalItems = items.filter(i => i.required).length;
  const completedCount = items.filter(i => 
    i.required && answers[i.item_id] && answers[i.item_id] !== ''
  ).length;
  const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  const handleToggle = (item) => {
    if (item.question_type === 'yes_no_na') {
      const currentAnswer = answers[item.item_id];
      const nextAnswer = currentAnswer === 'yes' ? 'no' : 
                        currentAnswer === 'no' ? 'na' : 'yes';
      setAnswers(prev => ({ ...prev, [item.item_id]: nextAnswer }));
      onItemToggle(item.item_id, nextAnswer, notes[item.item_id]);
    } else if (item.question_type === 'section_header') {
      return;
    } else if (item.question_type === 'photo') {
      return; // Handle photo separately via file input
    } else {
      const newValue = !answers[item.item_id];
      setAnswers(prev => ({ ...prev, [item.item_id]: newValue ? 'completed' : '' }));
      onItemToggle(item.item_id, newValue ? 'completed' : '', notes[item.item_id]);
    }
  };

  const handlePhotoUpload = async (item, file) => {
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAnswers(prev => ({ ...prev, [item.item_id]: file_url }));
      onItemToggle(item.item_id, file_url, `Photo: ${file.name}`);
    } catch (error) {
      alert('Error uploading photo. Please try again.');
    }
  };

  const handleTextInput = (item, value) => {
    setAnswers(prev => ({ ...prev, [item.item_id]: value }));
    onItemToggle(item.item_id, value, notes[item.item_id]);
  };

  // Group items by section headers
  const groupedItems = [];
  let currentGroup = { title: 'General', items: [] };
  
  items.forEach(item => {
    if (item.question_type === 'section_header') {
      if (currentGroup.items.length > 0) {
        groupedItems.push(currentGroup);
      }
      currentGroup = { title: item.section_header || 'Section', items: [] };
    } else {
      currentGroup.items.push(item);
    }
  });
  if (currentGroup.items.length > 0) {
    groupedItems.push(currentGroup);
  }

  const allRequiredComplete = items
    .filter(i => i.required && i.question_type !== 'section_header')
    .every(i => answers[i.item_id] && answers[i.item_id] !== '');

  const handleCompleteWithReport = async () => {
    // Call original complete handler
    await onComplete();
    
    // Also save to OperationReport
    try {
      const completedItems = items.filter(i => answers[i.item_id] && answers[i.item_id] !== '');
      const failedItems = items.filter(i => 
        answers[i.item_id] === 'no' || 
        (i.required && (!answers[i.item_id] || answers[i.item_id] === ''))
      );

      await base44.entities.OperationReport.create({
        reportType: 'CHECKLIST',
        locationId: 'default',
        staffId: user?.id || 'unknown',
        staffName: user?.full_name || user?.email || 'Staff',
        staffEmail: user?.email || 'unknown@restaurant.com',
        reportDate: format(new Date(), 'yyyy-MM-dd'),
        completionPercentage: Math.round(progress) || 0,
        status: failedItems.length > 0 ? 'fail' : 'pass',
        checklistItems: completedItems.map(item => ({
          item_id: item.item_id,
          item_name: item.question_text,
          answer: answers[item.item_id],
          notes: notes[item.item_id] || ''
        })),
        failedItems: failedItems.map(i => i.question_text),
        sourceEntityId: existingCompletion?.id || checklist.id,
        sourceEntityType: 'ChecklistCompletion',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving to operation report:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{checklist.checklist_name}</DialogTitle>
              <Badge className={checklist.checklist_category === 'opening' ? 'bg-emerald-600' : 'bg-red-600'}>
                {checklist.checklist_category?.toUpperCase()}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Progress</p>
              <p className="text-3xl font-bold text-emerald-600">{Math.round(progress)}%</p>
            </div>
          </div>
          <Progress value={progress} className="h-3 mt-2" />
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 overflow-y-auto">
          <div className="space-y-6">
            {groupedItems.map((group, groupIdx) => (
              <div key={groupIdx}>
                <h3 className="font-bold text-slate-700 mb-3 sticky top-0 bg-white py-2 border-b">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item, idx) => {
                    const answer = answers[item.item_id];
                    const isAnswered = answer && answer !== '';
                    
                    return (
                      <motion.div
                        key={item.item_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                      >
                        <div
                          onClick={() => item.question_type !== 'photo' && handleToggle(item)}
                          className={`
                            p-4 rounded-lg border-2 transition-all
                            ${item.question_type !== 'photo' ? 'cursor-pointer' : ''}
                            ${isAnswered 
                              ? answer === 'no' 
                                ? 'bg-red-50 border-red-300'
                                : 'bg-emerald-50 border-emerald-300'
                              : 'bg-white border-slate-200 hover:border-emerald-200'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            {isAnswered ? (
                              <CheckCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                                answer === 'no' ? 'text-red-600' : 'text-emerald-600'
                              }`} />
                            ) : (
                              <Circle className="w-6 h-6 text-slate-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className={`font-medium ${
                                isAnswered 
                                  ? answer === 'no' ? 'text-red-900' : 'text-emerald-900'
                                  : 'text-slate-800'
                              }`}>
                                {item.question_text}
                              </p>
                              
                              {item.question_type === 'yes_no_na' && isAnswered && (
                                <Badge className={`mt-2 ${
                                  answer === 'yes' ? 'bg-emerald-600' :
                                  answer === 'no' ? 'bg-red-600' : 'bg-slate-600'
                                }`}>
                                  {answer.toUpperCase()}
                                </Badge>
                              )}
                              
                              {item.question_type === 'text' && (
                                <Input
                                  value={answer || ''}
                                  onChange={(e) => handleTextInput(item, e.target.value)}
                                  placeholder="Enter text..."
                                  className="mt-2"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                              
                              {item.question_type === 'photo' && (
                                <div className="mt-2">
                                  {isAnswered ? (
                                    <div className="flex items-center gap-2">
                                      <img src={answer} alt="uploaded" className="h-20 rounded border" />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setAnswers(prev => ({ ...prev, [item.item_id]: '' }));
                                          onItemToggle(item.item_id, '', '');
                                        }}
                                      >
                                        Change
                                      </Button>
                                    </div>
                                  ) : (
                                    <label className="flex items-center justify-center border-2 border-dashed rounded p-4 cursor-pointer hover:bg-slate-50">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handlePhotoUpload(item, e.target.files?.[0])}
                                        className="hidden"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <div className="flex flex-col items-center gap-1 text-slate-600">
                                        <Upload className="w-5 h-5" />
                                        <span className="text-sm">Click to upload photo</span>
                                      </div>
                                    </label>
                                  )}
                                </div>
                              )}
                              
                              {item.question_type === 'temperature' && (
                                <Input
                                  type="number"
                                  value={answer || ''}
                                  onChange={(e) => handleTextInput(item, e.target.value)}
                                  placeholder="Enter temperature (°C)..."
                                  className="mt-2"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                              
                              {item.required && !isAnswered && (
                                <Badge variant="outline" className="mt-1 text-xs border-amber-400 text-amber-700">
                                  Required
                                </Badge>
                              )}
                              
                              {item.auto_fail && answer === 'no' && (
                                <Badge className="mt-1 ml-2 text-xs bg-red-600">
                                  ⚠ Auto-Fail
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t pt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {completedCount} of {totalItems} required items completed
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleCompleteWithReport}
              disabled={!allRequiredComplete || loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? 'Saving...' : 'Mark Complete'}
            </Button>
          </div>
        </div>

        {!allRequiredComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">
              Complete all required items before finishing checklist
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}