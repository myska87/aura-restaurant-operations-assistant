import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PrepComponentsManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrep, setEditingPrep] = useState(null);
  const [formData, setFormData] = useState({
    prep_name: '',
    category: '',
    station: '',
    batch_size: '',
    batch_unit: '',
    yield_portions: '',
    shelf_life_hours: '',
    storage_location: '',
    preparation_method: [],
    notes: '',
  });
  const [currentStep, setCurrentStep] = useState('');

  const queryClient = useQueryClient();

  const { data: prepComponents = [], isLoading } = useQuery({
    queryKey: ['prep_components'],
    queryFn: () => base44.entities.Prep_Components_v1.list('-created_date', 500),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Prep_Components_v1.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prep_components'] });
      resetForm();
      setDialogOpen(false);
      alert('Prep component created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create prep component:', error);
      alert('Failed to create prep component. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Prep_Components_v1.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prep_components'] });
      resetForm();
      setDialogOpen(false);
      alert('Prep component updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update prep component:', error);
      alert('Failed to update prep component. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Prep_Components_v1.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prep_components'] });
    },
  });

  const resetForm = () => {
    setFormData({
      prep_name: '',
      category: '',
      station: '',
      batch_size: '',
      batch_unit: '',
      yield_portions: '',
      shelf_life_hours: '',
      storage_location: '',
      preparation_method: [],
      notes: '',
    });
    setCurrentStep('');
    setEditingPrep(null);
  };

  const handleEdit = (prep) => {
    setEditingPrep(prep);
    setFormData({
      prep_name: prep.data.prep_name || '',
      category: prep.data.category || '',
      station: prep.data.station || '',
      batch_size: prep.data.batch_size || '',
      batch_unit: prep.data.batch_unit || '',
      yield_portions: prep.data.yield_portions || '',
      shelf_life_hours: prep.data.shelf_life_hours || '',
      storage_location: prep.data.storage_location || '',
      preparation_method: prep.data.preparation_method || [],
      notes: prep.data.notes || '',
    });
    setDialogOpen(true);
  };

  const handleAddStep = () => {
    if (currentStep.trim()) {
      setFormData({
        ...formData,
        preparation_method: [...formData.preparation_method, currentStep],
      });
      setCurrentStep('');
    }
  };

  const handleRemoveStep = (index) => {
    setFormData({
      ...formData,
      preparation_method: formData.preparation_method.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.prep_name || !formData.category || !formData.station || 
        !formData.batch_size || !formData.batch_unit || !formData.storage_location) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }

    const data = {
      ...formData,
      batch_size: parseFloat(formData.batch_size),
      yield_portions: parseFloat(formData.yield_portions) || 0,
      shelf_life_hours: parseFloat(formData.shelf_life_hours) || 24,
      status: 'not_prepared',
    };

    if (editingPrep) {
      updateMutation.mutate({ id: editingPrep.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading prep components..." />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Prep Components Manager</CardTitle>
            <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Prep Component
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prep Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Batch Size</TableHead>
                  <TableHead>Yield</TableHead>
                  <TableHead>Shelf Life</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prepComponents.map((prep) => {
                  if (!prep?.data) return null;
                  return (
                    <TableRow key={prep.id}>
                      <TableCell className="font-medium">{prep.data.prep_name}</TableCell>
                      <TableCell className="capitalize">{prep.data.category}</TableCell>
                      <TableCell className="capitalize">{prep.data.station?.replace('_', ' ')}</TableCell>
                      <TableCell>
                        {prep.data.batch_size} {prep.data.batch_unit}
                      </TableCell>
                      <TableCell>{prep.data.yield_portions} portions</TableCell>
                      <TableCell>{prep.data.shelf_life_hours}h</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(prep)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Delete this prep component?')) {
                                deleteMutation.mutate(prep.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPrep ? 'Edit' : 'Add'} Prep Component</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Prep Name *</label>
              <Input
                value={formData.prep_name}
                onChange={(e) => setFormData({ ...formData, prep_name: e.target.value })}
                placeholder="e.g., Butter Chicken Sauce"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category *</label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sauce">Sauce</SelectItem>
                    <SelectItem value="protein">Protein</SelectItem>
                    <SelectItem value="bread">Bread</SelectItem>
                    <SelectItem value="chutney">Chutney</SelectItem>
                    <SelectItem value="beverage_base">Beverage Base</SelectItem>
                    <SelectItem value="garnish">Garnish</SelectItem>
                    <SelectItem value="base_prep">Base Prep</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Station *</label>
                <Select value={formData.station} onValueChange={(val) => setFormData({ ...formData, station: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot_line">Hot Line</SelectItem>
                    <SelectItem value="grill">Grill Station</SelectItem>
                    <SelectItem value="cold_prep">Cold Prep</SelectItem>
                    <SelectItem value="chai_station">Chai Station</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                    <SelectItem value="fryer">Fryer Station</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Batch Size *</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.batch_size}
                  onChange={(e) => setFormData({ ...formData, batch_size: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Unit *</label>
                <Select value={formData.batch_unit} onValueChange={(val) => setFormData({ ...formData, batch_unit: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Liters</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="portions">Portions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Yield (portions)</label>
                <Input
                  type="number"
                  value={formData.yield_portions}
                  onChange={(e) => setFormData({ ...formData, yield_portions: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Shelf Life (hours)</label>
                <Input
                  type="number"
                  value={formData.shelf_life_hours}
                  onChange={(e) => setFormData({ ...formData, shelf_life_hours: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Storage Location *</label>
                <Select value={formData.storage_location} onValueChange={(val) => setFormData({ ...formData, storage_location: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Storage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fridge">Fridge</SelectItem>
                    <SelectItem value="freezer">Freezer</SelectItem>
                    <SelectItem value="hot_hold">Hot Hold</SelectItem>
                    <SelectItem value="ambient">Ambient</SelectItem>
                    <SelectItem value="bain_marie">Bain Marie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Preparation Steps</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={currentStep}
                  onChange={(e) => setCurrentStep(e.target.value)}
                  placeholder="Add preparation step..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStep()}
                />
                <Button type="button" onClick={handleAddStep}>Add Step</Button>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {formData.preparation_method.map((step, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span>{step}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveStep(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingPrep ? 'Update' : 'Create'} Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}