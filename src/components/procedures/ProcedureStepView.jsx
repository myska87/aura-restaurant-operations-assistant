import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProcedureStepView({ step }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="flex gap-4">
        {/* Step Number */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
            {step.step_number}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="text-lg font-bold text-slate-800 mb-1">
              {step.step_title}
            </h4>
            <p className="text-slate-600">
              {step.instruction_text}
            </p>
            {step.duration_seconds && (
              <Badge variant="outline" className="mt-2">
                <Clock className="w-3 h-3 mr-1" />
                {Math.round(step.duration_seconds / 60)}m {step.duration_seconds % 60}s
              </Badge>
            )}
          </div>

          {/* Photo */}
          {step.photo_url && (
            <div className="rounded-xl overflow-hidden shadow-md border-2 border-slate-200">
              <img
                src={step.photo_url}
                alt={step.step_title}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Video */}
          {step.video_url && (
            <div className="rounded-xl overflow-hidden shadow-md border-2 border-emerald-200">
              <div className="bg-slate-900 aspect-video relative">
                <video
                  src={step.video_url}
                  controls
                  className="w-full h-full"
                  preload="metadata"
                >
                  Your browser does not support videos.
                </video>
                <div className="absolute top-3 right-3">
                  <Badge className="bg-emerald-600 text-white">
                    <Play className="w-3 h-3 mr-1" />
                    Video Guide
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connector Line */}
      <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gradient-to-b from-emerald-300 to-transparent" />
    </motion.div>
  );
}