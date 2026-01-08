import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'emerald',
  delay = 0 
}) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/25',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
    rose: 'from-rose-500 to-rose-600 shadow-rose-500/25',
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/25'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span className="font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}