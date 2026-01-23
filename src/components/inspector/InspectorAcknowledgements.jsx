import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileCheck, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

export default function InspectorAcknowledgements({ onBack }) {
  const { data: acknowledgements = [] } = useQuery({
    queryKey: ['acknowledgements'],
    queryFn: () => base44.entities.DocumentAcknowledgement.list('-acknowledged_date')
  });

  const signed = acknowledgements.filter(a => a.signed).length;
  const acknowledged = acknowledgements.filter(a => a.acknowledged).length;

  const exportPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Document Acknowledgements Report', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, yPos);
    yPos += 6;
    doc.text(`Total: ${acknowledgements.length} | Signed: ${signed} | Acknowledged: ${acknowledged}`, 20, yPos);
    yPos += 12;

    doc.setFontSize(8);
    acknowledgements.forEach(item => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const status = item.signed ? '✓ Signed' : item.acknowledged ? '✓ Ack' : '○ Pending';
      doc.text(`${item.user_name} | ${item.document_title} | v${item.document_version} | ${status}`, 20, yPos);
      yPos += 5;
    });

    doc.save(`Acknowledgements-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCheck className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Staff Acknowledgements</h1>
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

      <div className="max-w-6xl mx-auto p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-slate-800">{acknowledgements.length}</p>
              <p className="text-sm text-slate-600">Total Records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-emerald-600">{signed}</p>
              <p className="text-sm text-slate-600">Signed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-600">{acknowledged}</p>
              <p className="text-sm text-slate-600">Acknowledged</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Acknowledgement Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2">
                  <tr>
                    <th className="text-left p-3 font-semibold">Staff Name</th>
                    <th className="text-left p-3 font-semibold">Document</th>
                    <th className="text-left p-3 font-semibold">Version</th>
                    <th className="text-left p-3 font-semibold">Acknowledged</th>
                    <th className="text-left p-3 font-semibold">Signed</th>
                    <th className="text-left p-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {acknowledgements.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="p-3 font-medium">{item.user_name}</td>
                      <td className="p-3">{item.document_title}</td>
                      <td className="p-3 text-slate-600">v{item.document_version}</td>
                      <td className="p-3">
                        {item.acknowledged ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                      <td className="p-3">
                        {item.signed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                      <td className="p-3 text-slate-600">
                        {item.acknowledged_date ? format(new Date(item.acknowledged_date), 'dd/MM/yyyy HH:mm') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}