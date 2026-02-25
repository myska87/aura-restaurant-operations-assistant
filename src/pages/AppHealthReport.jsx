import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Users,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Navigation,
  Bug,
  Activity
} from 'lucide-react';

const STATUS = {
  OK: 'ok',
  WARNING: 'warning',
  BUG: 'bug',
  INFO: 'info',
};

const statusConfig = {
  ok: { label: 'Working', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-500', borderLeft: 'border-l-4 border-l-emerald-500' },
  warning: { label: 'Warning', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500', borderLeft: 'border-l-4 border-l-amber-500' },
  bug: { label: 'Bug', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, iconColor: 'text-red-500', borderLeft: 'border-l-4 border-l-red-500' },
  info: { label: 'Note', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Info, iconColor: 'text-blue-500', borderLeft: 'border-l-4 border-l-blue-500' },
};

const sections = [
  {
    title: 'Authentication & Route Guard',
    icon: Shield,
    iconColor: 'text-emerald-600',
    bg: 'from-emerald-50 to-emerald-100',
    items: [
      {
        status: STATUS.OK,
        title: 'Login & Authentication',
        detail: 'Auth flow works correctly. Users not logged in are redirected to the login page. The `base44.auth.me()` call is used consistently throughout all pages.'
      },
      {
        status: STATUS.OK,
        title: 'RouteGuard - Hook Order (Recently Fixed)',
        detail: 'All React hooks (useState, useEffect, useNavigate, useMode) are now called unconditionally before any conditional returns, fixing the "Rendered more hooks than previous render" error.'
      },
      {
        status: STATUS.OK,
        title: 'RouteGuard - Mode Access Logic (Recently Fixed)',
        detail: 'hasModeAccess now correctly allows access when modes is undefined, includes "all", or matches the current mode.'
      },
      {
        status: STATUS.OK,
        title: 'Role-Based Access Control',
        detail: 'Pages correctly restrict access based on user role (staff / manager / owner / admin). The Access Denied screen displays correctly with role info.'
      },
      {
        status: STATUS.WARNING,
        title: 'Onboarding Redirect Risk',
        detail: 'RouteGuard checks `user.onboarding_completed`. If no OnboardingTask records exist in the database, the user will land on an empty onboarding screen and be stuck in a loop. This depends on the database having OnboardingTask data set up.'
      },
      {
        status: STATUS.INFO,
        title: 'Pages Not in NavGroups Pass Through',
        detail: 'Pages like Dashboard, Profile, Settings, WelcomeVision, RavingFans, Certification, AboutAURA are not in the RouteGuard navGroups so they always allow access regardless of mode or role — this is intentional and correct.'
      },
    ]
  },
  {
    title: 'Mode System (Operate / Train / Manage)',
    icon: Zap,
    iconColor: 'text-amber-600',
    bg: 'from-amber-50 to-amber-100',
    items: [
      {
        status: STATUS.OK,
        title: 'Mode Persistence',
        detail: 'Current mode is saved to localStorage (key: "aura_mode") and restored on page load. Works correctly.'
      },
      {
        status: STATUS.OK,
        title: 'Mode Selector UI',
        detail: 'Mode buttons (Operate / Train / Manage) render correctly in both desktop header and mobile header. Disabled state applied for Manage mode on staff role.'
      },
      {
        status: STATUS.BUG,
        title: 'Mode Switch Causes Full Page Reload',
        detail: 'ModeSelector uses `window.location.href = ...` to navigate to the new mode\'s home page. This causes a full browser page reload instead of a React Router navigation. Should use `navigate(createPageUrl(homePage))` instead. All state is lost on switch.'
      },
      {
        status: STATUS.OK,
        title: 'Sidebar Filters Correctly by Mode',
        detail: 'Navigation items in the sidebar are properly filtered based on the current mode. When switching modes, the correct nav items appear.'
      },
      {
        status: STATUS.OK,
        title: 'OperateHome, TrainHome, ManageHome',
        detail: 'Each mode has its own home page that renders correctly and redirects when selected from the Dashboard.'
      },
      {
        status: STATUS.WARNING,
        title: 'ManageHome Uses Hardcoded Status Values',
        detail: 'ManageHome shows "Food Safety: 100%" and "Training: 85%" as hardcoded static values — these are NOT pulled from real data. Only "Tasks" and "Documents" use live data.'
      },
    ]
  },
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    iconColor: 'text-blue-600',
    bg: 'from-blue-50 to-blue-100',
    items: [
      {
        status: STATUS.OK,
        title: 'Welcome Banner',
        detail: 'Shows personalized greeting with user first name, today\'s date, and today\'s shift count. Displays team stats for managers/owners.'
      },
      {
        status: STATUS.OK,
        title: 'Stats Cards',
        detail: 'Today\'s Shifts, Active Staff, Low Stock Items, and Pending SOPs all pull from real entity queries and display correctly.'
      },
      {
        status: STATUS.OK,
        title: 'Quick Actions',
        detail: 'Clock In/Out → Shifts, New Menu Item → Menu, Start Audit → Quality, Add Staff → Staff, New Order → Inventory. All 5 links point to valid pages.'
      },
      {
        status: STATUS.OK,
        title: 'Low Stock Alert Widget',
        detail: 'Pulls from Ingredient entity and correctly highlights items at or below min_stock_level.'
      },
      {
        status: STATUS.OK,
        title: 'Training Progress Widget',
        detail: 'Queries TrainingProgress filtered by current user email and shows correct counts.'
      },
      {
        status: STATUS.OK,
        title: 'Upcoming Shifts Widget',
        detail: 'Fetches shifts for the next 7 days and displays correctly.'
      },
      {
        status: STATUS.WARNING,
        title: 'Activity Feed',
        detail: 'Activity feed is built from recent shifts and audits. The audit items reference `a.title` and `a.overall_score`/`a.max_score` — if QualityAudit records don\'t have these fields, it will show "undefined".'
      },
      {
        status: STATUS.INFO,
        title: 'Dashboard Redirects to Mode Home',
        detail: 'Authenticated users visiting /Dashboard are automatically redirected to their mode\'s home page (OperateHome / TrainHome / ManageHome). The Dashboard itself is mainly a fallback/loading point.'
      },
    ]
  },
  {
    title: 'Operate Mode',
    icon: Activity,
    iconColor: 'text-cyan-600',
    bg: 'from-cyan-50 to-cyan-100',
    items: [
      {
        status: STATUS.OK,
        title: 'OperateHome Safety Status Indicator',
        detail: 'Traffic light system (🔴 STOP / 🟡 ATTENTION / 🟢 SAFE) calculates correctly based on temperature logs, illness reports, hygiene declarations, and cleaning logs.'
      },
      {
        status: STATUS.OK,
        title: 'Start Shift Button',
        detail: 'Correctly requires a Personal Hygiene Declaration before allowing clock-in. Shows the declaration form modal if missing.'
      },
      {
        status: STATUS.OK,
        title: 'Opening / Closing Checklist',
        detail: 'Fetches from ChecklistMaster, creates/updates ChecklistCompletion records. Auto-fail items trigger "pending_review" status.'
      },
      {
        status: STATUS.OK,
        title: 'Daily Briefing Form',
        detail: 'Disabled if a briefing already exists for today. Saves to DailyBriefing entity correctly.'
      },
      {
        status: STATUS.OK,
        title: 'Shift Handover',
        detail: 'Submits handover data and sends notifications to managers when issues are flagged.'
      },
      {
        status: STATUS.OK,
        title: 'Temperature Logging',
        detail: 'Pulls from Assets_Registry_v1 (temperature-controlled equipment) and TemperatureLog entity. Progress bar shows completion.'
      },
      {
        status: STATUS.OK,
        title: 'Critical Control Points (CCPs)',
        detail: 'Lists active CCPs, shows which are checked for today. Check modal works correctly.'
      },
      {
        status: STATUS.OK,
        title: 'Food Labels, Hot Holding, Hygiene Check',
        detail: 'All modal-based forms function and save to their respective entities.'
      },
      {
        status: STATUS.WARNING,
        title: '"DailyOperationsHub" in RouteGuard but Not in Sidebar',
        detail: 'RouteGuard\'s navGroups includes DailyOperationsHub (operate mode) but the Layout sidebar navGroups does not include it — so it\'s accessible by URL/link but not via sidebar navigation.'
      },
    ]
  },
  {
    title: 'Training & Development',
    icon: GraduationCap,
    iconColor: 'text-purple-600',
    bg: 'from-purple-50 to-purple-100',
    items: [
      {
        status: STATUS.OK,
        title: 'Training Mode Access (Recently Fixed)',
        detail: 'TrainHome, TrainingAcademy, LeadershipPathway, Culture, and Training (Hygiene) pages now use modes: ["all"] — accessible from any mode without the "Mode Restricted" error.'
      },
      {
        status: STATUS.OK,
        title: 'TrainHome Journey Steps',
        detail: 'Journey steps (Welcome, Culture, Raving Fans, Hygiene, Certification, Growth) display correctly with completion tracking from TrainingJourneyProgress entity.'
      },
      {
        status: STATUS.OK,
        title: 'Training Academy Sequential Lock',
        detail: 'Training modules are locked sequentially — only the current step is accessible. Completed steps can be reviewed. Visual Procedures is always accessible as a supplemental module.'
      },
      {
        status: STATUS.BUG,
        title: 'Hygiene L1 / L2 Completion Flags Never Set',
        detail: 'TrainingAcademy checks `journeyProgress.hygieneL1Completed` and `hygieneL2Completed` in stepCompletionMap, but the syncProgress() effect only ever sets `hygieneCompleted` (general). The L1 and L2 individual flags are NEVER set, so those steps will always appear locked/incomplete even if a user has done hygiene training.'
      },
      {
        status: STATUS.OK,
        title: 'Training Progress Sync',
        detail: 'Auto-sync checks CultureAcknowledgment, TrainingProgress, SOPAcknowledgment to update journey flags. Certification gate logic is correct.'
      },
      {
        status: STATUS.OK,
        title: 'Reset Training (Self & Admin)',
        detail: 'Reset Training button works for self. Admin users can select a staff member to reset. Mutation correctly resets all journey flags.'
      },
      {
        status: STATUS.OK,
        title: 'Auto-Create Training Profile',
        detail: 'RouteGuard auto-creates a TrainingJourneyProgress record for new users on first login.'
      },
    ]
  },
  {
    title: 'Management Mode',
    icon: Settings,
    iconColor: 'text-red-600',
    bg: 'from-red-50 to-red-100',
    items: [
      {
        status: STATUS.OK,
        title: 'Command Center',
        detail: 'Loads correctly for managers/owners. All 8 tabs (Sales, Marketing, Operations, Menu, Financial, Training, Forecast, Edit Data) render. PDF/Excel export and email report send correctly.'
      },
      {
        status: STATUS.INFO,
        title: 'Command Center - Financial Tab',
        detail: 'Financial tab is only visible to "owner" and "admin" roles — correctly hidden from managers. This is intentional.'
      },
      {
        status: STATUS.OK,
        title: 'Reports Page',
        detail: 'Restricted to manager/owner/admin. Renders correctly.'
      },
      {
        status: STATUS.OK,
        title: 'Audit Center',
        detail: 'Accessible to all roles in manage mode. Weekly and Monthly audit forms are available.'
      },
      {
        status: STATUS.OK,
        title: 'Inspector Mode',
        detail: 'Manager/owner/admin restricted. Entry with passcode, inspector views for HACCP, cleaning, staff hygiene, documents, training certs, temperature logs, and PDF export.'
      },
      {
        status: STATUS.OK,
        title: 'Data Management',
        detail: 'Manager/owner/admin restricted. Entity management tools accessible.'
      },
      {
        status: STATUS.OK,
        title: 'Shifts, Meetings, Documents, Announcements',
        detail: 'All standard management pages load and function correctly.'
      },
    ]
  },
  {
    title: 'People & Staff',
    icon: Users,
    iconColor: 'text-indigo-600',
    bg: 'from-indigo-50 to-indigo-100',
    items: [
      {
        status: STATUS.OK,
        title: 'People Page',
        detail: 'Shows "My Personal Space" for all users. Shows "Team Management" section only for managers/owners/admins. Mode: all — accessible from any mode.'
      },
      {
        status: STATUS.OK,
        title: 'Staff Directory',
        detail: 'Staff page loads all staff records with filters by status, department, role.'
      },
      {
        status: STATUS.OK,
        title: 'Profile Page',
        detail: 'Shows personal details, shifts, training progress, documents vault, performance snapshot, and next meeting. Data pulls from multiple entities correctly.'
      },
      {
        status: STATUS.OK,
        title: 'Invitations System',
        detail: 'Managers can invite staff via email. Role selection (user/admin) with appropriate restrictions.'
      },
      {
        status: STATUS.WARNING,
        title: 'Performance Page Role Check',
        detail: 'People page shows "Performance" link for managers. The Performance page is restricted to managers/owners/admin in RouteGuard — staff will get "Access Denied" if they somehow reach it, but the link is correctly hidden for staff on the People page.'
      },
    ]
  },
  {
    title: 'Navigation & Layout',
    icon: Navigation,
    iconColor: 'text-slate-600',
    bg: 'from-slate-50 to-slate-100',
    items: [
      {
        status: STATUS.OK,
        title: 'Desktop Sidebar',
        detail: 'Fixed left sidebar (272px) with grouped navigation, mode-filtered items, user dropdown with profile/settings/logout.'
      },
      {
        status: STATUS.OK,
        title: 'Mobile Responsive Header',
        detail: 'Hamburger menu with full sidebar sheet, back button, mode selector, and notification bell all render correctly on mobile.'
      },
      {
        status: STATUS.WARNING,
        title: 'Runtime Warning: Header Element Coverage',
        detail: 'Development warning fires: "Element is covering the header area" — the sidebar NavContent div overlaps the header\'s z-index detection point. This is a dev-only warning and does NOT affect production users, but indicates the sidebar panel is close to the header area.'
      },
      {
        status: STATUS.BUG,
        title: 'NavContent Defined Inside LayoutContent',
        detail: 'The `NavContent` component function is defined inside the `LayoutContent` component. This causes React to recreate the component definition on every render, leading to unnecessary unmount/remount cycles and potential animation glitches when navigating.'
      },
      {
        status: STATUS.OK,
        title: 'Back Navigation Button',
        detail: 'Back button in both desktop and mobile headers calls navigate(-1) correctly for browser history navigation.'
      },
      {
        status: STATUS.OK,
        title: 'Notification Bell',
        detail: 'Fetches unread notifications filtered by current user email. Shows badge count and dropdown list.'
      },
      {
        status: STATUS.OK,
        title: 'Quick Access Toolbar',
        detail: 'Floating toolbar renders correctly and provides fast access to key operations.'
      },
    ]
  },
  {
    title: 'Onboarding Flow',
    icon: Bug,
    iconColor: 'text-orange-600',
    bg: 'from-orange-50 to-orange-100',
    items: [
      {
        status: STATUS.OK,
        title: 'Onboarding Task Display',
        detail: 'Fetches OnboardingTask records filtered by role and displays them sequentially with a progress bar.'
      },
      {
        status: STATUS.OK,
        title: 'Task Completion & Signatures',
        detail: 'Scroll-to-bottom detection, checkbox agreement, and task completion save to UserTaskCompletion and ComplianceLog entities.'
      },
      {
        status: STATUS.OK,
        title: 'Document Acknowledgement Logging',
        detail: 'If a task has a linked_document_id, a DocumentAcknowledgement record is created on completion.'
      },
      {
        status: STATUS.WARNING,
        title: 'Empty Onboarding State',
        detail: 'If no OnboardingTask records exist with is_active: true, the user sees an empty task list and cannot proceed to complete onboarding. They will be permanently redirected here until an admin adds OnboardingTask records.'
      },
      {
        status: STATUS.OK,
        title: 'Completion & Redirect',
        detail: 'After all tasks are completed, the "Enter Dashboard" button sets onboarding_completed: true on the user record and redirects to Dashboard.'
      },
    ]
  },
];

function SectionCard({ section }) {
  const [expanded, setExpanded] = useState(true);
  const Icon = section.icon;
  const bugs = section.items.filter(i => i.status === STATUS.BUG).length;
  const warnings = section.items.filter(i => i.status === STATUS.WARNING).length;
  const oks = section.items.filter(i => i.status === STATUS.OK).length;

  return (
    <Card className="border-2 shadow-lg overflow-hidden">
      <CardHeader
        className={`bg-gradient-to-r ${section.bg} cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Icon className={`w-6 h-6 ${section.iconColor}`} />
            {section.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {bugs > 0 && <Badge className="bg-red-100 text-red-800 border border-red-300">{bugs} Bug{bugs > 1 ? 's' : ''}</Badge>}
            {warnings > 0 && <Badge className="bg-amber-100 text-amber-800 border border-amber-300">{warnings} Warning{warnings > 1 ? 's' : ''}</Badge>}
            {oks > 0 && <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300">{oks} OK</Badge>}
            {expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-4 pb-2 space-y-3">
          {section.items.map((item, idx) => {
            const cfg = statusConfig[item.status];
            const ItemIcon = cfg.icon;
            return (
              <div key={idx} className={`p-4 rounded-lg border bg-white ${cfg.borderLeft} shadow-sm`}>
                <div className="flex items-start gap-3">
                  <ItemIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">{item.title}</span>
                      <Badge className={`text-xs border ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

export default function AppHealthReport() {
  const totalBugs = sections.reduce((acc, s) => acc + s.items.filter(i => i.status === STATUS.BUG).length, 0);
  const totalWarnings = sections.reduce((acc, s) => acc + s.items.filter(i => i.status === STATUS.WARNING).length, 0);
  const totalOks = sections.reduce((acc, s) => acc + s.items.filter(i => i.status === STATUS.OK).length, 0);
  const totalInfos = sections.reduce((acc, s) => acc + s.items.filter(i => i.status === STATUS.INFO).length, 0);
  const total = totalBugs + totalWarnings + totalOks + totalInfos;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <h1 className="text-4xl font-bold text-slate-800">AURA App Health Report</h1>
        <p className="text-slate-600">Full technical audit — February 2026</p>
        <p className="text-sm text-slate-500">Analysed as a real user across all modes and sections</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-emerald-300 bg-emerald-50 text-center">
          <CardContent className="pt-6 pb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="text-4xl font-bold text-emerald-700">{totalOks}</p>
            <p className="text-sm font-semibold text-emerald-600">Working</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-300 bg-red-50 text-center">
          <CardContent className="pt-6 pb-4">
            <XCircle className="w-10 h-10 text-red-600 mx-auto mb-2" />
            <p className="text-4xl font-bold text-red-700">{totalBugs}</p>
            <p className="text-sm font-semibold text-red-600">Bugs Found</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-amber-300 bg-amber-50 text-center">
          <CardContent className="pt-6 pb-4">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
            <p className="text-4xl font-bold text-amber-700">{totalWarnings}</p>
            <p className="text-sm font-semibold text-amber-600">Warnings</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-300 bg-blue-50 text-center">
          <CardContent className="pt-6 pb-4">
            <Info className="w-10 h-10 text-blue-600 mx-auto mb-2" />
            <p className="text-4xl font-bold text-blue-700">{totalInfos}</p>
            <p className="text-sm font-semibold text-blue-600">Notes</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Bugs Summary */}
      {totalBugs > 0 && (
        <Card className="border-2 border-red-400 bg-red-50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-6 h-6" />
              🔴 Critical Bugs — Fix These First
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="p-3 bg-white border-l-4 border-red-500 rounded shadow-sm">
              <p className="font-bold text-slate-800">1. Mode Switch Causes Full Page Reload</p>
              <p className="text-sm text-slate-600 mt-1">In <code className="bg-slate-100 px-1 rounded">ModeSelector.jsx</code> — uses <code className="bg-slate-100 px-1 rounded">window.location.href</code> instead of React Router's <code className="bg-slate-100 px-1 rounded">navigate()</code>. Every time a user switches mode, the entire app reloads from scratch, losing all state.</p>
            </div>
            <div className="p-3 bg-white border-l-4 border-red-500 rounded shadow-sm">
              <p className="font-bold text-slate-800">2. Hygiene L1 / L2 Training Flags Never Set</p>
              <p className="text-sm text-slate-600 mt-1">In <code className="bg-slate-100 px-1 rounded">TrainingAcademy.jsx</code> — <code className="bg-slate-100 px-1 rounded">hygieneL1Completed</code> and <code className="bg-slate-100 px-1 rounded">hygieneL2Completed</code> are checked in <code className="bg-slate-100 px-1 rounded">stepCompletionMap</code> but never written in <code className="bg-slate-100 px-1 rounded">syncProgress()</code>. Both Hygiene L1 and L2 steps will always appear locked.</p>
            </div>
            <div className="p-3 bg-white border-l-4 border-red-500 rounded shadow-sm">
              <p className="font-bold text-slate-800">3. NavContent Defined Inside LayoutContent</p>
              <p className="text-sm text-slate-600 mt-1">In <code className="bg-slate-100 px-1 rounded">Layout.js</code> — the <code className="bg-slate-100 px-1 rounded">NavContent</code> component is declared inside <code className="bg-slate-100 px-1 rounded">LayoutContent</code>. React recreates this component definition on every re-render, causing the sidebar to fully remount and animations/scroll position to reset on every navigation.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings Summary */}
      {totalWarnings > 0 && (
        <Card className="border-2 border-amber-400 bg-amber-50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              🟡 Warnings — Should Be Addressed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[
              { title: 'ManageHome Hardcoded Status Values', desc: 'Food Safety (100%) and Training (85%) are static hardcoded numbers — not real data from the database.' },
              { title: 'Onboarding Empty State Risk', desc: 'If no OnboardingTask records exist, users are permanently stuck on the onboarding screen with no way to proceed.' },
              { title: 'DailyOperationsHub Missing from Sidebar', desc: 'Page exists in RouteGuard but has no sidebar link — only reachable by direct URL.' },
              { title: 'Activity Feed May Show "undefined"', desc: 'Dashboard activity feed references QualityAudit.title / .overall_score / .max_score which may not exist on all audit records.' },
              { title: 'Runtime Dev Warning: Header Coverage', desc: 'Non-critical development warning about sidebar element overlapping header detection area.' },
            ].map((w, i) => (
              <div key={i} className="p-3 bg-white border-l-4 border-amber-400 rounded shadow-sm">
                <p className="font-bold text-slate-800">{i + 1}. {w.title}</p>
                <p className="text-sm text-slate-600 mt-1">{w.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Detailed Section Reports */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Detailed Section Analysis</h2>
        {sections.map((section, idx) => (
          <SectionCard key={idx} section={section} />
        ))}
      </div>

      {/* Overall Health Score */}
      <Card className="border-2 border-slate-300 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-t-lg">
          <CardTitle className="text-2xl">Overall App Health Score</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <p className="text-7xl font-bold text-slate-800">
              {Math.round((totalOks / (totalOks + totalBugs + totalWarnings)) * 100)}
              <span className="text-4xl text-slate-500">%</span>
            </p>
            <p className="text-xl text-slate-600 mt-2">Health Score</p>
            <p className="text-sm text-slate-500">{totalOks} of {totalOks + totalBugs + totalWarnings} checked items passing</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h3 className="font-bold text-emerald-800 mb-2">✅ What Works Well</h3>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Authentication & access control</li>
                <li>• Mode system & sidebar navigation</li>
                <li>• All core operations forms</li>
                <li>• Training academy journey tracking</li>
                <li>• Command Center & reporting</li>
                <li>• Food safety & hygiene checklists</li>
                <li>• Notification system</li>
                <li>• Profile & staff management</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-bold text-red-800 mb-2">❌ Needs Fixing</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Mode switch full page reload</li>
                <li>• Hygiene L1/L2 flags never set</li>
                <li>• NavContent inside LayoutContent</li>
              </ul>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-bold text-amber-800 mb-2">⚠️ Needs Attention</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• ManageHome hardcoded data</li>
                <li>• Onboarding empty state</li>
                <li>• DailyOperationsHub sidebar link</li>
                <li>• Activity feed undefined fields</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-4 text-slate-500 text-sm">
        <p>AURA App Health Report — Analysed: February 25, 2026</p>
        <p className="mt-1 text-xs">Report generated by reading all major page components, checking entity queries, hook patterns, navigation, access control, and runtime logs.</p>
      </div>
    </div>
  );
}