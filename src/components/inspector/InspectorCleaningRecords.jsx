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
      const daysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { date: { $gte: daysAgo } };
    }
    if (dateRange === 'last_30') {
      const daysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { date: { $gte: daysAgo } };
    }
    if (dateRange === 'last_60') {
      const daysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { date: { $gte: daysAgo } };
    }
    if (dateRange === 'last_90') {
      const daysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { date: { $gte: daysAgo } };
    }
    return {};
  };

  const { data: dailyCleaningLogs = [] } = useQuery({
    queryKey: ['dailyCleaningLogs', dateRange],
    queryFn: () => base44.entities.DailyCleaningLog?.filter?.(getDateFilter(), '-date', 100) || []
  });

  const { data: deepCleaningSchedules = [] } = useQuery({
    queryKey: ['deepCleaningSchedules', dateRange],
    queryFn: () => base44.entities.DeepCleaningSchedule?.list?.('-completion_date', 100) || []
  });

  const { data: signOffLogs = [] } = useQuery({
    queryKey: ['signOffLogs', dateRange],
    queryFn: () => base44.entities.CleaningSignOffLog?.list?.('-approval_time', 100) || []
  });

  const { data: hygieneDeclarations = [] } = useQuery({
    queryKey: ['hygieneDeclarations', dateRange],
    queryFn: () => base44.entities.PersonalHygieneDeclaration?.list?.('-declaration_time', 100) || []
  });

  const { data: illnessReports = [] } = useQuery({
    queryKey: ['illnessReports', dateRange],
    queryFn: () => base44.entities.IllnessReport?.list?.('-report_time', 100) || []
  });

  const totalRecords = dailyCleaningLogs.length + deepCleaningSchedules.length + signOffLogs.length;
  const approvedLogs = dailyCleaningLogs.filter(log => log.status === 'approved').length;
  const pendingLogs = dailyCleaningLogs.filter(log => log.status !== 'approved').length;

  const exportPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Cleaning & Hygiene Inspector Report', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, yPos);
    yPos += 6;
    doc.text(`Date Range: ${dateRange} | Total Records: ${totalRecords}`, 20, yPos);
    yPos += 6;
    doc.text(`Daily Cleaning Logs: ${dailyCleaningLogs.length} | Deep Cleaning: ${deepCleaningSchedules.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Hygiene Declarations: ${hygieneDeclarations.length} | Illness Reports: ${illnessReports.length}`, 20, yPos);
    yPos += 12;

    // Daily Cleaning
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Daily Cleaning Logs', 20, yPos);
    yPos += 8;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    dailyCleaningLogs.forEach(log => {
      if (yPos > 280) { doc.addPage(); yPos = 20; }
      const status = log.status === 'approved' ? '✓' : '⏳';
      doc.text(`${log.date} | ${log.area_name} | ${status} | ${log.completed_by_name}`, 20, yPos);
      yPos += 5;
    });
    yPos += 10;

    // Deep Cleaning
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Deep Cleaning Schedule', 20, yPos);
    yPos += 8;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    deepCleaningSchedules.forEach(schedule => {
      if (yPos > 280) { doc.addPage(); yPos = 20; }
      const status = schedule.status === 'approved' ? '✓' : '⏳';
      doc.text(`${schedule.area_equipment_name} | ${schedule.frequency} | ${status}`, 20, yPos);
      yPos += 5;
    });
    yPos += 10;

    // Hygiene Declarations
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Staff Hygiene Declarations', 20, yPos);
    yPos += 8;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    hygieneDeclarations.forEach(decl => {
      if (yPos > 280) { doc.addPage(); yPos = 20; }
      const status = decl.all_clear ? '✓ Clear' : '⚠ Issues';
      doc.text(`${decl.declaration_date} | ${decl.staff_name} | ${status}`, 20, yPos);
      yPos += 5;
    });
    yPos += 10;

    // Illness Reports (dates only)
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Illness Reports (Summary)', 20, yPos);
    yPos += 8;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    illnessReports.forEach(report => {
      if (yPos > 280) { doc.addPage(); yPos = 20; }
      doc.text(`${report.report_date} | Staff Member | ${report.status}`, 20, yPos);
      yPos += 5;
    });

    doc.save(`Cleaning-Hygiene-Inspector-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-slate-800">{totalRecords}</p>
              <p className="text-sm text-slate-600">Total Records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-emerald-600">{approvedLogs}</p>
              <p className="text-sm text-slate-600">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-600">{hygieneDeclarations.length}</p>
              <p className="text-sm text-slate-600">Hygiene Checks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-red-600">{illnessReports.length}</p>
              <p className="text-sm text-slate-600">Illness Reports</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Cleaning & Hygiene Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="daily">Daily ({dailyCleaningLogs.length})</TabsTrigger>
                <TabsTrigger value="deep">Deep ({deepCleaningSchedules.length})</TabsTrigger>
                <TabsTrigger value="signoff">Sign-Offs ({signOffLogs.length})</TabsTrigger>
                <TabsTrigger value="hygiene">Hygiene ({hygieneDeclarations.length})</TabsTrigger>
                <TabsTrigger value="illness">Illness ({illnessReports.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="daily" className="mt-4">
                <DailyCleaningTable logs={dailyCleaningLogs} />
              </TabsContent>
              <TabsContent value="deep" className="mt-4">
                <DeepCleaningTable schedules={deepCleaningSchedules} />
              </TabsContent>
              <TabsContent value="signoff" className="mt-4">
                <SignOffTable logs={signOffLogs} />
              </TabsContent>
              <TabsContent value="hygiene" className="mt-4">
                <HygieneDeclarationTable declarations={hygieneDeclarations} />
              </TabsContent>
              <TabsContent value="illness" className="mt-4">
                <IllnessReportTable reports={illnessReports} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DailyCleaningTable({ logs }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b-2">
          <tr>
            <th className="text-left p-3 font-semibold">Date</th>
            <th className="text-left p-3 font-semibold">Area</th>
            <th className="text-left p-3 font-semibold">Task</th>
            <th className="text-left p-3 font-semibold">Status</th>
            <th className="text-left p-3 font-semibold">Completed By</th>
            <th className="text-left p-3 font-semibold">Supervisor</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border-b">
              <td className="p-3">{format(new Date(log.date), 'dd/MM/yyyy')}</td>
              <td className="p-3 font-medium">{log.area_name}</td>
              <td className="p-3 text-slate-600">{log.cleaning_task}</td>
              <td className="p-3">
                <Badge className={log.status === 'approved' ? 'bg-emerald-600' : 'bg-amber-600'}>
                  {log.status}
                </Badge>
              </td>
              <td className="p-3">{log.completed_by_name}</td>
              <td className="p-3 text-slate-600">{log.supervisor_name || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeepCleaningTable({ schedules }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b-2">
          <tr>
            <th className="text-left p-3 font-semibold">Equipment</th>
            <th className="text-left p-3 font-semibold">Frequency</th>
            <th className="text-left p-3 font-semibold">Next Due</th>
            <th className="text-left p-3 font-semibold">Status</th>
            <th className="text-left p-3 font-semibold">Last Completed</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map(schedule => (
            <tr key={schedule.id} className="border-b">
              <td className="p-3 font-medium">{schedule.area_equipment_name}</td>
              <td className="p-3">{schedule.frequency}</td>
              <td className="p-3">{schedule.next_due_date ? format(new Date(schedule.next_due_date), 'dd/MM/yyyy') : '-'}</td>
              <td className="p-3">
                <Badge className={schedule.is_overdue ? 'bg-red-600' : schedule.status === 'approved' ? 'bg-emerald-600' : 'bg-amber-600'}>
                  {schedule.is_overdue ? 'OVERDUE' : schedule.status}
                </Badge>
              </td>
              <td className="p-3 text-slate-600">{schedule.completed_by_name || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SignOffTable({ logs }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b-2">
          <tr>
            <th className="text-left p-3 font-semibold">Date</th>
            <th className="text-left p-3 font-semibold">Type</th>
            <th className="text-left p-3 font-semibold">Task</th>
            <th className="text-left p-3 font-semibold">Completed By</th>
            <th className="text-left p-3 font-semibold">Supervisor</th>
            <th className="text-left p-3 font-semibold">Approved</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border-b bg-emerald-50">
              <td className="p-3">{format(new Date(log.log_date), 'dd/MM/yyyy')}</td>
              <td className="p-3">
                <Badge className={log.task_type === 'daily_cleaning' ? 'bg-blue-600' : 'bg-purple-600'}>
                  {log.task_type === 'daily_cleaning' ? 'Daily' : 'Deep'}
                </Badge>
              </td>
              <td className="p-3 font-medium">{log.task_name}</td>
              <td className="p-3">{log.completed_by_name}</td>
              <td className="p-3 text-emerald-700 font-semibold">{log.supervisor_name}</td>
              <td className="p-3 text-xs text-slate-600">{format(new Date(log.approval_time), 'HH:mm')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HygieneDeclarationTable({ declarations }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b-2">
          <tr>
            <th className="text-left p-3 font-semibold">Date</th>
            <th className="text-left p-3 font-semibold">Staff Name</th>
            <th className="text-left p-3 font-semibold">Status</th>
            <th className="text-left p-3 font-semibold">Time</th>
            <th className="text-left p-3 font-semibold">Manager Approval</th>
          </tr>
        </thead>
        <tbody>
          {declarations.map(decl => (
            <tr key={decl.id} className="border-b">
              <td className="p-3">{format(new Date(decl.declaration_date), 'dd/MM/yyyy')}</td>
              <td className="p-3 font-medium">{decl.staff_name}</td>
              <td className="p-3">
                <Badge className={decl.all_clear ? 'bg-emerald-600' : 'bg-red-600'}>
                  {decl.all_clear ? '✓ Clear' : '⚠ Issues'}
                </Badge>
              </td>
              <td className="p-3 text-xs">{format(new Date(decl.declaration_time), 'HH:mm')}</td>
              <td className="p-3 text-slate-600">{decl.manager_name || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IllnessReportTable({ reports }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b-2">
          <tr>
            <th className="text-left p-3 font-semibold">Report Date</th>
            <th className="text-left p-3 font-semibold">Staff (Privacy Protected)</th>
            <th className="text-left p-3 font-semibold">Symptoms Started</th>
            <th className="text-left p-3 font-semibold">Status</th>
            <th className="text-left p-3 font-semibold">Manager Response</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.id} className="border-b">
              <td className="p-3">{format(new Date(report.report_date), 'dd/MM/yyyy')}</td>
              <td className="p-3 font-medium">Staff Member</td>
              <td className="p-3">{report.date_symptoms_started ? format(new Date(report.date_symptoms_started), 'dd/MM/yyyy') : '-'}</td>
              <td className="p-3">
                <Badge className={report.status === 'cleared' ? 'bg-emerald-600' : 'bg-amber-600'}>
                  {report.status}
                </Badge>
              </td>
              <td className="p-3 text-slate-600">{report.manager_response || 'pending'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}