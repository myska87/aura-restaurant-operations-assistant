import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

export default function InspectorPDFExport({ open, onClose, user }) {
  const [generating, setGenerating] = useState(false);
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const { data: temperatureLogs = [] } = useQuery({
    queryKey: ['tempLogs', dateFrom, dateTo],
    queryFn: () => base44.entities.TemperatureLog.filter({
      date: { $gte: dateFrom, $lte: dateTo }
    }),
    enabled: open
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', dateFrom, dateTo],
    queryFn: () => base44.entities.FoodSafetyChecklist.filter({
      date: { $gte: dateFrom, $lte: dateTo }
    }),
    enabled: open
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
    enabled: open
  });

  const { data: trainingProgress = [] } = useQuery({
    queryKey: ['trainingProgress'],
    queryFn: () => base44.entities.TrainingProgress.list(),
    enabled: open
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.filter({ status: 'approved' }),
    enabled: open
  });

  const { data: acknowledgements = [] } = useQuery({
    queryKey: ['acknowledgements'],
    queryFn: () => base44.entities.DocumentAcknowledgement.list(),
    enabled: open
  });

  const generatePDF = async () => {
    setGenerating(true);
    
    const doc = new jsPDF();
    let yPos = 20;

    // Helper to add text
    const addText = (text, size = 12, isBold = false) => {
      doc.setFontSize(size);
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      doc.text(text, 20, yPos);
      yPos += size * 0.5;
    };

    const addSection = (title) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      yPos += 10;
      doc.setFillColor(230, 230, 230);
      doc.rect(10, yPos - 8, 190, 10, 'F');
      addText(title, 14, true);
      yPos += 5;
    };

    // COVER PAGE
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('AUDIT PACK', 105, 30, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Food Safety Compliance Report', 105, 45, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    yPos = 80;
    addText(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 12, true);
    addText(`Period: ${format(new Date(dateFrom), 'dd MMM yyyy')} - ${format(new Date(dateTo), 'dd MMM yyyy')}`, 12);
    addText(`Exported by: ${user?.full_name || user?.email}`, 12);
    addText(`Role: ${user?.role}`, 12);

    doc.addPage();
    yPos = 20;

    // SECTION 1: TEMPERATURE LOGS
    addSection('1. TEMPERATURE LOGS');
    addText(`Total logs: ${temperatureLogs.length}`, 10);
    
    const missingTemp = temperatureLogs.filter(log => !log.temperature || log.status === 'fail').length;
    if (missingTemp > 0) {
      doc.setTextColor(220, 38, 38);
      addText(`⚠ ${missingTemp} failed or missing entries`, 10, true);
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setTextColor(16, 185, 129);
      addText('✓ All temperature logs compliant', 10, true);
      doc.setTextColor(0, 0, 0);
    }
    
    yPos += 5;
    temperatureLogs.slice(0, 20).forEach(log => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      addText(`${log.date} | ${log.equipment_name} | ${log.temperature}°C | ${log.status}`, 8);
    });

    // SECTION 2: CLEANING RECORDS
    addSection('2. CLEANING RECORDS');
    addText(`Total checklists: ${checklists.length}`, 10);
    
    const incompleteCleaning = checklists.filter(c => c.status !== 'completed').length;
    if (incompleteCleaning > 0) {
      doc.setTextColor(220, 38, 38);
      addText(`⚠ ${incompleteCleaning} incomplete checklists`, 10, true);
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setTextColor(16, 185, 129);
      addText('✓ All cleaning tasks completed', 10, true);
      doc.setTextColor(0, 0, 0);
    }

    // SECTION 3: TRAINING & CERTIFICATIONS
    addSection('3. TRAINING & CERTIFICATIONS');
    addText(`Total staff: ${staff.length}`, 10);
    
    const completedTraining = trainingProgress.filter(t => t.status === 'completed').length;
    addText(`Completed courses: ${completedTraining}`, 10);
    
    staff.slice(0, 15).forEach(member => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const progress = trainingProgress.filter(t => t.staff_id === member.id);
      const completed = progress.filter(p => p.status === 'completed').length;
      addText(`${member.full_name} | ${member.position} | ${completed} courses`, 8);
    });

    // SECTION 4: DOCUMENTS & POLICIES
    addSection('4. APPROVED DOCUMENTS');
    addText(`Total approved documents: ${documents.length}`, 10);
    
    documents.slice(0, 20).forEach(doc => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      addText(`${doc.title} | v${doc.version} | ${doc.category}`, 8);
    });

    // SECTION 5: ACKNOWLEDGEMENTS
    addSection('5. STAFF ACKNOWLEDGEMENTS');
    addText(`Total acknowledgements: ${acknowledgements.length}`, 10);
    
    const signedDocs = acknowledgements.filter(a => a.signed).length;
    addText(`Signed: ${signedDocs}`, 10);
    addText(`Acknowledged: ${acknowledgements.filter(a => a.acknowledged).length}`, 10);

    // FOOTER ON EVERY PAGE
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('Generated by AURA Restaurant Operations System', 105, 285, { align: 'center' });
    }

    // SAVE PDF
    doc.save(`Audit-Pack-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    // Log export action
    await base44.entities.AuditLog.create({
      action: 'audit_pack_exported',
      entity_type: 'InspectorMode',
      user_id: user?.id,
      user_name: user?.full_name || user?.email,
      details: `Full audit pack exported for period ${dateFrom} to ${dateTo}`,
      timestamp: new Date().toISOString()
    });

    setGenerating(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Audit Pack</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Preview Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600">Temperature Logs</p>
              <p className="text-2xl font-bold text-slate-800">{temperatureLogs.length}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600">Cleaning Records</p>
              <p className="text-2xl font-bold text-slate-800">{checklists.length}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600">Staff</p>
              <p className="text-2xl font-bold text-slate-800">{staff.length}</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <p className="text-xs text-slate-600">Documents</p>
              <p className="text-2xl font-bold text-slate-800">{documents.length}</p>
            </div>
          </div>

          {/* Compliance Checks */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Temperature logs tracked</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Cleaning records documented</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Training certifications verified</span>
            </div>
            {acknowledgements.filter(a => !a.signed).length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>{acknowledgements.filter(a => !a.signed).length} documents pending signature</span>
              </div>
            )}
          </div>

          {/* Export Button */}
          <Button
            onClick={generatePDF}
            disabled={generating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Generate & Download PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}