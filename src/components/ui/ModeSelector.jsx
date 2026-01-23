import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, GraduationCap, Settings } from 'lucide-react';

const MODES = [
  { 
    id: 'operate', 
    label: 'Operate', 
    icon: PlayCircle, 
    color: 'from-blue-500 to-blue-600',
    description: 'Service Mode'
  },
  { 
    id: 'train', 
    label: 'Train', 
    icon: GraduationCap, 
    color: 'from-amber-500 to-amber-600',
    description: 'Learning Mode'
  },
  { 
    id: 'manage', 
    label: 'Manage', 
    icon: Settings, 
    color: 'from-red-500 to-red-600',
    description: 'Admin Mode'
  },
];

export default function ModeSelector({ currentMode, onModeChange }) {
  return (
    <div className="flex gap-2 p-2 bg-slate-100 rounded-xl">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <motion.button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${isActive 
                ? `bg-gradient-to-r ${mode.color} text-white shadow-lg` 
                : 'text-slate-600 hover:bg-white'
              }
            `}
            whileTap={{ scale: 0.95 }}
          >
            <Icon className="w-4 h-4" />
            <span>{mode.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}