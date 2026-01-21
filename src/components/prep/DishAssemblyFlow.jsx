import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, ArrowRight, Package, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DishAssemblyFlow({ prepComponents, menuItems, user }) {
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [assemblySteps, setAssemblySteps] = useState([]);

  const handleMenuItemSelect = (menuItemId) => {
    setSelectedMenuItem(menuItemId);
    const menuItem = menuItems.find(m => m.id === menuItemId);
    
    // Match prep components to menu item based on category/name
    const relevantPrep = prepComponents.filter(prep => {
      const menuName = menuItem?.data?.name?.toLowerCase() || '';
      const prepName = prep.data?.prep_name?.toLowerCase() || '';
      return menuName.includes(prepName.split(' ')[0]) || 
             prepName.includes(menuName.split(' ')[0]);
    });

    setAssemblySteps(relevantPrep);
  };

  const selectedItem = menuItems.find(m => m.id === selectedMenuItem);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">🧩 Flow 2: Dish Assembly</h2>
        <p className="text-sm text-slate-500">Assemble menu items using prepared components</p>
      </div>

      {/* Menu Item Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Dish to Assemble</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedMenuItem} onValueChange={handleMenuItemSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a menu item..." />
            </SelectTrigger>
            <SelectContent>
              {menuItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.data?.name} - {item.data?.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Assembly Steps */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Assembly for: {selectedItem.data?.name}</span>
                {selectedItem.data?.photo_url && (
                  <img 
                    src={selectedItem.data.photo_url} 
                    alt={selectedItem.data.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Required Prep Components:</h4>
                
                {assemblySteps.length > 0 ? (
                  <div className="space-y-3">
                    {assemblySteps.map((prep, idx) => (
                      <motion.div
                        key={prep.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-semibold text-emerald-700">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{prep.data?.prep_name}</p>
                          <p className="text-sm text-slate-500">
                            {prep.data?.batch_size} {prep.data?.batch_unit} • {prep.data?.station}
                          </p>
                        </div>
                        <Badge className={
                          prep.data?.status === 'prepared' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }>
                          {prep.data?.status === 'prepared' ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Ready</>
                          ) : (
                            <><AlertCircle className="w-3 h-3 mr-1" /> Not Ready</>
                          )}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-slate-50">
                    <CardContent className="pt-6">
                      <div className="text-center text-slate-500">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No prep components matched to this dish yet</p>
                        <p className="text-xs mt-1">Add prep items that match this dish name/category</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assembly Instructions */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Assembly Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Ensure all prep components are ready and at correct temperature</li>
                    <li>Follow portion sizes from recipe specifications</li>
                    <li>Plate according to presentation standards</li>
                    <li>Check for allergens and food safety compliance</li>
                    <li>Quality check before service</li>
                  </ol>
                </div>

                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={assemblySteps.some(p => p.data?.status !== 'prepared')}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Complete Assembly & Move to Service
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}