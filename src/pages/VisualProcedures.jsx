import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter,
  BookOpen,
  ChefHat,
  Shield,
  Wrench,
  Trash2,
  Clock,
  Users,
  LayoutGrid,
  List,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProcedureCard from '@/components/procedures/ProcedureCard';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const categoryIcons = {
  food_prep: ChefHat,
  hygiene: Shield,
  equipment: Wrench,
  safety: Shield,
  waste: Trash2,
  opening: Clock,
  closing: Clock
};

const categoryColors = {
  food_prep: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  hygiene: 'bg-blue-100 text-blue-700 border-blue-300',
  equipment: 'bg-purple-100 text-purple-700 border-purple-300',
  safety: 'bg-red-100 text-red-700 border-red-300',
  waste: 'bg-amber-100 text-amber-700 border-amber-300',
  opening: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  closing: 'bg-slate-100 text-slate-700 border-slate-300'
};

export default function VisualProcedures() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStation, setFilterStation] = useState('all');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const isAdmin = user && ['admin', 'owner', 'manager'].includes(user.role);

  const { data: procedures = [], isLoading } = useQuery({
    queryKey: ['visualProcedures'],
    queryFn: () => base44.entities.SOP.list('-created_date', 500),
    enabled: !!user
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['procedureCompletions', user?.email],
    queryFn: () => base44.entities.Procedure_Completion_v1.filter({ 
      completed_by_id: user.email 
    }, '-completion_date', 50),
    enabled: !!user?.email
  });

  const filteredProcedures = procedures.filter(proc => {
    const matchesSearch = 
      proc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proc.intro_description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || proc.category === filterCategory;
    
    const matchesRole = filterRole === 'all' || 
      proc.applicable_roles?.includes(filterRole) ||
      proc.applicable_roles?.includes('all_staff');
    
    const matchesStation = filterStation === 'all' || proc.station === filterStation;
    
    return matchesSearch && matchesCategory && matchesRole && matchesStation;
  });

  // Stats
  const totalProcedures = procedures.length;
  const completedCount = new Set(completions.map(c => c.procedure_id)).size;
  const avgTime = procedures.length > 0 
    ? Math.round(procedures.reduce((sum, p) => sum + (p.estimated_time_minutes || 0), 0) / procedures.length)
    : 0;

  if (isLoading) return <LoadingSpinner message="Loading visual procedures..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visual Procedures & Processes"
        description={`${totalProcedures} procedures • ${completedCount} completed by you`}
      >
        {isAdmin && (
          <Link to={createPageUrl('VisualProcedureForm')}>
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Procedure
            </Button>
          </Link>
        )}
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProcedures}</p>
                <p className="text-xs text-slate-500">Total Procedures</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-slate-500">You Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgTime}m</p>
                <p className="text-xs text-slate-500">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Filter className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredProcedures.length}</p>
                <p className="text-xs text-slate-500">Filtered Results</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search procedures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="food_prep">Food Prep</SelectItem>
            <SelectItem value="hygiene">Hygiene</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="safety">Safety</SelectItem>
            <SelectItem value="waste">Waste</SelectItem>
            <SelectItem value="opening">Opening</SelectItem>
            <SelectItem value="closing">Closing</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="chef">Chef</SelectItem>
            <SelectItem value="prep">Prep</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="all_staff">All Staff</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStation} onValueChange={setFilterStation}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Station" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stations</SelectItem>
            <SelectItem value="hot_line">Hot Line</SelectItem>
            <SelectItem value="grill">Grill</SelectItem>
            <SelectItem value="chai_station">Chai Station</SelectItem>
            <SelectItem value="fryer">Fryer</SelectItem>
            <SelectItem value="bakery">Bakery</SelectItem>
            <SelectItem value="cold_prep">Cold Prep</SelectItem>
            <SelectItem value="wash_area">Wash Area</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Procedures Grid */}
      {filteredProcedures.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No procedures found"
          description="Try adjusting your filters or create a new procedure."
          action={isAdmin ? () => window.location.href = createPageUrl('VisualProcedureForm') : undefined}
          actionLabel="Create Procedure"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProcedures.map((procedure) => {
            const isCompleted = completions.some(c => c.procedure_id === procedure.id);
            return (
              <ProcedureCard
                key={procedure.id}
                procedure={procedure}
                isCompleted={isCompleted}
                categoryIcon={categoryIcons[procedure.category]}
                categoryColor={categoryColors[procedure.category]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}