import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, GraduationCap, Download, AlertTriangle } from 'lucide-react';
import { format, isBefore, addMonths } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TrainingView({ user }) {
  const { data: certificates = [] } = useQuery({
    queryKey: ['myCertificates', user?.email],
    queryFn: () => base44.entities.Certificate.filter({ staff_email: user.email }),
    enabled: !!user?.email
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['myTrainingProgress', user?.email],
    queryFn: () => base44.entities.TrainingProgress.filter({ staff_email: user.email }),
    enabled: !!user?.email
  });

  const expiringCerts = certificates.filter(c => {
    const expiryDate = new Date(c.expiry_date);
    return isBefore(expiryDate, addMonths(new Date(), 1));
  });

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const inProgressCount = progress.filter(p => p.status === 'in_progress').length;

  return (
    <div className="space-y-4">
      {/* Expiring Alerts */}
      {expiringCerts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-900">Certificates Expiring Soon</h4>
                <p className="text-sm text-amber-700 mt-1">
                  {expiringCerts.length} certificate{expiringCerts.length !== 1 ? 's' : ''} expire within 30 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-3xl font-bold text-emerald-600">{completedCount}</p>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
              <p className="text-sm text-slate-600">In Progress</p>
            </div>
          </div>
          <Link to={createPageUrl('Training')}>
            <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
              <GraduationCap className="w-4 h-4 mr-2" />
              Go to Training Academy
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Certificates */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            My Certificates
          </h3>
          {certificates.length > 0 ? (
            <div className="space-y-2">
              {certificates.map(cert => {
                const isExpired = isBefore(new Date(cert.expiry_date), new Date());
                const isExpiring = !isExpired && isBefore(new Date(cert.expiry_date), addMonths(new Date(), 1));
                
                return (
                  <div key={cert.id} className={`p-3 rounded-lg border ${
                    isExpired ? 'bg-red-50 border-red-200' :
                    isExpiring ? 'bg-amber-50 border-amber-200' :
                    'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Award className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium">{cert.level_name}</p>
                          <p className="text-xs text-slate-500">
                            Expires: {format(new Date(cert.expiry_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      {cert.pdf_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-3 h-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No certificates yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}