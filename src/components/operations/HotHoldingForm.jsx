import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Thermometer, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const PRESET_ITEMS = [
  'Chicken Soup',
  'Beef Stew',
  'Curry',
  'Rice',
  'Pasta',
  'Sauce',
  'Gravy',
  'Vegetables',
  'Roast Meat',
  'Mashed Potatoes',
];

export default function HotHoldingForm({ open, onClose, user, today }) {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', temperature: '', time: '' });
  const [customName, setCustomName] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const minimumTemp = 63; // Celsius - standard hot holding minimum

  const addItem = () => {
    const finalName = newItem.name === 'custom' ? customName : newItem.name;
    
    if (!finalName || !newItem.temperature) {
      alert('⚠️ Please enter food item name and temperature');
      return;
    }

    const temp = parseFloat(newItem.temperature);
    const status = temp >= minimumTemp ? 'compliant' : 'non_compliant';

    setItems([
      ...items,
      {
        id: Date.now(),
        name: finalName,
        temperature: temp,
        time: newItem.time || format(new Date(), 'HH:mm'),
        status,
        logged_by: user?.full_name || user?.email,
        logged_at: new Date().toISOString()
      }
    ]);

    setNewItem({ name: '', temperature: '', time: '' });
    setCustomName('');
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert('⚠️ Please add at least one hot holding temperature reading');
      return;
    }

    setSaving(true);
    try {
      const passedItems = items.filter(i => i.status === 'compliant').length;
      const failedItems = items.filter(i => i.status === 'non_compliant').length;

      // Create Hot Holding Log record
      await base44.entities.ChecklistCompletion.create({
        checklist_id: 'HOT_HOLDING_LOG',
        checklist_name: 'Hot Holding Temperature Log',
        checklist_category: 'hot_holding',
        date: today,
        shift: new Date().getHours() >= 12 ? 'Service' : 'Prep',
        user_id: user?.id || 'unknown',
        user_name: user?.full_name || user?.email || 'Staff',
        user_email: user?.email || 'unknown@restaurant.com',
        answers: items.map(item => ({
          item_id: String(item.id),
          question_text: `Hot holding temperature for: ${item.name}`,
          question_type: 'temperature',
          answer: `${item.temperature}°C @ ${item.time}`,
          notes: `Status: ${item.status === 'compliant' ? '✓ Compliant' : '✗ Non-Compliant (Below 63°C)'}`
        })),
        completion_percentage: Math.round((passedItems / items.length) * 100) || 0,
        failed_items: items.filter(i => i.status === 'non_compliant').map(i => String(i.id)),
        status: failedItems > 0 ? 'pending_review' : 'completed'
      });

      alert(`✅ Hot Holding Log recorded\n${passedItems} items compliant, ${failedItems} require attention`);
      
      queryClient.invalidateQueries(['completions']);
      setItems([]);
      onClose();
    } catch (error) {
      console.error('Error saving hot holding log:', error);
      alert(`❌ Error: ${error.message || 'Failed to save hot holding log'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-red-600" />
            Hot Holding Temperature Log
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Box */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Food Safety Standard</p>
                <p>Hot held food must maintain a minimum temperature of 63°C (145°F) to prevent bacterial growth.</p>
              </div>
            </div>
          </div>

          {/* Add New Item */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-slate-800 mb-4">Add Food Item</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Select value={newItem.name} onValueChange={(val) => setNewItem({ ...newItem, name: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select food item" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_ITEMS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        ✏️ Custom Item (type your own)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Temperature (°C)"
                    step="0.1"
                    value={newItem.temperature}
                    onChange={(e) => setNewItem({ ...newItem, temperature: e.target.value })}
                  />
                </div>
                
                {newItem.name === 'custom' && (
                  <Input
                    placeholder="Enter custom food item name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                )}
                
                <div className="flex gap-3">
                  <Input
                    type="time"
                    value={newItem.time}
                    onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                    className="flex-1"
                  />
                  <Button 
                    onClick={addItem}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          {items.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-800">Logged Items ({items.length})</h3>
              {items.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded border-l-4 border-slate-300 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <Badge 
                        className={item.status === 'compliant' ? 'bg-emerald-600' : 'bg-red-600'}
                      >
                        {item.temperature}°C
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">Logged at {item.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'compliant' && (
                      <Check className="w-5 h-5 text-emerald-600" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {items.length > 0 && (
            <Card className="bg-slate-50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Total Items</p>
                    <p className="text-2xl font-bold text-slate-800">{items.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Compliant</p>
                    <p className="text-2xl font-bold text-emerald-600">{items.filter(i => i.status === 'compliant').length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Non-Compliant</p>
                    <p className="text-2xl font-bold text-red-600">{items.filter(i => i.status === 'non_compliant').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={items.length === 0 || saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save Hot Holding Log'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}