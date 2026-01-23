import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ManageLabelItems({ open, onClose, items, onItemsUpdate }) {
  const [newItem, setNewItem] = useState('');
  const [shelLifeSuggestion, setShelLifeSuggestion] = useState('');
  const [items_local, setItems_local] = useState(items || []);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  const addItem = async () => {
    if (!newItem.trim()) return;
    
    const newLabelItem = {
      name: newItem,
      suggested_shelf_life: shelLifeSuggestion || '2 days',
      created_date: new Date().toISOString()
    };

    try {
      await base44.entities.FoodLabel.create({
        dish_name: newItem,
        suggested_shelf_life: shelLifeSuggestion || '2 days',
        status: 'active'
      });

      setItems_local([...items_local, newLabelItem]);
      setNewItem('');
      setShelLifeSuggestion('');
      onItemsUpdate([...items_local, newLabelItem]);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const removeItem = (idx) => {
    const updated = items_local.filter((_, i) => i !== idx);
    setItems_local(updated);
    onItemsUpdate(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>⚙️ Manage Label Items</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Item */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Add New Dish</p>
            <Input
              placeholder="Dish name..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Suggested shelf life (e.g., '2 days' or '8 hours')"
              value={shelLifeSuggestion}
              onChange={(e) => setShelLifeSuggestion(e.target.value)}
              className="text-sm"
            />
            <Button
              onClick={addItem}
              disabled={!newItem.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Item List */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Current Items</p>
            <ScrollArea className="h-64 border rounded-lg p-3">
              <div className="space-y-2">
                {items_local.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.suggested_shelf_life || '2 days'}
                      </p>
                    </div>
                    <Button
                      onClick={() => removeItem(idx)}
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={onClose} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Save & Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}