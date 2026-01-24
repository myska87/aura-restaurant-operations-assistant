import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Upload, CheckCircle2 } from 'lucide-react';

const AREA_DETAILS = {
  front_counter: {
    name: 'Front Counter',
    task: 'Wipe surfaces, sanitize, organize customer area',
    method: 'Microfiber cloth + disinfectant spray',
  },
  chai_station: {
    name: 'Chai Station',
    task: 'Clean kettles, wipe surfaces, sanitize utensils',
    method: 'Hot water + detergent, then sanitiser',
  },
  kitchen_prep: {
    name: 'Kitchen Prep',
    task: 'Clean prep tables, sanitize cutting boards',
    method: 'Hot water + detergent, then sanitiser',
  },
  cooking_area: {
    name: 'Cooking Area',
    task: 'Clean stoves, wipe surfaces, empty grease traps',
    method: 'Degreaser + hot water',
  },
  storage: {
    name: 'Storage',
    task: 'Wipe shelves, check expiry dates, organize stock',
    method: 'Damp cloth + mild detergent',
  },
  toilets: {
    name: 'Toilets',
    task: 'Clean toilets, sinks, sanitize surfaces',
    method: 'Toilet cleaner + disinfectant',
  },
  floor_waste: {
    name: 'Floor & Waste',
    task: 'Sweep, mop floors, empty bins, drain cleaning',
    method: 'Broom + mop with cleaning solution',
  },
};

const CHEMICALS = [
  'Disinfectant Spray',
  'Sanitiser Solution',
  'Degreaser',
  'Toilet Cleaner',
  'Glass Cleaner',
  'Floor Cleaner',
  'All-Purpose Detergent',
  'Other',
];

export default function DailyCleaningScheduleForm({ user, onSuccess }) {
  const [selectedArea, setSelectedArea] = useState('');
  const [chemical, setChemical] = useState('');
  const [timeCompleted, setTimeCompleted] = useState(format(new Date(), 'HH:mm'));
  const [photoFile, setPhotoFile] = useState(null);
  const [supervisorSignOff, setSupervisorSignOff] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      let photoUrl = null;

      // Upload photo if provided
      if (photoFile) {
        const uploadRes = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrl = uploadRes.file_url;
      }

      // Create cleaning log
      const today = format(new Date(), 'yyyy-MM-dd');
      const completedTime = new Date(`${today}T${timeCompleted}:00`);

      const data = {
        date: today,
        area: selectedArea,
        area_name: AREA_DETAILS[selectedArea].name,
        cleaning_task: AREA_DETAILS[selectedArea].task,
        cleaning_method: AREA_DETAILS[selectedArea].method,
        chemical_used: chemical,
        completed_by_id: user.id,
        completed_by_name: user.full_name,
        completed_by_email: user.email,
        time_completed: completedTime.toISOString(),
        supervisor_sign_off: supervisorSignOff,
        photo_url: photoUrl,
        status: supervisorSignOff ? 'approved' : 'completed',
        notes,
      };

      await base44.entities.DailyCleaningLog.create(data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaningLogs'] });
      setSuccess(true);
      setSelectedArea('');
      setChemical('');
      setPhotoFile(null);
      setSupervisorSignOff(false);
      setNotes('');
      setTimeout(() => setSuccess(false), 3000);
      onSuccess?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedArea || !chemical || !supervisorSignOff) {
      alert('Please fill all required fields and get supervisor sign-off');
      return;
    }
    setLoading(true);
    submitMutation.mutate();
    setLoading(false);
  };

  const area = AREA_DETAILS[selectedArea];

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardTitle className="text-blue-900">Daily Cleaning Schedule</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date (auto) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-300">
            <label className="text-sm font-semibold text-slate-700">Date</label>
            <p className="text-lg font-bold text-slate-800">{format(new Date(), 'd MMMM yyyy')}</p>
          </div>

          {/* Area Selection */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Area <span className="text-red-600">*</span>
            </label>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="bg-white border-slate-300">
                <SelectValue placeholder="Select cleaning area" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AREA_DETAILS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task & Method (display only) */}
          {area && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Cleaning Task</label>
                <p className="text-slate-800 font-medium">{area.task}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Cleaning Method</label>
                <p className="text-slate-800 font-medium">{area.method}</p>
              </div>
            </motion.div>
          )}

          {/* Chemical Used */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Chemical Used <span className="text-red-600">*</span>
            </label>
            <Select value={chemical} onValueChange={setChemical}>
              <SelectTrigger className="bg-white border-slate-300">
                <SelectValue placeholder="Select chemical" />
              </SelectTrigger>
              <SelectContent>
                {CHEMICALS.map((chem) => (
                  <SelectItem key={chem} value={chem}>
                    {chem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Completed By (auto) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-300">
            <label className="text-sm font-semibold text-slate-700">Completed By</label>
            <p className="text-lg font-bold text-slate-800">{user.full_name}</p>
          </div>

          {/* Time Completed */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Time Completed</label>
            <input
              type="time"
              value={timeCompleted}
              onChange={(e) => setTimeCompleted(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Photo Upload (optional) */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Photo (optional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {photoFile && <Badge className="bg-emerald-600">{photoFile.name.slice(0, 20)}...</Badge>}
            </div>
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations..."
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="2"
            />
          </div>

          {/* Supervisor Sign-Off */}
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-900">Supervisor Sign-Off Required</span>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={supervisorSignOff}
                onChange={(e) => setSupervisorSignOff(e.target.checked)}
                className="w-5 h-5 accent-amber-600"
              />
              <span className="text-slate-800">
                I confirm this area has been properly cleaned and is compliant.
              </span>
            </label>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-50 border border-emerald-400 rounded-lg flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-800">Cleaning log recorded successfully!</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!selectedArea || !chemical || !supervisorSignOff || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
          >
            {loading ? 'Submitting...' : 'Submit Cleaning Log'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}