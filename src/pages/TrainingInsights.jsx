import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  MessageSquare,
  Heart,
  AlertTriangle,
  CheckCircle,
  Eye,
  Send,
  Download,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { values } from '@/components/training/ValuesSection';

export default function TrainingInsights() {
  const [user, setUser] = useState(null);
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [managerResponse, setManagerResponse] = useState('');
  const [filterValue, setFilterValue] = useState('all');

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

  const { data: reflections = [], isLoading } = useQuery({
    queryKey: ['trainingReflections'],
    queryFn: () => base44.entities.TrainingReflection.list('-reflection_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainingReflection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingReflections']);
      setSelectedReflection(null);
      setManagerResponse('');
    }
  });

  const handleRespond = () => {
    updateMutation.mutate({
      id: selectedReflection.id,
      data: {
        ...selectedReflection,
        manager_reviewed: true,
        manager_response: managerResponse
      }
    });
  };

  const canView = ['manager', 'owner', 'admin'].includes(user?.role);

  // Analytics
  const totalReflections = reflections.length;
  const reviewedCount = reflections.filter(r => r.manager_reviewed).length;
  const pendingCount = totalReflections - reviewedCount;
  
  const valueCounts = values.map(v => ({
    ...v,
    count: reflections.filter(r => r.connected_value === v.id).length
  })).sort((a, b) => b.count - a.count);

  const topValue = valueCounts[0];

  const concernCount = reflections.filter(r => r.concerns && r.concerns.trim().length > 0).length;
  const suggestionCount = reflections.filter(r => r.suggestions && r.suggestions.trim().length > 0).length;

  // Common themes
  const allConcerns = reflections.filter(r => r.concerns).map(r => r.concerns.toLowerCase());
  const allSuggestions = reflections.filter(r => r.suggestions).map(r => r.suggestions.toLowerCase());

  const filteredReflections = filterValue === 'all' 
    ? reflections 
    : filterValue === 'pending'
    ? reflections.filter(r => !r.manager_reviewed)
    : filterValue === 'concerns'
    ? reflections.filter(r => r.concerns && r.concerns.trim().length > 0)
    : reflections.filter(r => r.connected_value === filterValue);

  if (isLoading) return <LoadingSpinner message="Loading insights..." />;

  if (!canView) {
    return (
      <div className="py-12 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
        <p className="text-slate-600">Only managers and admins can view training insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Insights & Feedback"
        description="Staff reflections, values alignment, and improvement suggestions"
      />

      {/* Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReflections}</p>
                <p className="text-xs text-slate-500">Total Reflections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-slate-500">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{concernCount}</p>
                <p className="text-xs text-slate-500">Concerns Raised</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suggestionCount}</p>
                <p className="text-xs text-slate-500">Suggestions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Values Alignment */}
      <Card>
        <CardHeader>
          <CardTitle>Values Alignment - What Resonates Most</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {valueCounts.map((value) => {
              const Icon = value.icon;
              const percentage = totalReflections > 0 ? (value.count / totalReflections) * 100 : 0;
              return (
                <div key={value.id} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${value.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{value.title}</span>
                      <span className="text-sm text-slate-600">{value.count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${value.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <Filter className="w-5 h-5 text-slate-500" />
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reflections</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="concerns">With Concerns</SelectItem>
            {values.map(v => (
              <SelectItem key={v.id} value={v.id}>Values: {v.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reflections List */}
      <div className="space-y-3">
        {filteredReflections.map((reflection, idx) => {
          const connectedValue = values.find(v => v.id === reflection.connected_value);
          const hasConcerns = reflection.concerns && reflection.concerns.trim().length > 0;

          return (
            <motion.div
              key={reflection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={hasConcerns ? 'border-amber-300 bg-amber-50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{reflection.staff_name}</h3>
                        {reflection.manager_reviewed ? (
                          <Badge className="bg-emerald-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Reviewed
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-600">Pending</Badge>
                        )}
                        {reflection.feedback_visibility === 'private' && (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{reflection.course_title} • {format(new Date(reflection.reflection_date), 'MMM d, yyyy')}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedReflection(reflection)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Full
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">What they learned:</p>
                      <p className="text-sm text-slate-600 line-clamp-2">{reflection.what_learned}</p>
                    </div>

                    {connectedValue && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-700">Connected with:</p>
                        <Badge className={`bg-gradient-to-r ${connectedValue.color}`}>
                          {connectedValue.title}
                        </Badge>
                      </div>
                    )}

                    {hasConcerns && (
                      <div className="bg-amber-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-900 mb-1">⚠️ Concern raised:</p>
                        <p className="text-sm text-amber-800 line-clamp-2">{reflection.concerns}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredReflections.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No reflections match your filter</p>
          </CardContent>
        </Card>
      )}

      {/* View Reflection Dialog */}
      <Dialog open={!!selectedReflection} onOpenChange={() => setSelectedReflection(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedReflection && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedReflection.staff_name}'s Reflection
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-4 space-y-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">Course:</p>
                      <p className="text-slate-600">{selectedReflection.course_title}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">Date:</p>
                      <p className="text-slate-600">{format(new Date(selectedReflection.reflection_date), 'PPpp')}</p>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <p className="font-semibold text-slate-800 mb-2">What they learned:</p>
                  <Card className="bg-slate-50">
                    <CardContent className="pt-4">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedReflection.what_learned}</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <p className="font-semibold text-slate-800 mb-2">Connected value:</p>
                  <Card className="bg-purple-50">
                    <CardContent className="pt-4">
                      <p className="font-semibold text-sm mb-1">{values.find(v => v.id === selectedReflection.connected_value)?.title}</p>
                      {selectedReflection.connected_value_why && (
                        <p className="text-sm text-slate-700">{selectedReflection.connected_value_why}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <p className="font-semibold text-slate-800 mb-2">Proud moment:</p>
                  <Card className="bg-emerald-50">
                    <CardContent className="pt-4">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedReflection.proud_moment}</p>
                    </CardContent>
                  </Card>
                </div>

                {selectedReflection.concerns && (
                  <div>
                    <p className="font-semibold text-slate-800 mb-2">Concerns:</p>
                    <Card className="bg-amber-50 border-amber-200">
                      <CardContent className="pt-4">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedReflection.concerns}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {selectedReflection.suggestions && (
                  <div>
                    <p className="font-semibold text-slate-800 mb-2">Suggestions:</p>
                    <Card className="bg-blue-50">
                      <CardContent className="pt-4">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedReflection.suggestions}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {selectedReflection.manager_response && (
                  <div>
                    <p className="font-semibold text-slate-800 mb-2">Your Response:</p>
                    <Card className="bg-green-50">
                      <CardContent className="pt-4">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedReflection.manager_response}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!selectedReflection.manager_reviewed && (
                  <div className="pt-4 border-t">
                    <p className="font-semibold text-slate-800 mb-2">Respond to {selectedReflection.staff_name}:</p>
                    <Textarea
                      value={managerResponse}
                      onChange={(e) => setManagerResponse(e.target.value)}
                      placeholder="Acknowledge their reflection, address concerns, or provide encouragement..."
                      rows={4}
                    />
                    <Button
                      onClick={handleRespond}
                      disabled={!managerResponse.trim()}
                      className="mt-3 bg-gradient-to-r from-emerald-600 to-emerald-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Response & Mark Reviewed
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}