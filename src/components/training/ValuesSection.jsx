import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Award, Sparkles, Shield, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const values = [
  {
    id: 'people_first',
    icon: Heart,
    title: 'People First',
    subtitle: 'Guests, Team, Community',
    color: 'from-rose-500 to-pink-600',
    description: 'Every person matters. Our guests deserve the best experience, our teammates deserve support, and our community deserves our care.',
    dailyWork: 'Greet guests warmly, help teammates without being asked, speak kindly, listen actively.'
  },
  {
    id: 'excellence',
    icon: Award,
    title: 'Excellence as Standard',
    subtitle: 'Not perfection, but commitment',
    color: 'from-amber-500 to-orange-600',
    description: 'We do things right, not just fast. Quality creates Craving Fans. Speed without standards is just rushing.',
    dailyWork: 'Follow recipes exactly, check temperatures properly, plate beautifully, never send out food you wouldn\'t eat.'
  },
  {
    id: 'emotional_hospitality',
    icon: Sparkles,
    title: 'Emotional Hospitality',
    subtitle: 'Create memories, not transactions',
    color: 'from-purple-500 to-indigo-600',
    description: 'We don\'t just serve food - we create experiences people can\'t stop thinking about. Every interaction is a chance to make someone\'s day.',
    dailyWork: 'Remember regulars, go beyond expectations, fix mistakes with grace, make every dish Instagram-worthy.'
  },
  {
    id: 'ownership',
    icon: Shield,
    title: 'Ownership & Responsibility',
    subtitle: 'Act like you own the place',
    color: 'from-blue-500 to-cyan-600',
    description: 'This is YOUR restaurant. Fix problems when you see them, spot opportunities, take pride in every detail - even when no one is watching.',
    dailyWork: 'If you see mess - clean it. If you spot an issue - fix it or report it. Own your mistakes and learn fast.'
  },
  {
    id: 'respect',
    icon: Users,
    title: 'Respect & Clean Mindset',
    subtitle: 'Hygiene is respect',
    color: 'from-emerald-500 to-teal-600',
    description: 'Respect shows in how we maintain standards. Clean hands = respect for guests. Clean workspace = respect for team. Clean mindset = professional pride.',
    dailyWork: 'Wash hands properly, keep uniform spotless, maintain high hygiene standards, never cut corners.'
  }
];

export default function ValuesSection({ compact = false }) {
  if (compact) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {values.slice(0, 3).map((value, idx) => {
          const Icon = value.icon;
          return (
            <Card key={value.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${value.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{value.title}</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{value.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {values.map((value, idx) => {
        const Icon = value.icon;
        return (
          <motion.div
            key={value.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-1.5 bg-gradient-to-r ${value.color}`} />
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-0.5">{value.title}</h3>
                    <p className="text-sm text-slate-500 mb-3">{value.subtitle}</p>
                    <p className="text-slate-700 mb-3 text-sm leading-relaxed">{value.description}</p>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-1">In Daily Work:</p>
                      <p className="text-xs text-slate-600">{value.dailyWork}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export { values };