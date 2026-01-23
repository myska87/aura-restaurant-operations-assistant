import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

export default function InspectorTrainingCerts({ onBack }) {
  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list()
  });

  const { data: trainingProgress = [] } = useQuery({
    queryKey: ['trainingProgress'],
    queryFn: () => base44.entities.TrainingProgress.list()
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => base44.entities.Certificate.list()
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Training & Certifications Report', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, yPos);
    yPos += 12;

    doc.setFontSize(8);
    staff.forEach(member => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const progress = trainingProgress.filter(t => t.staff_id === member.id);
      const completed = progress.filter(p => p.status === 'completed').length;
      const cert = certificates.find(c => c.staff_id === member.id);
      doc.text(`${member.full_name} | ${member.position} | ${completed}/${progress.length} courses | Cert: ${cert?.level || 'None'}`, 20, yPos);
      yPos += 5;
    });

    doc.save(`Training-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Training & Certifications</h1>
              <p className="text-sm opacity-90">Read-only view</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={exportPDF}
              variant="outline"
              className="bg-white text-red-700 hover:bg-red-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-white text-red-700 hover:bg-red-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Staff Training Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2">
                  <tr>
                    <th className="text-left p-3 font-semibold">Staff Name</th>
                    <th className="text-left p-3 font-semibold">Role</th>
                    <th className="text-left p-3 font-semibold">Completed Courses</th>
                    <th className="text-left p-3 font-semibold">Certification</th>
                    <th className="text-left p-3 font-semibold">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(member => {
                    const progress = trainingProgress.filter(t => t.staff_id === member.id);
                    const completed = progress.filter(p => p.status === 'completed').length;
                    const cert = certificates.find(c => c.staff_id === member.id);
                    
                    return (
                      <tr key={member.id} className="border-b">
                        <td className="p-3 font-medium">{member.full_name}</td>
                        <td className="p-3 text-slate-600">{member.position}</td>
                        <td className="p-3">
                          <Badge variant="outline">{completed}/{progress.length}</Badge>
                        </td>
                        <td className="p-3">
                          {cert ? (
                            <Badge className="bg-emerald-100 text-emerald-800">
                              {cert.level}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {cert?.expiry_date ? format(new Date(cert.expiry_date), 'dd/MM/yyyy') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}