import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ThermometerSun, 
  Sparkles, 
  GraduationCap, 
  FileText, 
  FileCheck,
  Download,
  Shield,
  AlertCircle,
  LogOut,
  Clock,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import InspectorPDFExport from '@/components/inspector/InspectorPDFExport';
import InspectorTemperatureLogs from '@/components/inspector/InspectorTemperatureLogs';
import InspectorCleaningRecords from '@/components/inspector/InspectorCleaningRecords';
import InspectorTrainingCerts from '@/components/inspector/InspectorTrainingCerts';
import InspectorDocuments from '@/components/inspector/InspectorDocuments';
import InspectorAcknowledgements from '@/components/inspector/InspectorAcknowledgements';
import HACCPInspectorView from '@/components/inspector/HACCPInspectorView';
import InspectorStaffHygiene from '@/components/inspector/InspectorStaffHygiene';

const TIMEOUT_MINUTES = 20;

export default function InspectorMode() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [showExport, setShowExport] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_MINUTES * 60);
  const [dateRange, setDateRange] = useState('last_30');
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Auto-logout timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Reset timer on activity
    const resetTimer = () => setTimeLeft(TIMEOUT_MINUTES * 60);
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
    };
  }, []);

  const handleExit = () => {
    navigate(createPageUrl('ComplianceHub'));
  };

  // Restrict access
  if (user && !['manager', 'owner', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-600">Only managers and owners can access Inspector Mode</p>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const sections = [
    {
      id: 'haccp',
      title: 'HACCP Plan & CCPs',
      icon: Shield,
      color: 'bg-slate-600',
      description: 'Critical control points & verifications'
    },
    {
      id: 'temperature',
      title: 'Temperature Logs',
      icon: ThermometerSun,
      color: 'bg-blue-500',
      description: 'Fridge, freezer, cooking temps'
    },
    {
      id: 'cleaning',
      title: 'Cleaning Records',
      icon: Sparkles,
      color: 'bg-purple-500',
      description: 'Daily, weekly, deep clean logs'
    },
    {
      id: 'training',
      title: 'Training & Certifications',
      icon: GraduationCap,
      color: 'bg-emerald-500',
      description: 'Staff training completion'
    },
    {
      id: 'documents',
      title: 'Documents (Approved)',
      icon: FileText,
      color: 'bg-amber-500',
      description: 'Approved SOPs, HACCP, COSHH'
    },
    {
      id: 'staff',
      title: 'Staff Hygiene & Certificates',
      icon: Users,
      color: 'bg-pink-500',
      description: 'Staff records and certifications'
    },
    {
      id: 'acknowledgements',
      title: 'Acknowledgements',
      icon: FileCheck,
      color: 'bg-red-500',
      description: 'Staff signatures & confirmations'
    }
  ];

  // Render section views
  if (currentView === 'haccp') {
    return <HACCPInspectorView onBack={() => setCurrentView('home')} dateRange={dateRange} />;
  }
  if (currentView === 'temperature') {
    return <InspectorTemperatureLogs onBack={() => setCurrentView('home')} dateRange={dateRange} />;
  }
  if (currentView === 'cleaning') {
    return <InspectorCleaningRecords onBack={() => setCurrentView('home')} dateRange={dateRange} />;
  }
  if (currentView === 'training') {
    return <InspectorTrainingCerts onBack={() => setCurrentView('home')} dateRange={dateRange} />;
  }
  if (currentView === 'documents') {
    return <InspectorDocuments onBack={() => setCurrentView('home')} dateRange={dateRange} />;
  }
  if (currentView === 'staff') {
    return <InspectorStaffHygiene onBack={() => setCurrentView('home')} />;
  }
  if (currentView === 'acknowledgements') {
    return <InspectorAcknowledgements onBack={() => setCurrentView('home')} dateRange={dateRange} />;
  }

  // Home view
  return (
    <div className="min-h-screen bg-white">
      {/* Inspector Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">INSPECTOR MODE (READ-ONLY)</h1>
              <p className="text-sm opacity-90">Audit-ready compliance view</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
            <Button
              onClick={handleExit}
              variant="outline"
              className="bg-white text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Date Range Filter */}
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-slate-700">
                Date Range:
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last_7">Last 7 days</SelectItem>
                  <SelectItem value="last_30">Last 30 days</SelectItem>
                  <SelectItem value="last_60">Last 60 days</SelectItem>
                  <SelectItem value="last_90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="ml-auto">
                Filter applies to all sections & exports
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Export Audit Pack */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-4 border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50">
            <CardContent className="pt-8 pb-8 text-center">
              <Download className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                Export Audit Pack
              </h2>
              <p className="text-slate-600 mb-6 text-lg">
                Generate complete compliance PDF for inspection
              </p>
              <Button
                onClick={() => setShowExport(true)}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-xl px-12 py-8 h-auto font-bold"
              >
                <Download className="w-7 h-7 mr-3" />
                EXPORT FULL AUDIT PACK (PDF)
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section Navigation */}
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            View Individual Sections
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    className="hover:shadow-xl transition-all cursor-pointer border-2 border-slate-200 hover:border-slate-400"
                    onClick={() => setCurrentView(section.id)}
                  >
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-center gap-5">
                        <div className={`${section.color} w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-slate-800">
                            {section.title}
                          </h4>
                          <p className="text-slate-600 mt-1">
                            {section.description}
                          </p>
                        </div>
                        <div className="text-slate-400 text-2xl">→</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6 text-center text-sm text-slate-600">
            <p className="font-semibold">All data is read-only in Inspector Mode</p>
            <p className="mt-2">
              Logged in as: <strong>{user?.full_name || user?.email}</strong> • 
              Role: <strong className="capitalize">{user?.role}</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PDF Export Dialog */}
      <InspectorPDFExport
        open={showExport}
        onClose={() => setShowExport(false)}
        user={user}
        dateRange={dateRange}
      />
    </div>
  );
}