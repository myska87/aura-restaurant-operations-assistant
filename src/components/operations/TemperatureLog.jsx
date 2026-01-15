import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Thermometer, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const equipment = [
  { name: 'Fridge 1', location: 'Main Kitchen', min: 0, max: 5 },
  { name: 'Fridge 2', location: 'Prep Area', min: 0, max: 5 },
  { name: 'Fridge 3', location: 'Bar', min: 0, max: 5 },
  { name: 'Freezer 1', location: 'Main Kitchen', min: -22, max: -18 },
  { name: 'Freezer 2', location: 'Storage', min: -22, max: -18 },
  { name: 'Chiller', location: 'Walk-in', min: 0, max: 4 },
  { name: 'Display Fridge', location: 'Front Counter', min: 0, max: 5 }
];

export default function TemperatureLog({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    equipment_name: '',
    temperature: '',
    check_time: '',
    notes: ''
  });

  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['temperatureLogs', today],
    queryFn: () => base44.entities.TemperatureLog.filter({ log_date: today }, '-created_date', 100)
  });

  const createLogMutation = useMutation({
    mutationFn: (data) => base44.entities.TemperatureLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['temperatureLogs']);
      setShowForm(false);
      setFormData({ equipment_name: '', temperature: '', check_time: '', notes: '' });
    }
  });

  const handleSubmit = () => {
    const selectedEquip = equipment.find(e => e.name === formData.equipment_name);
    const temp = parseFloat(formData.temperature);
    const isInRange = temp >= selectedEquip.min && temp <= selectedEquip.max;

    createLogMutation.mutate({
      ...formData,
      temperature: temp,
      location: selectedEquip.location,
      min_temp: selectedEquip.min,
      max_temp: selectedEquip.max,
      is_in_range: isInRange,
      logged_by: user.email,
      logged_by_name: user.full_name || user.email,
      log_date: today,
      manager_notified: !isInRange
    });
  };

  const getCheckTimeStatus = (checkTime) => {
    const hasLog = todayLogs.find(log => log.check_time === checkTime);
    return hasLog ? 'complete' : 'pending';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Temperature Monitoring</CardTitle>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Log Temperature
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Check Time Status */}
          <div className="grid grid-cols-3 gap-3">
            {['opening', 'mid_shift', 'closing'].map(time => (
              <Card key={time} className={
                getCheckTimeStatus(time) === 'complete' 
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-amber-50 border-amber-300'
              }>
                <CardContent className="pt-4 text-center">
                  {getCheckTimeStatus(time) === 'complete' ? (
                    <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                  )}
                  <p className="text-sm font-semibold capitalize">{time.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-600">
                    {getCheckTimeStatus(time) === 'complete' ? 'Logged' : 'Pending'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Log Form */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 p-4 bg-slate-50 rounded-xl"
            >
              <Select value={formData.equipment_name} onValueChange={(v) => setFormData({...formData, equipment_name: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment..." />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(e => (
                    <SelectItem key={e.name} value={e.name}>
                      {e.name} - {e.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.equipment_name && (
                <>
                  <div className="p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="text-blue-900">
                      <strong>Range:</strong> {equipment.find(e => e.name === formData.equipment_name)?.min}°C to{' '}
                      {equipment.find(e => e.name === formData.equipment_name)?.max}°C
                    </p>
                  </div>

                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Temperature (°C)"
                    value={formData.temperature}
                    onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                  />

                  <Select value={formData.check_time} onValueChange={(v) => setFormData({...formData, check_time: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Check time..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opening">Opening</SelectItem>
                      <SelectItem value="mid_shift">Mid Shift</SelectItem>
                      <SelectItem value="closing">Closing</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Notes (optional)"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                  />

                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.equipment_name || !formData.temperature || !formData.check_time}
                    className="w-full"
                  >
                    Save Temperature Log
                  </Button>
                </>
              )}
            </motion.div>
          )}

          {/* Today's Logs */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-3">Today's Logs</h4>
            <div className="space-y-2">
              {todayLogs.map(log => (
                <Card key={log.id} className={!log.is_in_range ? 'border-red-300 bg-red-50' : ''}>
                  <CardContent className="pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{log.equipment_name}</p>
                        <p className="text-xs text-slate-600 capitalize">{log.check_time.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          log.is_in_range ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {log.temperature}°C
                        </p>
                        {!log.is_in_range && (
                          <Badge className="bg-red-600 mt-1">Out of Range</Badge>
                        )}
                      </div>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-slate-600 mt-2">{log.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {todayLogs.length === 0 && (
                <p className="text-center text-slate-500 py-4">No logs recorded yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}