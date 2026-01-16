import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlaskConical, Plus, Shield, AlertTriangle, Eye, Check, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const colourZones = {
  red: { label: '🔴 RED - Toilets & High Risk', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  blue: { label: '🔵 BLUE - General Surfaces', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  green: { label: '🟢 GREEN - Food Contact', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  yellow: { label: '🟡 YELLOW - Dishwashing', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' }
};

export default function ChemicalRegister() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedChem, setSelectedChem] = useState(null);
  const [filterZone, setFilterZone] = useState('all');

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

  const { data: chemicals = [], isLoading } = useQuery({
    queryKey: ['chemicals'],
    queryFn: () => base44.entities.Chemical.list()
  });

  const { data: stock = [] } = useQuery({
    queryKey: ['chemicalStock'],
    queryFn: () => base44.entities.ChemicalStock.list()
  });

  if (isLoading) return <LoadingSpinner message="Loading chemical register..." />;

  const canManage = ['admin', 'manager', 'owner'].includes(user?.role);

  const filteredChemicals = filterZone === 'all' 
    ? chemicals 
    : chemicals.filter(c => c.colour_zone === filterZone);

  const approvedChemicals = chemicals.filter(c => c.is_approved);
  const lowStockCount = stock.filter(s => s.status === 'low' || s.status === 'out_of_stock').length;
  const expiredCount = stock.filter(s => s.is_expired).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chemical Safety Register"
        description="COSHH-compliant chemical management & colour-coded control"
        action={canManage ? () => setShowDialog(true) : null}
        actionLabel="Add Chemical"
        actionIcon={Plus}
      />

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{chemicals.length}</p>
                <p className="text-xs text-slate-500">Total Chemicals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedChemicals.length}</p>
                <p className="text-xs text-slate-500">HQ Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={lowStockCount > 0 ? 'bg-amber-50 border-amber-300' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
                <AlertTriangle className={`w-6 h-6 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-xs text-slate-500">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={expiredCount > 0 ? 'bg-red-50 border-red-300' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${expiredCount > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
                <X className={`w-6 h-6 ${expiredCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiredCount}</p>
                <p className="text-xs text-slate-500">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colour Zone Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterZone === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterZone('all')}
            >
              All Zones
            </Button>
            {Object.entries(colourZones).map(([zone, config]) => (
              <Button
                key={zone}
                variant={filterZone === zone ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterZone(zone)}
                className={filterZone === zone ? `${config.bg} ${config.text}` : ''}
              >
                {config.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chemical Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChemicals.map(chem => {
          const zone = colourZones[chem.colour_zone];
          const stockInfo = stock.find(s => s.chemical_id === chem.id);
          
          return (
            <Card key={chem.id} className={`${zone.border} border-2 hover:shadow-lg transition-shadow cursor-pointer`} onClick={() => setSelectedChem(chem)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`px-3 py-1 rounded-full ${zone.bg} ${zone.text} text-xs font-bold`}>
                    {zone.label.split(' - ')[0]}
                  </div>
                  {chem.is_approved ? (
                    <Badge className="bg-emerald-600">✓ Approved</Badge>
                  ) : (
                    <Badge className="bg-amber-600">Pending</Badge>
                  )}
                </div>

                <h3 className="font-bold text-lg mb-2">{chem.product_name}</h3>
                <p className="text-sm text-slate-600 capitalize mb-3">{chem.category?.replace('_', ' ')}</p>

                {chem.dilution_ratio && (
                  <div className="p-2 bg-slate-50 rounded-lg mb-2">
                    <p className="text-xs font-semibold text-slate-700">Dilution: {chem.dilution_ratio}</p>
                  </div>
                )}

                {chem.ppe_required && chem.ppe_required.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {chem.ppe_required.map((ppe, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs capitalize">
                        {ppe.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}

                {stockInfo && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Stock:</span>
                      <Badge className={
                        stockInfo.status === 'low' ? 'bg-amber-600' :
                        stockInfo.status === 'out_of_stock' ? 'bg-red-600' :
                        stockInfo.is_expired ? 'bg-red-600' :
                        'bg-emerald-600'
                      }>
                        {stockInfo.current_stock} {stockInfo.unit_type}
                      </Badge>
                    </div>
                  </div>
                )}

                <Button variant="outline" size="sm" className="w-full mt-3">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredChemicals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600">No chemicals in this zone</p>
          </CardContent>
        </Card>
      )}

      {/* Chemical Details Dialog */}
      <Dialog open={!!selectedChem} onOpenChange={() => setSelectedChem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedChem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedChem.product_name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${colourZones[selectedChem.colour_zone].bg}`}>
                  <p className={`font-bold ${colourZones[selectedChem.colour_zone].text}`}>
                    {colourZones[selectedChem.colour_zone].label}
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Usage Instructions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedChem.dilution_ratio && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Dilution Ratio</p>
                        <p className="text-lg font-bold text-blue-600">{selectedChem.dilution_ratio}</p>
                      </div>
                    )}

                    {selectedChem.application_method && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Application Method</p>
                        <Badge className="capitalize">{selectedChem.application_method}</Badge>
                      </div>
                    )}

                    {selectedChem.contact_time_seconds && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Contact Time</p>
                        <p className="font-bold">{selectedChem.contact_time_seconds} seconds</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-semibold text-slate-700">Rinse Required</p>
                      <Badge className={selectedChem.rinse_required ? 'bg-blue-600' : 'bg-slate-600'}>
                        {selectedChem.rinse_required ? 'Yes - Must rinse' : 'No rinse needed'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {selectedChem.ppe_required && selectedChem.ppe_required.length > 0 && (
                  <Card className="bg-amber-50 border-amber-300">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Required PPE
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedChem.ppe_required.map((ppe, idx) => (
                          <Badge key={idx} className="bg-amber-600 capitalize">
                            {ppe.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedChem.hazard_symbols && selectedChem.hazard_symbols.length > 0 && (
                  <Card className="bg-red-50 border-red-300">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        COSHH Hazards
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedChem.hazard_symbols.map((symbol, idx) => (
                          <Badge key={idx} className="bg-red-600 capitalize">
                            {symbol}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedChem.coshh_sheet_url && (
                  <Button className="w-full" onClick={() => window.open(selectedChem.coshh_sheet_url, '_blank')}>
                    <Shield className="w-4 h-4 mr-2" />
                    View COSHH Safety Data Sheet
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}