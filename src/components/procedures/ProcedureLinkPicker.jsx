import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Link as LinkIcon, Clock, CheckCircle, Eye } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProcedureLinkPicker({ 
  open, 
  onClose, 
  onSelect, 
  selectedProcedureId = null 
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: procedures = [], isLoading } = useQuery({
    queryKey: ['visualProcedures-picker'],
    queryFn: () => base44.entities.Visual_Procedures_v1.filter({ 
      status: 'published'
    }, '-created_date'),
    enabled: open
  });

  const { data: selectedProcedure } = useQuery({
    queryKey: ['procedure-detail', selectedProcedureId],
    queryFn: () => base44.entities.Visual_Procedures_v1.filter({ id: selectedProcedureId }),
    enabled: !!selectedProcedureId
  });

  const filteredProcedures = procedures.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryColors = {
    food_prep: 'bg-emerald-100 text-emerald-700',
    hygiene: 'bg-blue-100 text-blue-700',
    equipment: 'bg-purple-100 text-purple-700',
    safety: 'bg-red-100 text-red-700',
    waste: 'bg-amber-100 text-amber-700',
    opening: 'bg-indigo-100 text-indigo-700',
    closing: 'bg-slate-100 text-slate-700'
  };

  if (isLoading && open) return <LoadingSpinner />;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Attach Visual Procedure
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Selection */}
          {selectedProcedureId && selectedProcedure?.[0] && (
            <Card className="border-emerald-300 bg-emerald-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700 font-semibold mb-1">Currently Linked</p>
                    <p className="font-semibold text-emerald-900">{selectedProcedure[0].title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={categoryColors[selectedProcedure[0].category]}>
                        {selectedProcedure[0].category?.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-emerald-700">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {selectedProcedure[0].estimated_time_minutes}m
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search procedures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Procedures List */}
          <ScrollArea className="h-96">
            <div className="space-y-2 pr-4">
              {filteredProcedures.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No published procedures found
                </p>
              ) : (
                filteredProcedures.map((proc) => (
                  <Card 
                    key={proc.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedProcedureId === proc.id ? 'border-emerald-500 bg-emerald-50' : ''
                    }`}
                    onClick={() => onSelect(proc.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        {proc.cover_image_url && (
                          <img 
                            src={proc.cover_image_url} 
                            alt={proc.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 mb-1 truncate">
                            {proc.title}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                            {proc.intro_description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={categoryColors[proc.category]}>
                              {proc.category?.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {proc.estimated_time_minutes}m
                            </span>
                            <span className="text-xs text-slate-500">
                              {proc.steps?.length || 0} steps
                            </span>
                          </div>
                        </div>
                        {selectedProcedureId === proc.id && (
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose} disabled={!selectedProcedureId}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}