import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Clock, ChefHat, Users, Award, AlertCircle, CheckCircle, Timer } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';

export default function VisualDishGuidePrint() {
  const urlParams = new URLSearchParams(window.location.search);
  const guideId = urlParams.get('id');

  const { data: guide, isLoading } = useQuery({
    queryKey: ['visualDishGuidePrint', guideId],
    queryFn: () => base44.entities.Visual_Dish_Guides_v1.filter({ id: guideId }).then(g => g[0]),
    enabled: !!guideId
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <LoadingSpinner message="Loading print preview..." />;
  if (!guide) return <div className="p-8 text-center">Guide not found</div>;

  const difficultyColors = {
    easy: '#10B981',
    medium: '#F59E0B',
    advanced: '#EF4444'
  };

  return (
    <div>
      {/* Print Button - Hidden when printing */}
      <div className="fixed top-4 right-4 print:hidden z-50">
        <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
          <ChefHat className="w-4 h-4 mr-2" />
          Print Recipe
        </Button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          }
          
          .print-container {
            width: 100%;
            max-width: 100%;
          }
          
          .no-print {
            display: none !important;
          }
          
          .page-break {
            page-break-inside: avoid;
          }
          
          .step-row {
            page-break-inside: avoid;
          }
          
          img {
            max-width: 100%;
            height: auto;
          }
        }
        
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 2rem auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            padding: 15mm;
          }
        }
      `}</style>

      <div className="print-container">
        {/* Header Section */}
        <div className="page-break" style={{ 
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '2px solid #D4AF37'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: '800', 
                color: '#1F2937',
                marginBottom: '8px',
                letterSpacing: '-0.5px'
              }}>
                {guide.dish_name}
              </h1>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                <span style={{
                  background: difficultyColors[guide.difficulty],
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {guide.difficulty}
                </span>
                <span style={{
                  background: '#8B5CF6',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {guide.category}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                <Clock style={{ width: '18px', height: '18px', color: '#059669' }} />
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                  {guide.estimated_cook_time_minutes || 0} min
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                <Users style={{ width: '18px', height: '18px', color: '#059669' }} />
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                  {guide.portion_size || 1} portion{guide.portion_size > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#6B7280' }}>
                Version {guide.version}
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        {guide.ingredients_summary?.length > 0 && (
          <div className="page-break" style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: '#1F2937',
              marginBottom: '16px',
              borderBottom: '3px solid #D4AF37',
              paddingBottom: '8px'
            }}>
              Ingredients
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}>
              {guide.ingredients_summary.map((ing, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: idx % 2 === 0 ? '#F9FAFB' : 'white',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                    {ing.ingredient_name}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                    {ing.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cooking Steps */}
        {guide.cooking_steps?.length > 0 && (
          <div className="page-break" style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: '#1F2937',
              marginBottom: '16px',
              borderBottom: '3px solid #D4AF37',
              paddingBottom: '8px'
            }}>
              Step-by-Step Instructions
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F3F4F6', borderBottom: '2px solid #D1D5DB' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6B7280', width: '50px' }}>
                    Step
                  </th>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6B7280', width: '80px' }}>
                    Image
                  </th>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6B7280' }}>
                    Instruction
                  </th>
                  <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#6B7280', width: '60px' }}>
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {guide.cooking_steps.map((step, idx) => (
                  <tr key={idx} className="step-row" style={{ 
                    borderBottom: '1px solid #E5E7EB',
                    background: idx % 2 === 0 ? 'white' : '#FAFAFA'
                  }}>
                    <td style={{ 
                      padding: '12px',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#059669',
                      verticalAlign: 'top'
                    }}>
                      {step.step_number}
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      {step.photo_url ? (
                        <img 
                          src={step.photo_url} 
                          alt={`Step ${step.step_number}`}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #E5E7EB'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          background: '#F3F4F6',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ChefHat style={{ width: '24px', height: '24px', color: '#9CA3AF' }} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                        {step.step_title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.5' }}>
                        {step.instruction_text}
                      </div>
                    </td>
                    <td style={{ 
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6B7280',
                      verticalAlign: 'top'
                    }}>
                      {step.duration_seconds ? `${Math.ceil(step.duration_seconds / 60)}m` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quality Tips */}
        {guide.quality_tips?.length > 0 && (
          <div className="page-break" style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: '#1F2937',
              marginBottom: '16px',
              borderBottom: '3px solid #D4AF37',
              paddingBottom: '8px'
            }}>
              Quality & Timing Notes
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {guide.quality_tips.map((tip, idx) => {
                const icons = {
                  quality_check: { icon: CheckCircle, color: '#10B981', bg: '#D1FAE5', label: 'Quality Check' },
                  common_mistake: { icon: AlertCircle, color: '#EF4444', bg: '#FEE2E2', label: 'Common Mistake' },
                  temperature: { icon: Award, color: '#8B5CF6', bg: '#EDE9FE', label: 'Temperature' },
                  timing: { icon: Timer, color: '#F59E0B', bg: '#FEF3C7', label: 'Timing' }
                };
                const config = icons[tip.type] || icons.quality_check;
                const Icon = config.icon;

                return (
                  <div key={idx} style={{
                    padding: '12px',
                    background: config.bg,
                    borderRadius: '8px',
                    borderLeft: `4px solid ${config.color}`,
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}>
                    <Icon style={{ width: '20px', height: '20px', color: config.color, marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: config.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        {config.label}
                      </div>
                      <div style={{ fontSize: '13px', color: '#1F2937', lineHeight: '1.5' }}>
                        {tip.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          marginTop: '32px',
          paddingTop: '16px',
          borderTop: '2px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '11px', color: '#6B7280' }}>
            Last updated: {new Date(guide.updated_date || guide.created_date).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280' }}>
            {guide.last_updated_by_name || 'Chef'}
          </div>
        </div>
      </div>
    </div>
  );
}