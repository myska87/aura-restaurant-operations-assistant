import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function PageHeader({ 
  title, 
  description, 
  action, 
  actionLabel = 'Add New',
  actionIcon: ActionIcon = Plus,
  children 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{title}</h1>
        {description && (
          <p className="text-slate-500 mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {action && (
          <Button 
            onClick={action}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-500/25"
          >
            <ActionIcon className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}