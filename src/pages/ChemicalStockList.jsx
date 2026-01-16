import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle, CheckCircle, XCircle, Clock, Printer, Download,
  Plus, Edit, Search, ShoppingCart, AlertCircle, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function ChemicalStockList() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [quickCheckMode, setQuickCheckMode] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [quantities, setQuantities] = useState({});

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

  const { data: chemicals = [], isLoading: chemicalsLoading } = useQuery({
    queryKey: ['chemicals'],
    queryFn: () => base44.entities.Chemical.filter({ is_active: true }, '-created_date')
  });

  const { data: stockRecords = [], isLoading: stockLoading } = useQuery({
    queryKey: ['chemicalStock'],
    queryFn: () => base44.entities.ChemicalStock.list('-last_stock_check')
  });

  const { data: sops = [] } = useQuery({
    queryKey: ['sops'],
    queryFn: () => base44.entities.SOP.list()
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChemicalStock.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['chemicalStock']);
    }
  });

  const createStockMutation = useMutation({
    mutationFn: (data) => base44.entities.ChemicalStock.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['chemicalStock']);
    }
  });

  const isManager = user?.role && ['admin', 'manager', 'owner'].includes(user.role);

  // Merge chemicals with stock data
  const chemicalStockList = chemicals.map(chem => {
    const stock = stockRecords.find(s => s.chemical_id === chem.id || s.chemical_name === chem.product_name);
    const isExpired = stock?.expiry_date && new Date(stock.expiry_date) < new Date();
    const isLow = stock && stock.current_stock <= stock.reorder_level;
    const isMissing = !stock || stock.current_stock === 0;
    
    let status = 'in_stock';
    if (isExpired) status = 'expired';
    else if (isMissing) status = 'out_of_stock';
    else if (isLow) status = 'low';

    return {
      ...chem,
      stock_id: stock?.id,
      current_stock: stock?.current_stock || 0,
      reorder_level: stock?.reorder_level || 2,
      expiry_date: stock?.expiry_date,
      last_stock_check: stock?.last_stock_check,
      status,
      isExpired,
      isLow,
      isMissing,
      required_for_sop: chem.is_approved
    };
  });

  const filteredChemicals = chemicalStockList.filter(chem => {
    const matchesSearch = chem.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || chem.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || chem.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const criticalItems = filteredChemicals.filter(c => c.isMissing || c.isExpired || c.isLow);
  const reorderList = filteredChemicals.filter(c => c.isLow || c.isMissing);

  const handleQuickUpdate = (chemId, value) => {
    setQuantities(prev => ({ ...prev, [chemId]: value }));
  };

  const saveQuickCheck = async () => {
    const updates = Object.entries(quantities).map(([chemId, qty]) => {
      const chem = chemicalStockList.find(c => c.id === chemId);
      const stockData = {
        chemical_id: chemId,
        chemical_name: chem.product_name,
        current_stock: parseFloat(qty),
        last_stock_check: format(new Date(), 'yyyy-MM-dd'),
        checked_by: user.email,
        reorder_level: chem.reorder_level,
        status: parseFloat(qty) === 0 ? 'out_of_stock' : parseFloat(qty) <= chem.reorder_level ? 'low' : 'in_stock'
      };

      if (chem.stock_id) {
        return updateStockMutation.mutateAsync({ id: chem.stock_id, data: stockData });
      } else {
        return createStockMutation.mutateAsync(stockData);
      }
    });

    await Promise.all(updates);
    setQuickCheckMode(false);
    setQuantities({});
  };

  const handlePrint = () => {
    window.print();
  };

  const exportReorderList = () => {
    const csv = [
      ['Chemical Name', 'Category', 'Current Stock', 'Reorder Level', 'Supplier'].join(','),
      ...reorderList.map(c => [
        c.product_name,
        c.category,
        c.current_stock,
        c.reorder_level,
        c.manufacturer || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reorder-list-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusBadge = (chem) => {
    if (chem.isExpired) return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    if (chem.isMissing) return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" />Out of Stock</Badge>;
    if (chem.isLow) return <Badge className="bg-amber-600"><AlertTriangle className="w-3 h-3 mr-1" />Low Stock</Badge>;
    return <Badge className="bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" />OK</Badge>;
  };

  const categories = [...new Set(chemicals.map(c => c.category))];

  if (chemicalsLoading || stockLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-content { max-width: 100%; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <PageHeader
        title="Chemical Stock & Availability"
        description={`${chemicals.length} chemicals tracked`}
        action={isManager ? () => setQuickCheckMode(true) : null}
        actionLabel="Quick Stock Check"
      >
        <Button variant="outline" onClick={handlePrint} className="no-print">
          <Printer className="w-4 h-4 mr-2" />
          Print List
        </Button>
        {reorderList.length > 0 && (
          <Button variant="outline" onClick={exportReorderList} className="no-print">
            <Download className="w-4 h-4 mr-2" />
            Export Reorder ({reorderList.length})
          </Button>
        )}
      </PageHeader>

      {/* Critical Alerts */}
      {criticalItems.length > 0 && (
        <Card className="bg-red-50 border-2 border-red-200 no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-6 h-6" />
              {criticalItems.length} Critical Item(s) Require Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {criticalItems.slice(0, 6).map(chem => (
                <div key={chem.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-300">
                  <span className="text-sm font-medium">{chem.product_name}</span>
                  {getStatusBadge(chem)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 no-print">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search chemicals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">All ({filteredChemicals.length})</TabsTrigger>
            <TabsTrigger value="low">Low ({filteredChemicals.filter(c => c.status === 'low').length})</TabsTrigger>
            <TabsTrigger value="out_of_stock">Out ({filteredChemicals.filter(c => c.status === 'out_of_stock').length})</TabsTrigger>
            <TabsTrigger value="expired">Expired ({filteredChemicals.filter(c => c.isExpired).length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stock Table */}
      <Card className="print-content">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-semibold">Chemical Name</th>
                  <th className="text-left p-3 font-semibold">Category</th>
                  <th className="text-left p-3 font-semibold">Usage Area</th>
                  <th className="text-center p-3 font-semibold">Required<br/>for SOP</th>
                  <th className="text-center p-3 font-semibold">Min Stock</th>
                  <th className="text-center p-3 font-semibold">Current<br/>Stock</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                  <th className="text-center p-3 font-semibold">Expiry</th>
                  <th className="text-left p-3 font-semibold no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChemicals.map(chem => (
                  <tr key={chem.id} className={`border-b hover:bg-slate-50 ${chem.isMissing || chem.isExpired ? 'bg-red-50' : chem.isLow ? 'bg-amber-50' : ''}`}>
                    <td className="p-3">
                      <div>
                        <p className="font-semibold text-slate-800">{chem.product_name}</p>
                        <p className="text-xs text-slate-500">{chem.manufacturer}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {chem.category?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs">
                      {chem.approved_areas?.slice(0, 2).join(', ')}
                      {chem.approved_areas?.length > 2 && ` +${chem.approved_areas.length - 2}`}
                    </td>
                    <td className="p-3 text-center">
                      {chem.required_for_sop ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-semibold">{chem.reorder_level}</td>
                    <td className="p-3 text-center">
                      <span className={`font-bold text-lg ${chem.current_stock === 0 ? 'text-red-600' : chem.isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {chem.current_stock}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {getStatusBadge(chem)}
                    </td>
                    <td className="p-3 text-center text-xs">
                      {chem.expiry_date ? (
                        <span className={chem.isExpired ? 'text-red-600 font-semibold' : ''}>
                          {format(new Date(chem.expiry_date), 'dd/MM/yyyy')}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 no-print">
                      <div className="flex gap-1">
                        {isManager && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingStock(chem)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        <Link to={createPageUrl(`ChemicalDashboard?id=${chem.id}`)}>
                          <Button size="sm" variant="outline">
                            <FileText className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Check Dialog */}
      <Dialog open={quickCheckMode} onOpenChange={setQuickCheckMode}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Stock Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Update current stock quantities. This will save all changes at once.</p>
            <div className="space-y-2">
              {chemicalStockList.map(chem => (
                <div key={chem.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{chem.product_name}</p>
                    <p className="text-xs text-slate-500">Current: {chem.current_stock} | Min: {chem.reorder_level}</p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    placeholder={chem.current_stock.toString()}
                    value={quantities[chem.id] ?? ''}
                    onChange={(e) => handleQuickUpdate(chem.id, e.target.value)}
                    className="w-24"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setQuickCheckMode(false)}>Cancel</Button>
              <Button onClick={saveQuickCheck} className="bg-emerald-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Stock Check
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Stock Dialog */}
      <Dialog open={!!editingStock} onOpenChange={() => setEditingStock(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock: {editingStock?.product_name}</DialogTitle>
          </DialogHeader>
          {editingStock && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Current Stock</label>
                <Input
                  type="number"
                  defaultValue={editingStock.current_stock}
                  id="current_stock"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Reorder Level</label>
                <Input
                  type="number"
                  defaultValue={editingStock.reorder_level}
                  id="reorder_level"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Expiry Date</label>
                <Input
                  type="date"
                  defaultValue={editingStock.expiry_date}
                  id="expiry_date"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingStock(null)}>Cancel</Button>
                <Button
                  className="bg-emerald-600"
                  onClick={() => {
                    const stockData = {
                      chemical_id: editingStock.id,
                      chemical_name: editingStock.product_name,
                      current_stock: parseFloat(document.getElementById('current_stock').value),
                      reorder_level: parseFloat(document.getElementById('reorder_level').value),
                      expiry_date: document.getElementById('expiry_date').value,
                      last_stock_check: format(new Date(), 'yyyy-MM-dd'),
                      checked_by: user.email
                    };
                    
                    if (editingStock.stock_id) {
                      updateStockMutation.mutate({ id: editingStock.stock_id, data: stockData });
                    } else {
                      createStockMutation.mutate(stockData);
                    }
                    setEditingStock(null);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}