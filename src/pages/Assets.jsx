import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, Plus, Search, Filter, AlertTriangle, CheckCircle2, 
  XCircle, AlertCircle, Eye, Thermometer, Zap, Wrench
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';

export default function Assets() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Assets_Registry_v1.list('-created_date', 500),
    refetchInterval: 60000
  });

  const createAssetMutation = useMutation({
    mutationFn: (assetData) => base44.entities.Assets_Registry_v1.create(assetData),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      setShowAddDialog(false);
      setEditingAsset(null);
    }
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data, auditLog }) => 
      Promise.all([
        base44.entities.Assets_Registry_v1.update(id, data),
        auditLog ? base44.entities.Asset_Audit_Log_v1.create(auditLog) : Promise.resolve()
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      setShowAddDialog(false);
      setEditingAsset(null);
    }
  });

  const handleSubmit = (formData) => {
    if (editingAsset) {
      updateAssetMutation.mutate({
        id: editingAsset.id,
        data: formData,
        auditLog: {
          asset_id: editingAsset.id,
          asset_name: formData.asset_name,
          field_changed: 'bulk_update',
          old_value: JSON.stringify(editingAsset),
          new_value: JSON.stringify(formData),
          changed_by_id: user.id,
          changed_by_name: user.full_name,
          changed_by_role: user.role,
          change_reason: 'Manual update'
        }
      });
    } else {
      createAssetMutation.mutate(formData);
    }
  };

  if (!user) return <LoadingSpinner />;

  const isAdmin = ['admin', 'owner'].includes(user.role);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || asset.asset_category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus && asset.status !== 'deactivated';
  });

  const getStatusBadge = (status) => {
    const configs = {
      operational: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
      warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      fault: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      out_of_service: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const config = configs[status] || configs.operational;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status?.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      fridge: Thermometer,
      freezer: Thermometer,
      oven: Zap,
      fryer: Zap,
      coffee_machine: Wrench,
      small_equipment: Package
    };
    return icons[category] || Package;
  };

  const stats = {
    total: assets.filter(a => a.status !== 'deactivated').length,
    operational: assets.filter(a => a.status === 'operational').length,
    faults: assets.filter(a => ['fault', 'out_of_service'].includes(a.status)).length,
    critical: assets.filter(a => a.is_critical_asset && a.status !== 'deactivated').length
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset & Equipment Registry"
        description="Single source of truth for all kitchen equipment and assets"
        actionLabel={isAdmin ? "Add Asset" : null}
        actionIcon={Plus}
        onAction={isAdmin ? () => { setEditingAsset(null); setShowAddDialog(true); } : null}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Assets</p>
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <Package className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Operational</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.operational}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Faults</p>
                <p className="text-3xl font-bold text-red-600">{stats.faults}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Critical Assets</p>
                <p className="text-3xl font-bold text-amber-600">{stats.critical}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fridge">Fridge</SelectItem>
                <SelectItem value="freezer">Freezer</SelectItem>
                <SelectItem value="oven">Oven</SelectItem>
                <SelectItem value="fryer">Fryer</SelectItem>
                <SelectItem value="coffee_machine">Coffee Machine</SelectItem>
                <SelectItem value="small_equipment">Small Equipment</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="fault">Fault</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 font-medium">No assets found</p>
              {isAdmin && (
                <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Asset
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Critical</TableHead>
                  <TableHead>Temp Control</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const CategoryIcon = getCategoryIcon(asset.asset_category);
                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-5 h-5 text-slate-600" />
                          <div>
                            <p className="font-medium">{asset.asset_name}</p>
                            {asset.serial_number && (
                              <p className="text-xs text-slate-500">SN: {asset.serial_number}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {asset.asset_category?.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="capitalize">
                        {asset.location?.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>
                        {asset.is_critical_asset ? (
                          <Badge className="bg-red-100 text-red-800">Critical</Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {asset.is_temperature_controlled ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Thermometer className="w-3 h-3 mr-1" />
                            {asset.min_temp}°C - {asset.max_temp}°C
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link to={createPageUrl(`AssetDetail?id=${asset.id}`)}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Asset Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          </DialogHeader>
          <AssetForm 
            asset={editingAsset} 
            onSubmit={handleSubmit}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssetForm({ asset, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(asset || {
    asset_name: '',
    asset_category: 'fridge',
    asset_type: 'cold',
    location: 'kitchen',
    station: 'general',
    is_critical_asset: false,
    is_temperature_controlled: false,
    power_type: 'electric',
    status: 'operational'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Asset Name *</label>
          <Input
            value={formData.asset_name}
            onChange={(e) => handleChange('asset_name', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <Select value={formData.asset_category} onValueChange={(v) => handleChange('asset_category', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fridge">Fridge</SelectItem>
              <SelectItem value="freezer">Freezer</SelectItem>
              <SelectItem value="oven">Oven</SelectItem>
              <SelectItem value="fryer">Fryer</SelectItem>
              <SelectItem value="coffee_machine">Coffee Machine</SelectItem>
              <SelectItem value="small_equipment">Small Equipment</SelectItem>
              <SelectItem value="grill">Grill</SelectItem>
              <SelectItem value="dishwasher">Dishwasher</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type *</label>
          <Select value={formData.asset_type} onValueChange={(v) => handleChange('asset_type', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="mechanical">Mechanical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location *</label>
          <Select value={formData.location} onValueChange={(v) => handleChange('location', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kitchen">Kitchen</SelectItem>
              <SelectItem value="store_room">Store Room</SelectItem>
              <SelectItem value="front_counter">Front Counter</SelectItem>
              <SelectItem value="chai_station">Chai Station</SelectItem>
              <SelectItem value="prep_area">Prep Area</SelectItem>
              <SelectItem value="wash_area">Wash Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Station</label>
          <Select value={formData.station} onValueChange={(v) => handleChange('station', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hot_line">Hot Line</SelectItem>
              <SelectItem value="grill">Grill</SelectItem>
              <SelectItem value="chai">Chai</SelectItem>
              <SelectItem value="fryer">Fryer</SelectItem>
              <SelectItem value="bakery">Bakery</SelectItem>
              <SelectItem value="cold_prep">Cold Prep</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Serial Number</label>
          <Input
            value={formData.serial_number || ''}
            onChange={(e) => handleChange('serial_number', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Manufacturer</label>
          <Input
            value={formData.manufacturer || ''}
            onChange={(e) => handleChange('manufacturer', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <Input
            value={formData.model || ''}
            onChange={(e) => handleChange('model', e.target.value)}
          />
        </div>
      </div>

      {/* Temperature Controls */}
      {(formData.asset_type === 'cold' || formData.is_temperature_controlled) && (
        <div className="p-4 bg-blue-50 rounded-lg space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_temperature_controlled}
              onChange={(e) => handleChange('is_temperature_controlled', e.target.checked)}
            />
            <span className="font-medium">Temperature Controlled Asset</span>
          </label>
          {formData.is_temperature_controlled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Min Temp (°C)</label>
                <Input
                  type="number"
                  value={formData.min_temp || ''}
                  onChange={(e) => handleChange('min_temp', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Temp (°C)</label>
                <Input
                  type="number"
                  value={formData.max_temp || ''}
                  onChange={(e) => handleChange('max_temp', parseFloat(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_critical_asset}
            onChange={(e) => handleChange('is_critical_asset', e.target.checked)}
          />
          <span className="font-medium">Critical Asset</span>
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {asset ? 'Update Asset' : 'Create Asset'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}