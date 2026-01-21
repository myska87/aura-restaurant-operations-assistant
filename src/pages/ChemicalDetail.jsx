import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertTriangle, FileText, Download, Printer, ArrowLeft, ExternalLink } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ChemicalIncidentForm from '@/components/chemical/ChemicalIncidentForm';

const HazardSymbols = {
  flammable: '🔥',
  corrosive: '⚗️',
  irritant: '⚠️',
  toxic: '☠️',
  harmful: '⚠️',
  oxidising: '⭕',
  compressed_gas: '🔫',
  health_hazard: '⛔'
};

export default function ChemicalDetail() {
  const [searchParams] = useSearchParams();
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const chemicalId = searchParams.get('id');

  const { data: chemical, isLoading } = useQuery({
    queryKey: ['chemical', chemicalId],
    queryFn: () => base44.entities.Chemical.list().then(
      chemicals => chemicals.find(c => c.id === chemicalId)
    ),
    enabled: !!chemicalId
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents', chemicalId],
    queryFn: () => base44.entities.ChemicalIncident.filter({ chemical_id: chemicalId })
  });

  if (isLoading) return <LoadingSpinner />;
  if (!chemical) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Chemical not found</p>
        <Button asChild className="mt-4">
          <Link to={createPageUrl('ChemicalDashboard')}>Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const safetyStatus = chemical.expiry_date
    ? differenceInDays(parseISO(chemical.expiry_date), new Date()) < 0
      ? 'Expired'
      : differenceInDays(parseISO(chemical.expiry_date), new Date()) < 30
      ? 'Near Expiry'
      : 'Safe'
    : 'Unknown';

  const stockStatus = chemical.current_quantity === 0
    ? 'Out of Stock'
    : chemical.current_quantity <= (chemical.minimum_stock || 1)
    ? 'Low Stock'
    : 'In Stock';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to={createPageUrl('ChemicalDashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{chemical.product_name}</h1>
          <p className="text-slate-600">{chemical.supplier || 'Supplier unknown'}</p>
        </div>
        <div className="flex gap-2">
          {chemical.sds_file_url && (
            <Button variant="outline" asChild>
              <a href={chemical.sds_file_url} target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4 mr-2" />
                SDS
              </a>
            </Button>
          )}
          <Button onClick={() => window.print()} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Safety Status</p>
            <Badge className={
              safetyStatus === 'Expired' ? 'bg-red-600' :
              safetyStatus === 'Near Expiry' ? 'bg-amber-600' :
              'bg-emerald-600'
            }>
              {safetyStatus}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Stock Status</p>
            <Badge className={
              stockStatus === 'Out of Stock' ? 'bg-red-600' :
              stockStatus === 'Low Stock' ? 'bg-amber-600' :
              'bg-emerald-600'
            }>
              {stockStatus}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Current Quantity</p>
            <p className="text-2xl font-bold">{chemical.current_quantity} {chemical.unit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Last Checked</p>
            <p className="text-sm font-semibold">
              {chemical.last_checked ? format(new Date(chemical.last_checked), 'MMM d') : 'Never'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">ℹ️ Info</TabsTrigger>
          <TabsTrigger value="safety">⚠️ Safety</TabsTrigger>
          <TabsTrigger value="stock">📦 Stock</TabsTrigger>
          <TabsTrigger value="incidents">🚨 Incidents ({incidents.length})</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600">Category</p>
                <p className="font-semibold capitalize">{chemical.category?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Area Used</p>
                <p className="font-semibold capitalize">{chemical.area_used?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Manufacturer</p>
                <p className="font-semibold">{chemical.manufacturer || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Concentration</p>
                <p className="font-semibold capitalize">{chemical.concentration_type?.replace('_', ' ')}</p>
              </div>
              {chemical.dilution_ratio && (
                <div>
                  <p className="text-sm text-slate-600">Dilution Ratio</p>
                  <p className="font-semibold">{chemical.dilution_ratio}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-600">Colour Zone</p>
                <Badge className={
                  chemical.colour_zone === 'red' ? 'bg-red-100 text-red-800' :
                  chemical.colour_zone === 'blue' ? 'bg-blue-100 text-blue-800' :
                  chemical.colour_zone === 'green' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {chemical.colour_zone?.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety Tab */}
        <TabsContent value="safety" className="mt-6 space-y-4">
          {/* Hazards */}
          <Card>
            <CardHeader>
              <CardTitle>Hazard Symbols</CardTitle>
            </CardHeader>
            <CardContent>
              {chemical.hazard_symbols && chemical.hazard_symbols.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {chemical.hazard_symbols.map(symbol => (
                    <div key={symbol} className="text-center">
                      <p className="text-4xl mb-2">{HazardSymbols[symbol] || '⚠️'}</p>
                      <p className="text-xs font-semibold capitalize">{symbol.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600">No specific hazards listed</p>
              )}
            </CardContent>
          </Card>

          {/* PPE Required */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Protective Equipment (PPE)</CardTitle>
            </CardHeader>
            <CardContent>
              {chemical.ppe_required && chemical.ppe_required.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {chemical.ppe_required.map(ppe => (
                    <div key={ppe} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                      <span className="text-lg">🛡️</span>
                      <span className="capitalize">{ppe.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600">No specific PPE required</p>
              )}
            </CardContent>
          </Card>

          {/* First Aid */}
          {chemical.first_aid && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  First Aid Measures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{chemical.first_aid}</p>
              </CardContent>
            </Card>
          )}

          {/* Storage */}
          {chemical.storage_location && (
            <Card>
              <CardHeader>
                <CardTitle>Storage Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{chemical.storage_location}</p>
              </CardContent>
            </Card>
          )}

          {/* Disposal */}
          {chemical.disposal_instructions && (
            <Card>
              <CardHeader>
                <CardTitle>Disposal Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{chemical.disposal_instructions}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Current Stock</p>
                  <p className="text-3xl font-bold">{chemical.current_quantity} {chemical.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Minimum Level</p>
                  <p className="text-3xl font-bold">{chemical.minimum_stock || 1} {chemical.unit}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-slate-600">Purchase Date</p>
                  <p className="font-semibold">{chemical.purchase_date ? format(parseISO(chemical.purchase_date), 'MMM d, yyyy') : 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Expiry Date</p>
                  <p className="font-semibold">{chemical.expiry_date ? format(parseISO(chemical.expiry_date), 'MMM d, yyyy') : 'Not recorded'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Incident Reports</CardTitle>
                <Button onClick={() => setShowIncidentForm(!showIncidentForm)} size="sm">
                  + Report Incident
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showIncidentForm && (
                <ChemicalIncidentForm chemical={chemical} onClose={() => setShowIncidentForm(false)} />
              )}
              {incidents.map(incident => (
                <Card key={incident.id} className={
                  incident.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  incident.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                  'bg-slate-50'
                }>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex gap-2 mb-1">
                          <Badge className={
                            incident.severity === 'critical' ? 'bg-red-600' :
                            incident.severity === 'high' ? 'bg-orange-600' :
                            'bg-slate-600'
                          }>
                            {incident.severity}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {incident.incident_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700">{incident.description}</p>
                      </div>
                      <Badge className={
                        incident.status === 'resolved' ? 'bg-emerald-600' :
                        'bg-amber-600'
                      }>
                        {incident.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 pt-2 border-t">
                      {incident.reported_by_name} • {format(new Date(incident.incident_date), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {incidents.length === 0 && !showIncidentForm && (
                <p className="text-center text-slate-500 py-8">No incidents recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}