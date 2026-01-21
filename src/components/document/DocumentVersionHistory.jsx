import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function DocumentVersionHistory({ documentId, currentVersion }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const { data: versions = [] } = useQuery({
    queryKey: ['documentVersions', documentId],
    queryFn: () => documentId 
      ? base44.entities.DocumentVersion.filter({ document_id: documentId }, '-created_date')
      : [],
    enabled: !!documentId
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2"
      >
        <Clock className="w-4 h-4" />
        Version History ({versions.length})
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {versions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No version history yet</p>
            ) : (
              versions.map((version, idx) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={version.version_number === currentVersion ? 'border-emerald-300 bg-emerald-50' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{version.version_number}</Badge>
                            <Badge className={
                              version.change_type === 'initial_creation' ? 'bg-blue-100 text-blue-800' :
                              version.change_type === 'content_update' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-slate-100 text-slate-800'
                            }>
                              {version.change_type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          {version.change_summary && (
                            <p className="text-sm text-slate-600 mb-2">{version.change_summary}</p>
                          )}
                          <p className="text-xs text-slate-500">
                            by {version.created_by_name} • {format(new Date(version.created_date), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                        {version.version_number !== currentVersion && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedVersion(version)}
                            className="ml-4 flex-shrink-0"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Version Preview Dialog */}
      {selectedVersion && (
        <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Preview Version {selectedVersion.version_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedVersion.content_snapshot }} />
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedVersion(null)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}