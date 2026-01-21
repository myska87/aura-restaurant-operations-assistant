import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, X, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EditableMenuItemsTable({ menuItems, refetch }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.MenuItem.update(data.id, {
      name: data.name,
      price: data.price,
      cost: data.cost,
      profit_margin: data.profit_margin,
      is_active: data.is_active
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items-dashboard'] });
      setEditingId(null);
    }
  });

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const handleSave = () => {
    const margin = ((editData.price - editData.cost) / editData.price * 100).toFixed(1);
    updateMutation.mutate({ ...editData, profit_margin: parseFloat(margin) });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="text-left py-3 px-3">Item Name</th>
            <th className="text-left py-3 px-3">Category</th>
            <th className="text-left py-3 px-3">Price (£)</th>
            <th className="text-left py-3 px-3">Cost (£)</th>
            <th className="text-left py-3 px-3">Margin</th>
            <th className="text-left py-3 px-3">Status</th>
            <th className="text-left py-3 px-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {menuItems.map((item) => (
            <motion.tr 
              key={item.id} 
              className="border-b hover:bg-slate-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <td className="py-3 px-3">
                {editingId === item.id ? (
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                ) : (
                  <span className="font-medium">{item.name}</span>
                )}
              </td>
              <td className="py-3 px-3 text-xs text-slate-500">{item.category}</td>
              <td className="py-3 px-3">
                {editingId === item.id ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.price}
                    onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                    className="w-24 h-8 text-sm"
                  />
                ) : (
                  <span>£{(item.price || 0).toFixed(2)}</span>
                )}
              </td>
              <td className="py-3 px-3">
                {editingId === item.id ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.cost}
                    onChange={(e) => setEditData({ ...editData, cost: parseFloat(e.target.value) })}
                    className="w-24 h-8 text-sm"
                  />
                ) : (
                  <span>£{(item.cost || 0).toFixed(2)}</span>
                )}
              </td>
              <td className="py-3 px-3">
                {editingId === item.id ? (
                  <span className="text-sm">
                    {(((editData.price - editData.cost) / editData.price * 100) || 0).toFixed(1)}%
                  </span>
                ) : (
                  <Badge className={item.profit_margin > 50 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                    {(item.profit_margin || 0).toFixed(1)}%
                  </Badge>
                )}
              </td>
              <td className="py-3 px-3">
                <Badge variant={item.is_active ? 'default' : 'secondary'}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="py-3 px-3 flex gap-1">
                {editingId === item.id ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={handleSave} disabled={updateMutation.isPending}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}