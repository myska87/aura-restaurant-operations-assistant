import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Droplet } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';

export default function ChemicalStockAlerts({ chemicals = [] }) {
  const expiringSoon = chemicals.filter(c => {
    if (!c.expiry_date) return false;
    const daysLeft = differenceInDays(parseISO(c.expiry_date), new Date());
    return daysLeft >= 0 && daysLeft <= 30;
  });

  const lowStock = chemicals.filter(c => c.current_quantity <= (c.minimum_stock || 1) && c.current_quantity > 0);
  const outOfStock = chemicals.filter(c => c.current_quantity === 0);
  const missingSDS = chemicals.filter(c => !c.sds_file_url);

  const handleNotifySupplier = (chemical) => {
    console.log('Notify supplier for:', chemical.product_name);
    // TODO: Create purchase order or email notification
  };

  return (
    <div className="space-y-4">
      {/* Out of Stock */}
      {outOfStock.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-red-50 border-red-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-red-700">Out of Stock ({outOfStock.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {outOfStock.map(chemical => (
                <div key={chemical.id} className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
                  <div>
                    <p className="font-semibold text-red-900">{chemical.product_name}</p>
                    <p className="text-xs text-red-700">{chemical.supplier || 'No supplier'}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleNotifySupplier(chemical)}>
                    Reorder
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Expiring Soon */}
      {expiringSoon.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-amber-50 border-amber-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-amber-700">Expiring Soon ({expiringSoon.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {expiringSoon.map(chemical => {
                const daysLeft = differenceInDays(parseISO(chemical.expiry_date), new Date());
                return (
                  <div key={chemical.id} className="flex items-center justify-between p-3 bg-white rounded border border-amber-200">
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900">{chemical.product_name}</p>
                      <p className="text-xs text-amber-700">
                        Expires {format(parseISO(chemical.expiry_date), 'MMM d')} ({daysLeft} days)
                      </p>
                    </div>
                    <Badge className="bg-amber-600">Action needed</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-orange-50 border-orange-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-orange-700">Low Stock ({lowStock.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {lowStock.map(chemical => (
                <div key={chemical.id} className="flex items-center justify-between p-3 bg-white rounded border border-orange-200">
                  <div>
                    <p className="font-semibold text-orange-900">{chemical.product_name}</p>
                    <p className="text-xs text-orange-700">
                      {chemical.current_quantity} {chemical.unit} (Min: {chemical.minimum_stock || 1})
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleNotifySupplier(chemical)}>
                    Reorder
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Missing SDS */}
      {missingSDS.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-blue-50 border-blue-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700">Missing Safety Data Sheets ({missingSDS.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {missingSDS.map(chemical => (
                <div key={chemical.id} className="flex items-center justify-between p-3 bg-white rounded border border-blue-200">
                  <p className="font-semibold text-blue-900">{chemical.product_name}</p>
                  <Button size="sm" variant="outline">Upload SDS</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {outOfStock.length === 0 && expiringSoon.length === 0 && lowStock.length === 0 && missingSDS.length === 0 && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6 text-center py-8">
            <p className="text-emerald-700 font-semibold">✓ All stock levels healthy</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}