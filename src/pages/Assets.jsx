import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import {
  Wrench,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  Camera,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  History,
  Upload,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const assetCategories = [
  { value: 'kitchen_equipment', label: 'Kitchen Equipment', icon: '🍳' },
  { value: 'furniture', label: 'Furniture', icon: '🪑' },
  { value: 'electronics', label: 'Electronics', icon: '💻' },
  { value: 'refrigeration', label: 'Refrigeration', icon: '❄️' },
  { value: 'cooking', label: 'Cooking', icon: '🔥' },
  { value: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { value: 'tools', label: 'Tools', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📦' }
];

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  maintenance: 'bg-amber-100 text-amber-700',
  repair: 'bg-red-100 text-red-700',
  replaced: 'bg-slate-100 text-slate-600',
  disposed: 'bg-gray-100 text-gray-600'
};

const conditionColors = {
  excellent: 'bg-emerald-100 text-emerald-700',
  good: 'bg-blue-100 text-blue-700',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-red-100 text-red-700'
};

export default function Assets() {
  const [showForm, setShowForm] = useState(false);
  const [showServiceLog, setShowServiceLog] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [newService, setNewService] = useState({ date: '', type: '', description: '', cost: '', technician: '' });

  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      setShowForm(false);
      setEditingAsset(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Asset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      setShowForm(false);
      setShowServiceLog(false);
      setEditingAsset(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['assets'])
  });

  // Assets needing maintenance
  const maintenanceAlerts = assets.filter(asset => {
    if (!asset.next_maintenance) return false;
    const nextDate = new Date(asset.next_maintenance);
    return isBefore(nextDate, addDays(new Date(), 7));
  });

  // Assets with expired warranty
  const warrantyAlerts = assets.filter(asset => {
    if (!asset.warranty_expiry) return false;
    return isBefore(new Date(asset.warranty_expiry), new Date());
  });

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || asset.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValue = assets.reduce((sum, a) => sum + (a.purchase_cost || 0), 0);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return null;
    
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    let imageUrl = editingAsset?.image_url;
    let receiptUrl = editingAsset?.receipt_url;
    
    const imageInput = e.target.querySelector('input[name="image"]');
    const receiptInput = e.target.querySelector('input[name="receipt"]');
    
    if (imageInput?.files?.[0]) {
      imageUrl = await handleFileUpload({ target: imageInput });
    }
    if (receiptInput?.files?.[0]) {
      receiptUrl = await handleFileUpload({ target: receiptInput });
    }
    
    const data = {
      name: formData.get('name'),
      category: formData.get('category'),
      location: formData.get('location'),
      serial_number: formData.get('serial_number'),
      purchase_date: formData.get('purchase_date'),
      purchase_cost: parseFloat(formData.get('purchase_cost')) || 0,
      warranty_expiry: formData.get('warranty_expiry'),
      status: formData.get('status'),
      condition: formData.get('condition'),
      maintenance_schedule: formData.get('maintenance_schedule'),
      next_maintenance: formData.get('next_maintenance'),
      notes: formData.get('notes'),
      image_url: imageUrl,
      receipt_url: receiptUrl,
      service_log: editingAsset?.service_log || []
    };
    
    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addServiceLogEntry = () => {
    if (!selectedAsset || !newService.date) return;
    
    const updatedLog = [...(selectedAsset.service_log || []), {
      ...newService,
      cost: parseFloat(newService.cost) || 0
    }];
    
    updateMutation.mutate({
      id: selectedAsset.id,
      data: {
        ...selectedAsset,
        service_log: updatedLog,
        last_maintenance: newService.date
      }
    });
    
    setNewService({ date: '', type: '', description: '', cost: '', technician: '' });
  };

  if (isLoading) return <LoadingSpinner message="Loading assets..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Management"
        description={`${assets.length} assets tracked • Total Value: £${totalValue.toLocaleString()}`}
        action={() => { setEditingAsset(null); setShowForm(true); }}
        actionLabel="Add Asset"
      />

      {/* Alerts */}
      {(maintenanceAlerts.length > 0 || warrantyAlerts.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {maintenanceAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-800">Maintenance Due</h3>
                  <p className="text-sm text-amber-600">{maintenanceAlerts.length} asset(s) need servicing</p>
                </div>
              </div>
              <div className="space-y-2">
                {maintenanceAlerts.slice(0, 3).map(asset => (
                  <div key={asset.id} className="flex items-center justify-between text-sm bg-white/60 p-2 rounded-lg">
                    <span className="font-medium">{asset.name}</span>
                    <span className="text-amber-600">{format(new Date(asset.next_maintenance), 'MMM d')}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
          {warrantyAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-5 border border-red-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Warranty Expired</h3>
                  <p className="text-sm text-red-600">{warrantyAlerts.length} asset(s) out of warranty</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {assetCategories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="repair">Repair</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No assets found"
          description="Add your first asset to start tracking equipment and furniture."
          action={() => setShowForm(true)}
          actionLabel="Add Asset"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredAssets.map((asset, index) => {
              const categoryInfo = assetCategories.find(c => c.value === asset.category);
              const needsMaintenance = asset.next_maintenance && isBefore(new Date(asset.next_maintenance), addDays(new Date(), 7));
              
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all"
                >
                  {asset.image_url ? (
                    <div className="h-32 bg-slate-100">
                      <img src={asset.image_url} alt={asset.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <span className="text-4xl">{categoryInfo?.icon || '📦'}</span>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-800 line-clamp-1">{asset.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingAsset(asset); setShowForm(true); }}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedAsset(asset); setShowServiceLog(true); }}>
                            <History className="w-4 h-4 mr-2" /> Service Log
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteMutation.mutate(asset.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <p className="text-sm text-slate-500 mb-3">{asset.location || 'No location set'}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={statusColors[asset.status]}>{asset.status}</Badge>
                      <Badge className={conditionColors[asset.condition]}>{asset.condition}</Badge>
                      {needsMaintenance && (
                        <Badge className="bg-amber-100 text-amber-700">
                          <Clock className="w-3 h-3 mr-1" />
                          Maintenance Due
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>{categoryInfo?.label}</span>
                      {asset.purchase_cost && <span>£{asset.purchase_cost.toLocaleString()}</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Asset Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input name="name" defaultValue={editingAsset?.name} required />
              </div>
              <div>
                <Label>Category *</Label>
                <Select name="category" defaultValue={editingAsset?.category || 'kitchen_equipment'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {assetCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input name="location" defaultValue={editingAsset?.location} />
              </div>
              <div>
                <Label>Serial Number</Label>
                <Input name="serial_number" defaultValue={editingAsset?.serial_number} />
              </div>
              <div>
                <Label>Purchase Date</Label>
                <Input name="purchase_date" type="date" defaultValue={editingAsset?.purchase_date} />
              </div>
              <div>
                <Label>Purchase Cost (£)</Label>
                <Input name="purchase_cost" type="number" step="0.01" defaultValue={editingAsset?.purchase_cost} />
              </div>
              <div>
                <Label>Warranty Expiry</Label>
                <Input name="warranty_expiry" type="date" defaultValue={editingAsset?.warranty_expiry} />
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editingAsset?.status || 'active'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="replaced">Replaced</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition</Label>
                <Select name="condition" defaultValue={editingAsset?.condition || 'good'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Maintenance Schedule</Label>
                <Select name="maintenance_schedule" defaultValue={editingAsset?.maintenance_schedule || 'as_needed'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                    <SelectItem value="as_needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Next Maintenance</Label>
                <Input name="next_maintenance" type="date" defaultValue={editingAsset?.next_maintenance} />
              </div>
              <div className="col-span-2">
                <Label>Photo</Label>
                <Input name="image" type="file" accept="image/*" />
              </div>
              <div className="col-span-2">
                <Label>Receipt/Invoice</Label>
                <Input name="receipt" type="file" accept="image/*,.pdf" />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea name="notes" defaultValue={editingAsset?.notes} rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending || uploading}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700"
              >
                {uploading ? 'Uploading...' : editingAsset ? 'Update' : 'Add'} Asset
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Service Log Dialog */}
      <Dialog open={showServiceLog} onOpenChange={setShowServiceLog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedAsset && (
            <>
              <DialogHeader>
                <DialogTitle>Service Log - {selectedAsset.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Add new entry */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Add Service Entry</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        type="date" 
                        placeholder="Date"
                        value={newService.date}
                        onChange={(e) => setNewService({...newService, date: e.target.value})}
                      />
                      <Select value={newService.type} onValueChange={(v) => setNewService({...newService, type: v})}>
                        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="repair">Repair</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                          <SelectItem value="upgrade">Upgrade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input 
                      placeholder="Description"
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        type="number"
                        placeholder="Cost (£)"
                        value={newService.cost}
                        onChange={(e) => setNewService({...newService, cost: e.target.value})}
                      />
                      <Input 
                        placeholder="Technician"
                        value={newService.technician}
                        onChange={(e) => setNewService({...newService, technician: e.target.value})}
                      />
                    </div>
                    <Button onClick={addServiceLogEntry} disabled={!newService.date} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Entry
                    </Button>
                  </CardContent>
                </Card>

                {/* Service history */}
                <div>
                  <h4 className="font-semibold mb-3">Service History</h4>
                  <ScrollArea className="h-64">
                    {selectedAsset.service_log?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedAsset.service_log.map((entry, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline">{entry.type}</Badge>
                              <span className="text-sm text-slate-500">{entry.date}</span>
                            </div>
                            <p className="text-sm">{entry.description}</p>
                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                              <span>{entry.technician}</span>
                              {entry.cost && <span>£{entry.cost}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-slate-500 py-8">No service history yet</p>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}