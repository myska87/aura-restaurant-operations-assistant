import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  ClipboardCheck,
  Plus,
  Search,
  Star,
  Camera,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Link as LinkIcon,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const auditTypes = [
  { value: 'hygiene', label: 'Hygiene', color: 'bg-green-100 text-green-700', icon: '🧼' },
  { value: 'cleanliness', label: 'Cleanliness', color: 'bg-blue-100 text-blue-700', icon: '✨' },
  { value: 'staff', label: 'Staff', color: 'bg-purple-100 text-purple-700', icon: '👥' },
  { value: 'equipment', label: 'Equipment', color: 'bg-orange-100 text-orange-700', icon: '🔧' },
  { value: 'food_safety', label: 'Food Safety', color: 'bg-red-100 text-red-700', icon: '🍽️' },
  { value: 'service', label: 'Service', color: 'bg-cyan-100 text-cyan-700', icon: '⭐' }
];

const defaultChecklists = {
  hygiene: [
    'Hand washing stations stocked and clean',
    'Staff wearing proper protective equipment',
    'Food prep surfaces sanitized',
    'Temperature logs up to date',
    'Pest control measures in place'
  ],
  cleanliness: [
    'Floors clean and dry',
    'All surfaces wiped down',
    'Restrooms cleaned and stocked',
    'Dining area tables clean',
    'Windows and mirrors spotless'
  ],
  equipment: [
    'All equipment functioning properly',
    'Refrigeration at correct temperature',
    'Ovens calibrated',
    'Fire suppression system checked',
    'First aid kit fully stocked'
  ],
  food_safety: [
    'Food stored at proper temperatures',
    'Raw and cooked foods separated',
    'Expiry dates checked',
    'FIFO system followed',
    'Allergen protocols in place'
  ],
  staff: [
    'Staff in proper uniform',
    'Name badges worn',
    'Grooming standards met',
    'Attitude and demeanor appropriate',
    'Knowledge of menu items'
  ],
  service: [
    'Greeting within 30 seconds',
    'Order accuracy',
    'Food served at correct temperature',
    'Table cleared promptly',
    'Payment processed efficiently'
  ]
};

export default function Quality() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingAudit, setViewingAudit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [auditData, setAuditData] = useState({
    title: '',
    audit_type: 'hygiene',
    checklist_items: [],
    findings: '',
    corrective_actions: '',
    images: []
  });
  const [uploading, setUploading] = useState(false);

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

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: () => base44.entities.QualityAudit.list('-audit_date'),
  });

  const { data: sops = [] } = useQuery({
    queryKey: ['sops'],
    queryFn: () => base44.entities.SOP.filter({ status: 'active' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.QualityAudit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['audits']);
      setShowForm(false);
      resetAuditForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.QualityAudit.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['audits']);
      setShowForm(false);
      resetAuditForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.QualityAudit.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['audits'])
  });

  const resetAuditForm = () => {
    setAuditData({
      title: '',
      audit_type: 'hygiene',
      checklist_items: [],
      findings: '',
      corrective_actions: '',
      images: []
    });
  };

  const initializeChecklist = (type) => {
    const items = defaultChecklists[type] || [];
    setAuditData(prev => ({
      ...prev,
      audit_type: type,
      checklist_items: items.map(item => ({
        item,
        score: 0,
        max_score: 5,
        notes: '',
        image_url: ''
      }))
    }));
  };

  const updateChecklistItem = (index, field, value) => {
    setAuditData(prev => ({
      ...prev,
      checklist_items: prev.checklist_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleImageUpload = async (e, itemIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (itemIndex !== undefined) {
        updateChecklistItem(itemIndex, 'image_url', result.file_url);
      } else {
        setAuditData(prev => ({
          ...prev,
          images: [...prev.images, result.file_url]
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const calculateScore = () => {
    const items = auditData.checklist_items;
    if (items.length === 0) return { overall: 0, max: 0, percentage: 0 };
    const overall = items.reduce((sum, item) => sum + (item.score || 0), 0);
    const max = items.reduce((sum, item) => sum + (item.max_score || 5), 0);
    return { overall, max, percentage: max > 0 ? Math.round((overall / max) * 100) : 0 };
  };

  const handleSubmit = () => {
    const scores = calculateScore();
    const status = scores.percentage >= 80 ? 'completed' : 'requires_action';
    
    const data = {
      ...auditData,
      auditor_name: user?.full_name || user?.email,
      auditor_email: user?.email,
      audit_date: format(new Date(), 'yyyy-MM-dd'),
      overall_score: scores.overall,
      max_score: scores.max,
      status
    };
    
    createMutation.mutate(data);
  };

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || audit.audit_type === filterType;
    return matchesSearch && matchesType;
  });

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-600 bg-emerald-100';
    if (percentage >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const statusColors = {
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    requires_action: 'bg-red-100 text-red-700'
  };

  const renderStars = (score, maxScore = 5, onSelect = null) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: maxScore }).map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 cursor-pointer transition-colors ${
              i < score ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
            }`}
            onClick={() => onSelect && onSelect(i + 1)}
          />
        ))}
      </div>
    );
  };

  if (isLoading) return <LoadingSpinner message="Loading quality audits..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality & Audits"
        description="Track quality standards and compliance"
        action={() => { resetAuditForm(); setShowForm(true); }}
        actionLabel="New Audit"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{audits.length}</p>
                <p className="text-xs text-slate-500">Total Audits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{audits.filter(a => a.status === 'completed').length}</p>
                <p className="text-xs text-slate-500">Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{audits.filter(a => a.status === 'in_progress').length}</p>
                <p className="text-xs text-slate-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{audits.filter(a => a.status === 'requires_action').length}</p>
                <p className="text-xs text-slate-500">Needs Action</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search audits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filterType} onValueChange={setFilterType}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {auditTypes.map(type => (
              <TabsTrigger key={type.value} value={type.value}>
                {type.icon} {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Audits Grid */}
      {filteredAudits.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No audits found"
          description="Start your first quality audit to track compliance."
          action={() => setShowForm(true)}
          actionLabel="Start Audit"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredAudits.map((audit, index) => {
              const typeInfo = auditTypes.find(t => t.value === audit.audit_type);
              const percentage = audit.max_score > 0 
                ? Math.round((audit.overall_score / audit.max_score) * 100) 
                : 0;
              
              return (
                <motion.div
                  key={audit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setViewingAudit(audit)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeInfo?.color || 'bg-slate-100'}`}>
                      <span className="text-xl">{typeInfo?.icon || '📋'}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(audit.id); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1">{audit.title}</h3>
                  <p className="text-sm text-slate-500 mb-3">{format(new Date(audit.audit_date), 'MMM d, yyyy')}</p>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getScoreColor(percentage)}`}>
                      {percentage}%
                    </div>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-slate-400 mt-1">{audit.overall_score}/{audit.max_score} points</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusColors[audit.status]}>
                      {audit.status?.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">{typeInfo?.label}</Badge>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* New Audit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Quality Audit</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label>Audit Title *</Label>
                <Input 
                  value={auditData.title}
                  onChange={(e) => setAuditData({...auditData, title: e.target.value})}
                  placeholder="e.g., Morning Hygiene Check"
                />
              </div>
              
              <div>
                <Label>Audit Type *</Label>
                <Select 
                  value={auditData.audit_type}
                  onValueChange={(value) => initializeChecklist(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {auditTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checklist */}
            {auditData.checklist_items.length > 0 && (
              <div>
                <Label className="mb-3 block">Checklist Items</Label>
                <div className="space-y-4">
                  {auditData.checklist_items.map((item, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-xl space-y-3">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-slate-700">{item.item}</p>
                        {renderStars(item.score, 5, (score) => updateChecklistItem(index, 'score', score))}
                      </div>
                      <Input
                        placeholder="Notes (optional)"
                        value={item.notes}
                        onChange={(e) => updateChecklistItem(index, 'notes', e.target.value)}
                        className="bg-white"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, index)}
                          className="hidden"
                          id={`image-${index}`}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById(`image-${index}`).click()}
                          disabled={uploading}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Add Photo
                        </Button>
                        {item.image_url && (
                          <Badge variant="secondary">Photo attached</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score Summary */}
            {auditData.checklist_items.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Current Score</span>
                    <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getScoreColor(calculateScore().percentage)}`}>
                      {calculateScore().percentage}%
                    </div>
                  </div>
                  <Progress value={calculateScore().percentage} className="mt-3" />
                </CardContent>
              </Card>
            )}

            {/* Findings & Actions */}
            <div className="space-y-4">
              <div>
                <Label>Findings</Label>
                <Textarea
                  value={auditData.findings}
                  onChange={(e) => setAuditData({...auditData, findings: e.target.value})}
                  placeholder="Document any issues or observations..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Corrective Actions</Label>
                <Textarea
                  value={auditData.corrective_actions}
                  onChange={(e) => setAuditData({...auditData, corrective_actions: e.target.value})}
                  placeholder="Actions needed to address issues..."
                  rows={3}
                />
              </div>
            </div>

            {/* Link to SOP */}
            <div>
              <Label>Link to Related SOPs</Label>
              <Select 
                value={auditData.linked_sop_ids?.[0] || ''}
                onValueChange={(value) => setAuditData({...auditData, linked_sop_ids: [value]})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select related SOP..." />
                </SelectTrigger>
                <SelectContent>
                  {sops.map(sop => (
                    <SelectItem key={sop.id} value={sop.id}>{sop.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit}
                disabled={!auditData.title || auditData.checklist_items.length === 0 || createMutation.isPending}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Audit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Audit Dialog */}
      <Dialog open={!!viewingAudit} onOpenChange={() => setViewingAudit(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingAudit && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingAudit.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Badge className={statusColors[viewingAudit.status]}>
                    {viewingAudit.status?.replace('_', ' ')}
                  </Badge>
                  <Badge className={auditTypes.find(t => t.value === viewingAudit.audit_type)?.color}>
                    {auditTypes.find(t => t.value === viewingAudit.audit_type)?.label}
                  </Badge>
                  <Badge variant="outline">
                    {format(new Date(viewingAudit.audit_date), 'MMM d, yyyy')}
                  </Badge>
                </div>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Overall Score</span>
                      <div className={`text-3xl font-bold px-4 py-2 rounded-xl ${getScoreColor(
                        Math.round((viewingAudit.overall_score / viewingAudit.max_score) * 100)
                      )}`}>
                        {Math.round((viewingAudit.overall_score / viewingAudit.max_score) * 100)}%
                      </div>
                    </div>
                    <Progress value={(viewingAudit.overall_score / viewingAudit.max_score) * 100} className="h-3" />
                    <p className="text-sm text-slate-500 mt-2">{viewingAudit.overall_score} / {viewingAudit.max_score} points</p>
                  </CardContent>
                </Card>

                <div>
                  <h4 className="font-semibold mb-3">Checklist Results</h4>
                  <div className="space-y-2">
                    {viewingAudit.checklist_items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm">{item.item}</span>
                        <div className="flex items-center gap-2">
                          {renderStars(item.score, 5)}
                          {item.image_url && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(item.image_url, '_blank')}>
                              <Camera className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {viewingAudit.findings && (
                  <div>
                    <h4 className="font-semibold mb-2">Findings</h4>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{viewingAudit.findings}</p>
                  </div>
                )}

                {viewingAudit.corrective_actions && (
                  <div>
                    <h4 className="font-semibold mb-2">Corrective Actions</h4>
                    <p className="text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200">{viewingAudit.corrective_actions}</p>
                  </div>
                )}

                <div className="text-sm text-slate-500">
                  Audited by: {viewingAudit.auditor_name}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}