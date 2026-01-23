import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, ThermometerSun, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

export default function InspectorTemperatureLogs({ onBack, dateRange }) {
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

  const { data: logs = [] } = useQuery({
    queryKey: ['tempLogs', dateRange],
    queryFn: () => base44.entities.TemperatureLog.filter(getDateFilter(), '-date')
  });

  const passedLogs = logs.filter(l => l.status === 'pass').length;
  const failedLogs = logs.filter(l => l.status === 'fail').length;

  const exportPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Temperature Logs Report', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, yPos);
    yPos += 6;
    doc.text(`Total logs: ${logs.length} | Passed: ${passedLogs} | Failed: ${failedLogs}`, 20, yPos);
    yPos += 12;

    doc.setFontSize(8);
    logs.forEach(log => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      const status = log.status === 'pass' ? '✓' : '✗';
      doc.text(`${log.date} | ${log.equipment_name} | ${log.temperature}°C | ${status} ${log.status}`, 20, yPos);
      yPos += 5;
    });

    doc.save(`Temperature-Logs-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ThermometerSun className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Temperature Logs</h1>
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
              <p className="text-3xl font-bold text-slate-800">{logs.length}</p>
              <p className="text-sm text-slate-600">Total Logs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-emerald-600">{passedLogs}</p>
              <p className="text-sm text-slate-600">Passed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-red-600">{failedLogs}</p>
              <p className="text-sm text-slate-600">Failed</p>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Temperature Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2">
                  <tr>
                    <th className="text-left p-3 font-semibold">Date/Time</th>
                    <th className="text-left p-3 font-semibold">Unit/Probe</th>
                    <th className="text-left p-3 font-semibold">Reading</th>
                    <th className="text-left p-3 font-semibold">Target Range</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Logged By</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className={`border-b ${log.status === 'fail' ? 'bg-red-50' : ''}`}>
                      <td className="p-3">{format(new Date(log.date), 'dd/MM/yyyy HH:mm')}</td>
                      <td className="p-3">{log.equipment_name}</td>
                      <td className="p-3 font-semibold">{log.temperature}°C</td>
                      <td className="p-3 text-slate-600">{log.target_min}°C - {log.target_max}°C</td>
                      <td className="p-3">
                        <Badge className={log.status === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600">{log.logged_by}</td>
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