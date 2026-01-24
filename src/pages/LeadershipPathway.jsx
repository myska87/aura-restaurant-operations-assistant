import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Trophy,
  TrendingUp,
  Lock,
  CheckCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Users,
  Heart,
  Shield,
  Target,
  Sparkles
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import TrainingJourneyBar from '@/components/training/TrainingJourneyBar';
import { format } from 'date-fns';

const leadershipLevels = [
  {
    level: 0,
    name: 'Trainee',
    icon: '🌱',
    color: 'from-slate-400 to-slate-500',
    description: 'Learning the basics',
    requirements: {
      training: 'Foundation + L1',
      timeInRole: '0 months',
      hygiene: 'L1 Certificate',
      incidents: 'N/A',
      sopCompliance: '80%',
      serviceRecovery: 'N/A'
    }
  },
  {
    level: 1,
    name: 'Team Member',
    icon: '⚡',
    color: 'from-blue-500 to-blue-600',
    description: 'Consistent performer',
    requirements: {
      training: 'Foundation + L1 + L2',
      timeInRole: '3 months',
      hygiene: 'L2 Certificate',
      incidents: '0 critical in 3 months',
      sopCompliance: '85%',
      serviceRecovery: '80% satisfied'
    }
  },
  {
    level: 2,
    name: 'Senior Team Member',
    icon: '⭐',
    color: 'from-emerald-500 to-emerald-600',
    description: 'Role model & mentor',
    requirements: {
      training: 'All levels complete',
      timeInRole: '6 months',
      hygiene: 'L3 Certificate',
      incidents: '0 critical in 6 months',
      sopCompliance: '90%',
      serviceRecovery: '85% satisfied'
    }
  },
  {
    level: 3,
    name: 'Shift Leader',
    icon: '🔥',
    color: 'from-amber-500 to-amber-600',
    description: 'Leads by example',
    requirements: {
      training: 'All + Leadership modules',
      timeInRole: '12 months',
      hygiene: 'L3 (renewed)',
      incidents: '0 critical in 12 months',
      sopCompliance: '95%',
      serviceRecovery: '90% satisfied'
    }
  },
  {
    level: 4,
    name: 'Floor Manager',
    icon: '👑',
    color: 'from-purple-500 to-pink-600',
    description: 'Culture guardian',
    requirements: {
      training: 'Advanced + Manager Training',
      timeInRole: '18 months',
      hygiene: 'L3 (current)',
      incidents: '0 critical in 18 months',
      sopCompliance: '98%',
      serviceRecovery: '95% satisfied'
    }
  }
];

export default function LeadershipPathway() {
  const [user, setUser] = useState(null);
  const [showJournal, setShowJournal] = useState(false);
  const [showNomination, setShowNomination] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [journalData, setJournalData] = useState({ title: '', content: '', entry_type: 'reflection', linked_value: '' });
  const [nominationData, setNominationData] = useState({ reason: '' });

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

  const { data: myLeadership } = useQuery({
    queryKey: ['myLeadership', user?.email],
    queryFn: async () => {
      const levels = await base44.entities.LeadershipLevel.filter({ staff_email: user.email });
      return levels[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['myJournal', user?.email],
    queryFn: () => base44.entities.LeadershipJournal.filter({ staff_email: user.email }, '-entry_date', 20),
    enabled: !!user?.email
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['myCertificates', user?.email],
    queryFn: () => base44.entities.Certificate.filter({ staff_email: user.email }),
    enabled: !!user?.email
  });

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

  const { data: allStaff = [] } = useQuery({
    queryKey: ['allStaff'],
    queryFn: () => base44.entities.Staff.list(),
    enabled: user?.role === 'manager' || user?.role === 'owner' || user?.role === 'admin'
  });

  const { data: pendingNominations = [] } = useQuery({
    queryKey: ['pendingNominations'],
    queryFn: () => base44.entities.LeadershipLevel.filter({ status: 'pending_approval' }),
    enabled: user?.role === 'owner' || user?.role === 'admin'
  });

  const addJournalMutation = useMutation({
    mutationFn: (data) => base44.entities.LeadershipJournal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myJournal']);
      setShowJournal(false);
      setJournalData({ title: '', content: '', entry_type: 'reflection', linked_value: '' });
    }
  });

  const nominateStaffMutation = useMutation({
    mutationFn: async ({ staffEmail, newLevel, reason }) => {
      const existing = await base44.entities.LeadershipLevel.filter({ staff_email: staffEmail });
      const staff = allStaff.find(s => s.email === staffEmail);
      
      if (existing.length > 0) {
        return base44.entities.LeadershipLevel.update(existing[0].id, {
          current_level: newLevel,
          level_name: leadershipLevels[newLevel].name,
          status: 'pending_approval',
          nomination_reason: reason,
          promoted_by: user.email,
          promoted_by_name: user.full_name || user.email
        });
      } else {
        return base44.entities.LeadershipLevel.create({
          staff_id: staff?.id || '',
          staff_email: staffEmail,
          staff_name: staff?.full_name || staffEmail,
          current_level: newLevel,
          level_name: leadershipLevels[newLevel].name,
          status: 'pending_approval',
          nomination_reason: reason,
          promoted_by: user.email,
          promoted_by_name: user.full_name || user.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingNominations']);
      setShowNomination(false);
      setSelectedStaff(null);
      setNominationData({ reason: '' });
    }
  });

  const approveNominationMutation = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.LeadershipLevel.update(id, {
      status: 'active',
      hq_approved: true,
      hq_approved_by: user.email,
      hq_approval_date: format(new Date(), 'yyyy-MM-dd'),
      hq_review_notes: notes,
      promotion_date: format(new Date(), 'yyyy-MM-dd')
    }),
    onSuccess: () => queryClient.invalidateQueries(['pendingNominations'])
  });

  const handleAddJournal = () => {
    addJournalMutation.mutate({
      staff_id: user.id || '',
      staff_email: user.email,
      staff_name: user.full_name || user.email,
      entry_date: new Date().toISOString(),
      ...journalData
    });
  };

  const currentLevel = myLeadership?.current_level || 0;
  const currentLevelInfo = leadershipLevels[currentLevel];
  const nextLevelInfo = leadershipLevels[currentLevel + 1];

  const calculateProgress = () => {
    // Simplified progress calculation
    const hygieneLevel = certificates.length;
    const baseProgress = Math.min(hygieneLevel * 20, 100);
    return baseProgress;
  };

  if (!user) return <LoadingSpinner message="Loading leadership pathway..." />;

  // Check if certified
  const isCertified = journeyProgress?.certified;

  if (!isCertified) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <TrainingJourneyBar progress={journeyProgress} compact />
        
        <Card className="border-2 border-purple-400">
          <CardContent className="pt-6 text-center">
            <Lock className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Growth Centre Locked</h2>
            <p className="text-lg text-slate-700 mb-2">
              Complete your certification to unlock the Growth Centre.
            </p>
            <p className="text-sm text-slate-600 mb-6">
              This is your space for personal and professional development.
            </p>
            <Button
              onClick={() => window.location.href = createPageUrl('TrainingAcademy')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Back to Training Academy
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Journey Progress Bar */}
      {journeyProgress && (
        <TrainingJourneyBar progress={journeyProgress} compact />
      )}

      {/* Growth Centre Header */}
      <Card className="border-2 border-purple-400 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <CardContent className="pt-8 pb-8 px-6 md:px-12">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
              Growth Centre
            </h1>
            <p className="text-xl text-purple-700 font-semibold mb-6">
              This Is Only the Beginning
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4 text-lg text-slate-700 leading-relaxed text-center">
            <p className="font-semibold text-slate-900">
              Chai Patta is a place to grow — personally and professionally.
            </p>
            <p>
              If you grow, the brand grows. If the brand grows, we all win.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Leadership Pathway</h1>
              <p className="text-white/90 text-lg">Grow from within. Lead with values.</p>
            </div>
          </div>
          <p className="text-white/80 leading-relaxed">
            At Chai Patta, we build leaders, not replace staff. Progress through 5 levels by mastering skills, 
            embodying values, and lifting others up.
          </p>
        </div>
      </motion.div>

      {/* Current Level */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">{currentLevelInfo.icon}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-amber-900">Level {currentLevel}: {currentLevelInfo.name}</h2>
              <p className="text-amber-700">{currentLevelInfo.description}</p>
              {myLeadership?.promotion_date && (
                <p className="text-sm text-amber-600 mt-1">
                  Since {format(new Date(myLeadership.promotion_date), 'MMM yyyy')}
                </p>
              )}
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-600">{calculateProgress()}%</div>
              <p className="text-xs text-amber-700">Progress to Next</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pathway Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Leadership Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leadershipLevels.map((level, index) => {
              const isUnlocked = currentLevel >= level.level;
              const isCurrent = currentLevel === level.level;
              
              return (
                <motion.div
                  key={level.level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    p-4 rounded-xl border-2 relative
                    ${isCurrent ? 'border-amber-400 bg-amber-50' : 
                      isUnlocked ? 'border-emerald-200 bg-emerald-50' : 
                      'border-slate-200 bg-slate-50 opacity-60'}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{level.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">Level {level.level}: {level.name}</h3>
                        {isCurrent && <Badge className="bg-amber-500">Current</Badge>}
                        {isUnlocked && !isCurrent && <Badge className="bg-emerald-500">Achieved</Badge>}
                        {!isUnlocked && <Lock className="w-4 h-4 text-slate-400" />}
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{level.description}</p>
                      
                      <div className="grid md:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 bg-white rounded">
                          <p className="text-slate-500">Training</p>
                          <p className="font-semibold">{level.requirements.training}</p>
                        </div>
                        <div className="p-2 bg-white rounded">
                          <p className="text-slate-500">Time in Role</p>
                          <p className="font-semibold">{level.requirements.timeInRole}</p>
                        </div>
                        <div className="p-2 bg-white rounded">
                          <p className="text-slate-500">SOP Compliance</p>
                          <p className="font-semibold">{level.requirements.sopCompliance}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leadership Journal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Leadership Journal
            </span>
            <Button onClick={() => setShowJournal(true)} size="sm" className="bg-purple-600">
              <Sparkles className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {journalEntries.length > 0 ? (
            <div className="space-y-3">
              {journalEntries.map(entry => (
                <div key={entry.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{entry.title}</h4>
                      <p className="text-xs text-slate-500">{format(new Date(entry.entry_date), 'MMM d, yyyy')}</p>
                    </div>
                    <Badge variant="outline">{entry.entry_type}</Badge>
                  </div>
                  <p className="text-sm text-slate-700">{entry.content}</p>
                  {entry.manager_feedback && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-700 font-semibold mb-1">Manager Feedback:</p>
                      <p className="text-sm text-blue-900">{entry.manager_feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">Start documenting your leadership journey</p>
          )}
        </CardContent>
      </Card>

      {/* Manager Tools */}
      {(user.role === 'manager' || user.role === 'owner' || user.role === 'admin') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Manager Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowNomination(true)} className="w-full bg-emerald-600">
              Nominate Staff for Promotion
            </Button>
          </CardContent>
        </Card>
      )}

      {/* HQ Approvals */}
      {(user.role === 'owner' || user.role === 'admin') && pendingNominations.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Pending HQ Approval ({pendingNominations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingNominations.map(nom => (
              <div key={nom.id} className="p-4 bg-white rounded-lg border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{nom.staff_name}</h4>
                    <p className="text-sm text-slate-600">
                      Nominated for Level {nom.current_level}: {nom.level_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">By {nom.promoted_by_name}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mb-3">{nom.nomination_reason}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveNominationMutation.mutate({ id: nom.id, notes: 'Approved' })}
                    className="bg-emerald-600"
                  >
                    Approve
                  </Button>
                  <Button size="sm" variant="outline">Review Later</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Journal Dialog */}
      <Dialog open={showJournal} onOpenChange={setShowJournal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Entry Type</Label>
              <Select value={journalData.entry_type} onValueChange={(v) => setJournalData({...journalData, entry_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reflection">Reflection</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="goal">Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={journalData.title}
                onChange={(e) => setJournalData({...journalData, title: e.target.value})}
                placeholder="What's on your mind?"
              />
            </div>
            <div>
              <Label>Entry</Label>
              <Textarea
                value={journalData.content}
                onChange={(e) => setJournalData({...journalData, content: e.target.value})}
                placeholder="Write your thoughts..."
                rows={5}
              />
            </div>
            <div>
              <Label>Link to Value (Optional)</Label>
              <Select value={journalData.linked_value} onValueChange={(v) => setJournalData({...journalData, linked_value: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="respect">Respect</SelectItem>
                  <SelectItem value="hygiene">Hygiene</SelectItem>
                  <SelectItem value="excellence">Excellence</SelectItem>
                  <SelectItem value="teamwork">Teamwork</SelectItem>
                  <SelectItem value="raving_fans">Raving Fans</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowJournal(false)}>Cancel</Button>
              <Button
                onClick={handleAddJournal}
                disabled={!journalData.title || !journalData.content}
                className="bg-purple-600"
              >
                Save Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nomination Dialog */}
      <Dialog open={showNomination} onOpenChange={setShowNomination}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nominate for Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Staff Member</Label>
              <Select onValueChange={(v) => setSelectedStaff(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose staff..." />
                </SelectTrigger>
                <SelectContent>
                  {allStaff.map(staff => (
                    <SelectItem key={staff.id} value={staff.email}>{staff.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedStaff && (
              <>
                <div>
                  <Label>Promote to Level</Label>
                  <Select onValueChange={(v) => setNominationData({...nominationData, newLevel: parseInt(v)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level..." />
                    </SelectTrigger>
                    <SelectContent>
                      {leadershipLevels.map(level => (
                        <SelectItem key={level.level} value={level.level.toString()}>
                          Level {level.level}: {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reason for Nomination</Label>
                  <Textarea
                    value={nominationData.reason}
                    onChange={(e) => setNominationData({...nominationData, reason: e.target.value})}
                    placeholder="Why is this person ready for the next level?"
                    rows={4}
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNomination(false)}>Cancel</Button>
              <Button
                onClick={() => nominateStaffMutation.mutate({
                  staffEmail: selectedStaff,
                  newLevel: nominationData.newLevel,
                  reason: nominationData.reason
                })}
                disabled={!selectedStaff || !nominationData.reason || nominationData.newLevel === undefined}
                className="bg-emerald-600"
              >
                Submit Nomination
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}