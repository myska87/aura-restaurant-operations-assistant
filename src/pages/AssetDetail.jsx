import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, AlertTriangle, CheckCircle2, Thermometer, Wrench, 
  FileText, Clock, DollarSign, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';

export default function AssetDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const assetId = urlParams.get('id');

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const assets = await base44.entities.Assets_Registry_v1.list();
      return assets.find(a => a.id === assetId);
    },
    enabled: !!assetId
  });

  const { data: tempLogs = [] } = useQuery({
    queryKey: ['tempLogs', asset?.asset_name],
    queryFn: () => base44.entities.TemperatureLog.filter({ 
      equipment_name: asset.asset_name 
    }, '-created_date', 100),
    enabled: !!asset?.is_temperature_controlled
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['faults', asset?.asset_name],
    queryFn: () => base44.entities.EquipmentFault.filter({ 
      equipment_name: asset.asset_name 
    }, '-created_date', 50),
    enabled: !!asset?.asset_name
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs', assetId],
    queryFn: () => base44.entities.Asset_Audit_Log_v1.filter({ 
      asset_id: assetId 
    }, '-created_date', 100),
    enabled: !!assetId
  });

  if (isLoading) return <LoadingSpinner />;
  if (!asset) return <div className="p-8 text-center">Asset not found</div>;

  const getStatusBadge = (status) => {
    const configs = {
      operational: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
      warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      fault: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      out_of_service: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
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

  const outOfRangeLogs = tempLogs.filter(log => !log.is_in_range);
  const openFaults = faults.filter(f => f.status !== 'resolved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Assets')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-800">{asset.asset_name}</h1>
          <p className="text-slate-600">
            {asset.manufacturer} {asset.model} 
            {asset.serial_number && ` • SN: ${asset.serial_number}`}
          </p>
        </div>
        {getStatusBadge(asset.status)}
      </div>

      {/* Alerts */}
      {(outOfRangeLogs.length > 0 || openFaults.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {outOfRangeLogs.length > 0 && (
            <Card className="bg-red-50 border-red-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Thermometer className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="font-bold text-red-800">{outOfRangeLogs.length} Temperature Alerts</p>
                    <p className="text-sm text-red-700">Out of range readings detected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {openFaults.length > 0 && (
            <Card className="bg-orange-50 border-orange-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="font-bold text-orange-800">{openFaults.length} Open Faults</p>
                    <p className="text-sm text-orange-700">Requires attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Category</p>
              <p className="text-xl font-bold capitalize">{asset.asset_category?.replace(/_/g, ' ')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Location</p>
              <p className="text-xl font-bold capitalize">{asset.location?.replace(/_/g, ' ')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Repair Cost</p>
              <p className="text-xl font-bold text-red-600">£{asset.total_repair_cost || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Critical Asset</p>
              <p className="text-xl font-bold">{asset.is_critical_asset ? '✓ Yes' : '- No'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="temperature">
            Temperature
            {outOfRangeLogs.length > 0 && (
              <Badge className="ml-2 bg-red-600">{outOfRangeLogs.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="faults">
            Faults
            {openFaults.length > 0 && (
              <Badge className="ml-2 bg-orange-600">{openFaults.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-slate-700">Identity</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Asset Name:</span>
                      <span className="font-medium">{asset.asset_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Category:</span>
                      <span className="font-medium capitalize">{asset.asset_category?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Type:</span>
                      <span className="font-medium capitalize">{asset.asset_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Serial Number:</span>
                      <span className="font-medium">{asset.serial_number || '-'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-slate-700">Location</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Location:</span>
                      <span className="font-medium capitalize">{asset.location?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Station:</span>
                      <span className="font-medium capitalize">{asset.station?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Power Type:</span>
                      <span className="font-medium capitalize">{asset.power_type?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {asset.is_temperature_controlled && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-blue-600" />
                    Temperature Control
                  </h3>
                  <p className="text-sm">
                    Range: <strong>{asset.min_temp}°C - {asset.max_temp}°C</strong>
                  </p>
                </div>
              )}

              {asset.notes && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-slate-700">{asset.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temperature">
          <Card>
            <CardHeader>
              <CardTitle>Temperature Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {!asset.is_temperature_controlled ? (
                <p className="text-center py-8 text-slate-500">This asset is not temperature controlled</p>
              ) : tempLogs.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No temperature logs recorded yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Logged By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tempLogs.slice(0, 50).map((log) => (
                      <TableRow key={log.id} className={!log.is_in_range ? 'bg-red-50' : ''}>
                        <TableCell>{format(new Date(log.log_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="capitalize">{log.check_time?.replace(/_/g, ' ')}</TableCell>
                        <TableCell className={log.is_in_range ? 'text-emerald-600' : 'text-red-600'}>
                          <strong>{log.temperature}°C</strong>
                        </TableCell>
                        <TableCell>{log.min_temp}°C - {log.max_temp}°C</TableCell>
                        <TableCell>
                          {log.is_in_range ? (
                            <Badge className="bg-emerald-100 text-emerald-800">OK</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Out of Range</Badge>
                          )}
                        </TableCell>
                        <TableCell>{log.logged_by_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Last Service</p>
                    <p className="font-semibold">
                      {asset.last_service_date ? format(new Date(asset.last_service_date), 'MMM d, yyyy') : 'Not serviced yet'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Service Interval</p>
                    <p className="font-semibold">{asset.service_interval_days || 'Not set'} days</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Service Provider</p>
                    <p className="font-semibold">{asset.service_provider || 'Not assigned'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Warranty Expiry</p>
                    <p className="font-semibold">
                      {asset.warranty_expiry ? format(new Date(asset.warranty_expiry), 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faults">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Faults</CardTitle>
            </CardHeader>
            <CardContent>
              {faults.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No faults recorded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Fault Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reported By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faults.map((fault) => (
                      <TableRow key={fault.id}>
                        <TableCell>{format(new Date(fault.created_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="capitalize">{fault.fault_type?.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <Badge className={
                            fault.severity === 'critical' ? 'bg-red-600' :
                            fault.severity === 'high' ? 'bg-orange-600' :
                            'bg-yellow-600'
                          }>
                            {fault.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{fault.description}</TableCell>
                        <TableCell className="capitalize">{fault.status?.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{fault.reported_by_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No audit history available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Field Changed</TableHead>
                      <TableHead>Old Value</TableHead>
                      <TableHead>New Value</TableHead>
                      <TableHead>Changed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.created_date), 'MMM d, yyyy HH:mm')}</TableCell>
                        <TableCell className="capitalize">{log.field_changed?.replace(/_/g, ' ')}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{log.old_value || '-'}</TableCell>
                        <TableCell className="font-medium text-sm">{log.new_value || '-'}</TableCell>
                        <TableCell>{log.changed_by_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}