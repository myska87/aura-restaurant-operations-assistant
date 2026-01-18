import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Thermometer, AlertTriangle, CheckCircle, Plus, Settings, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function TemperatureLog({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [showEquipmentManager, setShowEquipmentManager] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [formData, setFormData] = useState({
    equipment_name: '',
    temperature: '',
    check_time: '',
    notes: ''
  });
  const [equipmentFormData, setEquipmentFormData] = useState({
    name: '',
    location: '',
    min_temp: '',
    max_temp: ''
  });

  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['temperatureLogs', today],
    queryFn: () => base44.entities.TemperatureLog.filter({ log_date: today }, '-created_date', 100)
  });

  const { data: equipmentList = [] } = useQuery({
    queryKey: ['temperature-equipment'],
    queryFn: () => base44.entities.Asset.filter({ category: 'refrigeration' }, 'name', 100)
  });

  const createLogMutation = useMutation({
    mutationFn: (data) => base44.entities.TemperatureLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['temperatureLogs']);
      setShowForm(false);
      setFormData({ equipment_name: '', temperature: '', check_time: '', notes: '' });
    }
  });

  const equipmentMutation = useMutation({
    mutationFn: ({ id, data }) => id 
      ? base44.entities.Asset.update(id, data)
      : base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['temperature-equipment']);
      setShowEquipmentForm(false);
      setEditingEquipment(null);
      setEquipmentFormData({ name: '', location: '', min_temp: '', max_temp: '' });
    }
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['temperature-equipment'])
  });

  const handleSubmit = () => {
    const selectedEquip = equipmentList.find(e => e.name === formData.equipment_name);
    const temp = parseFloat(formData.temperature);
    const minTemp = selectedEquip?.min_temp ?? 0;
    const maxTemp = selectedEquip?.max_temp ?? 5;
    const isInRange = temp >= minTemp && temp <= maxTemp;

    createLogMutation.mutate({
      ...formData,
      temperature: temp,
      location: selectedEquip?.location || '',
      min_temp: minTemp,
      max_temp: maxTemp,
      is_in_range: isInRange,
      logged_by: user.email,
      logged_by_name: user.full_name || user.email,
      log_date: today,
      manager_notified: !isInRange
    });
  };

  const handleEquipmentSubmit = () => {
    const data = {
      name: equipmentFormData.name,
      location: equipmentFormData.location,
      category: 'refrigeration',
      min_temp: parseFloat(equipmentFormData.min_temp),
      max_temp: parseFloat(equipmentFormData.max_temp),
      status: 'active'
    };

    equipmentMutation.mutate({ 
      id: editingEquipment?.id, 
      data 
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
            <div className="flex gap-2">
              <Button onClick={() => setShowEquipmentManager(true)} size="sm" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Manage Equipment
              </Button>
              <Button onClick={() => setShowForm(!showForm)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Log Temperature
              </Button>
            </div>
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
                  {equipmentList.map(e => (
                    <SelectItem key={e.id} value={e.name}>
                      {e.name} - {e.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.equipment_name && (
                <>
                  <div className="p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="text-blue-900">
                      <strong>Range:</strong> {equipmentList.find(e => e.name === formData.equipment_name)?.min_temp}°C to{' '}
                      {equipmentList.find(e => e.name === formData.equipment_name)?.max_temp}°C
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

      {/* Equipment Manager Dialog */}
      <Dialog open={showEquipmentManager} onOpenChange={setShowEquipmentManager}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Temperature Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              onClick={() => {
                setEditingEquipment(null);
                setEquipmentFormData({ name: '', location: '', min_temp: '', max_temp: '' });
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
                        Range: {equip.min_temp}°C to {equip.max_temp}°C
                      </p>
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
                            max_temp: equip.max_temp?.toString() || ''
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
                <p className="text-center text-slate-500 py-8">No equipment added yet</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Equipment Form Dialog */}
      <Dialog open={showEquipmentForm} onOpenChange={setShowEquipmentForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEquipment ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Equipment Name *</Label>
              <Input
                value={equipmentFormData.name}
                onChange={(e) => setEquipmentFormData({...equipmentFormData, name: e.target.value})}
                placeholder="e.g., Fridge 1"
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
                <Label>Min Temp (°C) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={equipmentFormData.min_temp}
                  onChange={(e) => setEquipmentFormData({...equipmentFormData, min_temp: e.target.value})}
                  placeholder="e.g., 0"
                />
              </div>
              <div>
                <Label>Max Temp (°C) *</Label>
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