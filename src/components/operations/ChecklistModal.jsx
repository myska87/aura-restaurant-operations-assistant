import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChecklistModal({ 
  open, 
  onClose, 
  checklist, 
  existingCompletion,
  onItemToggle,
  onComplete,
  loading 
}) {
  const [completedItems, setCompletedItems] = useState({});
  const [notes, setNotes] = useState({});

  useEffect(() => {
    if (existingCompletion?.completed_items) {
      const items = {};
      const itemNotes = {};
      existingCompletion.completed_items.forEach(item => {
        items[item.item_id] = item.completed;
        if (item.notes) itemNotes[item.item_id] = item.notes;
      });
      setCompletedItems(items);
      setNotes(itemNotes);
    }
  }, [existingCompletion]);

  if (!checklist) return null;

  const items = checklist.checklist_items || [];
  const totalItems = items.filter(i => i.required).length;
  const completedCount = items.filter(i => i.required && completedItems[i.item_id]).length;
  const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  const handleToggle = (itemId, isDishwasher) => {
    const newValue = !completedItems[itemId];
    setCompletedItems(prev => ({ ...prev, [itemId]: newValue }));
    onItemToggle(itemId, newValue, isDishwasher, notes[itemId]);
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const allRequiredComplete = items
    .filter(i => i.required)
    .every(i => completedItems[i.item_id]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{checklist.checklist_name}</DialogTitle>
              <Badge className={checklist.checklist_type === 'opening' ? 'bg-emerald-600' : 'bg-red-600'}>
                {checklist.checklist_type.toUpperCase()}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Progress</p>
              <p className="text-3xl font-bold text-emerald-600">{Math.round(progress)}%</p>
            </div>
          </div>
          <Progress value={progress} className="h-3 mt-2" />
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-4 my-4">
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h3 className="font-bold text-slate-700 mb-3 sticky top-0 bg-white py-2 border-b">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryItems.map((item, idx) => {
                    const isCompleted = completedItems[item.item_id];
                    return (
                      <motion.div
                        key={item.item_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                      >
                        <div
                          onClick={() => handleToggle(item.item_id, item.is_dishwasher_control)}
                          className={`
                            p-4 rounded-lg border-2 cursor-pointer transition-all
                            ${isCompleted 
                              ? 'bg-emerald-50 border-emerald-300' 
                              : 'bg-white border-slate-200 hover:border-emerald-200'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-6 h-6 text-slate-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className={`font-medium ${isCompleted ? 'text-emerald-900' : 'text-slate-800'}`}>
                                {item.description}
                              </p>
                              {item.required && !isCompleted && (
                                <Badge variant="outline" className="mt-1 text-xs border-amber-400 text-amber-700">
                                  Required
                                </Badge>
                              )}
                              {item.is_dishwasher_control && (
                                <Badge className="mt-1 ml-2 text-xs bg-blue-500">
                                  Dishwasher Control
                                </Badge>
                              )}
                              {item.required && !isCompleted && (
                                <Textarea
                                  placeholder="Add note (if not completed)..."
                                  value={notes[item.item_id] || ''}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setNotes(prev => ({ ...prev, [item.item_id]: e.target.value }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-2 text-sm"
                                  rows={2}
                                />
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

        <div className="border-t pt-4 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-slate-600">
            {completedCount} of {totalItems} required items completed
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={onComplete}
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