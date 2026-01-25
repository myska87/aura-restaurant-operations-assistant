import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function FormCompletionBanner({ 
  status, // 'completed', 'pending_signoff', 'failed'
  message,
  details
}) {
  const config = {
    completed: {
      icon: CheckCircle2,
      color: 'bg-emerald-50 border-emerald-300',
      textColor: 'text-emerald-800',
      badge: 'bg-emerald-500'
    },
    pending_signoff: {
      icon: Clock,
      color: 'bg-amber-50 border-amber-300',
      textColor: 'text-amber-800',
      badge: 'bg-amber-500'
    },
    failed: {
      icon: AlertCircle,
      color: 'bg-red-50 border-red-300',
      textColor: 'text-red-800',
      badge: 'bg-red-500'
    }
  };

  const cfg = config[status] || config.completed;
  const Icon = cfg.icon;

  const defaultMessages = {
    completed: '✅ Completed & Logged',
    pending_signoff: '⏳ Completed — Awaiting Supervisor Sign-Off',
    failed: '❌ Failed — Action Required'
  };

  const displayMessage = message || defaultMessages[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-2 ${cfg.color}`}>
        <div className="p-4 flex items-start gap-3">
          <Icon className={`w-6 h-6 ${cfg.textColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className={`font-semibold ${cfg.textColor}`}>
              {displayMessage}
            </p>
            {details && (
              <p className={`text-sm ${cfg.textColor} opacity-80 mt-1`}>
                {details}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}