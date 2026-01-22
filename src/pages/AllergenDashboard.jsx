import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Download,
  Eye,
  Calendar,
  Printer,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { allergenList } from '@/components/pos/AllergenConfirmation';

export default function AllergenDashboard() {
  const [user, setUser] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const canView = ['manager', 'owner', 'admin'].includes(user?.role);

  const { data: allergenOrders = [], isLoading } = useQuery({
    queryKey: ['allergenOrders'],
    queryFn: () => base44.entities.AllergenOrder.list('-order_date', 500),
    enabled: canView
  });

  if (isLoading) return <LoadingSpinner message="Loading allergen data..." />;

  if (!canView) {
    return (
      <div className="py-12 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold mb-2">Manager Access Only</h2>
        <p className="text-slate-600">Allergen logs are restricted to management.</p>
      </div>
    );
  }

  // Analytics
  const totalOrders = allergenOrders.length;
  const thisMonth = allergenOrders.filter(o => {
    const orderDate = new Date(o.order_date);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });

  const allergenCounts = {};
  allergenOrders.forEach(order => {
    order.customer_allergens?.forEach(allergen => {
      allergenCounts[allergen] = (allergenCounts[allergen] || 0) + 1;
    });
  });

  const topAllergens = Object.entries(allergenCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const complianceRate = allergenOrders.length > 0
    ? Math.round((allergenOrders.filter(o => o.sop_acknowledged).length / allergenOrders.length) * 100)
    : 100;

  const uncertifiedStaff = allergenOrders.filter(o => !o.staff_certified).length;

  const exportToCSV = () => {
    const csv = [
      ['Date', 'Order Number', 'Staff', 'Allergens', 'SOP Acknowledged', 'Certified', 'Items'].join(','),
      ...allergenOrders.map(order => [
        format(new Date(order.order_date), 'yyyy-MM-dd HH:mm'),
        order.order_number,
        order.staff_name,
        order.customer_allergens.join('; '),
        order.sop_acknowledged ? 'Yes' : 'No',
        order.staff_certified ? 'Yes' : 'No',
        order.affected_items?.length || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allergen-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToPDF = async () => {
    const element = document.getElementById('allergen-report');
    if (!element) return;
    
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`allergen-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #allergen-report, #allergen-report * {
            visibility: visible;
          }
          #allergen-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <PageHeader
        title="Allergen Safety Dashboard"
        description="Monitor allergen orders, compliance, and audit trail"
      />

      <div className="flex gap-2 no-print">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
        <Button onClick={exportToPDF} variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
        <Button onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div id="allergen-report">

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-xs text-slate-500">Total Allergen Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{thisMonth.length}</p>
                <p className="text-xs text-slate-500">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{complianceRate}%</p>
                <p className="text-xs text-slate-500">SOP Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={uncertifiedStaff > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                uncertifiedStaff > 0 ? 'bg-red-100' : 'bg-slate-100'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${uncertifiedStaff > 0 ? 'text-red-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{uncertifiedStaff}</p>
                <p className="text-xs text-slate-500">Uncertified Handlers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Allergens */}
      <Card>
        <CardHeader>
          <CardTitle>Most Common Allergens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topAllergens.map(([allergenId, count]) => {
              const allergen = allergenList.find(a => a.id === allergenId);
              const percentage = (count / totalOrders) * 100;
              return (
                <div key={allergenId} className="flex items-center gap-4">
                  <div className="text-3xl">{allergen?.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{allergen?.label || allergenId}</span>
                      <span className="text-sm text-slate-600">{count} orders ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-orange-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Allergen Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allergenOrders.slice(0, 20).map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className={!order.sop_acknowledged ? 'border-red-300 bg-red-50' : ''}>
                  <CardContent className="pt-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">Order #{order.order_number}</p>
                          {!order.staff_certified && (
                            <Badge className="bg-red-600">Staff Not Certified</Badge>
                          )}
                          {!order.sop_acknowledged && (
                            <Badge className="bg-amber-600">Missing SOP Ack</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {order.staff_name} • {format(new Date(order.order_date), 'PPp')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {order.customer_allergens?.map(allergenId => {
                            const allergen = allergenList.find(a => a.id === allergenId);
                            return (
                              <Badge key={allergenId} className={allergen?.color}>
                                {allergen?.icon} {allergen?.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      <Button
                       size="sm"
                       variant="outline"
                       onClick={() => setSelectedLog(order)}
                       className="no-print"
                      >
                       <Eye className="w-4 h-4 mr-1" />
                       View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle>Allergen Order Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-4 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-600 font-semibold">Order Number</p>
                        <p className="font-bold">{selectedLog.order_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-semibold">Date & Time</p>
                        <p className="font-bold">{format(new Date(selectedLog.order_date), 'PPp')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-semibold">Staff Member</p>
                        <p className="font-bold">{selectedLog.staff_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-semibold">Certified</p>
                        <p className="font-bold">{selectedLog.staff_certified ? '✓ Yes' : '✗ No'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <p className="font-semibold text-slate-800 mb-2">Declared Allergens:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLog.customer_allergens?.map(allergenId => {
                      const allergen = allergenList.find(a => a.id === allergenId);
                      return (
                        <Badge key={allergenId} className={`${allergen?.color} text-base px-3 py-1`}>
                          {allergen?.icon} {allergen?.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {selectedLog.affected_items && selectedLog.affected_items.length > 0 && (
                  <div>
                    <p className="font-semibold text-slate-800 mb-2">Order Items:</p>
                    <div className="space-y-2">
                      {selectedLog.affected_items.map((item, idx) => (
                        <Card key={idx} className={item.contains_allergen ? 'border-red-300 bg-red-50' : ''}>
                          <CardContent className="pt-3">
                            <p className="font-semibold">{item.item_name}</p>
                            {item.contains_allergen && (
                              <p className="text-sm text-red-700 mt-1">
                                ⚠️ Contains: {item.allergens_present?.join(', ')}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLog.special_instructions && (
                  <div>
                    <p className="font-semibold text-slate-800 mb-2">Special Instructions:</p>
                    <Card className="bg-slate-50">
                      <CardContent className="pt-3">
                        <p className="text-sm">{selectedLog.special_instructions}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Card className={selectedLog.sop_acknowledged ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}>
                  <CardContent className="pt-3">
                    <p className={`font-semibold ${selectedLog.sop_acknowledged ? 'text-emerald-900' : 'text-red-900'}`}>
                      {selectedLog.sop_acknowledged ? '✓ SOP Acknowledged' : '✗ SOP NOT Acknowledged'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}