import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Users, Award, Leaf, Sparkles, Target, TrendingUp, Shield, CheckCircle, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import TrainingJourneyBar from '@/components/training/TrainingJourneyBar';
import TrainingModuleQuiz from '@/components/training/TrainingModuleQuiz';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

const hospitalityQuotes = [
  { quote: "Hospitality is making your guests feel at home, even when you wish they were.", author: "Unknown" },
  { quote: "People will forget what you said, people will forget what you did, but people will never forget how you made them feel.", author: "Maya Angelou" },
  { quote: "Excellence is not a skill, it's an attitude.", author: "Ralph Marston" },
  { quote: "Hospitality exists when you believe the other person is on your side.", author: "Danny Meyer" },
  { quote: "The heart of hospitality is about creating space for someone to feel seen and heard and loved.", author: "Unknown" },
  { quote: "Great service is not just what we do, it's who we are.", author: "Unknown" },
  { quote: "In the end, people won't remember the meal, they'll remember how you made them feel.", author: "Unknown" },
  { quote: "A guest never forgets the host who had treated him kindly.", author: "Homer" },
  { quote: "Hospitality is simply love on the loose.", author: "Unknown" },
  { quote: "Service is the rent we pay for being. It is the very purpose of life, and not something you do in your spare time.", author: "Marian Wright Edelman" },
  { quote: "The way we treat our guests is a direct reflection of how we value ourselves.", author: "Unknown" },
  { quote: "Hospitality is the art of making people feel welcome, valued, and cared for.", author: "Unknown" },
  { quote: "You can have everything in life you want if you will just help enough other people get what they want.", author: "Zig Ziglar" },
  { quote: "The customer's perception is your reality.", author: "Kate Zabriskie" },
  { quote: "It's not what you do for your guests, but how you make them feel that truly matters.", author: "Unknown" },
  { quote: "Hospitality means we take people into the space that is our lives and our minds and our hearts and our work and our efforts.", author: "Taiye Selasi" },
  { quote: "To give real service you must add something which cannot be bought or measured with money, and that is sincerity and integrity.", author: "Douglas Adams" },
  { quote: "Quality in a service or product is not what you put into it. It is what the client or customer gets out of it.", author: "Peter Drucker" },
  { quote: "The single most important thing is to make people happy. If you are making people happy, as a side effect, they will be happy to open up their wallets.", author: "Derek Sivers" },
  { quote: "Every great business is built on friendship.", author: "JC Penney" },
  { quote: "If you work just for money, you'll never make it. But if you love what you do, success will be yours.", author: "Ray Kroc" },
  { quote: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.", author: "Socrates" },
  { quote: "There are no traffic jams along the extra mile.", author: "Roger Staubach" },
  { quote: "Success is not the key to happiness. Happiness is the key to success.", author: "Albert Schweitzer" },
  { quote: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
  { quote: "Make a customer, not a sale.", author: "Katherine Barchetti" },
  { quote: "The goal as a company is to have customer service that is not just the best, but legendary.", author: "Sam Walton" },
  { quote: "Good food is the foundation of genuine happiness.", author: "Auguste Escoffier" },
  { quote: "Cooking is about passion, so it may look slightly temperamental in a way that it's too assertive to the naked eye.", author: "Gordon Ramsay" },
  { quote: "One cannot think well, love well, sleep well, if one has not dined well.", author: "Virginia Woolf" }
];

const getDailyQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return hospitalityQuotes[dayOfYear % hospitalityQuotes.length];
};

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

const cultureQuizQuestions = [
  {
    question: "At Chai Patta, skills can be trained but attitude is non-negotiable.",
    type: 'true-false',
    correct: 0
  },
  {
    question: "Cutting corners to save money is a core value at Chai Patta.",
    type: 'true-false',
    correct: 1
  },
  {
    question: "If you see a mess at your station, what should you do?",
    type: 'multiple-choice',
    options: [
      "Clean it immediately",
      "Let someone else clean it",
      "Tell your manager",
      "Ignore it if you're busy"
    ],
    correct: 0
  },
  {
    question: "Excellence Over Speed means quality matters more than speed.",
    type: 'true-false',
    correct: 0
  },
  {
    question: "How should you handle a guest complaint?",
    type: 'multiple-choice',
    options: [
      "Fix mistakes with grace and learn from it",
      "Defend yourself",
      "Make excuses",
      "Blame the team"
    ],
    correct: 0
  }
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
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const pageRef = useRef(null);
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data: acknowledgment } = useQuery({
    queryKey: ['cultureAck', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const acks = await base44.entities.CultureAcknowledgment.filter({ staff_email: user.email });
      return acks[0] || null;
    },
    enabled: !!user?.email
  });

  const alreadyCompleted = !!acknowledgment;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!pageRef.current || showQuiz || alreadyCompleted) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        setShowQuiz(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showQuiz, alreadyCompleted]);

  const { data: journeyProgress } = useQuery({
    queryKey: ['trainingJourney', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const existing = await base44.entities.TrainingJourneyProgress.filter({
        staff_email: user.email
      });
      return existing.length > 0 ? existing[0] : null;
    },
    enabled: !!user?.email
  });

  const createAckMutation = useMutation({
    mutationFn: (data) => {
      if (!quizPassed) {
        throw new Error('Quiz must be passed first');
      }
      return base44.entities.CultureAcknowledgment.create(data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['cultureAck'] });
      
      // Update training journey progress
      if (journeyProgress) {
        await base44.entities.TrainingJourneyProgress.update(journeyProgress.id, {
          valuesCompleted: true,
          currentStep: 'raving_fans',
          lastUpdated: new Date().toISOString()
        });
        queryClient.invalidateQueries({ queryKey: ['trainingJourney'] });
      }
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const handleNextModule = async () => {
    await createAckMutation.mutate({
      staff_id: user.id || '',
      staff_email: user.email,
      staff_name: user.full_name || user.email,
      ...assessment,
      acknowledged_date: new Date().toISOString()
    });
    setTimeout(() => {
      navigate(createPageUrl('RavingFans'));
    }, 500);
  };

  const handleSubmit = () => {
    if (!quizPassed) {
      alert('Please complete and pass the quiz first');
      return;
    }
    createAckMutation.mutate({
      staff_id: user.id || '',
      staff_email: user.email,
      staff_name: user.full_name || user.email,
      ...assessment,
      acknowledged_date: new Date().toISOString()
    });
    setShowAssessment(false);
  };

  const handleQuizPassed = (passed, score) => {
    if (passed) {
      setQuizPassed(true);
    }
  };

  const isComplete = assessment.raving_fans_answer.trim() && 
                     assessment.connected_value && 
                     assessment.improvement_action.trim() &&
                     acknowledged &&
                     quizPassed;

  const dailyQuote = getDailyQuote();

  return (
    <div className="space-y-8" ref={pageRef}>
      {/* Journey Progress Bar */}
      {journeyProgress && (
        <TrainingJourneyBar progress={journeyProgress} compact />
      )}

      {/* Training Journey Header */}
      <Card className="border-2 border-indigo-400 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <CardContent className="pt-8 pb-8 px-6 md:px-12">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <Star className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
              Values & Identity
            </h1>
            <p className="text-xl text-indigo-700 font-semibold mb-6">
              Who You Must Become
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4 text-lg text-slate-700 leading-relaxed">
            <p className="text-center font-semibold text-slate-900">
              At Chai Patta, skills can be trained. Attitude is non-negotiable.
            </p>
            <p className="text-center">
              You are not here to 'do a shift.' You are here to represent the brand.
            </p>
            <p className="text-center font-semibold text-indigo-900">
              Every action answers one question: Would this create a raving fan?
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Quote */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border-l-4 border-blue-500"
      >
        <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-2">
          Daily Inspiration
        </p>
        <p className="text-lg md:text-xl text-slate-800 italic mb-3">
          "{dailyQuote.quote}"
        </p>
        <p className="text-sm text-slate-600">— {dailyQuote.author}</p>
      </motion.div>

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
      {alreadyCompleted && acknowledgment && (
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

      {/* Quiz Section - Show First */}
      {!alreadyCompleted && !quizPassed && (
        <Card className="border-2 border-blue-400 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-2xl">🎯 Culture & Values Quiz</CardTitle>
            <p className="text-slate-600 text-sm">
              Test your understanding of Chai Patta's core values. You need 80% to pass.
            </p>
          </CardHeader>
          <CardContent>
            <TrainingModuleQuiz
              questions={cultureQuizQuestions}
              onQuizPassed={handleQuizPassed}
              moduleName="Culture & Values"
              passPercentage={80}
            />
          </CardContent>
        </Card>
      )}

      {/* Assessment Section - Show After Quiz Passes */}
      {!alreadyCompleted && quizPassed && (
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

                <div className="flex gap-3">
                   <Button 
                     onClick={() => setShowAssessment(false)}
                     variant="outline"
                   >
                     Back
                   </Button>
                   <Button 
                     onClick={handleNextModule}
                     disabled={!isComplete || !quizPassed || createAckMutation.isPending}
                     size="lg"
                     className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-lg h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <CheckCircle className="w-5 h-5 mr-2" />
                     {createAckMutation.isPending ? 'Continuing...' : 'Complete & Continue'}
                   </Button>
                 </div>

                {!isComplete && (
                  <p className="text-sm text-amber-700 text-center">
                    Please complete all required fields and acknowledge the commitments
                  </p>
                )}
                {!quizPassed && (
                  <p className="text-sm text-red-600 text-center font-semibold">
                    ⚠️ You must pass the quiz below before submitting
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