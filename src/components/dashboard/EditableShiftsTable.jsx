import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, X, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EditableShiftsTable({ shifts, refetch }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Shift.update(data.id, {
      duration: data.duration,
      total_cost: data.total_cost,
      status: data.status
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts-dashboard'] });
      setEditingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Shift.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts-dashboard'] });
    }
  });

  const handleEdit = (shift) => {
    setEditingId(shift.id);
    setEditData(shift);
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this shift?')) {
      deleteMutation.mutate(id);
    }
  };

  const groupedByDate = shifts.reduce((acc, shift) => {
    if (!acc[shift.date]) acc[shift.date] = [];
    acc[shift.date].push(shift);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDate).sort().reverse().map(([date, dayShifts]) => (
        <Card key={date}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{new Date(date).toLocaleDateString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Staff</th>
                    <th className="text-left py-2 px-2">Position</th>
                    <th className="text-left py-2 px-2">Duration (h)</th>
                    <th className="text-left py-2 px-2">Cost (£)</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dayShifts.map((shift) => (
                    <motion.tr 
                      key={shift.id} 
                      className="border-b hover:bg-slate-50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="py-2 px-2">{shift.staff_name}</td>
                      <td className="py-2 px-2">{shift.position}</td>
                      <td className="py-2 px-2">
                        {editingId === shift.id ? (
                          <Input
                            type="number"
                            step="0.5"
                            value={editData.duration}
                            onChange={(e) => setEditData({ ...editData, duration: parseFloat(e.target.value) })}
                            className="w-20 h-8"
                          />
                        ) : (
                          <span>{shift.duration || 0}</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {editingId === shift.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editData.total_cost}
                            onChange={(e) => setEditData({ ...editData, total_cost: parseFloat(e.target.value) })}
                            className="w-24 h-8"
                          />
                        ) : (
                          <span>£{(shift.total_cost || 0).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {editingId === shift.id ? (
                          <select
                            value={editData.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                            className="h-8 text-xs border rounded"
                          >
                            <option>scheduled</option>
                            <option>clocked_in</option>
                            <option>completed</option>
                            <option>missed</option>
                          </select>
                        ) : (
                          <Badge variant="outline">{shift.status}</Badge>
                        )}
                      </td>
                      <td className="py-2 px-2 flex gap-1">
                        {editingId === shift.id ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={handleSave} disabled={updateMutation.isPending}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(shift)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(shift.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}