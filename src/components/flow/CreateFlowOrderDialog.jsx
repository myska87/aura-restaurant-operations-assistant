import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CreateFlowOrderDialog({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState('dine_in');
  const [customerName, setCustomerName] = useState('');
  
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
    enabled: open
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      return base44.entities.FlowOrder.create(orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['flowOrders']);
      onClose();
      // Reset form
      setSelectedMenuItem('');
      setQuantity(1);
      setOrderType('dine_in');
      setCustomerName('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const menuItem = menuItems.find(m => m.id === selectedMenuItem);
    if (!menuItem) return;

    const orderData = {
      flow_id: `FLW-${Date.now()}`,
      menu_item_id: menuItem.id,
      menu_item_name: menuItem.name,
      quantity,
      order_type: orderType,
      customer_name: customerName || undefined,
      current_stage: 'ordered',
      stage_times: {
        ordered_at: new Date().toISOString()
      },
      assigned_staff_id: user?.id,
      assigned_staff_name: user?.full_name || user?.email,
      priority: 'normal'
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Menu Item *</Label>
            <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
              <SelectTrigger>
                <SelectValue placeholder="Select dish..." />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Order Type *</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dine_in">Dine In</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <Label>Customer Name (optional)</Label>
            <Input
              placeholder="John Doe"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedMenuItem || createOrderMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}