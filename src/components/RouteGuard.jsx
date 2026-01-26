import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { useMode, MODES } from '@/components/modes/ModeContext';

const navGroups = [
  {
    title: 'Live Operations',
    items: [
      { name: 'Command Center', page: 'CommandCenter', roles: ['all'], modes: ['manage'] },
      { name: 'Daily Operations Hub', page: 'DailyOperationsHub', roles: ['all'], modes: ['operate'] },
      { name: 'Cleaning & Hygiene', page: 'CleaningHygieneHub', roles: ['all'], modes: ['operate'] },
      { name: 'Sign-Off Log', page: 'CleaningSignOffLog', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Live Food Safety', page: 'LiveFoodSafety', roles: ['all'], modes: ['operate'] },
      { name: 'Shift Handover', page: 'ShiftHandovers', roles: ['all'], modes: ['operate'] },
      { name: 'Equipment Status', page: 'EquipmentHealth', roles: ['all'], modes: ['operate'] },
      { name: 'Menu Manager', page: 'MenuManager', roles: ['all'], modes: ['operate'] },
      { name: 'Checklist Library', page: 'ChecklistLibrary', roles: ['all'], modes: ['operate'] },
      { name: 'Operations Reports', page: 'OperationsReports', roles: ['all'], modes: ['operate', 'manage'] },
      { name: 'Visual Procedures', page: 'VisualProcedures', roles: ['all'], modes: ['operate'] },
      { name: 'Visual Dish Guides', page: 'VisualDishGuides', roles: ['all'], modes: ['operate'] },
      { name: 'Quality & Safety', page: 'QualitySafety', roles: ['all'], modes: ['operate'] },
      { name: 'Incident Records', page: 'IncidentCenter', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Chemical Safety', page: 'ChemicalDashboard', roles: ['all'], modes: ['operate'] },
    ]
  },
  {
    title: 'Team Development',
    items: [
      { name: 'Training Academy', page: 'TrainingAcademy', roles: ['all'], modes: ['train'] },
      { name: 'Leadership Path', page: 'LeadershipPathway', roles: ['all'], modes: ['train'] },
      { name: 'Culture', page: 'Culture', roles: ['all'], modes: ['train'] },
      { name: 'People', page: 'People', roles: ['all'], modes: ['train'] },
    ]
  },
  {
    title: 'Management & Control',
    items: [
      { name: 'Reports', page: 'Reports', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Audit Center', page: 'AuditCenter', roles: ['all'], modes: ['manage'] },
      { name: 'Inspector Mode', page: 'InspectorMode', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Compliance Hub', page: 'ComplianceHub', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Data Management', page: 'DataManagement', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Restaurant Info', page: 'GlobalInfo', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Meetings', page: 'Meetings', roles: ['all'], modes: ['manage'] },
      { name: 'Shifts', page: 'Shifts', roles: ['all'], modes: ['manage'] },
      { name: 'Performance', page: 'Performance', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Assets & Equipment', page: 'Assets', roles: ['all'], modes: ['manage'] },
      { name: 'Weekly Manager Reports', page: 'WeeklyManagerReports', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
      { name: 'Documents', page: 'Documents', roles: ['all'], modes: ['manage'] },
      { name: 'Announcements', page: 'Announcements', roles: ['all'], modes: ['manage'] },
      { name: 'Change Requests', page: 'ChangeRequests', roles: ['all'], modes: ['manage'] },
      { name: 'Diagnostics', page: 'Diagnostics', roles: ['manager', 'owner', 'admin'], modes: ['manage'] },
    ]
  }
];

export default function RouteGuard({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentMode, setCurrentMode } = useMode();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        // Not authenticated - redirect to login
        if (currentPageName !== 'Invitation') {
          base44.auth.redirectToLogin();
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [currentPageName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow Invitation and OnboardingFlow pages without restrictions
  if (currentPageName === 'Invitation' || currentPageName === 'OnboardingFlow') {
    return children;
  }

  // Check onboarding completion
  if (user && !user.onboarding_completed) {
    navigate(createPageUrl('OnboardingFlow'));
    return null;
  }

  // Find page requirements in navGroups
  let pageConfig = null;
  for (const group of navGroups) {
    const found = group.items.find(item => item.page === currentPageName);
    if (found) {
      pageConfig = found;
      break;
    }
  }

  // If page not in navGroups, allow access (e.g., Dashboard, Profile, Settings)
  if (!pageConfig) {
    return children;
  }

  // Check role access
  const hasRoleAccess = pageConfig.roles.includes('all') || 
                        pageConfig.roles.includes(user?.role);

  if (!hasRoleAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-red-300 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-t-lg">
            <Lock className="w-12 h-12 mx-auto mb-3" />
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-slate-700">
              You don't have permission to access <strong>{pageConfig.name}</strong>.
            </p>
            <p className="text-sm text-slate-600">
              Required role: <span className="font-semibold capitalize">{pageConfig.roles.join(', ')}</span>
            </p>
            <p className="text-sm text-slate-600">
              Your role: <span className="font-semibold capitalize">{user?.role}</span>
            </p>
            <Button
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="bg-emerald-600 hover:bg-emerald-700 w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check mode access
  const hasModeAccess = pageConfig.modes?.includes(currentMode);

  if (!hasModeAccess) {
    const requiredMode = pageConfig.modes?.[0];
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-amber-300 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
            <Shield className="w-12 h-12 mx-auto mb-3" />
            <CardTitle className="text-2xl font-bold">Mode Restricted</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-slate-700">
              <strong>{pageConfig.name}</strong> is only accessible in <span className="font-semibold capitalize">{pageConfig.modes.join(' or ')}</span> mode.
            </p>
            <p className="text-sm text-slate-600">
              Current mode: <span className="font-semibold capitalize">{currentMode}</span>
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (requiredMode && setCurrentMode) {
                    setCurrentMode(requiredMode);
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 flex-1"
              >
                Switch to {requiredMode} Mode
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('Dashboard'))}
                variant="outline"
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed
  return children;
}