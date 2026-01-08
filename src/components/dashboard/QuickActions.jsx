import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  Clock,
  Plus,
  FileText,
  ClipboardCheck,
  Users,
  Package
} from 'lucide-react';

const actions = [
  { label: 'Clock In/Out', icon: Clock, page: 'Shifts', color: 'bg-emerald-500' },
  { label: 'New Menu Item', icon: Plus, page: 'Menu', color: 'bg-amber-500' },
  { label: 'Start Audit', icon: ClipboardCheck, page: 'Quality', color: 'bg-blue-500' },
  { label: 'Add Staff', icon: Users, page: 'Staff', color: 'bg-purple-500' },
  { label: 'New Order', icon: Package, page: 'Inventory', color: 'bg-rose-500' },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={createPageUrl(action.page) + (action.params || '')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-600 text-center">{action.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}