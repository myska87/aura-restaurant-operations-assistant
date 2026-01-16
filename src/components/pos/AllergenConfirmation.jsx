import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, CheckCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// UK Food Standards Agency - 14 Major Allergens
const allergenList = [
  { id: 'milk', label: 'Milk', icon: '🥛', color: 'bg-blue-100 text-blue-800 border-blue-300', warning: 'Contains dairy products' },
  { id: 'eggs', label: 'Eggs', icon: '🥚', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', warning: 'Contains eggs or egg products' },
  { id: 'gluten', label: 'Gluten (Wheat)', icon: '🌾', color: 'bg-amber-100 text-amber-800 border-amber-300', warning: 'Contains gluten from wheat, barley, rye or oats' },
  { id: 'peanuts', label: 'Peanuts', icon: '🥜', color: 'bg-red-100 text-red-800 border-red-300', warning: 'Contains peanuts or peanut products' },
  { id: 'nuts', label: 'Tree Nuts', icon: '🌰', color: 'bg-orange-100 text-orange-800 border-orange-300', warning: 'Contains tree nuts (almonds, hazelnuts, walnuts, etc.)' },
  { id: 'soy', label: 'Soy', icon: '🫘', color: 'bg-green-100 text-green-800 border-green-300', warning: 'Contains soya/soy products' },
  { id: 'sesame', label: 'Sesame', icon: '🫓', color: 'bg-purple-100 text-purple-800 border-purple-300', warning: 'Contains sesame seeds or sesame products' },
  { id: 'mustard', label: 'Mustard', icon: '🌭', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', warning: 'Contains mustard or mustard products' },
  { id: 'celery', label: 'Celery', icon: '🥬', color: 'bg-green-100 text-green-800 border-green-300', warning: 'Contains celery or celeriac' },
  { id: 'fish', label: 'Fish', icon: '🐟', color: 'bg-cyan-100 text-cyan-800 border-cyan-300', warning: 'Contains fish or fish products' },
  { id: 'crustaceans', label: 'Crustaceans', icon: '🦐', color: 'bg-teal-100 text-teal-800 border-teal-300', warning: 'Contains crustaceans (prawns, crab, lobster, etc.)' },
  { id: 'molluscs', label: 'Molluscs', icon: '🦪', color: 'bg-slate-100 text-slate-800 border-slate-300', warning: 'Contains molluscs (mussels, oysters, squid, etc.)' },
  { id: 'lupin', label: 'Lupin', icon: '🌸', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', warning: 'Contains lupin flour or seeds' },
  { id: 'sulphites', label: 'Sulphites', icon: '🍷', color: 'bg-pink-100 text-pink-800 border-pink-300', warning: 'Contains sulphur dioxide/sulphites at >10mg/kg' }
];

export default function AllergenConfirmation({ 
  open, 
  onClose, 
  onConfirm,
  cartItems = [],
  menuItems = [],
  user,
  isCertified
}) {
  const [step, setStep] = useState(1);
  const [hasAllergy, setHasAllergy] = useState(null);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [sopAcknowledged, setSopAcknowledged] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleReset = () => {
    setStep(1);
    setHasAllergy(null);
    setSelectedAllergens([]);
    setSopAcknowledged(false);
    setSpecialInstructions('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleComplete = () => {
    onConfirm({
      hasAllergy,
      allergens: selectedAllergens,
      sopAcknowledged,
      specialInstructions
    });
    handleReset();
  };

  const toggleAllergen = (allergenId) => {
    if (selectedAllergens.includes(allergenId)) {
      setSelectedAllergens(selectedAllergens.filter(a => a !== allergenId));
    } else {
      setSelectedAllergens([...selectedAllergens, allergenId]);
    }
  };

  // Check which cart items contain selected allergens
  const getAffectedItems = () => {
    return cartItems.map(cartItem => {
      const menuItem = menuItems.find(m => m.id === cartItem.id);
      if (!menuItem) return null;

      const itemAllergens = menuItem.allergens || [];
      const hasConflict = selectedAllergens.some(a => itemAllergens.includes(a));

      return {
        name: menuItem.name,
        hasConflict,
        allergens: itemAllergens.filter(a => selectedAllergens.includes(a))
      };
    }).filter(Boolean);
  };

  const affectedItems = hasAllergy ? getAffectedItems() : [];
  const hasConflicts = affectedItems.some(item => item.hasConflict);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <DialogTitle>Allergen Safety Check</DialogTitle>
              <p className="text-sm text-slate-600 mt-1">Mandatory before order completion</p>
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Initial Question */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="bg-red-50 border-red-300">
                <CardContent className="pt-4">
                  <p className="text-red-900 font-semibold mb-2">
                    ⚠️ Allergen safety is a responsibility we take seriously.
                  </p>
                  <p className="text-red-800 text-sm">
                    If you are unsure — STOP and ask a manager.
                  </p>
                </CardContent>
              </Card>

              <div className="text-center py-4">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">
                  Has the customer declared any allergies?
                </h3>

                <div className="grid gap-4 max-w-md mx-auto">
                  <Button
                    onClick={() => {
                      setHasAllergy(false);
                      handleComplete();
                    }}
                    size="lg"
                    variant="outline"
                    className="h-16 text-lg border-2 hover:bg-emerald-50 hover:border-emerald-600"
                  >
                    <CheckCircle className="w-6 h-6 mr-3 text-emerald-600" />
                    No allergies declared
                  </Button>

                  <Button
                    onClick={() => {
                      if (!isCertified) {
                        alert('You must complete Hygiene Level 1 certification to handle allergen orders. Please contact your manager.');
                        return;
                      }
                      setHasAllergy(true);
                      setStep(2);
                    }}
                    size="lg"
                    className="h-16 text-lg bg-gradient-to-r from-red-600 to-orange-600"
                  >
                    <AlertTriangle className="w-6 h-6 mr-3" />
                    YES — Allergy declared
                  </Button>
                </div>
              </div>

              <Button onClick={handleClose} variant="ghost" className="w-full">
                Cancel Order
              </Button>
            </motion.div>
          )}

          {/* Step 2: Select Allergens */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">
                  Select declared allergen(s):
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allergenList.map(allergen => (
                    <button
                      key={allergen.id}
                      onClick={() => toggleAllergen(allergen.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedAllergens.includes(allergen.id)
                          ? allergen.color + ' border-current shadow-lg scale-105'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{allergen.icon}</div>
                      <p className="font-semibold text-sm">{allergen.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={selectedAllergens.length === 0}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review & Acknowledge */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Selected Allergens */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Declared Allergens:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAllergens.map(id => {
                    const allergen = allergenList.find(a => a.id === id);
                    return (
                      <Badge key={id} className={`${allergen.color} text-base px-3 py-1`}>
                        {allergen.icon} {allergen.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Affected Items Warning */}
              {hasConflicts && (
                <Card className="bg-red-50 border-red-400 border-2">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-bold text-red-900 mb-2">⚠️ ALLERGEN CONFLICT DETECTED</p>
                        <p className="text-sm text-red-800 mb-3">
                          The following items contain declared allergens:
                        </p>
                        <ul className="space-y-2">
                          {affectedItems.filter(item => item.hasConflict).map((item, idx) => (
                            <li key={idx} className="text-sm text-red-900 font-semibold">
                              • {item.name} - Contains: {item.allergens.map(a => 
                                allergenList.find(al => al.id === a)?.label
                              ).join(', ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SOP Reminder */}
              <Card className="bg-amber-50 border-amber-300">
                <CardContent className="pt-4">
                  <h4 className="font-bold text-amber-900 mb-2">🚨 ALLERGEN HANDLING PROTOCOL</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Use separate utensils and equipment</li>
                    <li>• Sanitize all surfaces before preparation</li>
                    <li>• Avoid cross-contamination at all stages</li>
                    <li>• Double-check ingredients</li>
                    <li>• Inform kitchen team verbally</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">
                  Special Instructions for Kitchen:
                </label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any additional notes or modifications..."
                  rows={3}
                />
              </div>

              {/* Acknowledgement */}
              <Card className="bg-slate-900 text-white">
                <CardContent className="pt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sopAcknowledged}
                      onChange={(e) => setSopAcknowledged(e.target.checked)}
                      className="mt-1 w-5 h-5"
                    />
                    <div>
                      <p className="font-bold mb-1">I confirm that:</p>
                      <ul className="text-sm text-white/90 space-y-1">
                        <li>• I understand the allergen handling SOP</li>
                        <li>• I will follow all safety protocols</li>
                        <li>• I will inform the kitchen team</li>
                        <li>• If unsure, I will ask a manager</li>
                      </ul>
                    </div>
                  </label>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!sopAcknowledged}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Confirm & Process Order
                </Button>
              </div>

              {!sopAcknowledged && (
                <p className="text-sm text-red-600 text-center font-semibold">
                  You must acknowledge the safety protocols to proceed
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export { allergenList };