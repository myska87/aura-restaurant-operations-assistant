import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Heart, Users, Award, Leaf, Sparkles, Target, TrendingUp, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';

const coreValues = [
  {
    icon: Heart,
    title: 'Respect for All',
    subtitle: 'Guests, Teammates, Yourself',
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50',
    description: 'We treat everyone with dignity and kindness. Our guests deserve the best, our teammates deserve support, and you deserve to work in a place that values you.',
    practices: [
      'Greet every guest warmly',
      'Support your teammates without being asked',
      'Take care of your wellbeing',
      'Never gossip or create drama',
      'Speak up when something isn\'t right'
    ]
  },
  {
    icon: Shield,
    title: 'Hygiene is Non-Negotiable',
    subtitle: 'Clean Hands, Clean Heart',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
    description: 'Hygiene isn\'t just rules - it\'s showing respect. Clean food means we care about our guests. Clean workspace means we respect our teammates.',
    practices: [
      'Wash hands regularly and properly',
      'Report illness immediately - never work sick',
      'Keep your station spotless',
      'If you see mess - clean it',
      'Hygiene = Professional pride'
    ]
  },
  {
    icon: Target,
    title: 'Excellence Over Speed',
    subtitle: 'Do It Right, Not Just Fast',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    description: 'We don\'t cut corners. Speed matters, but quality matters more. A perfect dish served with care creates a Craving Fan for life.',
    practices: [
      'Follow recipes exactly',
      'Check temperatures properly',
      'Plate food beautifully',
      'Taste and adjust before serving',
      'Never send out food you wouldn\'t eat'
    ]
  },
  {
    icon: Users,
    title: 'Teamwork Wins',
    subtitle: 'We Rise Together',
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-50',
    description: 'No one succeeds alone. When one of us struggles, we all help. When one of us wins, we all celebrate. Chai Patta is a family.',
    practices: [
      'Help without being asked',
      'Share knowledge with new staff',
      'Celebrate wins together',
      'Own mistakes and learn',
      'Communicate clearly and kindly'
    ]
  },
  {
    icon: Sparkles,
    title: 'Create Craving Fans',
    subtitle: 'Not Just Customers',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    description: 'Our mission isn\'t to serve food - it\'s to create experiences so good that people can\'t stop thinking about us. Every interaction matters.',
    practices: [
      'Remember regular customers',
      'Go beyond expectations',
      'Fix mistakes with grace',
      'Make every dish Instagram-worthy',
      'Leave guests happier than they arrived'
    ]
  },
  {
    icon: TrendingUp,
    title: 'Continuous Improvement',
    subtitle: 'Always Growing',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    description: 'We never stop learning. Yesterday\'s best is today\'s baseline. We train, we practice, we improve, we repeat.',
    practices: [
      'Complete all training courses',
      'Ask questions - never pretend to know',
      'Try new techniques',
      'Accept feedback with grace',
      'Teach others what you learn'
    ]
  }
];

const culturePillars = [
  {
    title: 'Clean Mindset',
    description: 'Professional attitude starts with personal standards. We hold ourselves to the highest hygiene and quality standards.',
    icon: '🧼'
  },
  {
    title: 'Ownership',
    description: 'This is YOUR restaurant. Treat it like you own it. Fix problems, spot opportunities, take pride in every detail.',
    icon: '🔑'
  },
  {
    title: 'Transparency',
    description: 'We communicate openly. Mistakes happen - own them fast. Good news travels, bad news travels faster if hidden.',
    icon: '💎'
  },
  {
    title: 'Chai Patta Family',
    description: 'We support each other through challenges. We celebrate together in success. We never leave anyone behind.',
    icon: '❤️'
  }
];

export default function Culture() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-500 via-emerald-600 to-teal-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative max-w-3xl">
          <Leaf className="w-12 h-12 mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Chai Patta Culture
          </h1>
          <p className="text-xl text-white/90 mb-6">
            "We create Craving Fans — not just customers"
          </p>
          <p className="text-white/80 text-lg">
            Our values aren't posters on walls. They're how we work, how we treat each other, and how we show up every single day.
          </p>
        </div>
      </motion.div>

      {/* Welcome Message */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Welcome to the Chai Patta Family</h2>
            <p className="text-slate-700 leading-relaxed">
              You're not just an employee here. You're part of something bigger. Every parotta you roll, every chai you serve, 
              every smile you give — it all matters. Our culture is built on respect, excellence, and genuine care for each other 
              and our guests. This isn't corporate talk. This is how we actually operate.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Core Values */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Our Core Values</h2>
        <div className="space-y-6">
          {coreValues.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`h-2 bg-gradient-to-r ${value.color}`} />
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-slate-800 mb-1">{value.title}</h3>
                          <p className="text-sm text-slate-500 font-medium">{value.subtitle}</p>
                        </div>
                        <p className="text-slate-700 mb-4 leading-relaxed">{value.description}</p>
                        
                        <div className={`${value.bgColor} rounded-xl p-4`}>
                          <p className="text-sm font-semibold text-slate-700 mb-2">In Practice:</p>
                          <ul className="space-y-2">
                            {value.practices.map((practice, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-emerald-600 mt-0.5">✓</span>
                                <span>{practice}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Culture Pillars */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">The Four Pillars</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {culturePillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-3">{pillar.icon}</div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{pillar.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expectations */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle>What We Expect From You</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-600 font-bold">1</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Show Up Ready</p>
              <p className="text-sm text-slate-600">Clean uniform, positive attitude, on time, every time.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Follow SOPs & Hygiene</p>
              <p className="text-sm text-slate-600">Recipes, procedures, and safety standards are non-negotiable.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Support Your Team</p>
              <p className="text-sm text-slate-600">Help without waiting to be asked. We win together.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-600 font-bold">4</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Never Stop Learning</p>
              <p className="text-sm text-slate-600">Complete training, ask questions, grow every day.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What You Can Expect */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader>
          <CardTitle>What You Can Expect From Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Professional Training</p>
              <p className="text-sm text-slate-600">Full onboarding, certification, and ongoing development.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Supportive Team</p>
              <p className="text-sm text-slate-600">Managers who listen, teammates who help, culture that cares.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Growth Opportunities</p>
              <p className="text-sm text-slate-600">We promote from within. Your success is our success.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Safe & Fair Environment</p>
              <p className="text-sm text-slate-600">Zero tolerance for harassment, bullying, or discrimination.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Closing Message */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="pt-6 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-3">You Matter Here</h3>
          <p className="text-white/90 max-w-2xl mx-auto leading-relaxed">
            Every role at Chai Patta is important. Whether you're rolling parottas, serving chai, or managing shifts — 
            you're building something special. Thank you for being part of our story.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}