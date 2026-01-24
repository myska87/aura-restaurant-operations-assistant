import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function InspectorStaffHygiene({ onBack }) {
  // Fetch all active staff
  const { data: staff = [] } = useQuery({
    queryKey: ['allStaff'],
    queryFn: () => base44.entities.Staff.filter({ status: 'active' }, 'full_name', 200)
  });

  // Fetch all training certificates
  const { data: certificates = [] } = useQuery({
    queryKey: ['allCertificates'],
    queryFn: () => base44.entities.Certificate.list('-issued_date', 500)
  });

  const getStaffCertificates = (staffId) => {
    return certificates.filter(c => c.staff_id === staffId);
  };

  const isCertificateValid = (certificate) => {
    const expiryDate = new Date(certificate.expiry_date);
    return expiryDate > new Date();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button onClick={onBack} variant="outline" className="bg-white/20 hover:bg-white/30 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Staff Hygiene & Training</h1>
            <p className="text-slate-300 text-sm mt-1">Certifications and compliance records</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Staff List */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Active Staff ({staff.length})
          </h2>

          {staff.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No staff records</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {staff.map((staffMember, idx) => {
                const staffCerts = getStaffCertificates(staffMember.id);
                const validCerts = staffCerts.filter(isCertificateValid);
                const expiredCerts = staffCerts.filter(c => !isCertificateValid(c));

                return (
                  <motion.div
                    key={staffMember.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <Card className="hover:shadow-lg transition-all border-2 hover:border-slate-400">
                      <CardContent className="pt-6">
                        {/* Staff Info */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                          <div>
                            <p className="text-sm text-slate-600">Name</p>
                            <p className="font-bold text-slate-900">{staffMember.full_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Position</p>
                            <p className="font-bold text-slate-900">{staffMember.position}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Department</p>
                            <p className="font-bold capitalize text-slate-900">{staffMember.department}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Training Level</p>
                            <Badge className="bg-blue-500">{staffMember.training_level}</Badge>
                          </div>
                        </div>

                        {/* Certificates Section */}
                        <div>
                          <p className="font-semibold text-slate-900 mb-3">Training Certificates</p>
                          {staffCerts.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">No certificates on record</p>
                          ) : (
                            <div className="space-y-2">
                              {/* Valid Certificates */}
                              {validCerts.length > 0 && (
                                <div className="space-y-2">
                                  {validCerts.map((cert) => (
                                    <div key={cert.id} className="bg-emerald-50 p-3 rounded border border-emerald-200 text-sm">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-semibold text-emerald-900">
                                            {cert.level} - {cert.quiz_score}%
                                          </p>
                                          <p className="text-emerald-700 text-xs">
                                            Issued: {format(new Date(cert.issued_date), 'PPP')}
                                          </p>
                                        </div>
                                        <Badge className="bg-emerald-500 text-white">VALID</Badge>
                                      </div>
                                      <p className="text-emerald-600 text-xs mt-1">
                                        Expires: {format(new Date(cert.expiry_date), 'PPP')}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Expired Certificates */}
                              {expiredCerts.length > 0 && (
                                <div className="space-y-2 mt-3">
                                  {expiredCerts.map((cert) => (
                                    <div key={cert.id} className="bg-red-50 p-3 rounded border border-red-200 text-sm">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-semibold text-red-900">
                                            {cert.level} - {cert.quiz_score}%
                                          </p>
                                          <p className="text-red-700 text-xs">
                                            Issued: {format(new Date(cert.issued_date), 'PPP')}
                                          </p>
                                        </div>
                                        <Badge className="bg-red-600 text-white">EXPIRED</Badge>
                                      </div>
                                      <p className="text-red-600 text-xs mt-1">
                                        Expired: {format(new Date(cert.expiry_date), 'PPP')}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}