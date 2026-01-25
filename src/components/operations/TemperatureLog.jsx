import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Thermometer, AlertTriangle, CheckCircle, Plus, Settings, Edit, Trash2, Save, Download, FileText } from 'lucide-react';
import FormCompletionBanner from '@/components/operations/FormCompletionBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function TemperatureLog({ user }) {
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showEquipmentManager, setShowEquipmentManager] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [bulkTemperatures, setBulkTemperatures] = useState({});
  const [bulkNotes, setBulkNotes] = useState({});
  const [isDraft, setIsDraft] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [completionStatus, setCompletionStatus] = useState(null);
  const [equipmentFormData, setEquipmentFormData] = useState({
    name: '',
    location: '',
    min_temp: '',
    max_temp: '',
    temperature_tracking: true
  });

  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Auto-detect shift stage based on current time
  const getCurrentShift = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'opening';
    if (hour >= 12 && hour < 18) return 'mid_shift';
    return 'closing';
  };
  
  const currentShift = getCurrentShift();
  const batchId = uuidv4();

  // Fetch today's temperature logs
  const { data: todayLogs = [] } = useQuery({
    queryKey: ['temperatureLogs', today],
    queryFn: () => base44.entities.TemperatureLog.filter({ log_date: today }, '-created_date', 200)
  });

  // Fetch only temperature-tracked equipment from Assets
  const { data: equipmentList = [] } = useQuery({
    queryKey: ['temperature-equipment'],
    queryFn: async () => {
      const allAssets = await base44.entities.Asset.filter({ category: 'refrigeration' }, 'name', 100);
      return allAssets.filter(asset => asset.temperature_tracking === true);
    }
  });

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!showBulkForm || Object.keys(bulkTemperatures).length === 0) return;

    const autoSaveInterval = setInterval(() => {
      handleAutoSave();
    }, 5000);

    return () => clearInterval(autoSaveInterval);
  }, [bulkTemperatures, bulkNotes, showBulkForm]);

  const handleAutoSave = useCallback(() => {
    if (Object.keys(bulkTemperatures).length === 0) return;
    
    setLastAutoSave(new Date());
    toast.success('Draft auto-saved', { duration: 1000 });
  }, [bulkTemperatures]);

  // Bulk create mutation
  const bulkCreateLogMutation = useMutation({
    mutationFn: async (logsData) => {
      await Promise.all(
        logsData.map(log => base44.entities.TemperatureLog.create(log))
      );
      return logsData;
    },
    onSuccess: (logsData) => {
      queryClient.invalidateQueries(['temperatureLogs']);
      
      // Check if any temps are out of range
      const hasFailures = logsData.some(log => !log.is_in_range);
      setCompletionStatus(hasFailures ? 'failed' : 'completed');
      
      setShowBulkForm(false);
      setBulkTemperatures({});
      setBulkNotes({});
      setIsDraft(false);
      
      setTimeout(() => setCompletionStatus(null), 4000);
    },
    onError: (error) => {
      toast.error('Failed to save temperatures. Please try again.');
    }
  });

  // Equipment CRUD mutations
  const equipmentMutation = useMutation({
    mutationFn: ({ id, data }) => id 
      ? base44.entities.Asset.update(id, data)
      : base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['temperature-equipment']);
      setShowEquipmentForm(false);
      setEditingEquipment(null);
      setEquipmentFormData({ name: '', location: '', min_temp: '', max_temp: '', temperature_tracking: true });
      toast.success('Equipment saved successfully');
    }
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['temperature-equipment']);
      toast.success('Equipment deleted');
    }
  });

  const handleBulkSubmit = (saveAsDraft = false) => {
    // Validate all equipment has temperature
    const missingTemps = equipmentList.filter(e => !bulkTemperatures[e.id]);
    if (!saveAsDraft && missingTemps.length > 0) {
      toast.error(`Missing temperatures for: ${missingTemps.map(e => e.name).join(', ')}`);
      return;
    }

    // Build all log entries
    const logsData = equipmentList
      .filter(equip => bulkTemperatures[equip.id]) // Only include those with temps
      .map(equip => {
        const temp = parseFloat(bulkTemperatures[equip.id]);
        const minTemp = equip.min_temp ?? 0;
        const maxTemp = equip.max_temp ?? 5;
        const isInRange = temp >= minTemp && temp <= maxTemp;

        return {
          asset_id: equip.id,
          equipment_name: equip.name,
          temperature: temp,
          check_time: currentShift,
          location: equip.location || '',
          min_temp: minTemp,
          max_temp: maxTemp,
          is_in_range: isInRange,
          logged_by: user.email,
          logged_by_name: user.full_name || user.email,
          log_date: today,
          notes: bulkNotes[equip.id] || '',
          manager_notified: !isInRange,
          batch_id: batchId,
          is_draft: saveAsDraft,
          auto_saved: false,
          last_edited_by: user.email,
          last_edited_at: new Date().toISOString()
        };
      });

    if (logsData.length === 0) {
      toast.error('Please enter at least one temperature');
      return;
    }

    bulkCreateLogMutation.mutate(logsData);
  };

  const handleEquipmentSubmit = () => {
    const data = {
      name: equipmentFormData.name,
      location: equipmentFormData.location,
      category: 'refrigeration',
      min_temp: parseFloat(equipmentFormData.min_temp),
      max_temp: parseFloat(equipmentFormData.max_temp),
      temperature_tracking: true,
      temp_check_frequency: 'all_shifts',
      status: 'active'
    };

    equipmentMutation.mutate({ 
      id: editingEquipment?.id, 
      data 
    });
  };

  const getCheckTimeStatus = (checkTime) => {
    const logsForShift = todayLogs.filter(log => log.check_time === checkTime && !log.is_draft);
    return logsForShift.length >= equipmentList.length ? 'complete' : 'pending';
  };
  
  const getTempStatus = (temp, minTemp, maxTemp) => {
    if (temp < minTemp || temp > maxTemp) {
      return { color: 'bg-red-100 border-red-400 text-red-800', label: 'Critical', icon: AlertTriangle };
    }
    return { color: 'bg-emerald-100 border-emerald-400 text-emerald-800', label: 'OK', icon: CheckCircle };
  };
  
  const groupLogsByShift = () => {
    const nonDraftLogs = todayLogs.filter(log => !log.is_draft);
    return {
      opening: nonDraftLogs.filter(log => log.check_time === 'opening'),
      mid_shift: nonDraftLogs.filter(log => log.check_time === 'mid_shift'),
      closing: nonDraftLogs.filter(log => log.check_time === 'closing')
    };
  };

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  const exportToExcel = () => {
    // Simple CSV export
    const csvContent = [
      ['Equipment', 'Temperature', 'Min', 'Max', 'Status', 'Shift', 'Date', 'Logged By', 'Time'],
      ...todayLogs.filter(l => !l.is_draft).map(log => [
        log.equipment_name,
        log.temperature,
        log.min_temp,
        log.max_temp,
        log.is_in_range ? 'OK' : 'Out of Range',
        log.check_time,
        log.log_date,
        log.logged_by_name,
        format(new Date(log.created_date), 'HH:mm')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `temperature-logs-${today}.csv`;
    a.click();
    toast.success('Exported to CSV');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Temperature Monitoring</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={exportToPDF} size="sm" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={exportToExcel} size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={() => setShowEquipmentManager(true)} size="sm" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Manage Equipment
              </Button>
              <Button onClick={() => setShowBulkForm(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Thermometer className="w-4 h-4 mr-2" />
                Log Temperature
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Check Time Status */}
          <div className="grid grid-cols-3 gap-3">
            {['opening', 'mid_shift', 'closing'].map(time => {
              const status = getCheckTimeStatus(time);
              return (
                <button
                  key={time}
                  onClick={() => {
                    if (status !== 'complete') {
                      setShowBulkForm(true);
                    }
                  }}
                  className="text-left"
                >
                  <Card className={`cursor-pointer transition-all hover:shadow-md ${
                    status === 'complete' 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-amber-50 border-amber-300 hover:border-amber-400'
                  }`}>
                    <CardContent className="pt-4 text-center">
                      {status === 'complete' ? (
                        <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                      )}
                      <p className="text-sm font-semibold capitalize">{time.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-600">
                        {status === 'complete' ? 'Logged' : 'Pending'}
                      </p>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          {/* Bulk Temperature Entry Table */}
          {showBulkForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-4 bg-slate-50 rounded-xl border-2 border-blue-200"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {currentShift === 'opening' ? '🌅 Opening Check' : 
                     currentShift === 'mid_shift' ? '☀️ Mid-Shift Check' : 
                     '🌙 Closing Check'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {format(new Date(), 'EEEE, MMMM d, yyyy • h:mm a')}
                  </p>
                  {lastAutoSave && (
                    <p className="text-xs text-emerald-600 mt-1">
                      ✓ Last auto-saved: {format(lastAutoSave, 'HH:mm:ss')}
                    </p>
                  )}
                </div>
                <Badge className="bg-blue-100 text-blue-700">
                  Logged by: {user?.full_name || user?.email}
                </Badge>
              </div>

              <div className="overflow-x-auto border rounded-lg bg-white">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700">Equipment</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Location</th>
                      <th className="text-center p-3 font-semibold text-slate-700">Safe Range</th>
                      <th className="text-center p-3 font-semibold text-slate-700">Current Temp (°C)</th>
                      <th className="text-center p-3 font-semibold text-slate-700">Status</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentList.map((equip, idx) => {
                      const currentTemp = bulkTemperatures[equip.id];
                      const status = currentTemp ? getTempStatus(
                        parseFloat(currentTemp), 
                        equip.min_temp ?? 0, 
                        equip.max_temp ?? 5
                      ) : null;
                      const StatusIcon = status?.icon;

                      return (
                        <tr key={equip.id} className="border-b hover:bg-slate-50">
                          <td className="p-3 font-medium">{equip.name}</td>
                          <td className="p-3 text-slate-600">{equip.location}</td>
                          <td className="p-3 text-center text-slate-600">
                            {equip.min_temp ?? 0}°C to {equip.max_temp ?? 5}°C
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Enter"
                              value={bulkTemperatures[equip.id] || ''}
                              onChange={(e) => setBulkTemperatures({
                                ...bulkTemperatures,
                                [equip.id]: e.target.value
                              })}
                              className="text-center font-semibold"
                              autoFocus={idx === 0}
                            />
                          </td>
                          <td className="p-3 text-center">
                            {status && (
                              <Badge className={`${status.color} flex items-center gap-1 justify-center`}>
                                {StatusIcon && <StatusIcon className="w-3 h-3" />}
                                {status.label}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Input
                              placeholder="Notes..."
                              value={bulkNotes[equip.id] || ''}
                              onChange={(e) => setBulkNotes({
                                ...bulkNotes,
                                [equip.id]: e.target.value
                              })}
                              className="text-sm"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-3">
                <p className="text-sm text-slate-600">
                  {Object.keys(bulkTemperatures).length} of {equipmentList.length} equipment logged
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowBulkForm(false);
                      setBulkTemperatures({});
                      setBulkNotes({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBulkSubmit(true)}
                    disabled={bulkCreateLogMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    onClick={() => handleBulkSubmit(false)}
                    disabled={bulkCreateLogMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {bulkCreateLogMutation.isPending ? 'Saving...' : '✅ Submit All'}
                  </Button>
                </div>
              </div>

              {/* Completion Status Banner */}
              {completionStatus && (
                <FormCompletionBanner 
                  status={completionStatus}
                  message={completionStatus === 'failed' 
                    ? '❌ Failed — Action Required'
                    : '✅ Completed & Logged'}
                  details={completionStatus === 'failed'
                    ? 'Some temperatures are out of range. Manager has been notified. Review the critical readings and take corrective action.'
                    : 'All temperature readings have been logged within safe ranges.'}
                />
              )}
            </motion.div>
          )}

          {/* Today's Logs - Grouped by Shift */}
          <div className="space-y-6">
            <h4 className="font-semibold text-slate-800">Today's Logs</h4>
            
            {['opening', 'mid_shift', 'closing'].map(shift => {
              const shiftLogs = groupLogsByShift()[shift];
              const shiftLabel = shift === 'opening' ? '🌅 Opening' : 
                               shift === 'mid_shift' ? '☀️ Mid-Shift' : 
                               '🌙 Closing';
              
              return (
                <div key={shift} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-slate-700">{shiftLabel}</h5>
                    <Badge variant={shiftLogs.length > 0 ? 'default' : 'outline'}>
                      {shiftLogs.length} entries
                    </Badge>
                  </div>
                  
                  {shiftLogs.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg bg-white">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="text-left p-2 font-medium">Equipment</th>
                            <th className="text-center p-2 font-medium">Temp</th>
                            <th className="text-center p-2 font-medium">Status</th>
                            <th className="text-left p-2 font-medium">User</th>
                            <th className="text-left p-2 font-medium">Time</th>
                            <th className="text-left p-2 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftLogs.map(log => (
                            <tr key={log.id} className="border-b last:border-0">
                              <td className="p-2 font-medium">{log.equipment_name}</td>
                              <td className="p-2 text-center">
                                <span className={`font-bold ${
                                  log.is_in_range ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                  {log.temperature}°C
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <Badge className={log.is_in_range 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-red-100 text-red-700'
                                }>
                                  {log.is_in_range ? 'OK' : 'Critical'}
                                </Badge>
                              </td>
                              <td className="p-2 text-slate-600">{log.logged_by_name}</td>
                              <td className="p-2 text-slate-600">
                                {format(new Date(log.created_date), 'h:mm a')}
                              </td>
                              <td className="p-2 text-slate-600 text-xs">{log.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-slate-400 py-4 bg-slate-50 rounded-lg">
                      No logs for this shift yet
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Manager Dialog */}
      <Dialog open={showEquipmentManager} onOpenChange={setShowEquipmentManager}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Temperature Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              onClick={() => {
                setEditingEquipment(null);
                setEquipmentFormData({ name: '', location: '', min_temp: '', max_temp: '', temperature_tracking: true });
                setShowEquipmentForm(true);
              }} 
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Equipment
            </Button>
            
            <div className="space-y-2">
              {equipmentList.map((equip) => (
                <Card key={equip.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{equip.name}</p>
                      <p className="text-sm text-slate-600">{equip.location}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Safe Range: {equip.min_temp}°C to {equip.max_temp}°C
                      </p>
                      <Badge className="mt-1 text-xs">
                        {equip.temp_check_frequency || 'all_shifts'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingEquipment(equip);
                          setEquipmentFormData({
                            name: equip.name,
                            location: equip.location || '',
                            min_temp: equip.min_temp?.toString() || '',
                            max_temp: equip.max_temp?.toString() || '',
                            temperature_tracking: true
                          });
                          setShowEquipmentForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm('Delete this equipment?')) {
                            deleteEquipmentMutation.mutate(equip.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {equipmentList.length === 0 && (
                <p className="text-center text-slate-500 py-8">No temperature-tracked equipment added yet</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Equipment Form Dialog */}
      <Dialog open={showEquipmentForm} onOpenChange={setShowEquipmentForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEquipment ? 'Edit Equipment' : 'Add Temperature Equipment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Equipment Name *</Label>
              <Input
                value={equipmentFormData.name}
                onChange={(e) => setEquipmentFormData({...equipmentFormData, name: e.target.value})}
                placeholder="e.g., Walk-in Fridge"
              />
            </div>
            <div>
              <Label>Location *</Label>
              <Input
                value={equipmentFormData.location}
                onChange={(e) => setEquipmentFormData({...equipmentFormData, location: e.target.value})}
                placeholder="e.g., Main Kitchen"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Safe Temp (°C) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={equipmentFormData.min_temp}
                  onChange={(e) => setEquipmentFormData({...equipmentFormData, min_temp: e.target.value})}
                  placeholder="e.g., 0"
                />
              </div>
              <div>
                <Label>Max Safe Temp (°C) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={equipmentFormData.max_temp}
                  onChange={(e) => setEquipmentFormData({...equipmentFormData, max_temp: e.target.value})}
                  placeholder="e.g., 5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEquipmentForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEquipmentSubmit}
              disabled={!equipmentFormData.name || !equipmentFormData.location || !equipmentFormData.min_temp || !equipmentFormData.max_temp}
            >
              {editingEquipment ? 'Update' : 'Add'} Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}