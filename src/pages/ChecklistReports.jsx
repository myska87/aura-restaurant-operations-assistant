import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  FileText,
  Download,
  Eye,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ChecklistReports() {
  const [user, setUser] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: completions = [], isLoading } = useQuery({
    queryKey: ['checklist-completions'],
    queryFn: () => base44.entities.ChecklistCompletion.list('-created_date', 500),
    enabled: !!user
  });

  if (!user || isLoading) return <LoadingSpinner message="Loading reports..." />;

  const filteredCompletions = completions.filter(c => {
    const matchesDate = !dateFilter || c.date === dateFilter;
    const matchesCategory = categoryFilter === 'all' || c.checklist_category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesDate && matchesCategory && matchesStatus;
  });

  const stats = {
    total: completions.length,
    completed: completions.filter(c => c.status === 'completed').length,
    failed: completions.filter(c => c.status === 'failed').length,
    pending: completions.filter(c => c.status === 'in_progress').length
  };

  const exportPDF = async (completion) => {
    // Basic PDF export - can be enhanced with jsPDF
    alert('PDF export coming soon!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checklist Reports"
        description="View all checklist completions, submissions, and compliance tracking"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-slate-600">Total Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-sm text-slate-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-slate-600">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-sm text-slate-600">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date"
              className="w-full md:w-48"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="opening">Opening</SelectItem>
                <SelectItem value="closing">Closing</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="hygiene">Hygiene</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredCompletions.map((completion, idx) => (
          <motion.div
            key={completion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card className={
              completion.status === 'failed' ? 'border-red-300 bg-red-50' :
              completion.status === 'completed' ? 'border-emerald-300 bg-emerald-50' : ''
            }>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{completion.checklist_name}</h3>
                      <Badge
                        className={
                          completion.status === 'completed' ? 'bg-emerald-600' :
                          completion.status === 'failed' ? 'bg-red-600' :
                          completion.status === 'pending_review' ? 'bg-amber-600' :
                          'bg-slate-600'
                        }
                      >
                        {completion.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {completion.checklist_category}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{completion.user_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(completion.date), 'MMM d, yyyy')}</span>
                      </div>
                      <div>
                        <span className="font-medium">Completion: </span>
                        <span className="font-bold text-emerald-600">
                          {Math.round(completion.completion_percentage || 0)}%
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Shift: </span>
                        <span>{completion.shift}</span>
                      </div>
                    </div>

                    {completion.failed_items && completion.failed_items.length > 0 && (
                      <div className="mt-3 p-2 bg-red-100 rounded-lg">
                        <p className="text-sm text-red-900 font-medium">
                          ⚠️ {completion.failed_items.length} item(s) failed
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedReport(completion)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportPDF(completion)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredCompletions.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No reports found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-hidden flex flex-col">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedReport.checklist_name} - Report</DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-semibold text-slate-600">User</p>
                          <p>{selectedReport.user_name}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-600">Date</p>
                          <p>{format(new Date(selectedReport.date), 'PPP')}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-600">Shift</p>
                          <p>{selectedReport.shift}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-600">Completion</p>
                          <p className="font-bold text-emerald-600">
                            {Math.round(selectedReport.completion_percentage || 0)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900">Answers</h4>
                    {selectedReport.answers?.map((answer, idx) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <p className="font-semibold mb-2">{answer.question_text}</p>
                          <p className="text-slate-700">{answer.answer}</p>
                          {answer.notes && (
                            <p className="text-sm text-slate-500 mt-2 italic">Note: {answer.notes}</p>
                          )}
                          {answer.photo_url && (
                            <img src={answer.photo_url} alt="Response" className="mt-2 rounded-lg max-w-xs" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}