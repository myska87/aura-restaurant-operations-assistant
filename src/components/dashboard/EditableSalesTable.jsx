import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, X, Edit2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EditableSalesTable({ sales }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSale, setNewSale] = useState({ item_name: '', quantity: 1, price: 0, date: new Date().toISOString().split('T')[0] });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Sale.update(data.id, {
      quantity: data.quantity,
      unit_price: data.unit_price,
      total_amount: data.total_amount
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      setEditingId(null);
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Sale.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      setShowNewForm(false);
      setNewSale({ item_name: '', quantity: 1, price: 0, date: new Date().toISOString().split('T')[0] });
    }
  });

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: editData.id,
      quantity: editData.quantity,
      unit_price: editData.unit_price,
      total_amount: editData.quantity * editData.unit_price
    });
  };

  const handleCreateSale = () => {
    createMutation.mutate({
      item_name: newSale.item_name,
      quantity: newSale.quantity,
      unit_price: newSale.price,
      total_amount: newSale.quantity * newSale.price,
      sale_date: newSale.date
    });
  };

  const groupedByDate = sales.reduce((acc, item) => {
    const date = item.sale_date || item.created_date?.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowNewForm(!showNewForm)} className="gap-2">
        <Plus className="w-4 h-4" />
        Add Sale
      </Button>

      {showNewForm && (
        <Card className="bg-emerald-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-5 gap-3">
              <Input
                placeholder="Item name"
                value={newSale.item_name}
                onChange={(e) => setNewSale({ ...newSale, item_name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Quantity"
                value={newSale.quantity}
                onChange={(e) => setNewSale({ ...newSale, quantity: parseFloat(e.target.value) })}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Price (£)"
                value={newSale.price}
                onChange={(e) => setNewSale({ ...newSale, price: parseFloat(e.target.value) })}
              />
              <Input
                type="date"
                value={newSale.date}
                onChange={(e) => setNewSale({ ...newSale, date: e.target.value })}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateSale} disabled={createMutation.isPending} className="flex-1">
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowNewForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(groupedByDate).sort().reverse().map(([date, dateSales]) => (
        <Card key={date}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{new Date(date).toLocaleDateString()} — {dateSales.length} sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Item</th>
                    <th className="text-left py-2 px-2">Qty</th>
                    <th className="text-left py-2 px-2">Unit Price (£)</th>
                    <th className="text-left py-2 px-2">Total (£)</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dateSales.map((item) => (
                    <motion.tr key={item.id} className="border-b hover:bg-slate-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td className="py-2 px-2">{item.item_name}</td>
                      <td className="py-2 px-2">
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={editData.quantity}
                            onChange={(e) => setEditData({ ...editData, quantity: parseFloat(e.target.value) })}
                            className="w-16 h-8"
                          />
                        ) : (
                          <span>{item.quantity}</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editData.unit_price}
                            onChange={(e) => setEditData({ ...editData, unit_price: parseFloat(e.target.value) })}
                            className="w-20 h-8"
                          />
                        ) : (
                          <span>£{(item.unit_price || 0).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 font-semibold">£{(item.total_amount || 0).toFixed(2)}</td>
                      <td className="py-2 px-2 flex gap-1">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}