import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function TemperatureReport() {
  const [reportType, setReportType] = useState('weekly');
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef();

  const getDateRange = () => {
    const today = new Date();
    if (reportType === 'weekly') {
      return {
        start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      };
    } else {
      return {
        start: format(startOfMonth(today), 'yyyy-MM-dd'),
        end: format(endOfMonth(today), 'yyyy-MM-dd')
      };
    }
  };

  const dateRange = getDateRange();

  const { data: temperatureLogs = [], isLoading } = useQuery({
    queryKey: ['tempReport', reportType, dateRange.start, dateRange.end],
    queryFn: async () => {
      const logs = await base44.entities.TemperatureLog.list('-created_date', 1000);
      return logs.filter(log => 
        log.log_date >= dateRange.start && log.log_date <= dateRange.end
      );
    },
    enabled: showPreview
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment-report'],
    queryFn: () => base44.entities.Asset.filter({ category: 'refrigeration' }, 'name', 100),
    enabled: showPreview
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    const WinPrint = window.open('', '', 'width=900,height=650');
    WinPrint.document.write(`
      <html>
        <head>
          <title>Temperature Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
            .header h1 { color: #059669; margin: 0; }
            .header p { color: #64748b; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f1f5f9; padding: 12px; text-align: left; border: 1px solid #cbd5e1; font-weight: 600; }
            td { padding: 10px; border: 1px solid #e2e8f0; }
            .critical { background: #fef2f2; color: #991b1b; font-weight: bold; }
            .ok { color: #059669; }
            .shift-section { margin-top: 30px; page-break-inside: avoid; }
            .shift-title { background: #f1f5f9; padding: 10px; font-weight: bold; margin-top: 20px; border-left: 4px solid #059669; }
            .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
      WinPrint.close();
    }, 250);
  };

  const groupByDate = () => {
    const grouped = {};
    temperatureLogs.forEach(log => {
      const date = log.log_date;
      if (!grouped[date]) grouped[date] = { opening: [], mid_shift: [], closing: [] };
      grouped[date][log.check_time]?.push(log);
    });
    return grouped;
  };

  const generateReport = () => {
    setShowPreview(true);
  };

  if (!showPreview) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-4">
          <Calendar className="w-16 h-16 mx-auto text-emerald-600" />
          <h2 className="text-2xl font-bold text-slate-800">Temperature Report</h2>
          <p className="text-slate-600">Generate a printable temperature monitoring report</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Report Period
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">This Week</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Date Range:</strong> {format(new Date(dateRange.start), 'MMM d, yyyy')} - {format(new Date(dateRange.end), 'MMM d, yyyy')}
              </p>
            </div>

            <Button onClick={generateReport} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner message="Generating report..." />;

  const groupedLogs = groupByDate();

  return (
    <div className="space-y-4">
      <div className="flex gap-3 no-print">
        <Button onClick={handlePrint} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
        <Button onClick={() => setShowPreview(false)} variant="outline">
          Back
        </Button>
      </div>

      <div ref={printRef} className="bg-white p-8">
        {/* Header */}
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ width: '120px', height: '120px', background: 'linear-gradient(135deg, #059669 0%, #D4AF37 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>AURA</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0' }}>Food Safety & Compliance</p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0' }}>Temperature Monitoring System</p>
            </div>
          </div>
          <h1>Temperature Monitoring Report</h1>
          <p>Period: {format(new Date(dateRange.start), 'MMMM d, yyyy')} - {format(new Date(dateRange.end), 'MMMM d, yyyy')}</p>
          <p>Generated: {format(new Date(), 'MMMM d, yyyy • h:mm a')}</p>
          <p style={{ marginTop: '10px', color: '#059669', fontWeight: 'bold' }}>
            Total Equipment Monitored: {equipment.length} | Total Logs: {temperatureLogs.length}
          </p>
        </div>

        {/* Equipment Summary */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ borderBottom: '2px solid #059669', paddingBottom: '10px', marginBottom: '15px' }}>
            Equipment Overview
          </h2>
          <table>
            <thead>
              <tr>
                <th>Equipment Name</th>
                <th>Location</th>
                <th>Min Temp</th>
                <th>Max Temp</th>
                <th>Logs Count</th>
                <th>Issues</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map(equip => {
                const equipLogs = temperatureLogs.filter(log => log.equipment_name === equip.name);
                const issues = equipLogs.filter(log => !log.is_in_range).length;
                return (
                  <tr key={equip.id}>
                    <td><strong>{equip.name}</strong></td>
                    <td>{equip.location}</td>
                    <td>{equip.min_temp}°C</td>
                    <td>{equip.max_temp}°C</td>
                    <td>{equipLogs.length}</td>
                    <td className={issues > 0 ? 'critical' : 'ok'}>
                      {issues > 0 ? `${issues} Out of Range` : 'All OK ✓'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Daily Logs */}
        {Object.keys(groupedLogs).sort().reverse().map(date => (
          <div key={date} className="shift-section">
            <h2 style={{ borderBottom: '2px solid #059669', paddingBottom: '10px', marginBottom: '15px' }}>
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </h2>

            {['opening', 'mid_shift', 'closing'].map(shift => {
              const shiftLogs = groupedLogs[date][shift];
              if (shiftLogs.length === 0) return null;

              return (
                <div key={shift}>
                  <div className="shift-title">
                    {shift === 'opening' ? '🌅 Opening Check' : 
                     shift === 'mid_shift' ? '☀️ Mid-Shift Check' : 
                     '🌙 Closing Check'}
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Equipment</th>
                        <th>Location</th>
                        <th>Temperature</th>
                        <th>Range</th>
                        <th>Status</th>
                        <th>Logged By</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftLogs.map(log => (
                        <tr key={log.id} className={!log.is_in_range ? 'critical' : ''}>
                          <td><strong>{log.equipment_name}</strong></td>
                          <td>{log.location}</td>
                          <td className={log.is_in_range ? 'ok' : 'critical'}>
                            <strong>{log.temperature}°C</strong>
                          </td>
                          <td>{log.min_temp}°C to {log.max_temp}°C</td>
                          <td>{log.is_in_range ? '✓ OK' : '⚠️ OUT OF RANGE'}</td>
                          <td>{log.logged_by_name}</td>
                          <td>{format(new Date(log.created_date), 'HH:mm')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        ))}

        {/* Footer */}
        <div className="footer">
          <p>This report is automatically generated and contains all temperature monitoring logs for the specified period.</p>
          <p>Document printed on {format(new Date(), 'MMMM d, yyyy')} at {format(new Date(), 'h:mm a')}</p>
          <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Food Safety Compliance Report</p>
        </div>
      </div>
    </div>
  );
}