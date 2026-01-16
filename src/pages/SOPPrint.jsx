import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SOPPrint() {
  const urlParams = new URLSearchParams(window.location.search);
  const sopId = urlParams.get('id');

  const { data: sop, isLoading } = useQuery({
    queryKey: ['sop', sopId],
    queryFn: async () => {
      const sops = await base44.entities.SOP.filter({ id: sopId });
      return sops[0];
    },
    enabled: !!sopId
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !sop) return <LoadingSpinner />;

  return (
    <div>
      {/* Print Controls - Hidden when printing */}
      <div className="no-print mb-6 flex items-center justify-between">
        <Link to={createPageUrl('SOPLibrary')}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <Button onClick={handlePrint} className="bg-emerald-600">
          <Printer className="w-4 h-4 mr-2" />
          Print SOP
        </Button>
      </div>

      {/* Printable Content */}
      <div className="print-content bg-white p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-4 border-emerald-600 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{sop.title}</h1>
              <p className="text-slate-600 capitalize">
                {sop.menu_category?.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{sop.sop_code || 'SOP-' + sop.id.slice(0, 6)}</p>
              <p className="text-slate-600">Version {sop.version}</p>
              <p className="text-slate-600">Printed: {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
            {sop.prep_time_minutes && (
              <div>
                <p className="text-slate-500">Prep Time</p>
                <p className="font-bold">{sop.prep_time_minutes} min</p>
              </div>
            )}
            {sop.cooking_time_minutes && (
              <div>
                <p className="text-slate-500">Cook Time</p>
                <p className="font-bold">{sop.cooking_time_minutes} min</p>
              </div>
            )}
            {sop.portion_size && (
              <div>
                <p className="text-slate-500">Portion</p>
                <p className="font-bold">{sop.portion_size}</p>
              </div>
            )}
            {sop.serving_vessel && (
              <div>
                <p className="text-slate-500">Serve In</p>
                <p className="font-bold">{sop.serving_vessel}</p>
              </div>
            )}
          </div>
        </div>

        {/* Allergen Warning */}
        {sop.allergens_present && sop.allergens_present.length > 0 && (
          <div className="bg-red-50 border-2 border-red-600 p-4 mb-6">
            <p className="font-bold text-red-900 mb-2">⚠️ ALLERGEN ALERT</p>
            <p className="text-red-800">
              Contains: {sop.allergens_present.map(a => a.toUpperCase()).join(', ')}
            </p>
            {sop.allergen_handling && (
              <p className="text-sm text-red-800 mt-2 font-semibold">{sop.allergen_handling}</p>
            )}
          </div>
        )}

        {/* Ingredients */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3 border-b-2 border-slate-300 pb-2">
            1. INGREDIENTS
          </h2>
          {sop.ingredients_list && sop.ingredients_list.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-2 border">Ingredient</th>
                  <th className="text-right p-2 border">Quantity</th>
                  <th className="text-left p-2 border">Notes</th>
                </tr>
              </thead>
              <tbody>
                {sop.ingredients_list.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">{item.ingredient}</td>
                    <td className="p-2 border text-right font-semibold">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-2 border text-xs">{item.prep_notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500">No ingredients documented</p>
          )}
        </div>

        {/* Equipment */}
        {sop.equipment_required && sop.equipment_required.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b-2 border-slate-300 pb-2">
              2. EQUIPMENT NEEDED
            </h2>
            <ul className="list-disc list-inside space-y-1">
              {sop.equipment_required.map((eq, idx) => (
                <li key={idx}>{eq}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Prep Steps */}
        {sop.prep_steps && sop.prep_steps.length > 0 && (
          <div className="mb-6 page-break-before">
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b-2 border-slate-300 pb-2">
              3. PRE-SERVICE PREPARATION
            </h2>
            <ol className="space-y-3">
              {sop.prep_steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="font-bold text-emerald-600 flex-shrink-0">
                    {step.step_number}.
                  </span>
                  <div>
                    <p>{step.instruction}</p>
                    {step.time_minutes && (
                      <p className="text-xs text-slate-500 mt-1">
                        ⏱ {step.time_minutes} minutes
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Cooking Steps */}
        {sop.cooking_steps && sop.cooking_steps.length > 0 && (
          <div className="mb-6 page-break-before">
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b-2 border-slate-300 pb-2">
              4. LIVE COOKING
            </h2>
            {sop.cooking_temperature && (
              <div className="bg-orange-50 border border-orange-300 p-3 mb-4">
                <p className="font-semibold">🌡️ Temperature: {sop.cooking_temperature}</p>
              </div>
            )}
            <ol className="space-y-3">
              {sop.cooking_steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="font-bold text-orange-600 flex-shrink-0">
                    {step.step_number}.
                  </span>
                  <div>
                    <p>{step.instruction}</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                      {step.time_minutes && <span>⏱ {step.time_minutes} min</span>}
                      {step.visual_cue && (
                        <span className="text-emerald-600 font-semibold">
                          ✓ {step.visual_cue}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Assembly & Plating */}
        {sop.assembly_steps && sop.assembly_steps.length > 0 && (
          <div className="mb-6 page-break-before">
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b-2 border-slate-300 pb-2">
              5. ASSEMBLY & PLATING
            </h2>
            <ol className="space-y-2">
              {sop.assembly_steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="font-bold text-blue-600 flex-shrink-0">
                    {step.step_number}.
                  </span>
                  <p>{step.instruction}</p>
                </li>
              ))}
            </ol>
            
            <div className="mt-4 space-y-2">
              {sop.plating_description && (
                <div className="bg-blue-50 p-3 border border-blue-200">
                  <p className="font-semibold text-sm">Final Look:</p>
                  <p className="text-sm">{sop.plating_description}</p>
                </div>
              )}
              {sop.garnish_rules && (
                <div className="bg-emerald-50 p-3 border border-emerald-200">
                  <p className="font-semibold text-sm">Garnish:</p>
                  <p className="text-sm">{sop.garnish_rules}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quality Standards */}
        {sop.quality_standards && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b-2 border-slate-300 pb-2">
              6. QUALITY STANDARDS
            </h2>
            <div className="bg-slate-900 text-white p-4">
              <p className="whitespace-pre-wrap">{sop.quality_standards}</p>
            </div>
          </div>
        )}

        {/* Safety & Hygiene */}
        <div className="mb-6 page-break-before">
          <h2 className="text-xl font-bold text-slate-900 mb-3 border-b-2 border-slate-300 pb-2">
            7. HYGIENE & SAFETY
          </h2>
          {sop.hygiene_notes && (
            <div className="mb-4 bg-blue-50 p-4 border-l-4 border-blue-600">
              <p className="font-semibold text-blue-900 mb-2">Hygiene Requirements:</p>
              <p className="text-sm whitespace-pre-wrap">{sop.hygiene_notes}</p>
            </div>
          )}
          {sop.safety_notes && (
            <div className="bg-red-50 p-4 border-l-4 border-red-600">
              <p className="font-semibold text-red-900 mb-2">Safety Precautions:</p>
              <p className="text-sm whitespace-pre-wrap">{sop.safety_notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-slate-300 pt-4 mt-8 text-xs text-slate-500">
          <div className="flex justify-between">
            <div>
              <p>Chai Patta Standard Operating Procedure</p>
              <p>This document is confidential and proprietary</p>
            </div>
            <div className="text-right">
              <p>{sop.sop_code || 'SOP-' + sop.id.slice(0, 6)} | v{sop.version}</p>
              {sop.approved_by && (
                <p>Approved by: {sop.approved_by}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-content {
            max-width: 100%;
            padding: 0;
          }
          .page-break-before {
            page-break-before: always;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}