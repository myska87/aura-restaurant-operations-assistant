import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

export default function InspectorCleaningRecords({ onBack, dateRange }) {
  const getDateFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    if (dateRange === 'today') return { date: today };
    if (dateRange === 'last_7') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { date: { $gte: weekAgo } };
    }
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { date: { $gte: monthAgo } };
  };

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', dateRange],
    queryFn: () => base44.entities.FoodSafetyChecklist.filter(getDateFilter(), '-date')
  });

  const completed = checklists.filter(c => c.status === 'completed').length;
  const pending = checklists.filter(c => c.status !== 'completed').length;

  const exportPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Cleaning Records Report', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, yPos);
    yPos += 6;
    doc.text(`Total: ${checklists.length} | Completed: ${completed} | Pending: ${pending}`, 20, yPos);
    yPos += 12;

    doc.setFontSize(8);
    checklists.forEach(item => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      const status = item.status === 'completed' ? '✓' : '○';
      doc.text(`${item.date} | ${item.checklist_type} | ${status} ${item.status}`, 20, yPos);
      yPos += 5;
    });

    doc.save(`Cleaning-Records-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const dailyChecklists = checklists.filter(c => c.checklist_type === 'daily');
  const weeklyChecklists = checklists.filter(c => c.checklist_type === 'weekly');
  const deepCleanChecklists = checklists.filter(c => c.checklist_type === 'deep_clean');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Cleaning Records</h1>
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
              <p className="text-3xl font-bold text-slate-800">{checklists.length}</p>
              <p className="text-sm text-slate-600">Total Checklists</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-emerald-600">{completed}</p>
              <p className="text-sm text-slate-600">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-amber-600">{pending}</p>
              <p className="text-sm text-slate-600">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Cleaning Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Daily ({dailyChecklists.length})</TabsTrigger>
                <TabsTrigger value="weekly">Weekly ({weeklyChecklists.length})</TabsTrigger>
                <TabsTrigger value="deep">Deep Clean ({deepCleanChecklists.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="daily" className="mt-4">
                <ChecklistTable checklists={dailyChecklists} />
              </TabsContent>
              <TabsContent value="weekly" className="mt-4">
                <ChecklistTable checklists={weeklyChecklists} />
              </TabsContent>
              <TabsContent value="deep" className="mt-4">
                <ChecklistTable checklists={deepCleanChecklists} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChecklistTable({ checklists }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b-2">
          <tr>
            <th className="text-left p-3 font-semibold">Date</th>
            <th className="text-left p-3 font-semibold">Checklist Name</th>
            <th className="text-left p-3 font-semibold">Status</th>
            <th className="text-left p-3 font-semibold">Completed By</th>
            <th className="text-left p-3 font-semibold">Time</th>
          </tr>
        </thead>
        <tbody>
          {checklists.map(item => (
            <tr key={item.id} className="border-b">
              <td className="p-3">{format(new Date(item.date), 'dd/MM/yyyy')}</td>
              <td className="p-3 font-medium">{item.checklist_type}</td>
              <td className="p-3">
                <Badge className={item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                  {item.status}
                </Badge>
              </td>
              <td className="p-3 text-slate-600">{item.completed_by || '-'}</td>
              <td className="p-3 text-slate-600">{item.completed_date ? format(new Date(item.completed_date), 'HH:mm') : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}