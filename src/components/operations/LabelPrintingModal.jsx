import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Printer, Plus, Copy, AlertTriangle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addDays, addHours } from 'date-fns';
import LabelPreview from './LabelPreview';
import ManageLabelItems from './ManageLabelItems';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function LabelPrintingModal({ open, onClose, user, today }) {
  const [formData, setFormData] = useState({
    dishName: '',
    preparedBy: user?.full_name || user?.email || '',
    shelfLife: '2 days',
    batchCode: '',
    quantity: 1
  });

  const [showManageItems, setShowManageItems] = useState(false);
  const [labelItems, setLabelItems] = useState([]);
  const [printHistory, setPrintHistory] = useState([]);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list('-created_date', 100),
    enabled: !!user
  });

  const { data: globalInfo = {} } = useQuery({
    queryKey: ['globalInfo'],
    queryFn: async () => {
      const items = await base44.entities.GlobalInfo.list(null, 1);
      return items[0] || {};
    },
    enabled: !!user
  });

  useEffect(() => {
    if (menuItems.length > 0) {
      setLabelItems(menuItems.map(item => ({ name: item.name, suggested_shelf_life: '2 days' })));
    }
  }, [menuItems]);

  const calculateExpiry = () => {
    if (!formData.shelfLife) return null;
    const [value, unit] = formData.shelfLife.split(' ');
    const printedDate = new Date();
    if (unit === 'hours') {
      return addHours(printedDate, parseInt(value));
    } else {
      return addDays(printedDate, parseInt(value));
    }
  };

  const expiryDate = calculateExpiry();

  const handlePrint = async () => {
    if (!formData.dishName || !formData.preparedBy) {
      alert('Please fill in dish name and prepared by');
      return;
    }

    try {
      // Log the print event
      const logData = {
        dish_name: formData.dishName,
        prepared_by: formData.preparedBy,
        prepared_by_email: user?.email,
        date_printed: new Date().toISOString(),
        expiry_date: expiryDate?.toISOString(),
        shelf_life: formData.shelfLife,
        batch_code: formData.batchCode,
        quantity: formData.quantity || 1,
        label_count: formData.quantity || 1
      };

      await base44.entities.FoodLabel.create(logData);

      // Notify manager if near expiry (within 6 hours)
      const now = new Date();
      const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      if (expiryDate && expiryDate < sixHoursFromNow) {
        const managers = await base44.entities.Staff.filter({ role: 'manager', status: 'active' });
        managers.forEach(manager => {
          base44.entities.Notification.create({
            recipient_email: manager.email,
            recipient_name: manager.full_name,
            title: '⏰ Label Expiry Alert',
            message: `${formData.dishName} expires at ${format(expiryDate, 'HH:mm')} - printed by ${formData.preparedBy}`,
            type: 'alert',
            priority: expiryDate < now ? 'critical' : 'high',
            is_read: false
          }).catch(() => {});
        });
      }

      // Open print dialog
      window.print();

      // Reset form
      setFormData({
        dishName: '',
        preparedBy: user?.full_name || user?.email || '',
        shelfLife: '2 days',
        batchCode: '',
        quantity: 1
      });

      alert('✓ Label printed and logged successfully');
    } catch (error) {
      console.error('Error printing label:', error);
      alert('Error saving label. Please try again.');
    }
  };

  const handleDuplicate = () => {
    setFormData({ ...formData, batchCode: formData.batchCode + '-COPY' });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="text-2xl">🏷️ Print Labels</DialogTitle>
              <Button
                onClick={() => setShowManageItems(true)}
                variant="outline"
                size="sm"
                className="text-slate-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Items
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-5">
              {/* Dish Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">🍽️ Dish Name</label>
                <Select value={formData.dishName} onValueChange={(value) => setFormData({ ...formData, dishName: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select or search dish..." />
                  </SelectTrigger>
                  <SelectContent>
                    {labelItems.map((item, idx) => (
                      <SelectItem key={idx} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prepared By */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">👤 Prepared By</label>
                <Input
                  value={formData.preparedBy}
                  onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                  placeholder="Your name"
                  disabled
                  className="bg-slate-50"
                />
              </div>

              {/* Shelf Life */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">⏰ Shelf Life</label>
                <Select value={formData.shelfLife} onValueChange={(value) => setFormData({ ...formData, shelfLife: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2 hours">2 hours</SelectItem>
                    <SelectItem value="4 hours">4 hours</SelectItem>
                    <SelectItem value="8 hours">8 hours</SelectItem>
                    <SelectItem value="1 day">1 day</SelectItem>
                    <SelectItem value="2 days">2 days</SelectItem>
                    <SelectItem value="3 days">3 days</SelectItem>
                    <SelectItem value="7 days">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expiry Date (Auto-calculated) */}
              {expiryDate && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-amber-50 border-2 border-amber-300 rounded-lg">
                  <p className="text-sm font-semibold text-amber-900">
                    ⏰ Expires: {format(expiryDate, 'dd MMM yyyy HH:mm')}
                  </p>
                </motion.div>
              )}

              {/* Batch Code / Notes */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">📝 Batch Code (Optional)</label>
                <Input
                  value={formData.batchCode}
                  onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })}
                  placeholder="e.g., BATCH-001"
                  className="text-sm"
                />
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">📦 Quantity / Portion Count</label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  placeholder="1"
                  min="1"
                  className="text-sm"
                />
              </div>

              {/* Label Preview */}
              <LabelPreview formData={formData} logo={globalInfo?.logo_url} />

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handlePrint}
                  disabled={!formData.dishName}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Label
                </Button>
                <Button
                  onClick={handleDuplicate}
                  variant="outline"
                  disabled={!formData.dishName}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t pt-4 flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Items Modal */}
      <ManageLabelItems
        open={showManageItems}
        onClose={() => setShowManageItems(false)}
        items={labelItems}
        onItemsUpdate={setLabelItems}
      />
    </>
  );
}