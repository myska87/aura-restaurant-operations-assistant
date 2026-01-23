import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Save, Thermometer } from 'lucide-react';

export default function TemperatureTableView({ open, onOpenChange, assets, existingLogs, user, date }) {
  const [tempData, setTempData] = useState({});
  const [comments, setComments] = useState({});
  const queryClient = useQueryClient();

  const createTempLogMutation = useMutation({
    mutationFn: (data) => base44.entities.TemperatureLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['todayTemps']);
    }
  });

  const createNotificationMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create(data)
  });

  const handleTempChange = (assetId, value) => {
    setTempData(prev => ({ ...prev, [assetId]: value }));
  };

  const handleCommentChange = (assetId, value) => {
    setComments(prev => ({ ...prev, [assetId]: value }));
  };

  const getStatus = (asset, temp) => {
    if (!temp) return 'pending';
    const temperature = parseFloat(temp);
    if (isNaN(temperature)) return 'pending';
    
    const minTemp = asset.min_temp || -18;
    const maxTemp = asset.max_temp || 5;
    
    if (temperature < minTemp || temperature > maxTemp) {
      return 'out_of_range';
    }
    return 'ok';
  };

  const handleSaveAll = async () => {
    const logsToCreate = [];
    const outOfRangeAssets = [];

    for (const asset of assets) {
      const temp = tempData[asset.id];
      if (!temp) continue;

      const status = getStatus(asset, temp);
      
      if (status === 'out_of_range' && !comments[asset.id]) {
        alert(`Temperature out of range for ${asset.asset_name}. Comment is REQUIRED.`);
        return;
      }

      logsToCreate.push({
        asset_id: asset.id,
        asset_name: asset.asset_name,
        asset_location: asset.location,
        recorded_temp: parseFloat(temp),
        min_acceptable_temp: asset.min_temp || -18,
        max_acceptable_temp: asset.max_temp || 5,
        status: status === 'out_of_range' ? 'out_of_range' : 'acceptable',
        logged_by: user?.full_name,
        logged_by_email: user?.email,
        log_date: date,
        log_time: new Date().toISOString(),
        notes: comments[asset.id] || ''
      });

      if (status === 'out_of_range') {
        outOfRangeAssets.push(asset);
      }
    }

    if (logsToCreate.length === 0) {
      alert('Please enter at least one temperature reading.');
      return;
    }

    // Create all logs
    for (const log of logsToCreate) {
      await createTempLogMutation.mutateAsync(log);
    }

    // Send notifications for out-of-range temps
    if (outOfRangeAssets.length > 0) {
      await createNotificationMutation.mutateAsync({
        title: '⚠️ Temperature Alert',
        message: `${outOfRangeAssets.length} fridge(s) out of safe range. Immediate action required.`,
        type: 'urgent',
        recipient_role: 'manager',
        related_module: 'temperature_logs'
      });
    }

    setTempData({});
    setComments({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-blue-600" />
            Bulk Temperature Logging
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
            <p><strong>Instructions:</strong> Walk around and enter temperatures for each unit. Save individual readings or save all at once.</p>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Unit</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Safe Range</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Current Temp (°C)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, idx) => {
                  const temp = tempData[asset.id];
                  const status = getStatus(asset, temp);
                  const existingLog = existingLogs.find(log => log.asset_id === asset.id);
                  
                  return (
                    <React.Fragment key={asset.id}>
                      <tr className={`border-b ${status === 'out_of_range' ? 'bg-red-50' : existingLog ? 'bg-emerald-50' : 'bg-white'}`}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{asset.asset_name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{asset.location}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {asset.min_temp || -18}°C to {asset.max_temp || 5}°C
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {existingLog ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{existingLog.recorded_temp}°C</span>
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            </div>
                          ) : (
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Enter temp"
                              value={temp || ''}
                              onChange={(e) => handleTempChange(asset.id, e.target.value)}
                              className={status === 'out_of_range' ? 'border-red-300' : ''}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {existingLog ? (
                            <Badge className="bg-emerald-100 text-emerald-700">Logged</Badge>
                          ) : status === 'pending' ? (
                            <Badge className="bg-slate-100 text-slate-600">Pending</Badge>
                          ) : status === 'ok' ? (
                            <Badge className="bg-green-100 text-green-700">OK</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3 h-3" />
                              Out of Range
                            </Badge>
                          )}
                        </td>
                      </tr>
                      {status === 'out_of_range' && !existingLog && (
                        <tr className="border-b bg-red-50">
                          <td colSpan="5" className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-red-900 mb-1">Comment Required</p>
                                <Textarea
                                  placeholder="Explain the issue and action taken..."
                                  value={comments[asset.id] || ''}
                                  onChange={(e) => handleCommentChange(asset.id, e.target.value)}
                                  rows={2}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={createTempLogMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save All Temperatures
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}