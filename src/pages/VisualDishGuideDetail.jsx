import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Clock,
  ChefHat,
  AlertTriangle,
  Lightbulb,
  Thermometer,
  Timer,
  Edit,
  Printer,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DishStepView from '@/components/dishes/DishStepView';
import LinkedMenuItemBadge from '@/components/dishes/LinkedMenuItemBadge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VisualDishGuideDetail() {
  const [user, setUser] = useState(null);
  const [printMode, setPrintMode] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const guideId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: guide, isLoading } = useQuery({
    queryKey: ['visualDishGuide', guideId],
    queryFn: () => base44.entities.Visual_Dish_Guides_v1.filter({ id: guideId }).then(g => g[0]),
    enabled: !!guideId
  });

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(false), 100);
    }, 300);
  };

  if (isLoading) return <LoadingSpinner />;
  if (!guide) return <div className="p-8 text-center">Dish guide not found</div>;

  const isAdmin = user && ['admin', 'owner', 'manager'].includes(user.role);

  const difficultyColors = {
    easy: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    advanced: 'bg-red-100 text-red-700'
  };

  const tipIcons = {
    quality_check: Lightbulb,
    common_mistake: AlertTriangle,
    temperature: Thermometer,
    timing: Timer
  };

  const tipColors = {
    quality_check: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    common_mistake: 'bg-amber-50 border-amber-300 text-amber-800',
    temperature: 'bg-blue-50 border-blue-300 text-blue-800',
    timing: 'bg-purple-50 border-purple-300 text-purple-800'
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { 
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            max-width: 100% !important;
          }
          .no-print { display: none !important; }
          .app-only { display: none !important; }
          
          .print-header { 
            border-bottom: 3px solid #f97316;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .print-header h1 { 
            font-size: 18px !important;
            margin-bottom: 4px !important;
          }
          .print-ingredients {
            background: #fff7ed !important;
            padding: 8px 12px !important;
            margin-bottom: 12px;
            border-radius: 4px;
            font-size: 10px !important;
          }
          .print-table { 
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 12px;
          }
          .print-table th {
            background: #f97316;
            color: white;
            padding: 6px 8px;
            text-align: left;
            font-weight: 600;
          }
          .print-table td {
            border-bottom: 1px solid #e5e7eb;
            padding: 6px 8px;
            vertical-align: top;
          }
          .print-table tr:last-child td {
            border-bottom: 2px solid #f97316;
          }
          .print-tips {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            font-size: 9px;
            margin-top: 12px;
          }
          .print-tips div {
            padding: 6px 8px;
            border-radius: 4px;
            border: 1px solid;
          }
        }
      `}</style>
      
      <div className={`max-w-4xl mx-auto space-y-6 pb-20 ${printMode ? 'print-content' : ''}`}>
      
      {/* PRINT MODE - Compact One-Page Layout */}
      <div className="hidden print:block print-header">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">{guide.dish_name}</h1>
          <div className="text-xs text-slate-600 space-x-3">
            <span>{guide.category?.toUpperCase()}</span>
            <span>{guide.difficulty?.toUpperCase()}</span>
            <span>⏱ {guide.estimated_cook_time_minutes}m</span>
            <span>🍽 {guide.portion_size} portion(s)</span>
            <span>v{guide.version}</span>
          </div>
        </div>
        
        {guide.ingredients_summary?.length > 0 && (
          <div className="print-ingredients">
            <strong>Ingredients:</strong>{' '}
            {guide.ingredients_summary.map((ing, i) => 
              `${ing.ingredient_name} (${ing.quantity})${i < guide.ingredients_summary.length - 1 ? ', ' : ''}`
            )}
          </div>
        )}

        <table className="print-table">
          <thead>
            <tr>
              <th style={{width: '40px'}}>#</th>
              <th style={{width: '140px'}}>Step</th>
              <th>Instructions</th>
              <th style={{width: '60px'}}>Time</th>
              <th style={{width: '30px'}}>✓</th>
            </tr>
          </thead>
          <tbody>
            {guide.cooking_steps?.map((step, idx) => (
              <tr key={idx}>
                <td className="font-bold text-center">{step.step_number}</td>
                <td className="font-semibold">{step.step_title}</td>
                <td>{step.instruction_text}</td>
                <td className="text-center">{Math.floor(step.duration_seconds / 60)}m</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>

        {guide.quality_tips?.length > 0 && (
          <div className="print-tips">
            {guide.quality_tips.map((tip, i) => (
              <div 
                key={i} 
                style={{
                  borderColor: tip.type === 'temperature' ? '#3b82f6' : tip.type === 'common_mistake' ? '#f59e0b' : '#10b981',
                  background: tip.type === 'temperature' ? '#eff6ff' : tip.type === 'common_mistake' ? '#fffbeb' : '#f0fdf4'
                }}
              >
                <strong>{tip.type === 'temperature' ? '🌡️' : tip.type === 'common_mistake' ? '⚠️' : '✅'} {tip.type.replace(/_/g, ' ').toUpperCase()}:</strong> {tip.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APP MODE - Rich Interactive Layout */}
      <div className="app-only">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to={createPageUrl('VisualDishGuides')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge className={difficultyColors[guide.difficulty]}>
              {guide.difficulty?.toUpperCase()}
            </Badge>
            <Badge variant="outline">{guide.category}</Badge>
            <Badge variant="outline">v{guide.version}</Badge>
            <LinkedMenuItemBadge visualGuideId={guideId} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{guide.dish_name}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {guide.estimated_cook_time_minutes} min
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              {guide.portion_size} portion(s)
            </div>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          {isAdmin && (
            <Link to={createPageUrl('VisualDishGuideForm') + '?id=' + guideId}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Hero Image */}
      {guide.hero_image_url && (
        <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
          <img 
            src={guide.hero_image_url} 
            alt={guide.dish_name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Ingredients */}
      {guide.ingredients_summary?.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-900">Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {guide.ingredients_summary.map((ing, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-orange-200">
                  {ing.icon_url && (
                    <img src={ing.icon_url} alt="" className="w-6 h-6 object-contain" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{ing.ingredient_name}</p>
                    <p className="text-xs text-slate-500">{ing.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cooking Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-600" />
              Cooking Steps
            </div>
            <Badge variant="outline" className="text-xs">
              {guide.cooking_steps?.length} Steps
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {guide.cooking_steps?.map((step, index) => (
            <div key={index}>
              <DishStepView step={step} totalSteps={guide.cooking_steps?.length} />
              
              {/* Video Section - App Only */}
              {step.video_url && (
                <div className="mt-4 ml-16 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-900">Watch Video Guide</span>
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    {step.video_url.includes('youtube.com') || step.video_url.includes('youtu.be') ? (
                      <iframe
                        src={step.video_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : step.video_url.includes('instagram.com') ? (
                      <div className="flex items-center justify-center h-full">
                        <a 
                          href={step.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-white underline"
                        >
                          Watch on Instagram
                        </a>
                      </div>
                    ) : (
                      <video src={step.video_url} controls className="w-full h-full" />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quality Tips */}
      {guide.quality_tips?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-800">Quality Tips & Notes</h3>
          {guide.quality_tips.map((tip, i) => {
            const Icon = tipIcons[tip.type];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-xl border-2 ${tipColors[tip.type]}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1 capitalize">{tip.type.replace(/_/g, ' ')}</p>
                    <p className="text-sm">{tip.text}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Plating Photo */}
      {guide.plating_photo_url && (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900">Final Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
              <img 
                src={guide.plating_photo_url} 
                alt="Final plated dish"
                className="w-full h-full object-cover"
              />
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
    </>
  );
}