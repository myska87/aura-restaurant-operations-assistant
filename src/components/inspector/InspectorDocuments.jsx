import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

export default function InspectorDocuments({ onBack }) {
  const { data: documents = [] } = useQuery({
    queryKey: ['approvedDocs'],
    queryFn: () => base44.entities.Document.filter({ status: 'approved' }, '-updated_date')
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Approved Documents Index', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, yPos);
    yPos += 6;
    doc.text(`Total approved documents: ${documents.length}`, 20, yPos);
    yPos += 12;

    doc.setFontSize(8);
    documents.forEach(item => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${item.title} | ${item.category} | v${item.version} | ${item.author_name}`, 20, yPos);
      yPos += 5;
    });

    doc.save(`Documents-Index-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Documents (Approved Only)</h1>
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
            <CardTitle>Approved Documents ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2">
                  <tr>
                    <th className="text-left p-3 font-semibold">Document Name</th>
                    <th className="text-left p-3 font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Version</th>
                    <th className="text-left p-3 font-semibold">Approved By</th>
                    <th className="text-left p-3 font-semibold">Approved Date</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id} className="border-b">
                      <td className="p-3 font-medium">{doc.title}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="capitalize">
                          {doc.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600">v{doc.version}</td>
                      <td className="p-3 text-slate-600">{doc.author_name}</td>
                      <td className="p-3 text-slate-600">
                        {format(new Date(doc.updated_date), 'dd/MM/yyyy')}
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