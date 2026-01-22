import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ClipboardCheck, CheckSquare, MessageSquare, TrendingUp, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

const quickActions = [
  { 
    icon: ClipboardCheck, 
    label: 'Daily Ops', 
    page: 'Operations',
    tooltip: 'Daily checklist & operations',
    shortcut: '1'
  },
  { 
    icon: CheckSquare, 
    label: 'Tasks', 
    page: 'PrepWorkflow',
    tooltip: 'Team task board',
    shortcut: '2'
  },
  { 
    icon: MessageSquare, 
    label: 'Comms', 
    page: 'ShiftHandovers',
    tooltip: 'Handover notes & chat',
    shortcut: '3'
  },
  { 
    icon: TrendingUp, 
    label: 'Reports', 
    page: 'Reports',
    tooltip: 'Live KPIs & analytics',
    shortcut: '4'
  },
  { 
    icon: Wrench, 
    label: 'Tools', 
    page: 'EquipmentHealth',
    tooltip: 'Equipment & stock status',
    shortcut: '5'
  }
];

export default function QuickAccessToolbar() {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden lg:block"
    >
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl p-3 flex items-center gap-2">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} to={createPageUrl(action.page)}>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-all"
                title={action.tooltip}
              >
                <Icon className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                <span className="text-[10px] font-medium text-slate-600 group-hover:text-emerald-600">
                  {action.label}
                </span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.shortcut}
                </span>
              </motion.button>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}