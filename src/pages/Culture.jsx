import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Users, Award, Leaf, Sparkles, Target, TrendingUp, Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

const coreValues = [
  {
    id: 'respect',
    icon: '🧡',
    title: 'Respect for All',
    subtitle: 'Guests · Teammates · Yourself',
    color: 'from-rose-500 to-pink-600',
    description: 'We treat everyone with dignity and kindness. Our guests deserve the best. Our teammates deserve support. And you deserve to work in a place that values you.',
    practices: [
      'Greet every guest warmly',
      'Support teammates without being asked',
      'Take care of your wellbeing',
      'Never gossip or create drama',
      'Speak up when something isn\'t right'
    ]
  },
  {
    id: 'hygiene',
    icon: '🧼',
    title: 'Hygiene is Non-Negotiable',
    subtitle: 'Clean Hands · Clean Heart',
    color: 'from-blue-500 to-cyan-600',
    description: 'Hygiene isn\'t just rules — it\'s respect. Clean food means we care about our guests. A clean workspace means we respect our teammates.',
    practices: [
      'Wash hands properly and regularly',
      'Report illness immediately — never work sick',
      'Keep your station spotless',
      'If you see mess, clean it',
      'Hygiene = professional pride'
    ]
  },
  {
    id: 'excellence',
    icon: '⭐',
    title: 'Excellence Over Speed',
    subtitle: 'Do It Right, Not Just Fast',
    color: 'from-amber-500 to-orange-600',
    description: 'Speed matters — but quality matters more. A perfect dish served with care creates a Raving Fan for life.',
    practices: [
      'Follow recipes exactly',
      'Check temperatures properly',
      'Plate food beautifully',
      'Taste before serving',
      'Never serve food you wouldn\'t eat yourself'
    ]
  },
  {
    id: 'teamwork',
    icon: '🤝',
    title: 'Teamwork Wins',
    subtitle: 'We Rise Together',
    color: 'from-purple-500 to-indigo-600',
    description: 'No one succeeds alone. When one of us struggles, we help. When one of us wins, we celebrate. Chai Patta is a family.',
    practices: [
      'Help without being asked',
      'Share knowledge with new staff',
      'Celebrate wins together',
      'Own mistakes and learn',
      'Communicate clearly and kindly'
    ]
  },
  {
    id: 'raving_fans',
    icon: '🔥',
    title: 'Create Raving Fans',
    subtitle: 'Not Just Customers',
    color: 'from-emerald-500 to-teal-600',
    description: 'Our mission isn\'t just to serve food. It\'s to create experiences so good people can\'t stop talking about us.',
    practices: [
      'Remember regular guests',
      'Go beyond expectations',
      'Fix mistakes with grace',
      'Make dishes Instagram-worthy',
      'Leave guests happier than they arrived'
    ]
  },
  {
    id: 'improvement',
    icon: '📈',
    title: 'Continuous Improvement',
    subtitle: 'Always Growing',
    color: 'from-pink-500 to-rose-600',
    description: 'We never stop learning. Yesterday\'s best is today\'s baseline.',
    practices: [
      'Complete all training courses',
      'Ask questions — never pretend',
      'Try new techniques',
      'Accept feedback with grace',
      'Teach others what you learn'
    ]
  }
];

const pillars = [
  { icon: '🧼', title: 'Clean Mindset', description: 'Professional standards start with personal standards.' },
  { icon: '🔑', title: 'Ownership', description: 'This is your restaurant. Act like it.' },
  { icon: '💎', title: 'Transparency', description: 'Speak honestly. Own mistakes early.' },
  { icon: '❤️', title: 'Chai Patta Family', description: 'We support each other. Always.' }
];

export default function Culture() {
  const [user, setUser] = useState(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessment, setAssessment] = useState({
    raving_fans_answer: '',
    connected_value: '',
    connected_value_why: '',
    improvement_action: ''
  });
  const [acknowledged, setAcknowledged] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: acknowledgment } = useQuery({
    queryKey: ['cultureAck', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const acks = await base44.entities.CultureAcknowledgment.filter({ staff_email: user.email });
      return acks[0] || null;
    },
    enabled: !!user?.email
  });

  const createAckMutation = useMutation({
    mutationFn: (data) => base44.entities.CultureAcknowledgment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cultureAck']);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  });

  const handleSubmit = () => {
    createAckMutation.mutate({
      staff_id: user.id || '',
      staff_email: user.email,
      staff_name: user.full_name || user.email,
      ...assessment,
      acknowledged_date: new Date().toISOString()
    });
    setShowAssessment(false);
  };

  const isComplete = assessment.raving_fans_answer.trim() && 
                     assessment.connected_value && 
                     assessment.improvement_action.trim() &&
                     acknowledged;

  const alreadyCompleted = !!acknowledgment;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-500 via-rose-600 to-pink-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative max-w-3xl">
          <Leaf className="w-12 h-12 mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Culture & Values | Chai Patta
          </h1>
          <p className="text-2xl font-semibold text-white/95 mb-4">
            "We create RAVING FANS — not just customers."
          </p>
          <p className="text-lg text-white/85 leading-relaxed">
            Our values are not posters on walls. They are how we work, how we treat each other, 
            and how we show up every single day.
          </p>
        </div>
      </motion.div>

      {/* Completion Status */}
      {alreadyCompleted && (
        <Card className="bg-emerald-50 border-emerald-300">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">Culture Training Completed</p>
                <p className="text-sm text-emerald-700">
                  Completed on {format(new Date(acknowledgment.acknowledged_date), 'PPP')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welcome */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">🤍 Welcome to the Chai Patta Family</h2>
          <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4">
            <p>You're not just an employee here. You're part of something bigger.</p>
            <p>
              Every parotta you roll.<br/>
              Every chai you serve.<br/>
              Every smile you give.
            </p>
            <p><strong>It all matters.</strong></p>
            <p>
              Our culture is built on respect, excellence, and genuine care — for each other and for our guests.
              This isn't corporate talk. This is how we actually operate.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Core Values */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-6">🌟 Our Core Values</h2>
        <div className="space-y-4">
          {coreValues.map((value, index) => (
            <motion.div
              key={value.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`h-2 bg-gradient-to-r ${value.color}`} />
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{value.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-800 mb-1">{value.title}</h3>
                      <p className="text-lg text-slate-600 mb-4">{value.subtitle}</p>
                      <p className="text-slate-700 mb-4 leading-relaxed">{value.description}</p>
                      
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-sm font-bold text-slate-800 mb-3">In Practice:</p>
                        <ul className="space-y-2">
                          {value.practices.map((practice, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="text-emerald-600 font-bold mt-0.5">✓</span>
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
          ))}
        </div>
      </div>

      {/* Four Pillars */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-6">🧱 The Four Pillars</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-5xl mb-3">{pillar.icon}</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{pillar.title}</h3>
                  <p className="text-slate-600">{pillar.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expectations */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <CardHeader>
            <CardTitle>📌 What We Expect From You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { num: '1️⃣', text: 'Show up ready — clean uniform, positive attitude, on time' },
              { num: '2️⃣', text: 'Follow SOPs & hygiene — non-negotiable' },
              { num: '3️⃣', text: 'Support your team — we win together' },
              { num: '4️⃣', text: 'Never stop learning' }
            ].map(item => (
              <div key={item.num} className="flex items-start gap-3">
                <span className="text-2xl">{item.num}</span>
                <p className="text-slate-700 pt-1">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardHeader>
            <CardTitle>🎁 What You Can Expect From Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Award, text: 'Professional training & certification' },
              { icon: Users, text: 'Supportive leadership & team' },
              { icon: TrendingUp, text: 'Growth & promotion opportunities' },
              { icon: Shield, text: 'Safe, fair, respectful environment' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <item.icon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-slate-700">{item.text}</p>
              </div>
            ))}
            <p className="text-sm text-emerald-800 font-semibold pt-2">
              Zero tolerance for bullying, harassment, or discrimination.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Closing Message */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="pt-6 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-3">🤍 You Matter Here</h3>
          <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Every role at Chai Patta is important. Whether you're rolling parottas, serving chai, or managing shifts — 
            you are building something special. Thank you for being part of our story.
          </p>
        </CardContent>
      </Card>

      {/* Assessment Section */}
      {!alreadyCompleted && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-2xl">📝 Mini Assessment (Mandatory)</CardTitle>
            <p className="text-slate-600 text-sm">
              Complete this assessment to unlock Hygiene Level 1, access SOPs, and be assigned shifts.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showAssessment ? (
              <Button 
                onClick={() => setShowAssessment(true)}
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-lg h-14"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Assessment
              </Button>
            ) : (
              <div className="space-y-6">
                {/* Question 1 */}
                <div>
                  <label className="text-sm font-bold text-slate-800 mb-2 block">
                    1. What does "Raving Fans" mean to you in your role? <span className="text-red-600">*</span>
                  </label>
                  <Textarea
                    value={assessment.raving_fans_answer}
                    onChange={(e) => setAssessment({...assessment, raving_fans_answer: e.target.value})}
                    placeholder="Share your understanding..."
                    rows={4}
                  />
                </div>

                {/* Question 2 */}
                <div>
                  <label className="text-sm font-bold text-slate-800 mb-2 block">
                    2. Which Chai Patta value do you connect with most, and why? <span className="text-red-600">*</span>
                  </label>
                  <Select 
                    value={assessment.connected_value} 
                    onValueChange={(v) => setAssessment({...assessment, connected_value: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a value..." />
                    </SelectTrigger>
                    <SelectContent>
                      {coreValues.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.icon} {v.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assessment.connected_value && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3"
                    >
                      <Textarea
                        value={assessment.connected_value_why}
                        onChange={(e) => setAssessment({...assessment, connected_value_why: e.target.value})}
                        placeholder="Why does this value resonate with you?"
                        rows={3}
                      />
                    </motion.div>
                  )}
                </div>

                {/* Question 3 */}
                <div>
                  <label className="text-sm font-bold text-slate-800 mb-2 block">
                    3. What is one action you will take to improve guest experience? <span className="text-red-600">*</span>
                  </label>
                  <Textarea
                    value={assessment.improvement_action}
                    onChange={(e) => setAssessment({...assessment, improvement_action: e.target.value})}
                    placeholder="One specific action you commit to..."
                    rows={3}
                  />
                </div>

                {/* Acknowledgment */}
                <Card className="bg-white border-slate-300">
                  <CardContent className="pt-4 space-y-4">
                    <h4 className="font-bold text-slate-800">✅ Acknowledgement (Required)</h4>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        className="mt-1 w-5 h-5"
                      />
                      <span className="text-sm text-slate-700">
                        <strong>I have read and understood the Chai Patta Culture & Values.</strong><br/>
                        I commit to living these values every day at work.
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <label className="text-xs text-slate-600">Full Name</label>
                        <Input value={user?.full_name || ''} disabled className="bg-slate-50" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600">Date</label>
                        <Input value={format(new Date(), 'PP')} disabled className="bg-slate-50" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handleSubmit}
                  disabled={!isComplete}
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-lg h-14"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit & Complete Culture Training
                </Button>

                {!isComplete && (
                  <p className="text-sm text-amber-700 text-center">
                    Please complete all required fields and acknowledge the commitments
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}