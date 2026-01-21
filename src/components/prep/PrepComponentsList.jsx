import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const statusColors = {
  not_prepared: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  prepared: 'bg-emerald-100 text-emerald-700',
  low_stock: 'bg-amber-100 text-amber-700'
};

export default function PrepComponentsList({ prepComponents, user }) {
  const queryClient = useQueryClient();
  const [selectedPrep, setSelectedPrep] = useState(null);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => 
      base44.entities.Prep_Components_v1.update(id, {
        status,
        prepared_date: status === 'prepared' ? new Date().toISOString() : null,
        prepared_by_id: user?.id,
        prepared_by_name: user?.full_name || user?.email,
        expiry_date: status === 'prepared' 
          ? new Date(Date.now() + (prepComponents.find(p => p.id === id)?.data?.shelf_life_hours || 24) * 3600000).toISOString()
          : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prep_components'] });
      setSelectedPrep(null);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">🧱 Flow 1: Prep Components</h2>
          <p className="text-sm text-slate-500">Create and manage base prep items like curry bases, sauces, proteins</p>
        </div>
        <Link to={createPageUrl('PrepComponentsManager')}>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Manage Prep Items
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prepComponents.map((prep) => (
          <motion.div
            key={prep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedPrep(prep)}
            className="cursor-pointer"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{prep.data?.prep_name}</CardTitle>
                  <Badge className={statusColors[prep.data?.status || 'not_prepared']}>
                    {prep.data?.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-medium capitalize">{prep.data?.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Station:</span>
                    <span className="font-medium capitalize">{prep.data?.station?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batch:</span>
                    <span className="font-medium">{prep.data?.batch_size} {prep.data?.batch_unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Yield:</span>
                    <span className="font-medium">{prep.data?.yield_portions} portions</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Prep Detail Dialog */}
      {selectedPrep && (
        <Dialog open={!!selectedPrep} onOpenChange={() => setSelectedPrep(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedPrep.data?.prep_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Category:</span>
                  <p className="font-medium capitalize">{selectedPrep.data?.category}</p>
                </div>
                <div>
                  <span className="text-slate-500">Station:</span>
                  <p className="font-medium capitalize">{selectedPrep.data?.station?.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-slate-500">Storage:</span>
                  <p className="font-medium capitalize">{selectedPrep.data?.storage_location}</p>
                </div>
                <div>
                  <span className="text-slate-500">Shelf Life:</span>
                  <p className="font-medium">{selectedPrep.data?.shelf_life_hours} hours</p>
                </div>
              </div>

              {selectedPrep.data?.preparation_method?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Preparation Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {selectedPrep.data.preparation_method.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => updateStatusMutation.mutate({ id: selectedPrep.id, status: 'in_progress' })}
                  variant="outline"
                  disabled={selectedPrep.data?.status === 'in_progress'}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Start Prep
                </Button>
                <Button
                  onClick={() => updateStatusMutation.mutate({ id: selectedPrep.id, status: 'prepared' })}
                  className="bg-emerald-600"
                  disabled={selectedPrep.data?.status === 'prepared'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Prepared
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}