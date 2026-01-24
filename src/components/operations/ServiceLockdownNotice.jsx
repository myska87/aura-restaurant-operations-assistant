import React from 'react';
import { AlertTriangle, Lock, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ServiceLockdownNotice({ failedCCPs = [] }) {
  if (failedCCPs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-96"
    >
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white rounded-2xl shadow-2xl overflow-hidden border-2 border-red-400">
        {/* Animated background pulse */}
        <div className="absolute inset-0 animate-pulse bg-red-500 opacity-20" />
        
        <div className="relative p-6 space-y-3">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-10 h-10 bg-red-400 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <Lock className="w-6 h-6 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold">🚫 FOOD SAFETY HOLD</h3>
          </div>

          <p className="text-red-50 font-semibold text-lg">
            Service Locked - Action Required
          </p>

          <div className="bg-red-900/50 rounded-lg p-3 space-y-2 text-red-100 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{failedCCPs.length} Critical Control Point(s) failed</span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Linked menu items are blocked from serving</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Apply corrective actions and recheck CCP to resume</span>
            </div>
          </div>

          <div className="text-center text-xs text-red-200 font-semibold">
            ⚠️ DO NOT SERVE AFFECTED MENU ITEMS ⚠️
          </div>
        </div>
      </div>
    </motion.div>
  );
}