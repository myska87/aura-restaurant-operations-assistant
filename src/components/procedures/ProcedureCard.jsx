import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProcedureCard({ procedure, isCompleted, categoryIcon: Icon, categoryColor }) {
  return (
    <Link to={createPageUrl('VisualProcedureDetail') + '?id=' + procedure.id}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
        transition={{ duration: 0.2 }}
      >
        <Card className="overflow-hidden hover:border-emerald-300 transition-all cursor-pointer h-full">
          {procedure.cover_image_url && (
            <div className="aspect-video overflow-hidden bg-slate-100">
              <img
                src={procedure.cover_image_url}
                alt={procedure.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={categoryColor}>
                  {Icon && <Icon className="w-3 h-3 mr-1" />}
                  {procedure.category?.replace(/_/g, ' ')}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Done
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 mb-1 line-clamp-2">
                {procedure.title}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-2">
                {procedure.intro_description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {procedure.estimated_time_minutes}m
                </div>
                <div>
                  {procedure.steps?.length || 0} steps
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}