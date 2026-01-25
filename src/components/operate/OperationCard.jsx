import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function OperationCard({ 
  icon: Icon,
  color,
  title,
  summary,
  details,
  status,
  actionButtons = [],
  progress,
  lastUpdate
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-xl transition-all border-2 border-slate-200 hover:border-emerald-400">
        <CardContent className="pt-4 pb-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{title}</h3>
                <p className="text-xs text-slate-600 mt-0.5 truncate">{summary}</p>
              </div>
            </div>
            <Badge 
              variant={status === 'complete' ? 'default' : 'outline'}
              className={status === 'complete' ? 'bg-emerald-500 flex-shrink-0' : 'border-amber-400 text-amber-700 flex-shrink-0'}
            >
              {status === 'complete' ? '✓' : '⚠'}
            </Badge>
          </div>

          {/* Progress Bar */}
          {progress !== undefined && progress < 100 && (
            <div className="mb-3">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-slate-500 mt-1">{Math.round(progress)}%</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 mb-2">
            {actionButtons.map((btn, idx) => (
              <Button
                key={idx}
                onClick={btn.onClick}
                size="sm"
                className="w-full text-xs font-semibold"
                variant={btn.variant || 'default'}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          {/* Expandable Details */}
          {details && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full justify-between px-0 h-auto py-1 text-xs text-slate-600 hover:text-slate-900"
              >
                {expanded ? 'Hide details' : 'Show details'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </Button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 mt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-600 leading-relaxed">{details}</p>
                      {lastUpdate && (
                        <p className="text-xs text-slate-400 mt-2">Updated {lastUpdate}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}