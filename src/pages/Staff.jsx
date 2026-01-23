import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  MoreVertical,
  Edit,
  Trash2,
  GraduationCap,
  Calendar,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StaffRoleManager from '@/components/staff/StaffRoleManager';
import PrivateDocumentVault from '@/components/staff/PrivateDocumentVault';
import PerformanceAppointmentManager from '@/components/staff/PerformanceAppointmentManager';
import JobDescriptionEditor from '@/components/staff/JobDescriptionEditor';
import VisibilityControlPanel from '@/components/staff/VisibilityControlPanel';

export default function Staff() {
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [user, setUser] = useState(null);

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

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list('-created_date'),
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => base44.entities.Certificate.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Staff.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      setShowForm(false);
      setEditingStaff(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Staff.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      setShowForm(false);
      setEditingStaff(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Staff.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['staff'])
  });

  const filteredStaff = staffList.filter(staff => {
    const matchesSearch = 
      staff.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.position?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || staff.role === filterRole;
    const matchesDept = filterDepartment === 'all' || staff.department === filterDepartment;
    return matchesSearch && matchesRole && matchesDept;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    if (data.hourly_rate) data.hourly_rate = parseFloat(data.hourly_rate);
    
    if (editingStaff) {
      updateMutation.mutate({ id: editingStaff.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStaffCertificates = (staffId) => {
    return certificates.filter(c => c.staff_id === staffId);
  };

  const roleColors = {
    staff: 'bg-slate-100 text-slate-600',
    manager: 'bg-blue-100 text-blue-600',
    owner: 'bg-amber-100 text-amber-600'
  };

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-600',
    on_leave: 'bg-amber-100 text-amber-600',
    terminated: 'bg-red-100 text-red-600'
  };

  if (isLoading) return <LoadingSpinner message="Loading staff..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        description={`${staffList.length} team members`}
        action={() => { setEditingStaff(null); setShowForm(true); }}
        actionLabel="Add Staff"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48 md:w-64"
            />
          </div>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depts</SelectItem>
              <SelectItem value="kitchen">Kitchen</SelectItem>
              <SelectItem value="front_of_house">FOH</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="management">Management</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {filteredStaff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff members yet"
          description="Add your first team member to get started with staff management."
          action={() => setShowForm(true)}
          actionLabel="Add Staff Member"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredStaff.map((staff, index) => {
              const staffCerts = getStaffCertificates(staff.id);
              
              return (
                <motion.div
                  key={staff.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={staff.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-semibold">
                          {staff.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-slate-800">{staff.full_name}</h3>
                        <p className="text-sm text-slate-500">{staff.position}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingStaff(staff); setShowForm(true); }}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteMutation.mutate(staff.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{staff.email}</span>
                    </div>
                    {staff.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{staff.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={roleColors[staff.role] || roleColors.staff}>
                      {staff.role || 'Staff'}
                    </Badge>
                    <Badge className={statusColors[staff.status] || statusColors.active}>
                      {staff.status?.replace('_', ' ') || 'Active'}
                    </Badge>
                    {staff.department && (
                      <Badge variant="outline">{staff.department.replace('_', ' ')}</Badge>
                    )}
                  </div>

                  {staffCerts.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-slate-500">{staffCerts.length} certificate(s)</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Staff Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Full Name *</Label>
                <Input 
                  name="full_name" 
                  defaultValue={editingStaff?.full_name}
                  required 
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input 
                  name="email" 
                  type="email"
                  defaultValue={editingStaff?.email}
                  required 
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  name="phone" 
                  defaultValue={editingStaff?.phone}
                />
              </div>
              <div>
                <Label>Position *</Label>
                <Input 
                  name="position" 
                  defaultValue={editingStaff?.position}
                  required 
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select name="role" defaultValue={editingStaff?.role || 'staff'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select name="department" defaultValue={editingStaff?.department || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="front_of_house">Front of House</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editingStaff?.status || 'active'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hourly Rate (£)</Label>
                <Input 
                  name="hourly_rate" 
                  type="number"
                  step="0.01"
                  defaultValue={editingStaff?.hourly_rate}
                />
              </div>
              <div>
                <Label>Hire Date</Label>
                <Input 
                  name="hire_date" 
                  type="date"
                  defaultValue={editingStaff?.hire_date}
                />
              </div>
              <div className="col-span-2">
                <Label>Emergency Contact</Label>
                <Input 
                  name="emergency_contact" 
                  defaultValue={editingStaff?.emergency_contact}
                />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea 
                  name="notes" 
                  defaultValue={editingStaff?.notes}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700"
              >
                {editingStaff ? 'Update' : 'Add'} Staff
              </Button>
            </div>
          </form>

          {editingStaff && user && (
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Advanced Staff Management</h3>
              <Accordion type="multiple" className="space-y-2">
                <AccordionItem value="roles">
                  <AccordionTrigger>Role Assignments</AccordionTrigger>
                  <AccordionContent>
                    <StaffRoleManager staffId={editingStaff.id} staffName={editingStaff.full_name} user={user} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="job-description">
                  <AccordionTrigger>Job Description</AccordionTrigger>
                  <AccordionContent>
                    <JobDescriptionEditor staffId={editingStaff.id} staffData={editingStaff} user={user} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="appointments">
                  <AccordionTrigger>Performance Appointments</AccordionTrigger>
                  <AccordionContent>
                    <PerformanceAppointmentManager staffId={editingStaff.id} staffName={editingStaff.full_name} user={user} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="private-docs">
                  <AccordionTrigger>Private Documents (Admin Only)</AccordionTrigger>
                  <AccordionContent>
                    <PrivateDocumentVault staffId={editingStaff.id} staffName={editingStaff.full_name} user={user} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="visibility">
                  <AccordionTrigger>Access Controls (Admin Only)</AccordionTrigger>
                  <AccordionContent>
                    <VisibilityControlPanel staffId={editingStaff.id} staffName={editingStaff.full_name} user={user} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}