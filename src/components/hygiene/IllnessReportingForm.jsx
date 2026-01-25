import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SYMPTOMS = [
  { id: 'diarrhoea', label: 'Diarrhoea' },
  { id: 'vomiting', label: 'Vomiting' },
  { id: 'fever', label: 'Fever' },
  { id: 'skin_infection', label: 'Skin Infection' },
  { id: 'other', label: 'Other' }
];

export default function IllnessReportingForm({ user, onSuccess, existingReport }) {
  const [symptoms, setSymptoms] = useState(existingReport?.symptoms || []);
  const [symptomsStartDate, setSymptomsStartDate] = useState(existingReport?.date_symptoms_started || '');
  const [lastShiftWorked, setLastShiftWorked] = useState(existingReport?.last_shift_worked || '');
  const [doctorAdvised, setDoctorAdvised] = useState(existingReport?.doctor_advised || false);
  const [managerNotified, setManagerNotified] = useState(existingReport?.manager_notified || false);
  const [managerResponse, setManagerResponse] = useState(existingReport?.manager_response || 'pending');
  const [managerNotes, setManagerNotes] = useState(existingReport?.manager_notes || '');
  const [clearanceDate, setClearanceDate] = useState(existingReport?.clearance_date || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const isManager = user?.role === 'manager' || user?.role === 'owner' || user?.role === 'admin';

  const submitMutation = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const data = {
        staff_id: existingReport?.staff_id || user.id,
        staff_name: existingReport?.staff_name || user.full_name,
        staff_email: existingReport?.staff_email || user.email,
        report_date: existingReport?.report_date || today,
        report_time: existingReport?.report_time || new Date().toISOString(),
        symptoms,
        date_symptoms_started: symptomsStartDate,
        last_shift_worked: lastShiftWorked,
        doctor_advised: doctorAdvised,
        manager_notified: managerNotified,
        manager_response: managerResponse,
        manager_notes: managerNotes,
        manager_id: isManager ? user.id : existingReport?.manager_id,
        manager_name: isManager ? user.full_name : existingReport?.manager_name,
        manager_email: isManager ? user.email : existingReport?.manager_email,
        clearance_date: clearanceDate,
        status: managerResponse === 'approved_work' ? 'cleared' : (managerResponse === 'go_home' ? 'reviewed' : 'pending')
      };

      if (existingReport) {
        await base44.entities.IllnessReport.update(existingReport.id, data);
      } else {
        await base44.entities.IllnessReport.create(data);
      }
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (symptoms.length === 0 || !symptomsStartDate) {
      alert('Please select at least one symptom and provide the date symptoms started');
      return;
    }

    setLoading(true);
    submitMutation.mutate();
    setLoading(false);
  };

  const toggleSymptom = (symptomId) => {
    setSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  return (
    <Card className="border-2 border-red-200">
      <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
        <CardTitle className="text-red-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Illness Reporting Form
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Staff Info (auto) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-300">
            <label className="text-sm font-semibold text-slate-700">Staff Member</label>
            <p className="text-lg font-bold text-slate-800">{user.full_name}</p>
            <p className="text-sm text-slate-600">{user.email}</p>
          </div>

          {/* Report Date (auto) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-300">
            <label className="text-sm font-semibold text-slate-700">Report Date</label>
            <p className="text-lg font-bold text-slate-800">{format(new Date(), 'd MMMM yyyy')}</p>
          </div>

          {/* Symptoms */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-3">
              Symptoms <span className="text-red-600">*</span>
            </label>
            <div className="space-y-2">
              {SYMPTOMS.map(symptom => (
                <label key={symptom.id} className="flex items-center gap-3 p-3 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <Checkbox
                    checked={symptoms.includes(symptom.id)}
                    onCheckedChange={() => toggleSymptom(symptom.id)}
                  />
                  <span className="text-slate-800">{symptom.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Symptoms Started */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Date Symptoms Started <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              value={symptomsStartDate}
              onChange={(e) => setSymptomsStartDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Last Shift Worked */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Last Shift Worked
            </label>
            <input
              type="date"
              value={lastShiftWorked}
              onChange={(e) => setLastShiftWorked(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Doctor Advised */}
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={doctorAdvised}
                onCheckedChange={setDoctorAdvised}
              />
              <span className="text-slate-800">
                Doctor advised to stay away from work
              </span>
            </label>
          </div>

          {/* Manager Notified */}
          <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={managerNotified}
                onCheckedChange={setManagerNotified}
              />
              <span className="text-slate-800">
                Manager has been notified immediately
              </span>
            </label>
          </div>

          {/* Manager Decision Section (only visible if manager and editing existing report) */}
          {isManager && existingReport && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-lg space-y-4">
              <h3 className="font-bold text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Manager Decision
              </h3>
              
              {/* Manager Response */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Decision <span className="text-red-600">*</span>
                </label>
                <select
                  value={managerResponse}
                  onChange={(e) => setManagerResponse(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="pending">Pending Review</option>
                  <option value="approved_work">Clear to Work</option>
                  <option value="approved_alternative">Alternative Duties</option>
                  <option value="go_home">Send Home</option>
                </select>
              </div>

              {/* Manager Notes */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Manager Notes
                </label>
                <textarea
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder="Enter notes about the decision..."
                  rows={3}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Clearance Date (if approved to work) */}
              {(managerResponse === 'approved_work' || managerResponse === 'approved_alternative') && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">
                    Clearance Date
                  </label>
                  <input
                    type="date"
                    value={clearanceDate}
                    onChange={(e) => setClearanceDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 border border-emerald-400 rounded-lg flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-800">Illness report submitted successfully!</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={symptoms.length === 0 || !symptomsStartDate || loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3"
          >
            {loading ? 'Submitting...' : (existingReport ? 'Update Report' : 'Submit Illness Report')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}