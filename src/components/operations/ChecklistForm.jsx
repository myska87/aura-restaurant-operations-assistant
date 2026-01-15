import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const openingChecklist = [
  { id: 'uniform', label: 'Clean uniform & hands', category: 'personal' },
  { id: 'hair', label: 'Hair tied / PPE worn', category: 'personal' },
  { id: 'handwash', label: 'Handwash completed', category: 'hygiene' },
  { id: 'equipment', label: 'Equipment switched on', category: 'station' },
  { id: 'surfaces', label: 'Work surfaces sanitised', category: 'station' },
  { id: 'floor', label: 'Floor clean & dry', category: 'environment' },
  { id: 'music', label: 'Music & lighting set', category: 'environment' }
];

const kitchenChecklist = [
  { id: 'station', label: 'Station setup complete' },
  { id: 'ingredients', label: 'Ingredient availability checked' },
  { id: 'prep', label: 'Prep checks completed' },
  { id: 'allergen', label: 'Allergen tools ready & separated' },
  { id: 'temps', label: 'Hot/cold equipment at temperature' }
];

const fohChecklist = [
  { id: 'counter', label: 'Counter cleanliness checked' },
  { id: 'menu', label: 'Menu display updated' },
  { id: 'till', label: 'Till & payment systems working' },
  { id: 'guest', label: 'Guest area clean & ready' },
  { id: 'stock', label: 'Front stock checked' }
];

const managerChecklist = [
  { id: 'staffing', label: 'Staffing levels checked' },
  { id: 'stock_alerts', label: 'Stock alerts reviewed' },
  { id: 'temps', label: 'Temperature logs reviewed' },
  { id: 'hygiene', label: 'Hygiene compliance spot-check' },
  { id: 'cash', label: 'Cash float verified' }
];

export default function ChecklistForm({ checkIn, onUpdate }) {
  const [openingItems, setOpeningItems] = useState(checkIn.opening_checklist?.items || []);
  const [positionItems, setPositionItems] = useState(checkIn.position_checklist?.items || []);

  const getPositionChecklist = () => {
    if (checkIn.staff_role === 'kitchen') return kitchenChecklist;
    if (checkIn.staff_role === 'foh') return fohChecklist;
    if (checkIn.staff_role === 'manager') return managerChecklist;
    return [];
  };

  const handleToggleOpening = (itemId) => {
    const existing = openingItems.find(i => i.item === itemId);
    let newItems;
    
    if (existing) {
      newItems = openingItems.map(i => 
        i.item === itemId ? { ...i, checked: !i.checked, timestamp: new Date().toISOString() } : i
      );
    } else {
      newItems = [...openingItems, { item: itemId, checked: true, timestamp: new Date().toISOString() }];
    }
    
    setOpeningItems(newItems);
    
    const allChecked = openingChecklist.every(item => 
      newItems.find(i => i.item === item.id)?.checked
    );
    
    onUpdate({
      ...checkIn,
      opening_checklist: { completed: allChecked, items: newItems }
    });
  };

  const handleTogglePosition = (itemId) => {
    const existing = positionItems.find(i => i.item === itemId);
    let newItems;
    
    if (existing) {
      newItems = positionItems.map(i => 
        i.item === itemId ? { ...i, checked: !i.checked, timestamp: new Date().toISOString() } : i
      );
    } else {
      newItems = [...positionItems, { item: itemId, checked: true, timestamp: new Date().toISOString() }];
    }
    
    setPositionItems(newItems);
    
    const positionChecklist = getPositionChecklist();
    const allChecked = positionChecklist.every(item => 
      newItems.find(i => i.item === item.id)?.checked
    );
    
    onUpdate({
      ...checkIn,
      position_checklist: { completed: allChecked, items: newItems },
      status: (checkIn.opening_checklist?.completed && allChecked) ? 'in_progress' : 'checked_in'
    });
  };

  const isItemChecked = (items, itemId) => {
    return items.find(i => i.item === itemId)?.checked || false;
  };

  const openingComplete = checkIn.opening_checklist?.completed || false;
  const positionComplete = checkIn.position_checklist?.completed || false;

  return (
    <div className="space-y-4">
      {/* Opening Checklist */}
      <Card className={openingComplete ? 'bg-emerald-50 border-emerald-300' : 'border-amber-300'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {openingComplete ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              Opening Checklist
            </CardTitle>
            {openingComplete && (
              <Badge className="bg-emerald-600">Complete</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {openingChecklist.map((item, idx) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleToggleOpening(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                isItemChecked(openingItems, item.id)
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {isItemChecked(openingItems, item.id) ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" />
              )}
              <span className={`flex-1 text-left ${
                isItemChecked(openingItems, item.id) ? 'text-emerald-900 font-semibold' : 'text-slate-700'
              }`}>
                {item.label}
              </span>
            </motion.button>
          ))}
        </CardContent>
      </Card>

      {/* Position Checklist */}
      {checkIn.shift_type === 'opening' && (
        <Card className={positionComplete ? 'bg-blue-50 border-blue-300' : 'border-slate-300'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {positionComplete ? (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400" />
                )}
                {checkIn.staff_role === 'kitchen' && 'Kitchen Station Checklist'}
                {checkIn.staff_role === 'foh' && 'Front of House Checklist'}
                {checkIn.staff_role === 'manager' && 'Manager Opening Checklist'}
              </CardTitle>
              {positionComplete && (
                <Badge className="bg-blue-600">Complete</Badge>
              )}
            </div>
            {!openingComplete && (
              <p className="text-sm text-amber-700">Complete opening checklist first</p>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {getPositionChecklist().map((item, idx) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleTogglePosition(item.id)}
                disabled={!openingComplete}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  !openingComplete 
                    ? 'opacity-50 cursor-not-allowed'
                    : isItemChecked(positionItems, item.id)
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {isItemChecked(positionItems, item.id) ? (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
                <span className={`flex-1 text-left ${
                  isItemChecked(positionItems, item.id) ? 'text-blue-900 font-semibold' : 'text-slate-700'
                }`}>
                  {item.label}
                </span>
              </motion.button>
            ))}
          </CardContent>
        </Card>
      )}

      {openingComplete && positionComplete && (
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <CardContent className="pt-4 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Ready to Start Work! 🎉</h3>
            <p className="text-white/90">All checklists complete. You can now begin operations.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}