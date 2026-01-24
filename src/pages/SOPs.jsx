import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Sparkles,
  CheckCircle,
  Clock,
  Archive,
  Link as LinkIcon,
  Users,
  GraduationCap,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TrainingJourneyBar from '@/components/training/TrainingJourneyBar';
import TrainingModuleQuiz from '@/components/training/TrainingModuleQuiz';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const categories = [
  { value: 'kitchen', label: 'Kitchen', color: 'bg-orange-100 text-orange-700' },
  { value: 'front_of_house', label: 'Front of House', color: 'bg-blue-100 text-blue-700' },
  { value: 'hygiene', label: 'Hygiene', color: 'bg-green-100 text-green-700' },
  { value: 'safety', label: 'Safety', color: 'bg-red-100 text-red-700' },
  { value: 'equipment', label: 'Equipment', color: 'bg-purple-100 text-purple-700' },
  { value: 'service', label: 'Service', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'admin', label: 'Admin', color: 'bg-slate-100 text-slate-700' }
];

const requiredSections = [
  { id: 'bar_chai', label: 'Bar & Chai Preparation', categories: ['kitchen', 'service'] },
  { id: 'food_pastry', label: 'Food & Pastry Handling', categories: ['kitchen'] },
  { id: 'customer_standards', label: 'Customer Interaction Standards', categories: ['front_of_house', 'service'] },
  { id: 'pos_flow', label: 'POS & Order Flow', categories: ['front_of_house', 'admin'] },
  { id: 'opening_closing', label: 'Opening & Closing Rituals', categories: ['kitchen', 'front_of_house'] }
];

const skillsQuizQuestions = [
  {
    question: 'What are the key components of proper bar and chai preparation?',
    options: [
      'Temperature control, ingredient freshness, and presentation standards',
      'Only speed and quantity',
      'Color and taste preferences',
      'Customer feedback alone'
    ],
    correct: 0
  },
  {
    question: 'How should food and pastries be handled to maintain quality?',
    options: [
      'Follow storage guidelines, respect expiry dates, and maintain hygiene standards',
      'Store anywhere that fits',
      'Thaw at room temperature',
      'Ignore temperature requirements'
    ],
    correct: 0
  },
  {
    question: 'What defines excellent customer interaction standards?',
    options: [
      'Greeting customers warmly, listening actively, and resolving issues promptly',
      'Ignoring customer needs',
      'Speaking only when spoken to',
      'Rushing through transactions'
    ],
    correct: 0
  },
  {
    question: 'What is the purpose of standardized POS and order flow?',
    options: [
      'Ensure accuracy, reduce errors, and maintain consistent service speed',
      'Complicate the process',
      'Slow down operations',
      'Confuse staff members'
    ],
    correct: 0
  },
  {
    question: 'Why are opening and closing rituals important?',
    options: [
      'They establish consistency, prepare/secure the premises, and ensure food safety',
      'They are optional',
      'They waste time',
      'They serve no purpose'
    ],
    correct: 0
  }
];

export default function SOPs() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSOP, setEditingSOP] = useState(null);
  const [viewingSOP, setViewingSOP] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiLoading, setAILoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [completedSections, setCompletedSections] = useState({});
  const [quizPassed, setQuizPassed] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: sops = [], isLoading } = useQuery({
    queryKey: ['sops'],
    queryFn: () => base44.entities.SOP.list('-created_date'),
  });

  const { data: journeyProgress } = useQuery({
    queryKey: ['trainingJourney', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const existing = await base44.entities.TrainingJourneyProgress.filter({
        staff_email: user.email
      });
      if (existing.length > 0) {
        // Load saved section completion
        const saved = existing[0].skillsSections || {};
        setCompletedSections(saved);
        return existing[0];
      }
      return null;
    },
    enabled: !!user?.email
  });

  const { data: acknowledgments = [] } = useQuery({
    queryKey: ['sopAcknowledgments'],
    queryFn: () => base44.entities.SOPAcknowledgment.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SOP.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sops']);
      setShowForm(false);
      setEditingSOP(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SOP.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sops']);
      setShowForm(false);
      setEditingSOP(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SOP.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['sops'])
  });

  const toggleSection = async (sectionId) => {
    const newCompleted = {
      ...completedSections,
      [sectionId]: !completedSections[sectionId]
    };
    setCompletedSections(newCompleted);

    // Check if all sections are complete
    const allComplete = requiredSections.every(s => newCompleted[s.id]);

    if (journeyProgress) {
      await base44.entities.TrainingJourneyProgress.update(journeyProgress.id, {
        skillsSections: newCompleted,
        skillsCompleted: allComplete,
        currentStep: allComplete ? 'hygiene' : 'skills',
        lastUpdated: new Date().toISOString()
      });
      queryClient.invalidateQueries(['trainingJourney']);
    }
  };

  const filteredSOPs = sops.filter(sop => {
    const matchesSearch = 
      sop.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.objective?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || sop.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || sop.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getSOPAcknowledgments = (sopId) => {
    return acknowledgments.filter(a => a.sop_id === sopId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      objective: formData.get('objective'),
      scope: formData.get('scope'),
      procedure: formData.get('procedure'),
      quality_standards: formData.get('quality_standards'),
      category: formData.get('category'),
      status: formData.get('status'),
      review_date: formData.get('review_date'),
      version: editingSOP?.version || '1.0'
    };
    
    if (editingSOP) {
      updateMutation.mutate({ id: editingSOP.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setAILoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a detailed Standard Operating Procedure (SOP) for a restaurant based on this request: "${aiPrompt}"
        
        Generate the SOP in this JSON format:
        {
          "title": "SOP Title",
          "objective": "Clear objective of this procedure",
          "scope": "Who this applies to and when",
          "procedure": "Step-by-step procedure with numbered steps",
          "quality_standards": "Quality standards to maintain",
          "category": "one of: kitchen, front_of_house, hygiene, safety, equipment, service, admin"
        }`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            objective: { type: "string" },
            scope: { type: "string" },
            procedure: { type: "string" },
            quality_standards: { type: "string" },
            category: { type: "string" }
          }
        }
      });
      
      if (result.title) {
        await base44.entities.SOP.create({
          ...result,
          status: 'draft',
          version: '1.0'
        });
        queryClient.invalidateQueries(['sops']);
        setShowAIGenerator(false);
        setAIPrompt('');
      }
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setAILoading(false);
    }
  };

  const statusColors = {
    draft: 'bg-amber-100 text-amber-700',
    active: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-slate-100 text-slate-600'
  };

  const statusIcons = {
    draft: Clock,
    active: CheckCircle,
    archived: Archive
  };

  if (isLoading) return <LoadingSpinner message="Loading SOPs..." />;

  const allSectionsComplete = requiredSections.every(s => completedSections[s.id]);

  return (
    <div className="space-y-6">
      {/* Journey Progress Bar */}
      {journeyProgress && (
        <TrainingJourneyBar progress={journeyProgress} compact />
      )}

      {/* Training Journey Header */}
      {journeyProgress && (
        <Card className="border-2 border-indigo-400 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
          <CardContent className="pt-8 pb-8 px-6 md:px-12">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                Role-Specific Training
              </h1>
              <p className="text-xl text-indigo-700 font-semibold mb-6">
                Master Your Craft
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-4 text-lg text-slate-700 leading-relaxed text-center">
              <p className="font-semibold text-slate-900">
                Mastery is built through repetition, standards, and pride.
              </p>
              <p>
                Short videos + SOPs + visual guides. Complete your role training to unlock certification.
              </p>
            </div>

            {/* Required Sections Checklist */}
            <div className="mt-8 bg-white rounded-xl p-6 max-w-2xl mx-auto border-2 border-indigo-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
                Required Training Sections
              </h3>
              <div className="space-y-3">
                {requiredSections.map((section) => (
                  <label
                    key={section.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={completedSections[section.id] || false}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <span className={`flex-1 ${completedSections[section.id] ? 'line-through text-slate-500' : 'text-slate-800 font-medium'}`}>
                      {section.label}
                    </span>
                    {completedSections[section.id] && (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    )}
                  </label>
                ))}
              </div>

              {allSectionsComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-center"
                >
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-emerald-900 font-bold">
                    ✓ Skills Training Complete! Hygiene Module Unlocked
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <PageHeader
        title="Standard Operating Procedures"
        description={`${sops.length} SOPs documented`}
        action={() => { setEditingSOP(null); setShowForm(true); }}
        actionLabel="Create SOP"
      >
        <Button 
          variant="outline" 
          onClick={() => setShowAIGenerator(true)}
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Generate
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search SOPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* SOP Grid */}
      {filteredSOPs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No SOPs found"
          description="Create your first Standard Operating Procedure to document your processes."
          action={() => setShowForm(true)}
          actionLabel="Create SOP"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredSOPs.map((sop, index) => {
              const StatusIcon = statusIcons[sop.status] || Clock;
              const categoryInfo = categories.find(c => c.value === sop.category);
              const ackCount = getSOPAcknowledgments(sop.id).length;
              
              return (
                <motion.div
                  key={sop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setViewingSOP(sop)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryInfo?.color || 'bg-slate-100 text-slate-600'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingSOP(sop); setShowForm(true); }}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(sop.id); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">{sop.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{sop.objective}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={statusColors[sop.status]}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {sop.status}
                    </Badge>
                    <Badge variant="outline">v{sop.version}</Badge>
                    {categoryInfo && (
                      <Badge variant="outline">{categoryInfo.label}</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {ackCount} acknowledged
                    </span>
                    {sop.review_date && (
                      <span>Review: {format(new Date(sop.review_date), 'MMM d')}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* SOP Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSOP ? 'Edit SOP' : 'Create SOP'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input name="title" defaultValue={editingSOP?.title} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select name="category" defaultValue={editingSOP?.category || 'kitchen'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editingSOP?.status || 'draft'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Objective</Label>
              <Textarea name="objective" defaultValue={editingSOP?.objective} rows={2} />
            </div>
            
            <div>
              <Label>Scope</Label>
              <Textarea name="scope" defaultValue={editingSOP?.scope} rows={2} placeholder="Who this applies to and when..." />
            </div>
            
            <div>
              <Label>Procedure *</Label>
              <Textarea name="procedure" defaultValue={editingSOP?.procedure} rows={6} placeholder="Step-by-step procedure..." required />
            </div>
            
            <div>
              <Label>Quality Standards</Label>
              <Textarea name="quality_standards" defaultValue={editingSOP?.quality_standards} rows={3} />
            </div>
            
            <div>
              <Label>Review Date</Label>
              <Input name="review_date" type="date" defaultValue={editingSOP?.review_date} />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700"
              >
                {editingSOP ? 'Update' : 'Create'} SOP
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View SOP Dialog */}
      <Dialog open={!!viewingSOP} onOpenChange={() => setViewingSOP(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingSOP && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingSOP.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColors[viewingSOP.status]}>
                    {viewingSOP.status}
                  </Badge>
                  <Badge variant="outline">v{viewingSOP.version}</Badge>
                  <Badge variant="outline">
                    {categories.find(c => c.value === viewingSOP.category)?.label}
                  </Badge>
                </div>
                
                {viewingSOP.objective && (
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-1">Objective</h4>
                    <p className="text-slate-600">{viewingSOP.objective}</p>
                  </div>
                )}
                
                {viewingSOP.scope && (
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-1">Scope</h4>
                    <p className="text-slate-600">{viewingSOP.scope}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1">Procedure</h4>
                  <div className="bg-slate-50 rounded-xl p-4 whitespace-pre-wrap text-slate-600">
                    {viewingSOP.procedure}
                  </div>
                </div>
                
                {viewingSOP.quality_standards && (
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-1">Quality Standards</h4>
                    <p className="text-slate-600">{viewingSOP.quality_standards}</p>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setViewingSOP(null)}>
                    Close
                  </Button>
                  <Button 
                    onClick={() => { setEditingSOP(viewingSOP); setViewingSOP(null); setShowForm(true); }}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit SOP
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Generator Dialog */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI SOP Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Describe the procedure you need and AI will generate a complete SOP.
            </p>
            <Textarea
              placeholder="e.g., Generate SOP for cleaning the deep fryer at end of day..."
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAIGenerator(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAIGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="bg-gradient-to-r from-amber-500 to-amber-600"
              >
                {aiLoading ? 'Generating...' : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate SOP
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}