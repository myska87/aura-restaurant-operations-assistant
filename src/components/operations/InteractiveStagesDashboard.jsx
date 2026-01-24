import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sunrise, ChefHat, Moon, CheckCircle } from 'lucide-react';

export default function InteractiveStagesDashboard({ 
  onOpeningClick, 
  onServiceClick, 
  onClosingClick,
  openingCompletion = 0,
  serviceCompletion = 0,
  closingCompletion = 0,
  isShiftActive = false
}) {

  const stages = [
    {
      id: 'pre-opening',
      title: '1. Pre-Opening Stage',
      subtitle: '60–90 mins before open',
      icon: Sunrise,
      color: 'from-amber-400 to-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      textColor: 'text-amber-900',
      completion: openingCompletion,
      onClick: onOpeningClick,
      items: [
        'Team Check-In',
        'Daily Briefing',
        'Opening Checklist',
        'Temperature Logs',
        'Food Labels',
        'Allergen Review',
        'Manager Sign-Off'
      ]
    },
    {
      id: 'service',
      title: '2. Service Period',
      subtitle: 'During Service Hours',
      icon: ChefHat,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
      textColor: 'text-emerald-900',
      completion: serviceCompletion,
      onClick: onServiceClick,
      items: [
        'Order Prep',
        'Hygiene Checks',
        'Equipment Alerts',
        'Customer Feedback',
        'Sales Dashboard',
        'Mid-Shift Review'
      ]
    },
    {
      id: 'closing',
      title: '3. Closing Stage',
      subtitle: '60–90 mins after close',
      icon: Moon,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-900',
      completion: closingCompletion,
      onClick: onClosingClick,
      items: [
        'Closing Checklist',
        'Hygiene Audit',
        'Waste Check',
        'Stock Count',
        'Fault Reports',
        'Shift Handover'
      ]
    }
  ];

  return (
    <div className="space-y-4 mb-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          Interactive Operations Dashboard
        </h2>
        <p className="text-sm text-slate-600">
          Click on any stage to begin operations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isComplete = stage.completion >= 100;
          
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                onClick={isShiftActive ? stage.onClick : undefined}
                className={`
                  ${stage.bgColor} ${stage.borderColor} 
                  border-2 cursor-pointer overflow-hidden
                  transition-all duration-300 hover:shadow-2xl
                  ${!isShiftActive ? 'opacity-60 cursor-not-allowed' : ''}
                  relative group
                `}
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${stage.color} p-4 text-white relative`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{stage.title}</h3>
                        <p className="text-xs text-white/80">{stage.subtitle}</p>
                      </div>
                    </div>
                    {isComplete && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Completion Badge */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white/90">
                        {isComplete ? 'Complete' : 'In Progress'}
                      </span>
                      <span className="text-sm font-bold">
                        {Math.round(stage.completion)}%
                      </span>
                    </div>
                    <Progress 
                      value={stage.completion} 
                      className="h-2 bg-white/20"
                    />
                  </div>
                </div>

                {/* Checklist Items */}
                <div className="p-4 space-y-2">
                  {stage.items.map((item, itemIdx) => (
                    <motion.div
                      key={itemIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 + itemIdx * 0.05 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <p className={`text-sm ${stage.textColor} font-medium`}>
                        {item}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Call to Action Badge */}
                <div className="px-4 pb-4">
                  <div className={`w-full flex items-center justify-center text-sm py-2 font-bold bg-gradient-to-r ${stage.color} text-white hover:opacity-90 transition-opacity rounded-md`}>
                    {stage.id === 'pre-opening' && 'Ready to Serve!'}
                    {stage.id === 'service' && 'Live Operations'}
                    {stage.id === 'closing' && 'Secure & Clean!'}
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Card>
            </motion.div>
          );
        })}
      </div>

      {!isShiftActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center border text-amber-700 border-amber-300 bg-amber-50 px-4 py-2 rounded-md text-sm font-medium">
            ⚠️ Start your shift to unlock stage operations
          </div>
        </motion.div>
      )}
    </div>
  );
}