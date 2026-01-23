import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plus,
  Edit,
  Copy,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ChecklistLibrary() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists-library'],
    queryFn: () => base44.entities.ChecklistMaster.list('-created_date', 500),
    enabled: !!user
  });

  const duplicateMutation = useMutation({
    mutationFn: async (checklist) => {
      const duplicate = {
        ...checklist,
        checklist_name: `${checklist.checklist_name} (Copy)`,
        version: '1.0',
        is_published: false,
        created_by_name: user?.full_name || user?.email,
        created_by_email: user?.email
      };
      delete duplicate.id;
      delete duplicate.created_date;
      delete duplicate.updated_date;
      return base44.entities.ChecklistMaster.create(duplicate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['checklists-library']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ChecklistMaster.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['checklists-library']);
    }
  });

  const exportToCSV = () => {
    const csv = [
      ['Name', 'Category', 'Version', 'Station', 'Status', 'Created By', 'Created Date'].join(','),
      ...filteredChecklists.map(c => [
        c.checklist_name,
        c.checklist_category,
        c.version,
        c.assigned_station,
        c.is_published ? 'Published' : 'Draft',
        c.created_by_name,
        format(new Date(c.created_date), 'yyyy-MM-dd')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklists-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (!user) return <LoadingSpinner />;
  if (isLoading) return <LoadingSpinner message="Loading checklists..." />;

  const filteredChecklists = checklists.filter(c => {
    const matchesSearch = c.checklist_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.checklist_category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && c.is_published) ||
      (statusFilter === 'draft' && !c.is_published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: checklists.length,
    published: checklists.filter(c => c.is_published).length,
    draft: checklists.filter(c => !c.is_published).length,
    opening: checklists.filter(c => c.checklist_category === 'opening').length,
    closing: checklists.filter(c => c.checklist_category === 'closing').length
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checklist Library"
        description="Create, manage, and publish custom checklists for operations, audits, and compliance"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{stats.total}</p>
            <p className="text-sm text-slate-600">Total Checklists</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.published}</p>
            <p className="text-sm text-slate-600">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{stats.draft}</p>
            <p className="text-sm text-slate-600">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.opening}</p>
            <p className="text-sm text-slate-600">Opening</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.closing}</p>
            <p className="text-sm text-slate-600">Closing</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search checklists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('ChecklistBuilder'))}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checklists Grid */}
      <div className="grid gap-4">
        {filteredChecklists.map((checklist, idx) => (
          <motion.div
            key={checklist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{checklist.checklist_name}</h3>
                      {checklist.is_published ? (
                        <Badge className="bg-emerald-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-400 text-amber-700">
                          Draft
                        </Badge>
                      )}
                      <Badge className="capitalize">{checklist.checklist_category}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                      <div>
                        <p className="font-medium">Version</p>
                        <p>v{checklist.version}</p>
                      </div>
                      <div>
                        <p className="font-medium">Station</p>
                        <p className="capitalize">{checklist.assigned_station}</p>
                      </div>
                      <div>
                        <p className="font-medium">Questions</p>
                        <p>{checklist.items?.length || 0} items</p>
                      </div>
                      <div>
                        <p className="font-medium">Created</p>
                        <p>{format(new Date(checklist.created_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      By {checklist.created_by_name}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(createPageUrl('ChecklistBuilder') + `?id=${checklist.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateMutation.mutate(checklist)}
                      disabled={duplicateMutation.isPending}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm(`Delete "${checklist.checklist_name}"?`)) {
                          deleteMutation.mutate(checklist.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredChecklists.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-slate-500 mb-4">No checklists found</p>
              <Button
                onClick={() => navigate(createPageUrl('ChecklistBuilder'))}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Checklist
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}