import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Award, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TrainingProgressWidget({ progress = [], totalCourses = 0 }) {
  const completedCount = progress.filter(p => p.status === 'completed').length;
  const inProgressCount = progress.filter(p => p.status === 'in_progress').length;
  const overallProgress = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

  const levels = ['culture', 'L1', 'L2', 'L3'];
  const levelLabels = {
    culture: 'Culture',
    L1: 'Level 1',
    L2: 'Level 2',
    L3: 'Level 3'
  };
  const levelColors = {
    culture: 'from-purple-400 to-purple-600',
    L1: 'from-blue-400 to-blue-600',
    L2: 'from-emerald-400 to-emerald-600',
    L3: 'from-amber-400 to-amber-600'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Training Progress</h3>
            <p className="text-sm text-slate-500">{completedCount} of {totalCourses} completed</p>
          </div>
        </div>
        <Link to={createPageUrl('Training')}>
          <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
            Continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-600">Overall Progress</span>
            <span className="text-sm font-bold text-slate-800">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2">
          {levels.map((level, index) => {
            const levelProgress = progress.filter(p => p.level === level);
            const completed = levelProgress.filter(p => p.status === 'completed').length > 0;
            
            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`text-center p-3 rounded-xl ${completed ? 'bg-gradient-to-br ' + levelColors[level] : 'bg-slate-100'}`}
              >
                {completed ? (
                  <Award className="w-5 h-5 text-white mx-auto mb-1" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 mx-auto mb-1" />
                )}
                <p className={`text-xs font-medium ${completed ? 'text-white' : 'text-slate-500'}`}>
                  {levelLabels[level]}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {inProgressCount > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
            {inProgressCount} course{inProgressCount > 1 ? 's' : ''} in progress
          </p>
        </div>
      )}
    </div>
  );
}