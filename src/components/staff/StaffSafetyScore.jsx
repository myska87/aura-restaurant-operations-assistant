import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const gradeColors = {
  'A': 'bg-emerald-100 text-emerald-900 border-emerald-300',
  'B': 'bg-blue-100 text-blue-900 border-blue-300',
  'C': 'bg-amber-100 text-amber-900 border-amber-300',
  'D': 'bg-orange-100 text-orange-900 border-orange-300',
  'F': 'bg-red-100 text-red-900 border-red-300'
};

const tierIcons = {
  exemplary: Award,
  proficient: CheckCircle,
  developing: TrendingUp,
  concerning: AlertTriangle
};

const tierColors = {
  exemplary: 'bg-emerald-50 border-emerald-300 text-emerald-900',
  proficient: 'bg-blue-50 border-blue-300 text-blue-900',
  developing: 'bg-amber-50 border-amber-300 text-amber-900',
  concerning: 'bg-red-50 border-red-300 text-red-900'
};

export default function StaffSafetyScore({ staffId, staffEmail, compact = false }) {
  const { data: score, isLoading } = useQuery({
    queryKey: ['safetyScore', staffEmail],
    queryFn: async () => {
      if (!staffEmail) return null;
      const scores = await base44.entities.StaffSafetyScore.filter(
        { staff_email: staffEmail },
        '-calculation_date',
        1
      );
      return scores[0];
    },
    enabled: !!staffEmail
  });

  if (!score) {
    return (
      <div className="text-center text-slate-500 text-sm p-4">
        {isLoading ? 'Loading safety score...' : 'No safety score available yet'}
      </div>
    );
  }

  const TierIcon = tierIcons[score.performance_tier];

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg border ${gradeColors[score.safety_grade]}`}>
          {score.safety_grade}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{score.overall_safety_score.toFixed(0)}/100</p>
          <p className="text-xs text-slate-500 capitalize">{score.performance_tier}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`border-2 ${tierColors[score.performance_tier]}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TierIcon className="w-5 h-5" />
              Safety Performance Score
            </CardTitle>
            <div className={`px-4 py-2 rounded-lg border font-bold text-xl ${gradeColors[score.safety_grade]}`}>
              Grade {score.safety_grade}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <h4 className="font-semibold text-slate-900">Overall Score</h4>
              <span className="text-3xl font-bold text-slate-900">{score.overall_safety_score.toFixed(0)}</span>
            </div>
            <Progress value={score.overall_safety_score} className="h-3" />
            <p className="text-xs text-slate-500 mt-2">
              Tier: <span className="font-semibold capitalize">{score.performance_tier}</span>
            </p>
          </div>

          {/* Metric Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            {/* Training Completion */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">Training</p>
                <Badge variant="outline" className="text-xs">
                  {score.training_courses_completed}/{score.training_courses_required}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-slate-900">{score.training_completion_score.toFixed(0)}%</p>
              <Progress value={score.training_completion_score} className="h-2 mt-2" />
            </div>

            {/* CCP Accuracy */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">CCP Accuracy</p>
                <Badge variant="outline" className="text-xs">
                  {score.ccp_checks_passed}/{score.ccp_checks_performed}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-slate-900">{score.ccp_accuracy_percentage.toFixed(0)}%</p>
              <Progress value={score.ccp_accuracy_percentage} className="h-2 mt-2" />
            </div>

            {/* Missed Checks */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">Check Completion</p>
                <Badge variant="outline" className="text-xs">
                  {score.scheduled_checks - score.missed_checks}/{score.scheduled_checks}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-slate-900">{(100 - score.missed_checks_percentage).toFixed(0)}%</p>
              <Progress value={100 - score.missed_checks_percentage} className="h-2 mt-2" />
            </div>

            {/* Incident Involvement */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">Safety Record</p>
                <Badge variant="outline" className="text-xs">
                  {score.total_incidents} incident(s)
                </Badge>
              </div>
              <p className="text-2xl font-bold text-slate-900">{score.incident_involvement_score.toFixed(0)}%</p>
              <Progress value={score.incident_involvement_score} className="h-2 mt-2" />
            </div>
          </div>

          {/* Incident Breakdown */}
          {score.total_incidents > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Incidents in Period
              </p>
              <div className="flex gap-4 text-sm">
                {score.critical_incidents > 0 && (
                  <span className="text-red-700"><span className="font-bold">{score.critical_incidents}</span> critical</span>
                )}
                {score.major_incidents > 0 && (
                  <span className="text-orange-700"><span className="font-bold">{score.major_incidents}</span> major</span>
                )}
                {score.minor_incidents > 0 && (
                  <span className="text-amber-700"><span className="font-bold">{score.minor_incidents}</span> minor</span>
                )}
              </div>
            </div>
          )}

          {/* Eligibility Badges */}
          <div className="flex flex-wrap gap-2">
            {score.promotion_ready && (
              <Badge className="bg-emerald-500 text-white">✓ Promotion Ready</Badge>
            )}
            {score.shift_leader_eligible && (
              <Badge className="bg-blue-500 text-white">✓ Shift Leader Eligible</Badge>
            )}
            {score.extra_training_required && (
              <Badge className="bg-red-500 text-white">⚠ Extra Training Required</Badge>
            )}
          </div>

          {/* Recommendations */}
          {score.training_recommendations?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-semibold text-amber-900 mb-2">Training Recommendations</p>
              <ul className="space-y-1">
                {score.training_recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Manager Notes */}
          {score.notes && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="font-semibold text-slate-900 mb-2">Manager Notes</p>
              <p className="text-sm text-slate-700">{score.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}