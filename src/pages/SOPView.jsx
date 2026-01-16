import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Printer, CheckCircle, Clock, AlertTriangle, ChefHat,
  Thermometer, Users, Shield, BookOpen, Camera, Award
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SOPView() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const sopId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: sop, isLoading } = useQuery({
    queryKey: ['sop', sopId],
    queryFn: async () => {
      const sops = await base44.entities.SOP.filter({ id: sopId });
      return sops[0];
    },
    enabled: !!sopId
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.SOPAcknowledgment.create({
        sop_id: sop.id,
        sop_title: sop.title,
        staff_email: user.email,
        staff_name: user.full_name || user.email,
        acknowledgment_date: new Date().toISOString(),
        version_acknowledged: sop.version
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sopAcknowledgments']);
    }
  });

  if (isLoading || !sop) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to={createPageUrl('SOPLibrary')}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link to={createPageUrl(`SOPPrint?id=${sop.id}`)}>
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </Link>
          <Button 
            onClick={() => acknowledgeMutation.mutate()}
            className="bg-emerald-600"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            I've Read This
          </Button>
        </div>
      </div>

      {/* Title Card */}
      <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-0">
                  {sop.sop_code || 'SOP-' + sop.id.slice(0, 6)}
                </Badge>
                <Badge className="bg-white/20 text-white border-0">
                  v{sop.version}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{sop.title}</h1>
              <p className="text-emerald-100 capitalize">
                {sop.menu_category?.replace(/_/g, ' ')}
              </p>
            </div>
            {sop.photo_final_product && (
              <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white/20">
                <img 
                  src={sop.photo_final_product} 
                  alt={sop.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            {sop.prep_time_minutes && (
              <div>
                <Clock className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xl font-bold">{sop.prep_time_minutes}</p>
                <p className="text-xs text-emerald-200">Prep (min)</p>
              </div>
            )}
            {sop.cooking_time_minutes && (
              <div>
                <Thermometer className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xl font-bold">{sop.cooking_time_minutes}</p>
                <p className="text-xs text-emerald-200">Cook (min)</p>
              </div>
            )}
            {sop.portion_size && (
              <div>
                <ChefHat className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xl font-bold">{sop.portion_size}</p>
                <p className="text-xs text-emerald-200">Portion</p>
              </div>
            )}
            {sop.required_training_level && (
              <div>
                <Award className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xl font-bold">{sop.required_training_level}</p>
                <p className="text-xs text-emerald-200">Training</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Allergen Warning */}
      {sop.allergens_present && sop.allergens_present.length > 0 && (
        <Card className="bg-red-50 border-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Allergen Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {sop.allergens_present.map(allergen => (
                <Badge key={allergen} className="bg-red-600 text-white">
                  {allergen.toUpperCase()}
                </Badge>
              ))}
            </div>
            {sop.allergen_handling && (
              <p className="text-sm text-red-800 font-semibold">{sop.allergen_handling}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="ingredients" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="prep">Prep Steps</TabsTrigger>
          <TabsTrigger value="cooking">Cooking</TabsTrigger>
          <TabsTrigger value="plating">Plating</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingredient List</CardTitle>
            </CardHeader>
            <CardContent>
              {sop.photo_ingredient_layout && (
                <div className="mb-4 rounded-xl overflow-hidden">
                  <img 
                    src={sop.photo_ingredient_layout} 
                    alt="Ingredient layout"
                    className="w-full"
                  />
                </div>
              )}
              {sop.ingredients_list && sop.ingredients_list.length > 0 ? (
                <div className="space-y-2">
                  {sop.ingredients_list.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-slate-800">{item.ingredient}</p>
                        {item.prep_notes && (
                          <p className="text-xs text-slate-500">{item.prep_notes}</p>
                        )}
                      </div>
                      <p className="font-bold text-emerald-600">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No ingredients documented</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prep" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Service Preparation</CardTitle>
            </CardHeader>
            <CardContent>
              {sop.prep_steps && sop.prep_steps.length > 0 ? (
                <div className="space-y-4">
                  {sop.prep_steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                        {step.step_number}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-800">{step.instruction}</p>
                        {step.time_minutes && (
                          <p className="text-xs text-slate-500 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {step.time_minutes} minutes
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No prep steps documented</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cooking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Cooking Steps</CardTitle>
            </CardHeader>
            <CardContent>
              {sop.photo_mid_process && (
                <div className="mb-4 rounded-xl overflow-hidden">
                  <img 
                    src={sop.photo_mid_process} 
                    alt="Cooking process"
                    className="w-full"
                  />
                </div>
              )}
              {sop.cooking_steps && sop.cooking_steps.length > 0 ? (
                <div className="space-y-4">
                  {sop.cooking_steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                        {step.step_number}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-800">{step.instruction}</p>
                        <div className="flex gap-4 mt-1 text-xs text-slate-500">
                          {step.time_minutes && (
                            <span>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {step.time_minutes} min
                            </span>
                          )}
                          {step.visual_cue && (
                            <span className="text-emerald-600 font-semibold">
                              ✓ {step.visual_cue}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No cooking steps documented</p>
              )}
              
              {sop.cooking_temperature && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm">
                    <Thermometer className="w-4 h-4 inline mr-2 text-orange-600" />
                    <span className="font-semibold">Temperature:</span> {sop.cooking_temperature}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plating" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assembly & Plating</CardTitle>
            </CardHeader>
            <CardContent>
              {sop.photo_final_product && (
                <div className="mb-4 rounded-xl overflow-hidden border-4 border-emerald-200">
                  <img 
                    src={sop.photo_final_product} 
                    alt="Final product"
                    className="w-full"
                  />
                </div>
              )}
              
              {sop.assembly_steps && sop.assembly_steps.length > 0 && (
                <div className="space-y-3 mb-4">
                  {sop.assembly_steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {step.step_number}
                      </div>
                      <p className="text-slate-800 pt-1">{step.instruction}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {sop.plating_description && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900">Final Look:</p>
                    <p className="text-sm text-blue-800">{sop.plating_description}</p>
                  </div>
                )}
                {sop.garnish_rules && (
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-sm font-semibold text-emerald-900">Garnish:</p>
                    <p className="text-sm text-emerald-800">{sop.garnish_rules}</p>
                  </div>
                )}
                {sop.serving_vessel && (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm font-semibold text-amber-900">Serve In:</p>
                    <p className="text-sm text-amber-800">{sop.serving_vessel}</p>
                  </div>
                )}
              </div>

              {sop.quality_standards && (
                <div className="mt-4 p-4 bg-slate-900 text-white rounded-lg">
                  <p className="font-semibold mb-2">✓ Quality Standards:</p>
                  <p className="text-sm">{sop.quality_standards}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Hygiene & Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sop.hygiene_notes && (
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                  <p className="font-semibold text-blue-900 mb-2">Hygiene Requirements:</p>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{sop.hygiene_notes}</p>
                </div>
              )}
              
              {sop.safety_notes && (
                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-600">
                  <p className="font-semibold text-red-900 mb-2">Safety Precautions:</p>
                  <p className="text-sm text-red-800 whitespace-pre-wrap">{sop.safety_notes}</p>
                </div>
              )}

              {sop.equipment_required && sop.equipment_required.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-700 mb-2">Equipment Required:</p>
                  <div className="flex flex-wrap gap-2">
                    {sop.equipment_required.map((equipment, idx) => (
                      <Badge key={idx} variant="outline">{equipment}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}