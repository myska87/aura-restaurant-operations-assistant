import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  MessageSquare,
  Plus,
  Search,
  Calendar,
  Users,
  Mic,
  MicOff,
  Sparkles,
  FileText,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Square,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const meetingTypes = [
  { value: 'team', label: 'Team Meeting', color: 'bg-blue-100 text-blue-700' },
  { value: 'one_on_one', label: '1:1 Meeting', color: 'bg-purple-100 text-purple-700' },
  { value: 'training', label: 'Training', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'briefing', label: 'Briefing', color: 'bg-amber-100 text-amber-700' },
  { value: 'review', label: 'Performance Review', color: 'bg-rose-100 text-rose-700' }
];

export default function Meetings() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('meetings');
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showCoachingForm, setShowCoachingForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [viewingMeeting, setViewingMeeting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

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

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => base44.entities.Meeting.list('-date'),
  });

  const { data: coaching = [] } = useQuery({
    queryKey: ['coaching', user?.email],
    queryFn: () => user?.email 
      ? base44.entities.Coaching.filter({ 
          $or: [{ staff_email: user.email }, { manager_email: user.email }] 
        })
      : [],
    enabled: !!user?.email,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.filter({ status: 'active' }),
  });

  const meetingMutation = useMutation({
    mutationFn: ({ id, data }) => id 
      ? base44.entities.Meeting.update(id, data)
      : base44.entities.Meeting.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['meetings']);
      setShowMeetingForm(false);
      setEditingMeeting(null);
      setRecordedText('');
    }
  });

  const coachingMutation = useMutation({
    mutationFn: (data) => base44.entities.Coaching.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coaching']);
      setShowCoachingForm(false);
    }
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (id) => base44.entities.Meeting.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['meetings'])
  });

  const filteredMeetings = meetings.filter(meeting => 
    meeting.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateAISummary = async (notes) => {
    if (!notes) return;
    
    setAiSummaryLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize these meeting notes into key points and action items:
        
        ${notes}
        
        Provide a JSON response with:
        {
          "summary": "Brief summary of the meeting",
          "key_points": ["point 1", "point 2"],
          "action_items": [{"action": "description", "assigned_to": "person if mentioned", "due_date": "date if mentioned"}]
        }`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            action_items: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  action: { type: "string" },
                  assigned_to: { type: "string" },
                  due_date: { type: "string" }
                }
              } 
            }
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('AI summary error:', error);
      return null;
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleMeetingSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    let aiSummary = null;
    const notes = formData.get('notes');
    if (notes && !editingMeeting?.ai_summary) {
      aiSummary = await generateAISummary(notes);
    }
    
    const data = {
      title: formData.get('title'),
      meeting_type: formData.get('meeting_type'),
      date: formData.get('date'),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      agenda: formData.get('agenda'),
      notes: notes,
      transcript: recordedText || editingMeeting?.transcript,
      ai_summary: aiSummary?.summary || editingMeeting?.ai_summary,
      action_items: aiSummary?.action_items || editingMeeting?.action_items,
      status: formData.get('status')
    };
    
    meetingMutation.mutate({ id: editingMeeting?.id, data });
  };

  const handleCoachingSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const selectedStaff = staff.find(s => s.id === formData.get('staff_id'));
    
    const data = {
      staff_id: formData.get('staff_id'),
      staff_name: selectedStaff?.full_name,
      staff_email: selectedStaff?.email,
      manager_id: user?.id,
      manager_name: user?.full_name,
      manager_email: user?.email,
      session_date: formData.get('session_date'),
      coaching_type: formData.get('coaching_type'),
      staff_self_reflection: formData.get('staff_self_reflection'),
      manager_feedback: formData.get('manager_feedback'),
      status: 'completed'
    };
    
    coachingMutation.mutate(data);
  };

  // Simple recording simulation (real implementation would use Web Speech API)
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // In production, this would use the Web Speech API
    }
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-600'
  };

  if (isLoading) return <LoadingSpinner message="Loading meetings..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings & Coaching"
        description="Schedule meetings and track coaching sessions"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="coaching">Coaching</TabsTrigger>
        </TabsList>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              onClick={() => { setEditingMeeting(null); setShowMeetingForm(true); }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Meeting
            </Button>
          </div>

          {filteredMeetings.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No meetings scheduled"
              description="Schedule your first meeting to get started."
              action={() => setShowMeetingForm(true)}
              actionLabel="Schedule Meeting"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredMeetings.map((meeting, index) => {
                  const typeInfo = meetingTypes.find(t => t.value === meeting.meeting_type);
                  
                  return (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setViewingMeeting(meeting)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeInfo?.color || 'bg-slate-100'}`}>
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingMeeting(meeting); setShowMeetingForm(true); }}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={(e) => { e.stopPropagation(); deleteMeetingMutation.mutate(meeting.id); }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1">{meeting.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(meeting.date), 'MMM d, yyyy')}</span>
                        {meeting.start_time && <span>• {meeting.start_time}</span>}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge className={statusColors[meeting.status]}>
                          {meeting.status}
                        </Badge>
                        <Badge variant="outline">{typeInfo?.label}</Badge>
                        {meeting.ai_summary && (
                          <Badge className="bg-purple-100 text-purple-700">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Summary
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Coaching Tab */}
        <TabsContent value="coaching" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => setShowCoachingForm(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Coaching Session
            </Button>
          </div>

          {coaching.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No coaching sessions"
              description="Start a coaching session with a team member."
              action={() => setShowCoachingForm(true)}
              actionLabel="Start Coaching"
            />
          ) : (
            <div className="space-y-4">
              {coaching.map((session) => (
                <Card key={session.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">{session.staff_name}</h3>
                        <p className="text-sm text-slate-500">
                          {format(new Date(session.session_date), 'MMM d, yyyy')} • {session.coaching_type}
                        </p>
                      </div>
                      <Badge className={
                        session.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }>
                        {session.status}
                      </Badge>
                    </div>
                    
                    {session.manager_feedback && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Manager Feedback</p>
                        <p className="text-sm text-slate-600">{session.manager_feedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Meeting Form Dialog */}
      <Dialog open={showMeetingForm} onOpenChange={setShowMeetingForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMeeting ? 'Edit Meeting' : 'New Meeting'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMeetingSubmit} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input name="title" defaultValue={editingMeeting?.title} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select name="meeting_type" defaultValue={editingMeeting?.meeting_type || 'team'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {meetingTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editingMeeting?.status || 'scheduled'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Date *</Label>
                <Input name="date" type="date" defaultValue={editingMeeting?.date || format(new Date(), 'yyyy-MM-dd')} required />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input name="start_time" type="time" defaultValue={editingMeeting?.start_time} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input name="end_time" type="time" defaultValue={editingMeeting?.end_time} />
              </div>
            </div>
            
            <div>
              <Label>Agenda</Label>
              <Textarea name="agenda" defaultValue={editingMeeting?.agenda} rows={2} />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Notes / Transcript</Label>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={toggleRecording}
                  className={isRecording ? 'bg-red-50 border-red-200 text-red-600' : ''}
                >
                  {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
              </div>
              <Textarea 
                name="notes" 
                defaultValue={editingMeeting?.notes || recordedText}
                rows={4} 
                placeholder="Meeting notes will be auto-summarized by AI..."
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowMeetingForm(false)}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={meetingMutation.isPending || aiSummaryLoading}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700"
              >
                {aiSummaryLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  editingMeeting ? 'Update' : 'Save'
                )} Meeting
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Coaching Form Dialog */}
      <Dialog open={showCoachingForm} onOpenChange={setShowCoachingForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Coaching Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCoachingSubmit} className="space-y-4">
            <div>
              <Label>Staff Member *</Label>
              <Select name="staff_id" required>
                <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name} - {s.position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input name="session_date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
              </div>
              <div>
                <Label>Type *</Label>
                <Select name="coaching_type" defaultValue="feedback">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="goal_setting">Goal Setting</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Staff Self-Reflection</Label>
              <Textarea name="staff_self_reflection" rows={3} placeholder="Staff member's own assessment..." />
            </div>
            
            <div>
              <Label>Manager Feedback</Label>
              <Textarea name="manager_feedback" rows={3} placeholder="Your feedback and observations..." />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCoachingForm(false)}>Cancel</Button>
              <Button type="submit" disabled={coachingMutation.isPending} className="bg-gradient-to-r from-purple-600 to-purple-700">
                Save Session
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Meeting Dialog */}
      <Dialog open={!!viewingMeeting} onOpenChange={() => setViewingMeeting(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewingMeeting && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingMeeting.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColors[viewingMeeting.status]}>{viewingMeeting.status}</Badge>
                  <Badge variant="outline">{meetingTypes.find(t => t.value === viewingMeeting.meeting_type)?.label}</Badge>
                  <Badge variant="outline">{format(new Date(viewingMeeting.date), 'MMM d, yyyy')}</Badge>
                </div>
                
                {viewingMeeting.ai_summary && (
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        AI Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-purple-800">{viewingMeeting.ai_summary}</p>
                    </CardContent>
                  </Card>
                )}
                
                {viewingMeeting.action_items?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Action Items</h4>
                    <div className="space-y-2">
                      {viewingMeeting.action_items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                          <div>
                            <p className="text-sm">{item.action}</p>
                            {item.assigned_to && (
                              <p className="text-xs text-slate-500">Assigned to: {item.assigned_to}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {viewingMeeting.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{viewingMeeting.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}