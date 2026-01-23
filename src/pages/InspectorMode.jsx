import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ThermometerSun, 
  Sparkles, 
  GraduationCap, 
  FileText, 
  FileCheck,
  Download,
  Shield,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import InspectorPDFExport from '@/components/inspector/InspectorPDFExport';

export default function InspectorMode() {
  const [user, setUser] = useState(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

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

  const sections = [
    {
      title: 'Temperature Logs',
      icon: ThermometerSun,
      color: 'bg-blue-500',
      page: 'Operations',
      description: 'Fridge, freezer, cooking temps'
    },
    {
      title: 'Cleaning Records',
      icon: Sparkles,
      color: 'bg-purple-500',
      page: 'FoodSafetyChecklist',
      description: 'Daily, weekly, deep clean logs'
    },
    {
      title: 'Training & Certifications',
      icon: GraduationCap,
      color: 'bg-emerald-500',
      page: 'TrainingAcademy',
      description: 'Staff training completion'
    },
    {
      title: 'Documents & Policies',
      icon: FileText,
      color: 'bg-amber-500',
      page: 'Documents',
      description: 'Approved SOPs, HACCP, COSHH'
    },
    {
      title: 'Acknowledgements',
      icon: FileCheck,
      color: 'bg-red-500',
      page: 'ComplianceHub',
      description: 'Staff signatures & confirmations'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Inspector Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">INSPECTOR MODE</h1>
              <p className="text-sm opacity-90">Read-only compliance view</p>
            </div>
          </div>
          <Badge className="bg-white text-red-700 text-sm px-4 py-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            Audit View Active
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8 space-y-8">
        {/* Export Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-4 border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50">
            <CardContent className="pt-6 text-center">
              <Download className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Full Audit Pack
              </h2>
              <p className="text-slate-600 mb-6">
                Generate complete compliance PDF for inspection
              </p>
              <Button
                onClick={() => setShowExport(true)}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6 h-auto"
              >
                <Download className="w-6 h-6 mr-3" />
                EXPORT FULL AUDIT PDF
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section Navigation */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            View Individual Sections
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link to={createPageUrl(section.page)}>
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-slate-200 hover:border-slate-400">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className={`${section.color} w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-slate-800">
                              {section.title}
                            </h4>
                            <p className="text-sm text-slate-600">
                              {section.description}
                            </p>
                          </div>
                          <div className="text-slate-400">→</div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6 text-center text-sm text-slate-600">
            <p>All data is read-only in Inspector Mode</p>
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
      />
    </div>
  );
}