import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, AlertTriangle, Lightbulb, Shield, CheckCircle, X } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProcedureViewModal({ procedureId, open, onClose }) {
  const { data: procedures = [], isLoading } = useQuery({
    queryKey: ['procedure-view', procedureId],
    queryFn: () => base44.entities.Visual_Procedures_v1.filter({ id: procedureId }),
    enabled: open && !!procedureId
  });

  const procedure = procedures[0];

  const tipIcons = {
    hygiene: Shield,
    safety: AlertTriangle,
    quality: CheckCircle,
    common_mistake: Lightbulb
  };

  const tipColors = {
    hygiene: 'bg-blue-100 text-blue-800 border-blue-300',
    safety: 'bg-red-100 text-red-800 border-red-300',
    quality: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    common_mistake: 'bg-amber-100 text-amber-800 border-amber-300'
  };

  if (!open) return null;
  if (isLoading) return <LoadingSpinner />;
  if (!procedure) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">{procedure.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-700">
                  {procedure.category?.replace(/_/g, ' ')}
                </Badge>
                <span className="text-sm text-slate-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {procedure.estimated_time_minutes} minutes
                </span>
                <span className="text-sm text-slate-600">
                  {procedure.steps?.length || 0} steps
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-140px)]">
          <div className="space-y-6 pr-4">
            {/* Cover Image */}
            {procedure.cover_image_url && (
              <img 
                src={procedure.cover_image_url} 
                alt={procedure.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}

            {/* Introduction */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Why This Matters</h3>
              <p className="text-slate-700">{procedure.intro_description}</p>
            </div>

            {/* Steps */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Step-by-Step Instructions</h3>
              <div className="space-y-6">
                {procedure.steps?.map((step, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                      {step.step_number}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-800">{step.step_title}</h4>
                      <p className="text-slate-600">{step.instruction_text}</p>
                      
                      {step.photo_url && (
                        <img 
                          src={step.photo_url} 
                          alt={step.step_title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}

                      {step.video_url && (
                        <div className="aspect-video">
                          {step.video_url.includes('youtube') || step.video_url.includes('youtu.be') ? (
                            <iframe
                              src={step.video_url.replace('watch?v=', 'embed/')}
                              className="w-full h-full rounded-lg"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : step.video_url.includes('vimeo') ? (
                            <iframe
                              src={step.video_url}
                              className="w-full h-full rounded-lg"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video controls className="w-full h-full rounded-lg">
                              <source src={step.video_url} />
                            </video>
                          )}
                        </div>
                      )}

                      {step.duration_seconds && (
                        <span className="text-xs text-slate-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          ~{Math.round(step.duration_seconds / 60)} min
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips & Warnings */}
            {procedure.tips_warnings && procedure.tips_warnings.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Important Notes</h3>
                <div className="space-y-2">
                  {procedure.tips_warnings.map((tip, idx) => {
                    const Icon = tipIcons[tip.type];
                    return (
                      <div 
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${tipColors[tip.type]}`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{tip.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}