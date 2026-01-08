import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel = 'Get Started' 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {Icon && (
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-slate-400" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-slate-700 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      {action && (
        <Button 
          onClick={action}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}