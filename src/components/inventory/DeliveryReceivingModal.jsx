import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  Thermometer, 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Upload,
  X,
  TruckIcon,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Temperature validation rules
const TEMP_RANGES = {
  frozen: { min: -Infinity, max: -15, label: '< -15°C' },
  chilled: { min: 0, max: 5, label: '0-5°C' },
  ambient: { min: null, max: null, label: 'N/A' }
};

const getTempStatus = (temp, category) => {
  if (category === 'ambient' || !temp) return 'not_applicable';
  
  const range = TEMP_RANGES[category];
  if (!range) return 'not_applicable';
  
  if (temp <= range.max && (range.min === -Infinity || temp >= range.min)) {
    return 'compliant';
  } else if (Math.abs(temp - range.max) <= 2) {
    return 'borderline';
  } else {
    return 'out_of_range';
  }
};

export default function DeliveryReceivingModal({ order, open, onClose }) {
  const queryClient = useQueryClient();
  const [receivedItems, setReceivedItems] = useState([]);
  const [temperatures, setTemperatures] = useState({});
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [manualTempItems, setManualTempItems] = useState({});

  // Fetch ingredients for temperature categories
  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients-master-all'],
    queryFn: () => base44.entities.Ingredient_Master_v1.list(),
    enabled: open
  });

  // Initialize received items with expected quantities
  useEffect(() => {
    if (order?.items && open) {
      setReceivedItems(order.items.map(item => ({
        ...item,
        received_quantity: item.quantity,
        status: 'accepted',
        temperature_category: 'ambient'
      })));
      
      // Map temperature categories from ingredients
      const tempMap = {};
      order.items.forEach(item => {
        const ing = ingredients.find(i => i.id === item.ingredient_id);
        if (ing?.storage_location === 'freezer') {
          tempMap[item.ingredient_id] = { category: 'frozen', temp: -18 };
        } else if (ing?.storage_location === 'fridge') {
          tempMap[item.ingredient_id] = { category: 'chilled', temp: 4 };
        } else {
          tempMap[item.ingredient_id] = { category: 'ambient', temp: null };
        }
      });
      setTemperatures(tempMap);
    }
  }, [order, ingredients, open]);

  const updateReceivedQuantity = (index, value) => {
    const updated = [...receivedItems];
    updated[index].received_quantity = parseFloat(value) || 0;
    setReceivedItems(updated);
  };

  const updateTemperature = (ingredientId, temp) => {
    setTemperatures(prev => ({
      ...prev,
      [ingredientId]: {
        ...prev[ingredientId],
        temp: parseFloat(temp) || 0
      }
    }));
  };

  const toggleManualTemp = (ingredientId, itemName) => {
    if (manualTempItems[ingredientId]) {
      // Remove manual temp tracking
      const { [ingredientId]: removed, ...rest } = manualTempItems;
      setManualTempItems(rest);
      setTemperatures(prev => {
        const { [ingredientId]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      // Add manual temp tracking
      setManualTempItems(prev => ({ ...prev, [ingredientId]: true }));
      setTemperatures(prev => ({
        ...prev,
        [ingredientId]: { category: 'chilled', temp: null }
      }));
    }
  };

  const uploadPhotosMutation = useMutation({
    mutationFn: async (files) => {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      return results.map(r => r.file_url);
    }
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    try {
      const urls = await uploadPhotosMutation.mutateAsync(files);
      setPhotos(prev => [...prev, ...urls]);
      toast.success(`${files.length} photo(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload photos');
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const acceptDeliveryMutation = useMutation({
    mutationFn: async (user) => {
      // 1. Update Order status
      await base44.entities.Order.update(order.id, {
        status: 'received',
        actual_delivery: format(new Date(), 'yyyy-MM-dd'),
        delivery_photos: photos,
        delivery_notes: notes,
        received_by: user.email,
        received_date: new Date().toISOString()
      });

      // 2. Update Inventory & Create Transactions
      const transactionPromises = receivedItems.map(async (item) => {
        const ingredient = ingredients.find(i => i.id === item.ingredient_id);
        if (!ingredient) return;

        const stockBefore = ingredient.current_stock || 0;
        const quantityChange = item.received_quantity;
        const stockAfter = stockBefore + quantityChange;

        // Update inventory
        await base44.entities.Ingredient_Master_v1.update(ingredient.id, {
          current_stock: stockAfter,
          last_ordered: format(new Date(), 'yyyy-MM-dd')
        });

        // Create transaction record
        const tempData = temperatures[item.ingredient_id];
        const tempStatus = getTempStatus(tempData?.temp, tempData?.category);

        await base44.entities.InventoryTransaction.create({
          transaction_type: 'delivery',
          ingredient_id: item.ingredient_id,
          ingredient_name: item.ingredient_name,
          quantity_change: quantityChange,
          unit: item.unit,
          stock_before: stockBefore,
          stock_after: stockAfter,
          executed_by: user.email,
          executed_by_name: user.full_name || user.email,
          order_id: order.id,
          supplier_id: order.supplier_id,
          supplier_name: order.supplier_name,
          delivery_date: format(new Date(), 'yyyy-MM-dd'),
          temperature_logged: tempData?.temp || null,
          temperature_status: tempStatus,
          photos: photos,
          notes: notes,
          transaction_date: new Date().toISOString()
        });
      });

      await Promise.all(transactionPromises);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['ingredients-master-all']);
      queryClient.invalidateQueries(['inventory-transactions']);
      toast.success('Delivery accepted & inventory updated');
      onClose();
    },
    onError: (error) => {
      console.error('Delivery acceptance error:', error);
      toast.error('Failed to accept delivery');
    }
  });

  const rejectDeliveryMutation = useMutation({
    mutationFn: async (user) => {
      await base44.entities.Order.update(order.id, {
        status: 'rejected',
        rejection_reason: rejectionReason,
        delivery_photos: photos,
        delivery_notes: notes,
        rejected_by: user.email,
        rejected_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success('Delivery rejected');
      onClose();
    },
    onError: () => {
      toast.error('Failed to reject delivery');
    }
  });

  const handleAccept = async () => {
    // Strict Validation: Proof of Delivery
    if (photos.length === 0) {
      toast.error('⚠️ BLOCKED: At least 1 photo is required as Proof of Delivery', { duration: 4000 });
      return;
    }

    // Strict Validation: Temperature checks for cold items
    const coldItems = Object.entries(temperatures).filter(([id, data]) => data.category !== 'ambient');
    const missingTemps = coldItems.filter(([id, data]) => !data.temp && data.temp !== 0);
    
    if (missingTemps.length > 0) {
      const itemNames = missingTemps.map(([id]) => {
        const item = receivedItems.find(i => i.ingredient_id === id);
        return item?.ingredient_name;
      }).join(', ');
      toast.error(`⚠️ BLOCKED: Temperature required for: ${itemNames}`, { duration: 5000 });
      return;
    }

    // Strict Validation: Out of range temps must have explanation
    const outOfRangeItems = Object.entries(temperatures).filter(([id, data]) => {
      const status = getTempStatus(data.temp, data.category);
      return status === 'out_of_range';
    });

    if (outOfRangeItems.length > 0 && !notes.trim()) {
      const itemNames = outOfRangeItems.map(([id]) => {
        const item = receivedItems.find(i => i.ingredient_id === id);
        return item?.ingredient_name;
      }).join(', ');
      toast.error(`⚠️ BLOCKED: Temperature out of safe range for ${itemNames}. You MUST add notes explaining why before proceeding.`, { duration: 6000 });
      return;
    }

    try {
      const user = await base44.auth.me();
      acceptDeliveryMutation.mutate(user);
    } catch (e) {
      toast.error('User not authenticated');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    if (photos.length === 0) {
      toast.error('Please upload photos of the issues');
      return;
    }

    try {
      const user = await base44.auth.me();
      rejectDeliveryMutation.mutate(user);
    } catch (e) {
      toast.error('User not authenticated');
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            Receive Delivery - {order.supplier_name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(95vh-200px)] pr-4">
          <div className="space-y-6">
            {/* Order Info */}
            <Card className="bg-slate-50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Order ID</p>
                    <p className="font-semibold">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Expected Date</p>
                    <p className="font-semibold">{order.expected_delivery}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Received Date</p>
                    <p className="font-semibold">{format(new Date(), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Items</p>
                    <p className="font-semibold">{order.items?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Item Confirmation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-lg">Item Confirmation</h3>
                </div>
                <div className="space-y-3">
                  {receivedItems.map((item, index) => {
                    const isDifferent = item.received_quantity !== item.quantity;
                    return (
                      <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-lg">
                        <div className="col-span-5">
                          <p className="font-semibold text-slate-800">{item.ingredient_name}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <p className="text-xs text-slate-500">Expected</p>
                          <p className="font-semibold">{item.quantity} {item.unit}</p>
                        </div>
                        <div className="col-span-3">
                          <p className="text-xs text-slate-500 mb-1">Received</p>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.received_quantity}
                            onChange={(e) => updateReceivedQuantity(index, e.target.value)}
                            className={isDifferent ? 'border-amber-400' : ''}
                          />
                        </div>
                        <div className="col-span-2 text-center">
                          {isDifferent ? (
                            <Badge className="bg-amber-100 text-amber-700">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Different
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Match
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Temperature Checks */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Thermometer className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg">Temperature Checks</h3>
                  <Badge variant="outline" className="ml-2">Required for Cold Items</Badge>
                </div>
                <div className="space-y-3">
                  {receivedItems.map((item) => {
                    const tempData = temperatures[item.ingredient_id];
                    const isTracked = tempData && tempData.category !== 'ambient';
                    
                    if (!isTracked) {
                      // Show option to manually add temp tracking
                      return (
                        <div key={item.ingredient_id} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-lg">
                          <div className="col-span-8">
                            <p className="font-medium text-slate-600">{item.ingredient_name}</p>
                          </div>
                          <div className="col-span-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleManualTemp(item.ingredient_id, item.ingredient_name)}
                            >
                              <Thermometer className="w-3 h-3 mr-1" />
                              Add Temperature
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    
                    const status = getTempStatus(tempData.temp, tempData.category);
                    const range = TEMP_RANGES[tempData.category];
                    const isManual = manualTempItems[item.ingredient_id];
                    
                    return (
                      <div key={item.ingredient_id} className="grid grid-cols-12 gap-3 items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="col-span-4">
                          <p className="font-semibold text-slate-800">{item.ingredient_name}</p>
                          {isManual && <Badge variant="outline" className="text-xs mt-1">Manual</Badge>}
                        </div>
                        <div className="col-span-2 text-center">
                          <select
                            value={tempData.category}
                            onChange={(e) => setTemperatures(prev => ({
                              ...prev,
                              [item.ingredient_id]: { ...prev[item.ingredient_id], category: e.target.value }
                            }))}
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="frozen">Frozen</option>
                            <option value="chilled">Chilled</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={tempData.temp || ''}
                            onChange={(e) => updateTemperature(item.ingredient_id, e.target.value)}
                            placeholder="Enter temp"
                            className="text-center"
                          />
                        </div>
                        <div className="col-span-2 text-center text-sm text-slate-600">
                          {range.label}
                        </div>
                        <div className="col-span-1 text-center">
                          {isManual && (
                            <button
                              onClick={() => toggleManualTemp(item.ingredient_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {!isManual && status === 'compliant' && <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />}
                          {!isManual && status === 'borderline' && <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto" />}
                          {!isManual && status === 'out_of_range' && <XCircle className="w-5 h-5 text-red-600 mx-auto" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Photo Evidence */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-lg">Photo Evidence</h3>
                  <Badge className="bg-purple-100 text-purple-700 ml-2">Required</Badge>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800 mb-2">
                      📷 Please upload photos of:
                    </p>
                    <ul className="text-xs text-purple-700 space-y-1 ml-4">
                      <li>• Delivery boxes/packaging</li>
                      <li>• Product labels and best-before dates</li>
                      <li>• Thermometer readings</li>
                      <li>• Any damage or issues</li>
                    </ul>
                  </div>

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById('photo-upload').click()}
                        disabled={uploadPhotosMutation.isPending}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadPhotosMutation.isPending ? 'Uploading...' : 'Upload Photos'}
                      </Button>
                    </label>
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {photos.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Delivery photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes & Issues */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-lg">Notes & Issues</h3>
                </div>
                {isRejecting && (
                  <div className="mb-4">
                    <Label className="text-red-600 mb-2">Rejection Reason (Required)</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Why are you rejecting this delivery?"
                      rows={3}
                      className="border-red-300"
                    />
                  </div>
                )}
                <div>
                  <Label className="mb-2">Any issues, damage, or concerns?</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes here..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-3">
          {!isRejecting ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsRejecting(true)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Delivery
              </Button>
              <Button
                onClick={handleAccept}
                disabled={acceptDeliveryMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {acceptDeliveryMutation.isPending ? 'Processing...' : 'Accept Delivery'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejecting(false);
                  setRejectionReason('');
                }}
              >
                Cancel Rejection
              </Button>
              <Button
                onClick={handleReject}
                disabled={rejectDeliveryMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="w-5 h-5 mr-2" />
                {rejectDeliveryMutation.isPending ? 'Processing...' : 'Confirm Rejection'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}