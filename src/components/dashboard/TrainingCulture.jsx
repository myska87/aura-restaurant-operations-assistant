import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Heart, Award, TrendingUp } from 'lucide-react';

export default function TrainingCulture({ dateRange = {} }) {
  // Placeholder training data
  const trainingMetrics = {
    completionRate: 78,
    certifications: 2.4,
    cultureScore: 8.7,
    satisfaction: 8.9,
    topPerformers: [
      { name: 'Priya Singh', role: 'Chef', certs: 3, score: 9.2 },
      { name: 'Ahmed Hassan', role: 'Manager', certs: 3, score: 8.9 },
      { name: 'Sofia Martinez', role: 'Barista', certs: 2, score: 8.7 }
    ]
  };

  const coursesData = [
    { name: 'Food Safety', completion: 95, students: 12 },
    { name: 'Customer Service', completion: 88, students: 10 },
    { name: 'Cash Handling', completion: 92, students: 11 },
    { name: 'Menu Knowledge', completion: 78, students: 8 },
    { name: 'Leadership Basics', completion: 65, students: 5 }
  ];

  const culturePillars = [
    { pillar: 'Respect', score: 8.8, surveys: 12 },
    { pillar: 'Integrity', score: 8.9, surveys: 12 },
    { pillar: 'Excellence', score: 8.5, surveys: 12 },
    { pillar: 'Teamwork', score: 8.9, surveys: 12 },
    { pillar: 'Growth', score: 8.3, surveys: 12 }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <span className="text-lg">📚</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{trainingMetrics.completionRate}%</p>
                  <p className="text-xs text-slate-500">Training Completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{trainingMetrics.certifications}</p>
                  <p className="text-xs text-slate-500">Avg Certifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{trainingMetrics.cultureScore}/10</p>
                  <p className="text-xs text-slate-500">Culture Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{trainingMetrics.satisfaction}/10</p>
                  <p className="text-xs text-slate-500">Satisfaction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Course Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Course Completion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={coursesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="completion" fill="#059669" name="Completion %" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top Performing Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trainingMetrics.topPerformers.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <div>
                  <p className="font-semibold text-slate-800">#{idx + 1} {member.name}</p>
                  <p className="text-xs text-slate-600">{member.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700">{member.certs} certs</Badge>
                  <Badge className="bg-emerald-600 text-white">{member.score}/10</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Culture Pillars */}
      <Card>
        <CardHeader>
          <CardTitle>Culture Pillar Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {culturePillars.map((pillar, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">{pillar.pillar}</span>
                  <span className="text-sm text-slate-600">{pillar.score}/10 ({pillar.surveys} surveys)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-600"
                    style={{ width: `${(pillar.score / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Development Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Active Development Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { member: 'James Wright', goal: 'Leadership Certification', progress: 65 },
              { member: 'Nina Patel', goal: 'Advanced Menu Knowledge', progress: 80 },
              { member: 'Luke Chen', goal: 'Kitchen L2 Certification', progress: 45 }
            ].map((plan, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{plan.member}</span>
                  <span className="text-xs text-slate-600">{plan.progress}%</span>
                </div>
                <p className="text-xs text-slate-600 mb-2">{plan.goal}</p>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${plan.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Culture Insights */}
      <Card className="border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50">
        <CardContent className="pt-6">
          <p className="text-sm text-emerald-900 mb-2">
            <strong>🌟 Team & Culture Insights:</strong>
          </p>
          <ul className="text-xs text-emerald-800 space-y-1 ml-4">
            <li>• Culture score of 8.7/10 reflects strong team cohesion — maintain this with monthly team events</li>
            <li>• Menu Knowledge course needs attention at 78% — consider mandatory refresher session</li>
            <li>• 3 team members ready for leadership roles — invest in L2/L3 certification this quarter</li>
            <li>• Staff satisfaction at 8.9 — celebrate this at next team meeting and share what's working</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}