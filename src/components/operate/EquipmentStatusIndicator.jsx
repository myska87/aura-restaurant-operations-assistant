import React from 'react';
import { motion } from 'framer-motion';

export default function EquipmentStatusIndicator({ equipmentStatus = "unknown" }) {
  const statusConfig = {
    ok: { label: 'All Equipment OK', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300' },
    warning: { label: 'Check Equipment', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300' },
    critical: { label: 'Equipment Issue', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300' },
    unknown: { label: 'Status Unavailable', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-300' }
  };

  const config = statusConfig[equipmentStatus] || statusConfig.unknown;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`equipment-status-indicator p-4 rounded-lg border-2 ${config.bg} ${config.border} mb-6`}
    >
      <span className={`${config.color} font-semibold text-sm`}>{config.label}</span>
    </motion.div>
  );
}