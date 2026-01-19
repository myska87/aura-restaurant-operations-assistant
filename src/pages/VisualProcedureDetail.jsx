import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Shield,
  Lightbulb,
  Play,
  Edit,
  Archive,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProcedureStepView from '@/components/procedures/ProcedureStepView';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VisualProcedureDetail() {
  const [user, setUser] = useState(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionComment, setCompletionComment] = useState('');
  const [printMode, setPrintMode] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const procedureId = urlParams.get('id');
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

  const { data: procedure, isLoading } = useQuery({
    queryKey: ['visualProcedure', procedureId],
    queryFn: () => base44.entities.Visual_Procedures_v1.filter({ id: procedureId }).then(p => p[0]),
    enabled: !!procedureId
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['procedureCompletions', procedureId, user?.email],
    queryFn: () => base44.entities.Procedure_Completion_v1.filter({
      procedure_id: procedureId,
      completed_by_id: user.email
    }, '-completion_date'),
    enabled: !!procedureId && !!user?.email
  });

  const completeMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Procedure_Completion_v1.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['procedureCompletions']);
      setShowCompletionDialog(false);
      setCompletionComment('');
    }
  });

  const handleComplete = () => {
    if (!user) return;
    
    completeMutation.mutate({
      procedure_id: procedureId,
      procedure_title: procedure.title,
      completed_by_id: user.email,
      completed_by_name: user.full_name || user.email,
      completed_by_role: user.role,
      completion_date: new Date().toISOString(),
      comment: completionComment,
      procedure_version: procedure.version
    });
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  if (isLoading) return <LoadingSpinner />;
  if (!procedure) return <div className="p-8 text-center">Procedure not found</div>;

  const isAdmin = user && ['admin', 'owner', 'manager'].includes(user.role);
  const hasCompleted = completions.length > 0;
  const lastCompletion = completions[0];

  const tipsWarningIcons = {
    hygiene: Shield,
    safety: AlertTriangle,
    quality: CheckCircle,
    common_mistake: Lightbulb
  };

  const tipsWarningColors = {
    hygiene: 'bg-blue-50 border-blue-300 text-blue-800',
    safety: 'bg-red-50 border-red-300 text-red-800',
    quality: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    common_mistake: 'bg-amber-50 border-amber-300 text-amber-800'
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { 
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            max-width: 100% !important;
          }
          .no-print { display: none !important; }
          .app-only { display: none !important; }
          
          /* Compact print layout */
          .print-header { 
            border-bottom: 3px solid #10b981;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .print-header h1 { 
            font-size: 18px !important;
            margin-bottom: 4px !important;
          }
          .print-intro {
            background: #f0fdf4 !important;
            padding: 8px 12px !important;
            margin-bottom: 12px;
            border-radius: 4px;
            font-size: 11px !important;
          }
          .print-table { 
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 12px;
          }
          .print-table th {
            background: #10b981;
            color: white;
            padding: 6px 8px;
            text-align: left;
            font-weight: 600;
          }
          .print-table td {
            border-bottom: 1px solid #e5e7eb;
            padding: 6px 8px;
            vertical-align: top;
          }
          .print-table tr:last-child td {
            border-bottom: 2px solid #10b981;
          }
          .print-notes {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            font-size: 9px;
            margin-top: 12px;
          }
          .print-notes div {
            padding: 6px 8px;
            border-radius: 4px;
            border: 1px solid;
          }
        }
      `}</style>
      
      <div className={`max-w-4xl mx-auto space-y-6 pb-20 ${printMode ? 'print-content' : ''}`}>
      
      {/* PRINT MODE - Compact One-Page Layout */}
      <div className="hidden print:block print-header">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">{procedure.title}</h1>
          <div className="text-xs text-slate-600 space-x-3">
            <span>v{procedure.version}</span>
            <span>⏱ {procedure.estimated_time_minutes} min</span>
            <span>👥 {procedure.applicable_roles?.join(', ').replace(/_/g, ' ')}</span>
          </div>
        </div>
        
        <div className="print-intro">
          <strong>Why This Matters:</strong> {procedure.intro_description}
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th style={{width: '40px'}}>#</th>
              <th style={{width: '140px'}}>Task</th>
              <th>Key Action</th>
              <th style={{width: '60px'}}>Time</th>
              <th style={{width: '30px'}}>✓</th>
            </tr>
          </thead>
          <tbody>
            {procedure.steps?.map((step, idx) => (
              <tr key={idx}>
                <td className="font-bold text-center">{step.step_number}</td>
                <td className="font-semibold">{step.step_title}</td>
                <td>{step.instruction_text}</td>
                <td className="text-center">{Math.floor(step.duration_seconds / 60)}m</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>

        {procedure.tips_warnings?.length > 0 && (
          <div className="print-notes">
            {procedure.tips_warnings.map((tip, i) => (
              <div 
                key={i} 
                style={{
                  borderColor: tip.type === 'safety' ? '#ef4444' : tip.type === 'hygiene' ? '#3b82f6' : '#10b981',
                  background: tip.type === 'safety' ? '#fef2f2' : tip.type === 'hygiene' ? '#eff6ff' : '#f0fdf4'
                }}
              >
                <strong>{tip.type === 'safety' ? '⚠️' : tip.type === 'hygiene' ? '🛡️' : '✅'} {tip.type.replace(/_/g, ' ').toUpperCase()}:</strong> {tip.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APP MODE - Rich Interactive Layout */}
      <div className="app-only">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to={createPageUrl('VisualProcedures')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge className={`${getCategoryColor(procedure.category)}`}>
              {procedure.category?.replace(/_/g, ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline">v{procedure.version}</Badge>
            {hasCompleted && (
              <Badge className="bg-emerald-100 text-emerald-700">
                ✓ Completed
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{procedure.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {procedure.estimated_time_minutes} min
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {procedure.applicable_roles?.join(', ').replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          {isAdmin && (
            <Link to={createPageUrl('VisualProcedureForm') + '?id=' + procedureId}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {procedure.cover_image_url && (
        <div className="aspect-video rounded-2xl overflow-hidden shadow-lg app-only">
          <img 
            src={procedure.cover_image_url} 
            alt={procedure.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Intro Section */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 app-only">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold text-emerald-900 mb-3">What & Why</h3>
          <p className="text-slate-700 leading-relaxed">{procedure.intro_description}</p>
        </CardContent>
      </Card>

      {/* Ingredients / Tools */}
      {procedure.ingredients_tools?.length > 0 && (
        <Card className="app-only">
          <CardHeader>
            <CardTitle>You'll Need</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {procedure.ingredients_tools.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                  {item.icon_url && (
                    <img src={item.icon_url} alt="" className="w-8 h-8 object-contain" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    {item.quantity && (
                      <p className="text-xs text-slate-500">{item.quantity}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      <Card className="app-only">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-600" />
              Step-by-Step Instructions
            </div>
            <Badge variant="outline" className="text-xs">
              {procedure.steps?.length} Steps
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {procedure.steps?.map((step, index) => (
            <div key={index}>
              <ProcedureStepView step={step} totalSteps={procedure.steps?.length} />
              
              {/* Video Section - App Only */}
              {step.video_url && (
                <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-900">Watch Video Guide</span>
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    {step.video_url.includes('youtube.com') || step.video_url.includes('youtu.be') ? (
                      <iframe
                        src={step.video_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : step.video_url.includes('instagram.com') ? (
                      <div className="flex items-center justify-center h-full">
                        <a 
                          href={step.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-white underline"
                        >
                          Watch on Instagram
                        </a>
                      </div>
                    ) : (
                      <video src={step.video_url} controls className="w-full h-full" />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tips & Warnings */}
      {procedure.tips_warnings?.length > 0 && (
        <div className="space-y-3 app-only">
          <h3 className="text-lg font-bold text-slate-800">Important Notes</h3>
          {procedure.tips_warnings.map((tip, i) => {
            const Icon = tipsWarningIcons[tip.type];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-xl border-2 ${tipsWarningColors[tip.type]}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1 capitalize">{tip.type.replace(/_/g, ' ')}</p>
                    <p className="text-sm">{tip.text}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Completion Section */}
      {lastCompletion && (
        <Card className="bg-emerald-50 border-emerald-200 app-only">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <p className="font-semibold text-emerald-900">
                You completed this on {new Date(lastCompletion.completion_date).toLocaleDateString()}
              </p>
            </div>
            {lastCompletion.comment && (
              <p className="text-sm text-slate-700 italic">"{lastCompletion.comment}"</p>
            )}
          </CardContent>
        </Card>
      )}
      </div>

      {/* Complete Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 lg:pl-80 no-print">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => setShowCompletionDialog(true)}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 h-12 text-lg font-semibold"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {hasCompleted ? 'Mark Complete Again' : 'I Have Completed This Procedure'}
          </Button>
        </div>
      </div>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Procedure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Confirm that you have followed all steps correctly.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">
                Optional Comment
              </label>
              <Textarea
                value={completionComment}
                onChange={(e) => setCompletionComment(e.target.value)}
                placeholder="Any notes or feedback..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                className="flex-1"
              >
                Confirm Completion
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCompletionDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}

function getCategoryColor(category) {
  const colors = {
    food_prep: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    hygiene: 'bg-blue-100 text-blue-700 border-blue-300',
    equipment: 'bg-purple-100 text-purple-700 border-purple-300',
    safety: 'bg-red-100 text-red-700 border-red-300',
    waste: 'bg-amber-100 text-amber-700 border-amber-300',
    opening: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    closing: 'bg-slate-100 text-slate-700 border-slate-300'
  };
  return colors[category] || 'bg-slate-100 text-slate-700';
}