import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Save } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function TemperatureLogsTable({ user, onClose }) {
  const [temps, setTemps] = useState({});
  const [comments, setComments] = useState({});
  const [outOfRangeAlerts, setOutOfRangeAlerts] = useState({});
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch temperature-controlled equipment
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['tempAssets'],
    queryFn: () => base44.entities.Assets_Registry_v1.filter({ 
      is_temperature_controlled: true,
      status: { $ne: 'deactivated' }
    }),
    enabled: !!user
  });

  // Fetch today's temperature logs
  const { data: logs = [] } = useQuery({
    queryKey: ['tempLogs', today],
    queryFn: () => base44.entities.TemperatureLog.filter({ log_date: today }),
    enabled: !!user
  });

  // Initialize temps from existing logs
  useEffect(() => {
    const initialTemps = {};
    const initialComments = {};
    logs.forEach(log => {
      initialTemps[log.asset_id] = log.current_temperature;
      initialComments[log.asset_id] = log.notes || '';
    });
    setTemps(initialTemps);
    setComments(initialComments);
  }, [logs]);

  // Check if temperature is in range
  const isInRange = (assetId, temperature) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset || !temperature) return true;
    const temp = parseFloat(temperature);
    const minTemp = parseFloat(asset.min_safe_temp || -18);
    const maxTemp = parseFloat(asset.max_safe_temp || 5);
    return temp >= minTemp && temp <= maxTemp;
  };

  // Save single row
  const saveTempMutation = useMutation({
    mutationFn: async (data) => {
      const { assetId, temperature, comment } = data;
      
      // Check if out of range
      const outOfRange = !isInRange(assetId, temperature);
      
      if (outOfRange && !comment) {
        throw new Error('Comment required for out-of-range temperatures');
      }

      const existingLog = logs.find(l => l.asset_id === assetId);
      
      const logData = {
        asset_id: assetId,
        asset_name: assets.find(a => a.id === assetId)?.asset_name,
        log_date: today,
        current_temperature: parseFloat(temperature),
        notes: comment,
        logged_by_id: user?.id,
        logged_by_email: user?.email,
        logged_by_name: user?.full_name,
        logged_at: new Date().toISOString(),
        status: outOfRange ? 'out_of_range' : 'ok'
      };

      if (existingLog) {
        await base44.entities.TemperatureLog.update(existingLog.id, logData);
      } else {
        await base44.entities.TemperatureLog.create(logData);
      }

      // Send manager notification if out of range
      if (outOfRange) {
        const asset = assets.find(a => a.id === assetId);
        await base44.entities.Notification.create({
          recipient_email: 'manager@example.com', // Will be filtered by actual manager role in real app
          title: '⚠️ Temperature Alert',
          message: `${asset?.asset_name} is ${temperature}°C - out of safe range. Comment: ${comment}`,
          type: 'alert',
          priority: 'high',
          is_read: false,
          source_user_email: user?.email,
          source_user_name: user?.full_name
        }).catch(() => {});
      }

      return logData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tempLogs'] });
    }
  });

  // Save all
  const saveAllMutation = useMutation({
    mutationFn: async () => {
      const errors = [];
      const promises = [];

      assets.forEach(asset => {
        const temp = temps[asset.id];
        if (temp) {
          const outOfRange = !isInRange(asset.id, temp);
          const comment = comments[asset.id];
          
          if (outOfRange && !comment) {
            errors.push(`${asset.asset_name}: Comment required for out-of-range temperature`);
            return;
          }

          promises.push(
            saveTempMutation.mutateAsync({
              assetId: asset.id,
              temperature: temp,
              comment: comment
            })
          );
        }
      });

      if (errors.length > 0) {
        throw new Error(errors.join('\n'));
      }

      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tempLogs'] });
    }
  });

  if (assetsLoading) return <LoadingSpinner />;

  const handleSaveRow = (assetId) => {
    const temp = temps[assetId];
    if (!temp) {
      alert('Please enter a temperature');
      return;
    }
    saveTempMutation.mutate({
      assetId,
      temperature: temp,
      comment: comments[assetId] || ''
    });
  };

  const handleSaveAll = () => {
    saveAllMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Temperature Logs - {format(new Date(), 'EEEE, MMMM dd')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Equipment</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Safe Range</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Temperature (°C)</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Comment</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const temp = temps[asset.id];
                  const comment = comments[asset.id];
                  const inRange = temp ? isInRange(asset.id, temp) : null;
                  const minTemp = asset.min_safe_temp || -18;
                  const maxTemp = asset.max_safe_temp || 5;

                  return (
                    <tr 
                      key={asset.id}
                      className={`border-b transition-colors ${
                        inRange === false ? 'bg-red-50' : inRange === true ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">{asset.asset_name}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {minTemp}°C to {maxTemp}°C
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.1"
                          value={temp || ''}
                          onChange={(e) => setTemps({ ...temps, [asset.id]: e.target.value })}
                          placeholder="Enter temp"
                          className="w-24 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inRange === null ? (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        ) : inRange ? (
                          <Badge className="bg-emerald-500 text-white text-xs flex items-center gap-1 w-fit mx-auto">
                            <Check className="w-3 h-3" />
                            OK
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500 text-white text-xs flex items-center gap-1 w-fit mx-auto">
                            <AlertCircle className="w-3 h-3" />
                            OUT OF RANGE
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {inRange === false && (
                          <input
                            type="text"
                            placeholder="Required comment"
                            value={comment || ''}
                            onChange={(e) => setComments({ ...comments, [asset.id]: e.target.value })}
                            className="w-32 px-2 py-1 border border-red-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleSaveRow(asset.id)}
                          disabled={saveTempMutation.isPending || !temp}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Save All Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={saveAllMutation.isPending || Object.keys(temps).length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save All Temperatures
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
            Out-of-range temperatures require a comment and will trigger a manager notification.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}