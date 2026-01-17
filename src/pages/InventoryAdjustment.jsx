import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, History, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function InventoryAdjustment() {
  const [user, setUser] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [reasonNotes, setReasonNotes] = useState('');

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log('User not authenticated');
      }
    };
    loadUser();
  }, []);

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient_Master_v1.list('-created_date', 500),
    initialData: [],
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit_logs', selectedIngredient?.id],
    queryFn: () => base44.entities.Inventory_Audit_Log_v1.filter(
      { ingredient_id: selectedIngredient.id },
      '-created_date',
      100
    ),
    enabled: !!selectedIngredient?.id,
    initialData: [],
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ ingredient, newStockValue, reason, notes }) => {
      if (!ingredient?.data) return;
      
      const previousStock = ingredient.data.current_stock || 0;
      const stockChange = newStockValue - previousStock;

      // Create audit log entry
      await base44.entities.Inventory_Audit_Log_v1.create({
        ingredient_id: ingredient.id,
        ingredient_name: ingredient.data.name || 'Unknown',
        previous_stock: previousStock,
        new_stock: newStockValue,
        stock_change: stockChange,
        unit: ingredient.data.unit || 'units',
        change_reason: reason,
        reason_notes: notes,
        updated_by_id: user.id,
        updated_by_name: user.full_name || user.email,
        updated_by_role: user.role,
        source: 'manual_update',
      });

      // Update ingredient stock
      await base44.entities.Ingredient_Master_v1.update(ingredient.id, {
        current_stock: newStockValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] });
      setUpdateDialogOpen(false);
      setNewStock('');
      setChangeReason('');
      setReasonNotes('');
    },
  });

  const handleUpdateClick = (ingredient) => {
    setSelectedIngredient(ingredient);
    setNewStock(ingredient.data.current_stock?.toString() || '0');
    setUpdateDialogOpen(true);
  };

  const handleHistoryClick = (ingredient) => {
    setSelectedIngredient(ingredient);
    setHistoryDialogOpen(true);
  };

  const handleSaveUpdate = () => {
    if (!changeReason) {
      alert('Please select a reason for the stock update');
      return;
    }

    const newStockValue = parseFloat(newStock);
    if (isNaN(newStockValue) || newStockValue < 0) {
      alert('Please enter a valid positive number');
      return;
    }

    updateStockMutation.mutate({
      ingredient: selectedIngredient,
      newStockValue,
      reason: changeReason,
      notes: reasonNotes,
    });
  };

  const getStockStatus = (ingredient) => {
    if (!ingredient?.data) return { label: 'Unknown', color: 'bg-gray-500 text-white' };
    
    const stock = ingredient.data.current_stock || 0;
    const min = ingredient.data.min_stock_level || 0;

    if (stock === 0) return { label: 'Out', color: 'bg-red-500 text-white' };
    if (stock < min) return { label: 'Low', color: 'bg-yellow-500 text-white' };
    if (stock < min * 2) return { label: 'Medium', color: 'bg-blue-500 text-white' };
    return { label: 'Good', color: 'bg-green-500 text-white' };
  };

  const canEdit = user && ['admin', 'manager', 'owner'].includes(user.role);

  if (isLoading) return <LoadingSpinner message="Loading inventory..." />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Real-Time Inventory Adjustment</span>
            {!canEdit && (
              <Badge variant="secondary">View Only - No Edit Permission</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {ingredients.map((ingredient) => {
                    if (!ingredient?.data) return null;
                    const status = getStockStatus(ingredient);
                    return (
                      <motion.tr
                        key={ingredient.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b"
                      >
                        <TableCell className="font-medium">{ingredient.data.name || 'Unknown'}</TableCell>
                        <TableCell className="capitalize">{ingredient.data.category || 'N/A'}</TableCell>
                        <TableCell>
                          <span className="text-lg font-semibold">
                            {ingredient.data.current_stock || 0}
                          </span>
                        </TableCell>
                        <TableCell>{ingredient.data.unit || 'units'}</TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateClick(ingredient)}
                              >
                                <Edit className="w-4 h-4 mr-1" /> Update
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleHistoryClick(ingredient)}
                            >
                              <History className="w-4 h-4 mr-1" /> History
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Update Stock Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - {selectedIngredient?.data.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Current Stock (Read-Only)
              </label>
              <Input
                value={`${selectedIngredient?.data.current_stock || 0} ${selectedIngredient?.data.unit}`}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                New Stock Value *
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="Enter new stock value"
                />
                <span className="flex items-center text-gray-500 font-medium px-3">
                  {selectedIngredient?.data.unit}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Reason for Update *
              </label>
              <Select value={changeReason} onValueChange={setChangeReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock_count">Stock Count / Physical Check</SelectItem>
                  <SelectItem value="delivery_received">New Delivery Received</SelectItem>
                  <SelectItem value="correction">Correction / Mistake</SelectItem>
                  <SelectItem value="waste_spoilage">Waste / Spoilage</SelectItem>
                  <SelectItem value="opening_stock">Opening Stock</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Additional Notes (Optional)
              </label>
              <Textarea
                value={reasonNotes}
                onChange={(e) => setReasonNotes(e.target.value)}
                placeholder="Add any additional details..."
                rows={3}
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                This will update the current stock immediately and create an audit log entry.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveUpdate}
              disabled={updateStockMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {updateStockMutation.isPending ? 'Saving...' : 'Save Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Stock History - {selectedIngredient?.data.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No history records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <Card key={log.id} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {log.data.previous_stock} {log.data.unit} → {log.data.new_stock} {log.data.unit}
                          </p>
                          <p className="text-sm text-gray-600">
                            Change: {log.data.stock_change > 0 ? '+' : ''}{log.data.stock_change} {log.data.unit}
                          </p>
                        </div>
                        <Badge variant={log.data.stock_change > 0 ? 'default' : 'destructive'}>
                          {log.data.change_reason.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {log.data.reason_notes && (
                        <p className="text-sm text-gray-600 mb-2 italic">
                          "{log.data.reason_notes}"
                        </p>
                      )}
                      <div className="text-xs text-gray-500 flex items-center gap-4">
                        <span>By: {log.data.updated_by_name}</span>
                        <span>•</span>
                        <span>Role: {log.data.updated_by_role}</span>
                        <span>•</span>
                        <span>{new Date(log.created_date).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}