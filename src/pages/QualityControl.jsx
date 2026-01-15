import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { motion } from 'framer-motion';
import {
  Award,
  Camera,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Star,
  TrendingUp,
  Users,
  Upload,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

export default function QualityControl() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    menu_item_id: '',
    prepared_by: '',
    taste_score: 5,
    presentation_score: 5,
    temperature_score: 5,
    portion_score: 5,
    feedback: '',
    corrective_action: '',
    photo_url: '',
    issues: []
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

  const { data: qualityChecks = [], isLoading } = useQuery({
    queryKey: ['qualityChecks'],
    queryFn: () => base44.entities.QualityCheck.list('-check_date', 50),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list('name'),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.QualityCheck.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['qualityChecks']);
      setShowDialog(false);
      setFormData({
        menu_item_id: '',
        prepared_by: '',
        taste_score: 5,
        presentation_score: 5,
        temperature_score: 5,
        portion_score: 5,
        feedback: '',
        corrective_action: '',
        photo_url: '',
        issues: []
      });
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({...formData, photo_url: result.file_url});
    } catch (error) {
      console.error('Upload failed', error);
    }
    setUploading(false);
  };

  const handleSubmit = () => {
    const selectedItem = menuItems.find(m => m.id === formData.menu_item_id);
    const selectedStaff = staff.find(s => s.email === formData.prepared_by);
    
    const overall = (formData.taste_score + formData.presentation_score + formData.temperature_score + formData.portion_score) / 4;
    const status = overall >= 4 ? 'passed' : overall >= 3 ? 'needs_improvement' : 'failed';

    createMutation.mutate({
      ...formData,
      menu_item_name: selectedItem?.name || '',
      prepared_by_name: selectedStaff?.full_name || formData.prepared_by,
      checker_email: user?.email,
      checker_name: user?.full_name || user?.email,
      check_date: new Date().toISOString(),
      overall_score: overall,
      status,
      retraining_required: status === 'failed'
    });
  };

  const avgQualityScore = qualityChecks.length > 0
    ? qualityChecks.reduce((sum, c) => sum + (c.overall_score || 0), 0) / qualityChecks.length
    : 0;

  const passRate = qualityChecks.length > 0
    ? (qualityChecks.filter(c => c.status === 'passed').length / qualityChecks.length) * 100
    : 0;

  const canEdit = ['manager', 'owner', 'admin'].includes(user?.role);

  if (isLoading) return <LoadingSpinner message="Loading quality checks..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality Control"
        description="Random quality checks and consistency monitoring"
        action={canEdit ? () => setShowDialog(true) : undefined}
        actionLabel="New Quality Check"
      />

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgQualityScore.toFixed(1)}/5</p>
                <p className="text-xs text-slate-500">Avg Quality Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{passRate.toFixed(0)}%</p>
                <p className="text-xs text-slate-500">Pass Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{qualityChecks.length}</p>
                <p className="text-xs text-slate-500">Total Checks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Checks */}
      <div className="space-y-3">
        {qualityChecks.map((check, idx) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={
              check.status === 'passed' ? 'border-emerald-300 bg-emerald-50' :
              check.status === 'failed' ? 'border-red-300 bg-red-50' :
              'border-amber-300 bg-amber-50'
            }>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg">{check.menu_item_name}</h3>
                      <Badge className={
                        check.status === 'passed' ? 'bg-emerald-600' :
                        check.status === 'failed' ? 'bg-red-600' :
                        'bg-amber-600'
                      }>
                        {check.status?.replace('_', ' ')}
                      </Badge>
                      {check.retraining_required && (
                        <Badge variant="outline" className="border-red-400 text-red-600">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Retraining Required
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-slate-500">Taste</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          {check.taste_score}/5
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Presentation</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          {check.presentation_score}/5
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Temperature</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          {check.temperature_score}/5
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Portion</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          {check.portion_score}/5
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Prepared By:</span>
                        <span className="font-semibold ml-2">{check.prepared_by_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Checked By:</span>
                        <span className="font-semibold ml-2">{check.checker_name}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Date:</span>
                        <span className="font-semibold ml-2">{format(new Date(check.check_date), 'PPp')}</span>
                      </div>
                    </div>

                    {check.feedback && (
                      <div className="bg-white p-3 rounded-lg mb-2">
                        <p className="text-sm font-medium mb-1">Feedback:</p>
                        <p className="text-sm text-slate-600">{check.feedback}</p>
                      </div>
                    )}

                    {check.corrective_action && (
                      <div className="bg-amber-100 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Corrective Action:</p>
                        <p className="text-sm text-slate-700">{check.corrective_action}</p>
                      </div>
                    )}
                  </div>

                  {check.photo_url && (
                    <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-slate-200">
                      <img src={check.photo_url} alt="Dish" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create Check Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Quality Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Menu Item</label>
                <Select value={formData.menu_item_id} onValueChange={(v) => setFormData({...formData, menu_item_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Prepared By</label>
                <Select value={formData.prepared_by} onValueChange={(v) => setFormData({...formData, prepared_by: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.email} value={s.email}>{s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Taste Score (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.taste_score}
                  onChange={(e) => setFormData({...formData, taste_score: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Presentation Score (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.presentation_score}
                  onChange={(e) => setFormData({...formData, presentation_score: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Temperature Score (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.temperature_score}
                  onChange={(e) => setFormData({...formData, temperature_score: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Portion Score (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.portion_score}
                  onChange={(e) => setFormData({...formData, portion_score: Number(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Photo Upload</label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && <span className="text-sm text-slate-500">Uploading...</span>}
              </div>
              {formData.photo_url && (
                <img src={formData.photo_url} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Feedback</label>
              <Textarea
                value={formData.feedback}
                onChange={(e) => setFormData({...formData, feedback: e.target.value})}
                placeholder="Detailed feedback on quality..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Corrective Action (if needed)</label>
              <Textarea
                value={formData.corrective_action}
                onChange={(e) => setFormData({...formData, corrective_action: e.target.value})}
                placeholder="What needs to be improved..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-emerald-600">
                Submit Check
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}