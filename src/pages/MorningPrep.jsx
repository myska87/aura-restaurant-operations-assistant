import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Clock, ChefHat, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MorningPrep() {
  const [user, setUser] = useState(null);
  const [selectedPrep, setSelectedPrep] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [markingPrepared, setMarkingPrepared] = useState(false);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log('User not authenticated');
      }
    };
    loadUser();
  }, []);

  const { data: prepComponents = [], isLoading } = useQuery({
    queryKey: ['prep_components'],
    queryFn: () => base44.entities.Prep_Components_v1.list('-created_date', 500),
    initialData: [],
  });

  const markPreparedMutation = useMutation({
    mutationFn: async (prep) => {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + (prep.data.shelf_life_hours * 60 * 60 * 1000));

      await base44.entities.Prep_Components_v1.update(prep.id, {
        status: 'prepared',
        prepared_date: now.toISOString(),
        prepared_by_id: user.id,
        prepared_by_name: user.full_name || user.email,
        expiry_date: expiryDate.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prep_components'] });
      setMarkingPrepared(false);
      setDetailsOpen(false);
    },
  });

  const groupByStation = (preps) => {
    const stations = {
      hot_line: [],
      grill: [],
      cold_prep: [],
      chai_station: [],
      bakery: [],
      fryer: [],
    };

    preps.forEach((prep) => {
      const station = prep.data.station || 'cold_prep';
      if (stations[station]) {
        stations[station].push(prep);
      }
    });

    return stations;
  };

  const getStatusBadge = (status) => {
    const badges = {
      not_prepared: { label: 'Not Prepared', color: 'bg-gray-500' },
      in_progress: { label: 'In Progress', color: 'bg-blue-500' },
      prepared: { label: 'Prepared', color: 'bg-green-500' },
      low_stock: { label: 'Low Stock', color: 'bg-amber-500' },
    };
    return badges[status] || badges.not_prepared;
  };

  const stationLabels = {
    hot_line: 'Hot Line',
    grill: 'Grill Station',
    cold_prep: 'Cold Prep',
    chai_station: 'Chai Station',
    bakery: 'Bakery',
    fryer: 'Fryer Station',
  };

  const groupedPreps = groupByStation(prepComponents);

  if (isLoading) return <LoadingSpinner message="Loading prep components..." />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-600" />
            Morning Prep Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hot_line" className="w-full">
            <TabsList className="grid grid-cols-6 w-full">
              {Object.keys(stationLabels).map((station) => (
                <TabsTrigger key={station} value={station}>
                  {stationLabels[station]}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.keys(stationLabels).map((station) => (
              <TabsContent key={station} value={station} className="space-y-4 mt-4">
                {groupedPreps[station].length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No prep components for this station</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedPreps[station].map((prep) => {
                      const statusBadge = getStatusBadge(prep.data.status);
                      return (
                        <motion.div
                          key={prep.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-lg">{prep.data.prep_name}</h3>
                                <Badge className={`${statusBadge.color} text-white`}>
                                  {statusBadge.label}
                                </Badge>
                              </div>

                              <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex justify-between">
                                  <span>Batch Size:</span>
                                  <span className="font-medium">
                                    {prep.data.batch_size} {prep.data.batch_unit}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Yield:</span>
                                  <span className="font-medium">{prep.data.yield_portions} portions</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Shelf Life:</span>
                                  <span className="font-medium">{prep.data.shelf_life_hours}h</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Storage:</span>
                                  <span className="font-medium capitalize">
                                    {prep.data.storage_location.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPrep(prep);
                                    setDetailsOpen(true);
                                  }}
                                  className="flex-1"
                                >
                                  View Details
                                </Button>
                                {prep.data.status !== 'prepared' && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPrep(prep);
                                      setMarkingPrepared(true);
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Mark Prepared
                                  </Button>
                                )}
                              </div>

                              {prep.data.status === 'prepared' && prep.data.prepared_by_name && (
                                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                                  <p>Prepared by: {prep.data.prepared_by_name}</p>
                                  <p>
                                    {new Date(prep.data.prepared_date).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPrep?.data.prep_name}</DialogTitle>
          </DialogHeader>
          {selectedPrep && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Category:</span>
                  <p className="capitalize">{selectedPrep.data.category}</p>
                </div>
                <div>
                  <span className="font-medium">Station:</span>
                  <p className="capitalize">{selectedPrep.data.station.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="font-medium">Batch Size:</span>
                  <p>
                    {selectedPrep.data.batch_size} {selectedPrep.data.batch_unit}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Yield:</span>
                  <p>{selectedPrep.data.yield_portions} portions</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Preparation Method:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {selectedPrep.data.preparation_method?.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              {selectedPrep.data.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes:</h3>
                  <p className="text-sm text-gray-600">{selectedPrep.data.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark Prepared Confirmation */}
      <Dialog open={markingPrepared} onOpenChange={setMarkingPrepared}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Prepared</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Confirm that <strong>{selectedPrep?.data.prep_name}</strong> has been prepared?
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p>
                <strong>Batch:</strong> {selectedPrep?.data.batch_size}{' '}
                {selectedPrep?.data.batch_unit}
              </p>
              <p>
                <strong>Storage:</strong> {selectedPrep?.data.storage_location}
              </p>
              <p>
                <strong>Shelf Life:</strong> {selectedPrep?.data.shelf_life_hours} hours
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkingPrepared(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => markPreparedMutation.mutate(selectedPrep)}
              disabled={markPreparedMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {markPreparedMutation.isPending ? 'Marking...' : 'Confirm Prepared'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}