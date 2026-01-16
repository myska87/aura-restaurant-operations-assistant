import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentsVault({ user, staffProfile }) {
  const { data: documents = [] } = useQuery({
    queryKey: ['myDocuments', user?.email],
    queryFn: () => base44.entities.Document.filter({ 
      $or: [
        { target_audience: 'all' },
        { target_audience: user.role }
      ]
    }),
    enabled: !!user?.email
  });

  const { data: signatures = [] } = useQuery({
    queryKey: ['mySignatures', staffProfile?.id],
    queryFn: () => base44.entities.DocumentSignature.filter({ staff_id: staffProfile.id }),
    enabled: !!staffProfile?.id
  });

  const getDocStatus = (doc) => {
    const sig = signatures.find(s => s.document_id === doc.id);
    if (sig) return { status: 'signed', date: sig.signed_date };
    if (doc.requires_signature) return { status: 'pending', date: null };
    return { status: 'available', date: null };
  };

  const mandatoryDocs = documents.filter(d => d.is_mandatory);
  const optionalDocs = documents.filter(d => !d.is_mandatory);

  return (
    <div className="space-y-4">
      {/* Mandatory Documents */}
      {mandatoryDocs.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold">Mandatory Documents</h3>
            </div>
            <div className="space-y-2">
              {mandatoryDocs.map(doc => {
                const status = getDocStatus(doc);
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <div>
                        <p className="font-medium text-sm">{doc.title}</p>
                        {status.date && (
                          <p className="text-xs text-slate-500">Signed {format(new Date(status.date), 'MMM d, yyyy')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        status.status === 'signed' ? 'bg-emerald-600' :
                        status.status === 'pending' ? 'bg-amber-600' : 'bg-slate-600'
                      }>
                        {status.status === 'signed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {status.status === 'signed' ? 'Signed' : status.status === 'pending' ? 'Pending' : 'View'}
                      </Badge>
                      {doc.file_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-3 h-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optional Documents */}
      {optionalDocs.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Available Documents</h3>
            <div className="space-y-2">
              {optionalDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <p className="font-medium text-sm">{doc.title}</p>
                  </div>
                  {doc.file_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-3 h-3 mr-1" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No documents available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}