import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Database,
  Download,
  Upload,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  Settings,
  RefreshCw,
  FileJson,
  FileText,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AVAILABLE_MODULES = [
  { id: 'DailyCheckIn', label: 'Daily Check-Ins', entity: 'DailyCheckIn' },
  { id: 'TemperatureLog', label: 'Temperature Logs', entity: 'TemperatureLog' },
  { id: 'FoodLabel', label: 'Food Labels', entity: 'FoodLabel' },
  { id: 'ShiftHandover', label: 'Shift Handovers', entity: 'ShiftHandover' },
  { id: 'Shift', label: 'Shifts', entity: 'Shift' },
  { id: 'Task', label: 'Tasks', entity: 'Task' },
  { id: 'Staff', label: 'Staff Records', entity: 'Staff' },
  { id: 'MenuItem', label: 'Menu Items', entity: 'MenuItem' },
  { id: 'Chemical', label: 'Chemical Safety', entity: 'Chemical' },
  { id: 'Assets_Registry_v1', label: 'Assets & Equipment', entity: 'Assets_Registry_v1' }
];

export default function DataManagement() {
  const [user, setUser] = useState(null);
  const [exportModules, setExportModules] = useState([]);
  const [exportFormat, setExportFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
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

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isManager = user?.role === 'manager' || isAdmin;

  // Fetch backups
  const { data: backups = [], isLoading: backupsLoading } = useQuery({
    queryKey: ['dataBackups'],
    queryFn: () => base44.entities.DataBackup.list('-backup_date', 30),
    enabled: isManager
  });

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['backupSettings'],
    queryFn: async () => {
      const list = await base44.entities.DataManagementSettings.list();
      return list[0];
    },
    enabled: isAdmin
  });

  const createBackupMutation = useMutation({
    mutationFn: async (modules) => {
      const backupData = {};
      const recordCount = {};

      for (const module of modules) {
        const data = await base44.entities[module.entity].list('-created_date', 10000);
        backupData[module.id] = data;
        recordCount[module.id] = data.length;
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], `backup-${Date.now()}.json`);
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      return base44.entities.DataBackup.create({
        backup_name: `Backup ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
        backup_type: 'manual',
        backup_format: 'json',
        modules_included: modules.map(m => m.id),
        backup_file_url: file_url,
        backup_size_kb: Math.round(blob.size / 1024),
        backup_date: new Date().toISOString(),
        created_by_id: user?.id,
        created_by_name: user?.full_name,
        created_by_role: user?.role,
        record_count: recordCount,
        status: 'completed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dataBackups']);
      alert('✅ Backup created successfully!');
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => {
      if (settings?.id) {
        return base44.entities.DataManagementSettings.update(settings.id, data);
      }
      return base44.entities.DataManagementSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['backupSettings']);
    }
  });

  const handleCreateBackup = () => {
    if (exportModules.length === 0) {
      alert('Please select at least one module to backup');
      return;
    }
    const modules = AVAILABLE_MODULES.filter(m => exportModules.includes(m.id));
    createBackupMutation.mutate(modules);
  };

  const handleExport = async () => {
    if (exportModules.length === 0) {
      alert('Please select at least one module to export');
      return;
    }

    setIsExporting(true);
    try {
      const exportData = {};
      
      for (const moduleId of exportModules) {
        const module = AVAILABLE_MODULES.find(m => m.id === moduleId);
        const data = await base44.entities[module.entity].list('-created_date', 10000);
        exportData[module.id] = data;
      }

      if (exportFormat === 'json') {
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
        a.click();
      } else {
        // CSV export (per module)
        for (const [moduleName, records] of Object.entries(exportData)) {
          if (records.length === 0) continue;
          
          const keys = Object.keys(records[0]);
          const csv = [
            keys.join(','),
            ...records.map(record => 
              keys.map(key => {
                const value = record[key];
                if (typeof value === 'object') return JSON.stringify(value);
                return value;
              }).join(',')
            )
          ].join('\n');

          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${moduleName}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
          a.click();
        }
      }
      
      alert('✅ Export completed!');
    } catch (error) {
      alert('❌ Export failed: ' + error.message);
    }
    setIsExporting(false);
  };

  const handleImport = async () => {
    if (!importFile || !importConfirmed) {
      alert('Please select a file and confirm');
      return;
    }

    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      
      // Import validation
      for (const [moduleName, records] of Object.entries(data)) {
        const module = AVAILABLE_MODULES.find(m => m.id === moduleName);
        if (!module) {
          alert(`❌ Unknown module: ${moduleName}`);
          return;
        }
      }

      alert('⚠️ Import functionality requires admin approval for safety. Contact system administrator.');
      setShowImportDialog(false);
    } catch (error) {
      alert('❌ Import failed: ' + error.message);
    }
  };

  const handleDownloadBackup = async (backup) => {
    const a = document.createElement('a');
    a.href = backup.backup_file_url;
    a.download = backup.backup_name.replace(/\s/g, '-') + '.json';
    a.click();
  };

  if (!isManager) {
    return (
      <div className="py-12 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold mb-2">Manager Access Required</h2>
        <p className="text-slate-600">Data management is restricted to managers and administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Management"
        description="Backup, export, and restore system data securely"
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{backups.length}</p>
                <p className="text-xs text-slate-500">Total Backups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {settings?.last_backup_date ? format(new Date(settings.last_backup_date), 'MMM d') : 'Never'}
                </p>
                <p className="text-xs text-slate-500">Last Backup</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {settings?.auto_backup_enabled ? 'ON' : 'OFF'}
                </p>
                <p className="text-xs text-slate-500">Auto Backup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="backup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="backup">
            <Database className="w-4 h-4 mr-2" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Backup</CardTitle>
              <CardDescription>Select modules to include in backup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                {AVAILABLE_MODULES.map(module => (
                  <div key={module.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={module.id}
                      checked={exportModules.includes(module.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExportModules([...exportModules, module.id]);
                        } else {
                          setExportModules(exportModules.filter(id => id !== module.id));
                        }
                      }}
                    />
                    <Label htmlFor={module.id} className="cursor-pointer">
                      {module.label}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => setExportModules(AVAILABLE_MODULES.map(m => m.id))}
                  variant="outline"
                  size="sm"
                >
                  Select All
                </Button>
                <Button
                  onClick={() => setExportModules([])}
                  variant="outline"
                  size="sm"
                >
                  Clear All
                </Button>
              </div>

              <Button
                onClick={handleCreateBackup}
                disabled={createBackupMutation.isPending || exportModules.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Database className="w-5 h-5 mr-2" />
                Create Backup Now
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
            </CardHeader>
            <CardContent>
              {backupsLoading ? (
                <LoadingSpinner message="Loading backups..." />
              ) : backups.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No backups yet</p>
              ) : (
                <div className="space-y-3">
                  {backups.map(backup => (
                    <Card key={backup.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileJson className="w-4 h-4 text-blue-600" />
                              <p className="font-semibold">{backup.backup_name}</p>
                              <Badge className={backup.backup_type === 'manual' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                                {backup.backup_type}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                              <p>Created: {format(new Date(backup.backup_date), 'PPp')}</p>
                              <p>By: {backup.created_by_name} ({backup.created_by_role})</p>
                              <p>Size: {backup.backup_size_kb} KB</p>
                              <p>Modules: {backup.modules_included?.length || 0}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadBackup(backup)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBackup(backup);
                                  setShowRestoreDialog(true);
                                }}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Download data in JSON or CSV format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (Single File)</SelectItem>
                    <SelectItem value="csv">CSV (Per Module)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-3 block">Select Modules to Export</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {AVAILABLE_MODULES.map(module => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`export-${module.id}`}
                        checked={exportModules.includes(module.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setExportModules([...exportModules, module.id]);
                          } else {
                            setExportModules(exportModules.filter(id => id !== module.id));
                          }
                        }}
                      />
                      <Label htmlFor={`export-${module.id}`} className="cursor-pointer">
                        {module.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={isExporting || exportModules.length === 0}
                className="w-full"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-600" />
                  Import Data
                </CardTitle>
                <CardDescription>Restore from previously exported backup</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowImportDialog(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import from File
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automatic Backup Settings</CardTitle>
                <CardDescription>Configure scheduled backups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Automatic Backups</Label>
                    <p className="text-sm text-slate-500">System will create backups automatically</p>
                  </div>
                  <Switch
                    checked={settings?.auto_backup_enabled || false}
                    onCheckedChange={(checked) => {
                      updateSettingsMutation.mutate({
                        ...settings,
                        auto_backup_enabled: checked,
                        updated_by_id: user?.id
                      });
                    }}
                  />
                </div>

                {settings?.auto_backup_enabled && (
                  <>
                    <div>
                      <Label>Backup Frequency</Label>
                      <Select
                        value={settings?.backup_frequency || 'weekly'}
                        onValueChange={(value) => {
                          updateSettingsMutation.mutate({
                            ...settings,
                            backup_frequency: value,
                            updated_by_id: user?.id
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Backup Time</Label>
                      <Input
                        type="time"
                        value={settings?.backup_time || '02:00'}
                        onChange={(e) => {
                          updateSettingsMutation.mutate({
                            ...settings,
                            backup_time: e.target.value,
                            updated_by_id: user?.id
                          });
                        }}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label>Retention Period (Days)</Label>
                  <Input
                    type="number"
                    value={settings?.retention_days || 30}
                    onChange={(e) => {
                      updateSettingsMutation.mutate({
                        ...settings,
                        retention_days: parseInt(e.target.value),
                        updated_by_id: user?.id
                      });
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-1">Backups older than this will be deleted</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Import Data - CAUTION
            </DialogTitle>
            <DialogDescription>
              Importing will overwrite existing data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Backup File</Label>
              <Input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files[0])}
              />
            </div>

            <div className="flex items-start space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <Checkbox
                id="import-confirm"
                checked={importConfirmed}
                onCheckedChange={setImportConfirmed}
              />
              <Label htmlFor="import-confirm" className="cursor-pointer text-red-900">
                I understand this will overwrite existing data and cannot be undone
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || !importConfirmed}
              className="bg-red-600 hover:bg-red-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              Restore Backup
            </DialogTitle>
            <DialogDescription>
              Contact system administrator to restore this backup safely.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              Backup restore requires admin re-authentication and system validation. 
              This feature is available through direct admin access only.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}