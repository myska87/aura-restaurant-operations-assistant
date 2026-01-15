import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { Printer, Tag, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const prepTypes = [
  { value: 'fresh', label: 'Fresh Prep', shelfLife: 2, color: 'bg-green-100 text-green-800' },
  { value: 'cooked', label: 'Cooked', shelfLife: 3, color: 'bg-blue-100 text-blue-800' },
  { value: 'batch', label: 'Batch Prep', shelfLife: 2, color: 'bg-purple-100 text-purple-800' },
  { value: 'sauce', label: 'Sauce', shelfLife: 5, color: 'bg-orange-100 text-orange-800' },
  { value: 'dessert', label: 'Dessert', shelfLife: 1, color: 'bg-pink-100 text-pink-800' }
];

const storageTypes = [
  { value: 'fridge', label: '❄️ Fridge (0-5°C)' },
  { value: 'freezer', label: '🧊 Freezer (-18°C)' },
  { value: 'ambient', label: '🌡️ Ambient' }
];

export default function LabelPrinter({ user }) {
  const [formData, setFormData] = useState({
    item_name: '',
    prep_type: '',
    storage_type: '',
    batch_size: '',
    allergens: []
  });

  const [preview, setPreview] = useState(null);
  const queryClient = useQueryClient();

  const createLabelMutation = useMutation({
    mutationFn: (data) => base44.entities.FoodLabel.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['foodLabels']);
      alert('Label created! Ready to print.');
      setFormData({
        item_name: '',
        prep_type: '',
        storage_type: '',
        batch_size: '',
        allergens: []
      });
      setPreview(null);
    }
  });

  const handleGenerate = () => {
    const prepInfo = prepTypes.find(p => p.value === formData.prep_type);
    const today = new Date();
    const useByDate = addDays(today, prepInfo.shelfLife);

    const labelData = {
      ...formData,
      prep_date: format(today, 'yyyy-MM-dd'),
      use_by_date: format(useByDate, 'yyyy-MM-dd'),
      shelf_life_days: prepInfo.shelfLife,
      prepared_by: user.email,
      prepared_by_name: user.full_name || user.email,
      qr_code: `LABEL-${Date.now()}`
    };

    setPreview(labelData);
  };

  const handlePrint = () => {
    if (!preview) return;
    createLabelMutation.mutate({
      ...preview,
      label_printed: true,
      print_count: 1
    });
  };

  const commonAllergens = ['Dairy', 'Eggs', 'Gluten', 'Nuts', 'Soy', 'Sesame'];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Smart Label Printer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Item Name</label>
                <Input
                  placeholder="e.g. Chicken Tikka Batch"
                  value={formData.item_name}
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Prep Type</label>
                <Select value={formData.prep_type} onValueChange={(v) => setFormData({...formData, prep_type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {prepTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} ({type.shelfLife} days)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Storage</label>
                <Select value={formData.storage_type} onValueChange={(v) => setFormData({...formData, storage_type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {storageTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Batch Size</label>
                <Input
                  placeholder="e.g. 5kg, 20 portions"
                  value={formData.batch_size}
                  onChange={(e) => setFormData({...formData, batch_size: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Allergens</label>
                <div className="flex flex-wrap gap-2">
                  {commonAllergens.map(allergen => (
                    <button
                      key={allergen}
                      onClick={() => {
                        if (formData.allergens.includes(allergen)) {
                          setFormData({
                            ...formData,
                            allergens: formData.allergens.filter(a => a !== allergen)
                          });
                        } else {
                          setFormData({
                            ...formData,
                            allergens: [...formData.allergens, allergen]
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        formData.allergens.includes(allergen)
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {allergen}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!formData.item_name || !formData.prep_type || !formData.storage_type}
                className="w-full"
              >
                Generate Label Preview
              </Button>
            </div>

            {/* Label Preview */}
            {preview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                <Card className="bg-white border-2 border-slate-800">
                  <CardContent className="pt-4 space-y-2">
                    <div className="text-center pb-2 border-b-2 border-dashed">
                      <h3 className="text-xl font-bold text-slate-800">{preview.item_name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-slate-600 font-semibold">Prepared</p>
                        <p className="font-bold">{format(new Date(preview.prep_date), 'dd/MM/yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-semibold">Use By</p>
                        <p className="font-bold text-red-600">{format(new Date(preview.use_by_date), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={prepTypes.find(p => p.value === preview.prep_type)?.color}>
                        {prepTypes.find(p => p.value === preview.prep_type)?.label}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {preview.storage_type}
                      </Badge>
                    </div>

                    {preview.batch_size && (
                      <p className="text-sm">
                        <span className="font-semibold">Batch:</span> {preview.batch_size}
                      </p>
                    )}

                    {preview.allergens.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold text-red-700 mb-1">⚠️ ALLERGENS:</p>
                        <div className="flex flex-wrap gap-1">
                          {preview.allergens.map(a => (
                            <Badge key={a} className="bg-red-600 text-xs">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t text-xs text-slate-600">
                      <p>By: {preview.prepared_by_name}</p>
                      <p className="font-mono text-[10px]">{preview.qr_code}</p>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handlePrint}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Print Label
                </Button>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}