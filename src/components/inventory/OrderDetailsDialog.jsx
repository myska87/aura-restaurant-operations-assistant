import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Printer, 
  Mail, 
  FileText, 
  X, 
  CheckCircle, 
  Send,
  Edit,
  Trash2,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function OrderDetailsDialog({ order, open, onClose, onEmailSent }) {
  const [sending, setSending] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState([]);
  const queryClient = useQueryClient();

  // Fetch restaurant/company info for letterhead
  const { data: globalInfo } = useQuery({
    queryKey: ['globalInfo'],
    queryFn: async () => {
      const data = await base44.entities.GlobalInfo.list();
      return data[0] || {};
    },
    enabled: open
  });

  // Initialize edited items when order changes
  React.useEffect(() => {
    if (order?.items) {
      setEditedItems(JSON.parse(JSON.stringify(order.items)));
    }
  }, [order?.id]);

  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      const totalAmount = editedItems.reduce((sum, item) => sum + item.total_cost, 0);
      return base44.entities.Order.update(order.id, {
        items: editedItems,
        total_amount: totalAmount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success('Order updated successfully');
      setEditMode(false);
    },
    onError: () => {
      toast.error('Failed to update order');
    }
  });

  if (!order) return null;

  const currentItems = editMode ? editedItems : order.items;
  const currentTotal = currentItems?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0;

  const handleQuantityChange = (index, newQuantity) => {
    const quantity = parseFloat(newQuantity) || 0;
    const updatedItems = [...editedItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].total_cost = quantity * (updatedItems[index].unit_cost || 0);
    setEditedItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  const handleCancelEdit = () => {
    setEditedItems(JSON.parse(JSON.stringify(order.items)));
    setEditMode(false);
  };

  // Generate HTML content for printing and emailing
  const generateLetterheadHTML = () => {
    const itemsHTML = order.items?.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.ingredient_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity} ${item.unit}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">£${item.unit_cost?.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">£${item.total_cost?.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Purchase Order ${order.order_number}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none !important; }
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              color: #1e293b;
              max-width: 900px;
              margin: 0 auto;
              padding: 40px;
              background: white;
            }
            .letterhead { border: 2px solid #10b981; padding: 30px; }
            .header-section { 
              display: flex; 
              justify-content: space-between; 
              align-items: start;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #10b981;
            }
            .company-info { flex: 1; }
            .company-name { 
              font-size: 28px; 
              font-weight: bold; 
              color: #10b981; 
              margin-bottom: 10px;
            }
            .company-details { 
              font-size: 13px; 
              color: #64748b; 
              line-height: 1.6;
            }
            .logo { 
              width: 80px; 
              height: 80px; 
              object-fit: contain; 
            }
            .po-title { 
              text-align: center; 
              font-size: 32px; 
              font-weight: bold; 
              color: #0f172a; 
              margin: 30px 0 20px 0;
              letter-spacing: 2px;
            }
            .order-info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              gap: 40px;
            }
            .info-box {
              flex: 1;
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #10b981;
            }
            .info-label { 
              font-size: 11px; 
              text-transform: uppercase; 
              color: #64748b; 
              font-weight: 600;
              margin-bottom: 8px;
            }
            .info-value { 
              font-size: 15px; 
              color: #0f172a; 
              font-weight: 500;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 30px 0;
              border: 1px solid #e2e8f0;
            }
            th { 
              background: #10b981; 
              color: white; 
              padding: 14px 12px; 
              text-align: left; 
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
            td { 
              padding: 12px; 
              border-bottom: 1px solid #e2e8f0;
              font-size: 14px;
            }
            tr:hover { background: #f8fafc; }
            .total-row {
              background: #f1f5f9;
              font-weight: bold;
              font-size: 16px;
            }
            .total-row td {
              padding: 16px 12px;
              border-top: 2px solid #10b981;
              border-bottom: none;
            }
            .footer-section {
              margin-top: 50px;
              padding-top: 30px;
              border-top: 2px solid #e2e8f0;
            }
            .thank-you {
              text-align: center;
              color: #64748b;
              font-size: 14px;
              font-style: italic;
              margin-bottom: 30px;
            }
            .signature-line {
              margin-top: 60px;
              padding-top: 10px;
              border-top: 2px solid #0f172a;
              width: 300px;
              text-align: center;
              font-size: 12px;
              color: #64748b;
            }
            .notes-section {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .notes-label {
              font-weight: bold;
              color: #92400e;
              font-size: 11px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .notes-content {
              color: #78350f;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <!-- Company Header -->
            <div class="header-section">
              <div class="company-info">
                <div class="company-name">${globalInfo?.restaurant_name || 'AURA Restaurant'}</div>
                <div class="company-details">
                  ${globalInfo?.address || ''}<br>
                  ${globalInfo?.city || ''} ${globalInfo?.postcode || ''}<br>
                  Phone: ${globalInfo?.phone || 'N/A'}<br>
                  Email: ${globalInfo?.email || 'N/A'}
                </div>
              </div>
              ${globalInfo?.logo_url ? `<img src="${globalInfo.logo_url}" class="logo" alt="Company Logo">` : ''}
            </div>

            <!-- Purchase Order Title -->
            <div class="po-title">PURCHASE ORDER</div>

            <!-- Order & Supplier Info -->
            <div class="order-info-section">
              <div class="info-box">
                <div class="info-label">Order Reference</div>
                <div class="info-value">${order.order_number}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Order Date</div>
                <div class="info-value">${order.order_date || format(new Date(), 'dd MMM yyyy')}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Expected Delivery</div>
                <div class="info-value">${order.expected_delivery || 'TBC'}</div>
              </div>
            </div>

            <div class="info-box" style="margin-bottom: 20px;">
              <div class="info-label">To: Supplier</div>
              <div class="info-value">${order.supplier_name || 'N/A'}</div>
            </div>

            <!-- Order Items Table -->
            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right; padding-right: 20px;">TOTAL ORDER VALUE</td>
                  <td style="text-align: right; color: #10b981;">£${order.total_amount?.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            ${order.notes ? `
              <div class="notes-section">
                <div class="notes-label">Special Instructions</div>
                <div class="notes-content">${order.notes}</div>
              </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer-section">
              <div class="thank-you">
                Thank you for your business. Please confirm receipt and estimated delivery time.
              </div>
              <div class="signature-line">
                Authorized Signature
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Handle Printing (Browsers save to PDF via Print)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateLetterheadHTML());
    printWindow.document.close();
    printWindow.print();
  };

  // Handle Emailing Supplier
  const handleEmail = async () => {
    if (!order.supplier_id) {
      toast.error("No supplier linked to this order.");
      return;
    }

    setSending(true);
    try {
      // 1. Fetch supplier details to get email
      const supplier = await base44.entities.Supplier.get(order.supplier_id);
      
      if (!supplier || !supplier.email) {
        toast.error("Supplier email not found.");
        setSending(false);
        return;
      }

      // 2. Check if supplier email is a registered user
      const allUsers = await base44.entities.User.list();
      const isRegisteredUser = allUsers.some(u => u.email === supplier.email);

      if (!isRegisteredUser) {
        toast.error(
          "Supplier must be a registered app user to receive emails. Please use Print/PDF instead or invite them to the app.",
          { duration: 5000 }
        );
        setSending(false);
        return;
      }

      // 3. Generate professional HTML email body
      const emailBody = generateLetterheadHTML();

      // 4. Send via Base44 Core (only to registered users)
      await base44.integrations.Core.SendEmail({
        to: supplier.email,
        subject: `Purchase Order ${order.order_number} - ${globalInfo?.restaurant_name || 'AURA Restaurant'}`,
        body: emailBody
      });

      toast.success(`Order sent to ${supplier.email}`);
      if (onEmailSent) onEmailSent(order.id);
      
    } catch (error) {
      console.error("Email failed", error);
      toast.error("Failed to send email. Please check internet connection.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Purchase Order Preview
          </DialogTitle>
        </DialogHeader>

        {/* Professional Letterhead Preview */}
        <div className="border-2 border-emerald-500 rounded-lg p-6 bg-white">
          {/* Company Header */}
          <div className="flex justify-between items-start pb-4 mb-6 border-b-2 border-emerald-500">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-emerald-600 mb-2">
                {globalInfo?.restaurant_name || 'AURA Restaurant'}
              </h1>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p>{globalInfo?.address || ''}</p>
                <p>{globalInfo?.city} {globalInfo?.postcode}</p>
                <p>Phone: {globalInfo?.phone || 'N/A'}</p>
                <p>Email: {globalInfo?.email || 'N/A'}</p>
              </div>
            </div>
            {globalInfo?.logo_url && (
              <img 
                src={globalInfo.logo_url} 
                alt="Company Logo" 
                className="w-16 h-16 object-contain"
              />
            )}
          </div>

          {/* Purchase Order Title */}
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-6 tracking-wider">
            PURCHASE ORDER
          </h2>

          {/* Order Info Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-500">
              <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Order Reference</p>
              <p className="font-mono font-bold text-slate-900">{order.order_number}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-500">
              <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Order Date</p>
              <p className="font-semibold text-slate-900">{order.order_date || format(new Date(), 'dd MMM yyyy')}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-500">
              <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Expected Delivery</p>
              <p className="font-semibold text-slate-900">{order.expected_delivery || 'TBC'}</p>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-emerald-500 mb-6">
            <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1">To: Supplier</p>
            <p className="font-bold text-slate-900 text-lg">{order.supplier_name || 'N/A'}</p>
          </div>

          {/* Order Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
            <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white text-xs uppercase font-semibold">Order Items</h3>
              {!editMode && order.status === 'pending' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-emerald-700 h-7"
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit Items
                </Button>
              )}
            </div>
            <table className="w-full">
              <thead className="bg-emerald-100 border-b border-emerald-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs uppercase font-semibold text-emerald-900">Item Description</th>
                  <th className="px-4 py-2 text-center text-xs uppercase font-semibold text-emerald-900">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs uppercase font-semibold text-emerald-900">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs uppercase font-semibold text-emerald-900">Total</th>
                  {editMode && <th className="px-4 py-2 w-12"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentItems?.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.ingredient_name}</td>
                    <td className="px-4 py-3 text-center">
                      {editMode ? (
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(i, e.target.value)}
                            className="w-20 h-8 text-center"
                          />
                          <span className="text-slate-600 text-sm">{item.unit}</span>
                        </div>
                      ) : (
                        `${item.quantity} ${item.unit}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">£{item.unit_cost?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold">£{item.total_cost?.toFixed(2)}</td>
                    {editMode && (
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveItem(i)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold text-lg">
                  <td colSpan={editMode ? 4 : 3} className="px-4 py-4 text-right border-t-2 border-emerald-600">TOTAL ORDER VALUE</td>
                  <td className="px-4 py-4 text-right text-emerald-600 border-t-2 border-emerald-600">
                    £{currentTotal.toFixed(2)}
                  </td>
                  {editMode && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes Section */}
          {order.notes && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-6">
              <p className="text-[10px] font-bold text-amber-900 uppercase mb-1">Special Instructions</p>
              <p className="text-sm text-amber-900">{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-slate-200 pt-6 mt-6">
            <p className="text-center text-slate-600 text-sm italic mb-8">
              Thank you for your business. Please confirm receipt and estimated delivery time.
            </p>
            <div className="w-80 mx-auto border-t-2 border-slate-900 pt-2 text-center">
              <p className="text-xs text-slate-500">Authorized Signature</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4 border-t pt-4">
          {editMode ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button 
                onClick={() => saveChangesMutation.mutate()} 
                disabled={saveChangesMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveChangesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print / PDF
              </Button>
              <Button onClick={handleEmail} disabled={sending} className="bg-emerald-600 hover:bg-emerald-700">
                {sending ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Email Supplier
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}