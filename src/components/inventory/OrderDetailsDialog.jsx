import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Mail, 
  FileText, 
  X, 
  CheckCircle, 
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function OrderDetailsDialog({ order, open, onClose, onEmailSent }) {
  const [sending, setSending] = useState(false);

  if (!order) return null;

  // Handle Printing (Browsers save to PDF via Print)
  const handlePrint = () => {
    const printContent = document.getElementById('printable-order-content');
    
    // Create a temporary print view
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order ${order.order_number}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .meta { color: #666; font-size: 14px; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8f9fa; padding: 12px; border-bottom: 2px solid #ddd; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 30px; }
            .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">Printed from AURA Operations Assistant on ${new Date().toLocaleDateString()}</div>
        </body>
      </html>
    `);
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

      // 3. Format the email body
      const itemList = order.items.map(i => 
        `- ${i.ingredient_name}: ${i.quantity} ${i.unit}`
      ).join('\n');

      const emailBody = `
Dear ${supplier.contact_person || supplier.name},

Please find attached our order details.

ORDER REFERENCE: ${order.order_number}
DATE: ${order.order_date || format(new Date(), 'yyyy-MM-dd')}

ITEMS REQUIRED:
${itemList}

TOTAL ESTIMATED VALUE: £${order.total_amount?.toFixed(2)}

Please confirm receipt and estimated delivery time.

Thank you,
${order.created_by_name || 'Restaurant Management'}
      `;

      // 4. Send via Base44 Core (only to registered users)
      await base44.integrations.Core.SendEmail({
        to: supplier.email,
        subject: `New Order: ${order.order_number}`,
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Order Details
          </DialogTitle>
        </DialogHeader>

        {/* Printable Area - ID used for extracting content */}
        <div id="printable-order-content" className="p-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{order.supplier_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-500">Ref:</span>
                <Badge variant="outline" className="font-mono text-base">
                  {order.order_number}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <Badge className={
                order.status === 'received' ? 'bg-emerald-100 text-emerald-700' :
                order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-700'
              }>
                {order.status?.toUpperCase()}
              </Badge>
              <p className="text-sm text-slate-500 mt-1">
                {order.order_date}
              </p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Item Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Quantity</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Unit Cost</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.ingredient_name}</td>
                    <td className="px-4 py-3">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-3 text-right">£{item.unit_cost?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold">£{item.total_cost?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6">
            <div className="text-right">
              <p className="text-slate-500 text-sm">Total Order Value</p>
              <p className="text-2xl font-bold text-emerald-600">£{order.total_amount?.toFixed(2)}</p>
            </div>
          </div>

          {order.notes && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Notes</p>
              <p className="text-sm text-yellow-900">{order.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 mt-4 border-t pt-4">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}