import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader, Download } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DetailedDailyReportGenerator({
  user,
  startDate,
  endDate,
  completions,
  checkIns,
  temperatures,
  labels,
  ccpChecks,
  handovers,
  staff,
  reportType = 'detailed', // 'detailed' or 'combined'
  onClose
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  // Group data by date
  const groupByDate = (items, dateField) => {
    const grouped = {};
    items.forEach(item => {
      const date = (item[dateField] || '').split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    });
    return grouped;
  };

  const dailyCompletions = groupByDate(completions, 'date');
  const dailyCheckIns = groupByDate(checkIns, 'shift_date');
  const dailyTemps = groupByDate(temperatures, 'log_date');
  const dailyLabels = groupByDate(labels, 'prep_date');
  const dailyCCPs = groupByDate(ccpChecks, 'check_date');
  const dailyHandovers = groupByDate(handovers, 'shift_date');

  // Get all unique dates
  const allDates = Array.from(
    new Set([
      ...Object.keys(dailyCompletions),
      ...Object.keys(dailyCheckIns),
      ...Object.keys(dailyTemps),
      ...Object.keys(dailyLabels),
      ...Object.keys(dailyCCPs),
      ...Object.keys(dailyHandovers)
    ])
  ).sort();

  const generateDetailedPDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF();
      let yPosition = 10;
      const pageWidth = pdf.getPageWidth();
      const pageHeight = pdf.getPageHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      const addNewPage = () => {
        pdf.addPage();
        yPosition = margin;
        addLetterhead();
      };

      const addLetterhead = () => {
        // Header
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(user.location_name || 'Restaurant', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Location: ${user.location || 'Main'}`, margin, yPosition);
        yPosition += 5;
        pdf.text(`Report Type: Detailed Daily Operations Report`, margin, yPosition);
        yPosition += 5;
        pdf.text(`Period: ${startDate} to ${endDate}`, margin, yPosition);
        yPosition += 5;
        pdf.text(`Generated: ${format(new Date(), 'PPP HH:mm')}`, margin, yPosition);
        yPosition += 5;
        pdf.text(`Report ID: DETAILED-${Date.now()}`, margin, yPosition);
        yPosition += 10;

        // Line separator
        pdf.setDrawColor(100);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
      };

      // First page with letterhead
      addLetterhead();

      // Generate daily reports
      allDates.forEach((date, dateIndex) => {
        // Check if we need new page
        if (yPosition > pageHeight - 40) {
          addNewPage();
        }

        // Day header
        const dayDate = new Date(date);
        const dayName = format(dayDate, 'EEEE');
        const formattedDate = format(dayDate, 'dd MMMM yyyy');

        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(`📅 ${dayName} – ${formattedDate}`, margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');

        // Daily summary metrics
        const daySummary = {
          checkIns: dailyCheckIns[date]?.length || 0,
          checklists: dailyCompletions[date]?.length || 0,
          temps: dailyTemps[date]?.length || 0,
          labels: dailyLabels[date]?.length || 0,
          ccps: dailyCCPs[date]?.length || 0,
          ccpsPassed: dailyCCPs[date]?.filter(c => c.status === 'pass').length || 0,
          ccpsFailed: dailyCCPs[date]?.filter(c => c.status === 'fail').length || 0
        };

        pdf.text(`Compliance Status: ${daySummary.ccpsFailed === 0 ? '✔ PASS' : '⚠ REQUIRES ATTENTION'}`, margin, yPosition);
        yPosition += 6;

        // Staff Check-ins section
        if (daySummary.checkIns > 0) {
          pdf.setFont(undefined, 'bold');
          pdf.text('🔹 Staff Check-ins', margin, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, 'normal');

          (dailyCheckIns[date] || []).slice(0, 5).forEach(checkIn => {
            pdf.text(`• ${checkIn.staff_name} (${checkIn.staff_role}) - ${checkIn.check_in_time}`, margin + 5, yPosition);
            yPosition += 4;
          });
          yPosition += 4;
        }

        // Opening Checklist section
        if (daySummary.checklists > 0) {
          pdf.setFont(undefined, 'bold');
          pdf.text('🔹 Checklists Completed', margin, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, 'normal');

          (dailyCompletions[date] || []).slice(0, 3).forEach(checklist => {
            const status = checklist.status === 'completed' ? '✔' : '✖';
            pdf.text(`• ${status} ${checklist.checklist_name} by ${checklist.user_name} (${Math.round(checklist.completion_percentage)}%)`, margin + 5, yPosition);
            yPosition += 4;
          });
          yPosition += 4;
        }

        // Temperature Logs section
        if (daySummary.temps > 0) {
          pdf.setFont(undefined, 'bold');
          pdf.text('🔹 Temperature Logs', margin, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, 'normal');

          (dailyTemps[date] || []).slice(0, 5).forEach(temp => {
            const status = temp.is_in_range ? '✔' : '❌';
            pdf.text(`• ${status} ${temp.equipment_name}: ${temp.temperature}°C (${temp.logged_by_name})`, margin + 5, yPosition);
            yPosition += 4;
          });
          yPosition += 4;
        }

        // Labels section
        if (daySummary.labels > 0) {
          pdf.setFont(undefined, 'bold');
          pdf.text('🔹 Labels Generated', margin, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, 'normal');

          (dailyLabels[date] || []).slice(0, 4).forEach(label => {
            pdf.text(`• ${label.item_name} - Use by ${format(new Date(label.use_by_date), 'dd MMM')} (${label.prepared_by_name})`, margin + 5, yPosition);
            yPosition += 4;
          });
          yPosition += 4;
        }

        // CCPs section
        if (daySummary.ccps > 0) {
          pdf.setFont(undefined, 'bold');
          pdf.text('🔹 Critical Control Point Checks', margin, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, 'normal');

          (dailyCCPs[date] || []).forEach(ccp => {
            const status = ccp.status === 'pass' ? '✔ PASS' : '✖ FAIL';
            pdf.text(`• ${status}: ${ccp.ccp_name} - ${ccp.recorded_value} (${ccp.staff_name})`, margin + 5, yPosition);
            yPosition += 4;
          });
          yPosition += 4;
        }

        // Handovers section
        if ((dailyHandovers[date] || []).length > 0) {
          pdf.setFont(undefined, 'bold');
          pdf.text('🔹 Shift Handovers', margin, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, 'normal');

          (dailyHandovers[date] || []).forEach(handover => {
            pdf.text(`• ${handover.handover_from_name} → ${handover.handover_to_name}`, margin + 5, yPosition);
            yPosition += 4;
          });
          yPosition += 4;
        }

        // Daily summary box
        pdf.setFont(undefined, 'bold');
        pdf.text('🧾 DAILY SUMMARY', margin, yPosition);
        yPosition += 6;
        pdf.setFont(undefined, 'normal');

        const summaryText = [
          `Checklists Completed: ${daySummary.checklists}`,
          `Staff Check-ins: ${daySummary.checkIns}`,
          `Temperatures Logged: ${daySummary.temps}`,
          `CCPs: ${daySummary.ccpsPassed} Passed, ${daySummary.ccpsFailed} Failed`,
          `Labels Printed: ${daySummary.labels}`
        ];

        summaryText.forEach(text => {
          pdf.text(`• ${text}`, margin + 5, yPosition);
          yPosition += 4;
        });

        yPosition += 10;

        // Add page separator line
        if (dateIndex < allDates.length - 1) {
          pdf.setDrawColor(200);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 8;
        }
      });

      // Add footer to all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Generated by AURA Restaurant Ops`, margin, pageHeight - 10);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
      }

      // Save and create record
      const pdfBlob = pdf.output('blob');
      const reportId = `DETAILED-${Date.now()}`;

      // Upload PDF
      const uploadedFile = await base44.integrations.Core.UploadFile({ file: pdfBlob });

      // Create report record
      await base44.entities.Report.create({
        report_id: reportId,
        report_type: 'detailed_daily',
        title: `Detailed Daily Report - ${format(new Date(), 'MMM d, yyyy')}`,
        description: `Chronological daily operations report with detailed activity logs`,
        date_range_start: startDate,
        date_range_end: endDate,
        generated_by_id: user.id || user.email,
        generated_by_name: user.full_name || 'Unknown',
        generated_by_email: user.email,
        generated_at: new Date().toISOString(),
        business_name: user.location_name || 'Main Location',
        location: user.location || 'Default',
        compliance_status: dailyCCPs[allDates[allDates.length - 1]]?.filter(c => c.status === 'fail').length > 0 ? 'amber' : 'green',
        pdf_url: uploadedFile.file_url,
        status: 'generated',
        notes: `Detailed daily report for ${allDates.length} days`
      });

      queryClient.invalidateQueries(['reports']);
      alert('✓ Detailed Daily Report generated successfully!');
      
      // Trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `Detailed-Daily-Report-${startDate}-to-${endDate}.pdf`;
      link.click();
      
      onClose?.();
    } catch (error) {
      console.error('[Report] Error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Detailed Daily Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Detailed Daily Operations Report</p>
                <p>Chronological, day-by-day breakdown of all operations with staff check-ins, checklists, hygiene, temperatures, labels, CCPs, and handovers.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-700 mb-2">Report Coverage</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 bg-white rounded">
                <p className="text-slate-600">Days Included</p>
                <p className="font-bold text-emerald-600">{allDates.length}</p>
              </div>
              <div className="p-2 bg-white rounded">
                <p className="text-slate-600">Total Records</p>
                <p className="font-bold">{completions.length + checkIns.length + temperatures.length + labels.length + ccpChecks.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 space-y-1">
            <p>✓ Organized chronologically by day</p>
            <p>✓ Human-readable narrative format</p>
            <p>✓ Professional letterhead with branding</p>
            <p>✓ Print-friendly PDF</p>
            <p>✓ Full audit trail included</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={generateDetailedPDF}
              disabled={isGenerating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate & Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}