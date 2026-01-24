import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format, addMonths, isPast } from 'date-fns';
import { Wrench, AlertTriangle, CheckCircle, Calendar, Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';

export default function AssetRegister() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch assets
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assetRegister'],
    queryFn: () => base44.entities.Asset.list('-created_date', 500)
  });

  // Fetch all issues
  const { data: allIssues = [] } = useQuery({
    queryKey: ['assetIssues'],
    queryFn: () => base44.entities.AssetIssue.list('-reported_at', 200)
  });

  // Fetch service records
  const { data: serviceRecords = [] } = useQuery({
    queryKey: ['serviceRecords'],
    queryFn: () => base44.entities.ServiceRecord.list('-service_date', 200)
  });

  // Fetch audits
  const { data: audits = [] } = useQuery({
    queryKey: ['equipmentAudits'],
    queryFn: () => base44.entities.EquipmentAudit.list('-audit_date', 200)
  });

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serial_number?.includes(searchQuery);
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate stats
  const criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
  const openIssues = allIssues.filter(i => i.status === 'open').length;
  const assetsNeedingService = assets.filter(a => {
    if (!a.next_maintenance) return false;
    return isPast(new Date(a.next_maintenance));
  }).length;

  const getAssetIssues = (assetId) => allIssues.filter(i => i.asset_id === assetId);
  const getAssetServices = (assetId) => serviceRecords.filter(s => s.asset_id === assetId);
  const getAssetAudits = (assetId) => audits.filter(a => a.asset_id === assetId);

  const getAssetStatus = (asset) => {
    const issues = getAssetIssues(asset.id);
    const openCritical = issues.filter(i => i.severity === 'critical' && i.status === 'open');
    if (openCritical.length > 0) return { status: 'critical', color: 'bg-red-100', text: 'text-red-800', icon: '🔴' };
    if (issues.some(i => i.status === 'open')) return { status: 'warning', color: 'bg-amber-100', text: 'text-amber-800', icon: '🟠' };
    if (asset.status === 'maintenance') return { status: 'maintenance', color: 'bg-blue-100', text: 'text-blue-800', icon: '🔧' };
    return { status: 'ok', color: 'bg-emerald-100', text: 'text-emerald-800', icon: '🟢' };
  };

  if (isLoading) return <LoadingSpinner message="Loading asset register..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Register"
        description="Complete equipment and asset lifecycle management"
      />

      {/* Critical Alerts */}
      {(criticalIssues > 0 || assetsNeedingService > 0) && (
        <Card className="bg-red-50 border-red-300">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {criticalIssues > 0 && (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-900">{criticalIssues} critical issue{criticalIssues !== 1 ? 's' : ''} require immediate attention</span>
                </div>
              )}
              {assetsNeedingService > 0 && (
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-900">{assetsNeedingService} asset{assetsNeedingService !== 1 ? 's' : ''} overdue for service</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Assets</p>
                <p className="text-2xl font-bold text-slate-900">{assets.length}</p>
              </div>
              <Wrench className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Open Issues</p>
                <p className="text-2xl font-bold text-orange-600">{openIssues}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{criticalIssues}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Service Overdue</p>
                <p className="text-2xl font-bold text-amber-600">{assetsNeedingService}</p>
              </div>
              <Calendar className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="register" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="register">Asset Register</TabsTrigger>
          <TabsTrigger value="issues">Issues ({openIssues})</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
        </TabsList>

        {/* Asset Register Tab */}
        <TabsContent value="register" className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="refrigeration">Refrigeration</SelectItem>
                <SelectItem value="cooking">Cooking</SelectItem>
                <SelectItem value="kitchen_equipment">Kitchen Equipment</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            {filteredAssets.map((asset) => {
              const status = getAssetStatus(asset);
              const issues = getAssetIssues(asset.id);
              const lastService = getAssetServices(asset.id)[0];
              const lastAudit = getAssetAudits(asset.id)[0];

              return (
                <Card key={asset.id} className={`${status.color} border-2`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{status.icon}</span>
                          <div>
                            <h3 className="font-bold text-lg">{asset.name}</h3>
                            <p className="text-sm text-slate-600">{asset.category?.replace(/_/g, ' ')}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3 bg-white/50 p-2 rounded">
                          {asset.serial_number && <div><span className="font-semibold">S/N:</span> {asset.serial_number}</div>}
                          {asset.location && <div><span className="font-semibold">Location:</span> {asset.location}</div>}
                          {asset.warranty_expiry && (
                            <div>
                              <span className="font-semibold">Warranty:</span>{' '}
                              {isPast(new Date(asset.warranty_expiry)) ? (
                                <span className="text-red-600">Expired {format(new Date(asset.warranty_expiry), 'MMM d')}</span>
                              ) : (
                                format(new Date(asset.warranty_expiry), 'MMM d, yyyy')
                              )}
                            </div>
                          )}
                          {asset.next_maintenance && (
                            <div>
                              <span className="font-semibold">Next Service:</span>{' '}
                              {isPast(new Date(asset.next_maintenance)) ? (
                                <span className="text-red-600 font-bold">OVERDUE</span>
                              ) : (
                                format(new Date(asset.next_maintenance), 'MMM d')
                              )}
                            </div>
                          )}
                        </div>

                        {issues.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {issues.map(issue => (
                              <Badge key={issue.id} className={
                                issue.severity === 'critical' ? 'bg-red-600' :
                                issue.severity === 'medium' ? 'bg-amber-600' :
                                'bg-slate-600'
                              }>
                                {issue.issue_type}: {issue.status}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-3">
          {allIssues.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium text-slate-600">No issues recorded</p>
              </CardContent>
            </Card>
          ) : (
            allIssues.map(issue => (
              <Card key={issue.id} className={
                issue.severity === 'critical' ? 'border-red-300 bg-red-50' :
                issue.severity === 'medium' ? 'border-amber-300 bg-amber-50' :
                'border-slate-300'
              }>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{issue.asset_name} - {issue.issue_type}</h4>
                      <p className="text-sm text-slate-600 mt-1">{issue.description}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge className={
                          issue.severity === 'critical' ? 'bg-red-600' :
                          issue.severity === 'medium' ? 'bg-amber-600' :
                          'bg-slate-600'
                        }>{issue.severity}</Badge>
                        <Badge variant="outline">{issue.status}</Badge>
                        <Badge variant="outline">{issue.source}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Reported by {issue.reported_by_name} on {format(new Date(issue.reported_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-3">
          {serviceRecords.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="font-medium text-slate-600">No service records</p>
              </CardContent>
            </Card>
          ) : (
            serviceRecords.map(record => (
              <Card key={record.id} className="border-slate-300">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{record.asset_name} - {record.service_type}</h4>
                      <p className="text-sm text-slate-600 mt-1">{record.description}</p>
                      <div className="grid md:grid-cols-3 gap-3 mt-2 text-sm">
                        <div><span className="font-semibold">Date:</span> {format(new Date(record.service_date), 'MMM d, yyyy')}</div>
                        <div><span className="font-semibold">Cost:</span> £{record.service_cost?.toFixed(2) || '0.00'}</div>
                        <div><span className="font-semibold">Next Due:</span> {record.next_service_due ? format(new Date(record.next_service_due), 'MMM d') : 'TBD'}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Audits Tab */}
        <TabsContent value="audits" className="space-y-3">
          {audits.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="font-medium text-slate-600">No audits recorded</p>
              </CardContent>
            </Card>
          ) : (
            audits.map(audit => (
              <Card key={audit.id} className="border-slate-300">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{audit.asset_name} - {audit.audit_type}</h4>
                      <div className="flex gap-2 mt-2">
                        <Badge className={
                          audit.overall_rating >= 8 ? 'bg-emerald-600' :
                          audit.overall_rating >= 6 ? 'bg-amber-600' :
                          'bg-red-600'
                        }>Rating: {audit.overall_rating}/10</Badge>
                        <Badge variant="outline">{audit.visual_condition}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {format(new Date(audit.audit_date), 'MMM d, yyyy')} by {audit.audited_by_name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      {showDetailModal && selectedAsset && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedAsset.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold">Category:</span> {selectedAsset.category?.replace(/_/g, ' ')}</div>
                <div><span className="font-semibold">Serial:</span> {selectedAsset.serial_number}</div>
                <div><span className="font-semibold">Location:</span> {selectedAsset.location}</div>
                <div><span className="font-semibold">Status:</span> {selectedAsset.status}</div>
                <div><span className="font-semibold">Purchase Date:</span> {selectedAsset.purchase_date ? format(new Date(selectedAsset.purchase_date), 'MMM d, yyyy') : 'N/A'}</div>
                <div><span className="font-semibold">Warranty Expiry:</span> {selectedAsset.warranty_expiry ? format(new Date(selectedAsset.warranty_expiry), 'MMM d, yyyy') : 'N/A'}</div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Recent Issues</h4>
                {getAssetIssues(selectedAsset.id).length === 0 ? (
                  <p className="text-sm text-slate-600">No issues</p>
                ) : (
                  <div className="space-y-2">
                    {getAssetIssues(selectedAsset.id).slice(0, 3).map(issue => (
                      <div key={issue.id} className="text-sm p-2 bg-slate-50 rounded">
                        <span className="font-semibold">{issue.issue_type}</span> - {issue.status}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Service History</h4>
                {getAssetServices(selectedAsset.id).length === 0 ? (
                  <p className="text-sm text-slate-600">No services recorded</p>
                ) : (
                  <div className="space-y-2">
                    {getAssetServices(selectedAsset.id).slice(0, 3).map(service => (
                      <div key={service.id} className="text-sm p-2 bg-slate-50 rounded">
                        <span className="font-semibold">{format(new Date(service.service_date), 'MMM d')}</span> - {service.service_type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}