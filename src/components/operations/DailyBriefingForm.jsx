import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Target, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DailyBriefingForm({ open, onClose, user, currentShift, today, onSuccess }) {
  const [formData, setFormData] = useState({
    date: today,
    shift: currentShift,
    manager_name: user?.full_name || user?.email,
    manager_email: user?.email,
    staff_present: [],
    key_points_discussed: '',
    safety_message: '',
    sales_goals: '',
    issues_raised: '',
    completed: true
  });
  const [saving, setSaving] = useState(false);

  const { data: allStaff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.filter({ status: 'active' }),
    enabled: open
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', today],
    queryFn: () => base44.entities.Shift.filter({ date: today, status: 'clocked_in' }),
    enabled: open
  });

  const toggleStaff = (staffName) => {
    setFormData(prev => ({
      ...prev,
      staff_present: prev.staff_present.includes(staffName)
        ? prev.staff_present.filter(s => s !== staffName)
        : [...prev.staff_present, staffName]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.key_points_discussed) {
      alert('Please enter key points discussed');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.DailyBriefing.create(formData);
      alert(`✅ Daily Briefing logged successfully for ${currentShift} shift`);
      onSuccess();
      onClose();
    } catch (error) {
      alert('Error saving briefing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            💬 Daily Briefing
            <Badge className="bg-blue-600">{currentShift} Shift</Badge>
          </DialogTitle>
          <p className="text-sm text-slate-600">Record team meeting notes and goals</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Manager Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <Label className="text-emerald-900 font-semibold">Manager on Duty</Label>
                <p className="text-lg font-bold text-emerald-700">{formData.manager_name}</p>
              </div>

              {/* Staff Present */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" />
                  Staff Present ({formData.staff_present.length})
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {shifts.map((shift) => {
                    const isSelected = formData.staff_present.includes(shift.staff_name);
                    return (
                      <Button
                        key={shift.id}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleStaff(shift.staff_name)}
                        className={isSelected ? 'bg-emerald-600' : ''}
                      >
                        {isSelected && <CheckCircle className="w-4 h-4 mr-1" />}
                        {shift.staff_name}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Key Points */}
              <div>
                <Label>Key Points Discussed *</Label>
                <Textarea
                  value={formData.key_points_discussed}
                  onChange={(e) => setFormData({ ...formData, key_points_discussed: e.target.value })}
                  placeholder="Main topics, announcements, goals for the day..."
                  rows={4}
                  required
                  className="mt-2"
                />
              </div>

              {/* Safety Message */}
              <div>
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Safety Message of the Day
                </Label>
                <Input
                  value={formData.safety_message}
                  onChange={(e) => setFormData({ ...formData, safety_message: e.target.value })}
                  placeholder="e.g., Remember proper knife handling..."
                  className="mt-2"
                />
              </div>

              {/* Sales Goals */}
              <div>
                <Label className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Sales / Goals for Shift
                </Label>
                <Input
                  value={formData.sales_goals}
                  onChange={(e) => setFormData({ ...formData, sales_goals: e.target.value })}
                  placeholder="e.g., £2,500 target, focus on chai sales..."
                  className="mt-2"
                />
              </div>

              {/* Issues Raised */}
              <div>
                <Label>Issues Raised</Label>
                <Textarea
                  value={formData.issues_raised}
                  onChange={(e) => setFormData({ ...formData, issues_raised: e.target.value })}
                  placeholder="Any concerns or problems to address..."
                  rows={3}
                  className="mt-2"
                />
              </div>
            </div>
          </ScrollArea>

          {/* Submit Button */}
          <div className="border-t pt-4 flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Submit Briefing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}