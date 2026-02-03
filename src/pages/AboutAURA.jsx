import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, Users, GraduationCap, Shield, Package, TrendingUp, 
  ClipboardCheck, Wrench, Calendar, FileText, BarChart3, Leaf,
  BookOpen, Trophy, Heart, Droplet, AlertCircle, CookingPot,
  Thermometer, MessageSquare, Bell
} from 'lucide-react';

export default function AboutAURA() {
  const features = [
    {
      category: 'Menu & Recipe Management',
      icon: ChefHat,
      color: 'from-amber-500 to-orange-500',
      capabilities: [
        'Complete menu item catalog with photos, descriptions, and pricing',
        'Recipe engine with ingredient quantities per serving',
        'Automatic cost calculation and profit margin tracking',
        'Visual dish guides with step-by-step photo instructions',
        'Allergen tracking (UK FSA 14 Major Allergens)',
        'Smart recipe scaling based on target servings',
        'Menu item linking to recipes, SOPs, and procedures',
        'Prep component management for complex dishes'
      ]
    },
    {
      category: 'Inventory & Ordering',
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      capabilities: [
        'Ingredient master database with supplier links',
        'Real-time stock level tracking',
        'Low stock alerts and automatic reorder triggers',
        'Smart ordering by menu item or prep plan',
        'Draft order management and supplier communication',
        'Delivery receiving with temperature checks and photo evidence',
        'Stock adjustment logging and audit trail',
        'Multi-supplier support with performance tracking',
        'Order history and cost analysis'
      ]
    },
    {
      category: 'Team Training & Development',
      icon: GraduationCap,
      color: 'from-emerald-500 to-green-500',
      capabilities: [
        'Training Academy with Foundation, L1, L2, and L3 levels',
        'Interactive courses with quizzes and practical assessments',
        'Culture and values training modules',
        'Leadership pathway with journal entries',
        'Certificate generation upon course completion',
        'Training progress tracking per staff member',
        'Welcome & Vision orientation for new staff',
        'Raving Fans philosophy integration',
        'Reflection and feedback collection'
      ]
    },
    {
      category: 'Food Safety & Compliance',
      icon: Shield,
      color: 'from-red-500 to-pink-500',
      capabilities: [
        'HACCP plan management and CCP monitoring',
        'Temperature logging (fridge, freezer, cooking, hot holding)',
        'Food labeling system with date/use-by tracking',
        'Daily hygiene checklists and personal declarations',
        'Illness reporting and food handling restrictions',
        'Allergen order confirmation at point of sale',
        'Mid-service safety checks',
        'Corrective action logging',
        'Inspector Mode for compliance readiness',
        'Chemical safety tracking and COSHH compliance'
      ]
    },
    {
      category: 'Operations & Workflow',
      icon: ClipboardCheck,
      color: 'from-purple-500 to-indigo-500',
      capabilities: [
        'Command Center dashboard for real-time oversight',
        'Daily briefing and shift handover system',
        'Visual procedure library with photo guides',
        'Checklist library with custom forms',
        'Equipment health monitoring and fault reporting',
        'Prep planning (manual and smart modes)',
        'Service readiness indicators',
        'Incident logging and service recovery',
        'Quality checks and audit trails'
      ]
    },
    {
      category: 'Staff & Scheduling',
      icon: Users,
      color: 'from-teal-500 to-cyan-500',
      capabilities: [
        'Staff directory with roles and positions',
        'Shift scheduling and clock in/out tracking',
        'Shift approval workflow for managers',
        'Performance tracking and coaching notes',
        'Private document vault per staff member',
        'Training progress visibility',
        'Meeting scheduling and notes',
        'Staff role management with custom permissions',
        'Onboarding task tracking'
      ]
    },
    {
      category: 'Cleaning & Hygiene',
      icon: Droplet,
      color: 'from-sky-500 to-blue-500',
      capabilities: [
        'Daily cleaning schedules with sign-off',
        'Deep cleaning task management',
        'Cleaning log with photo evidence',
        'Manager sign-off and approval system',
        'Area-based cleaning checklists',
        'Chemical stock and usage tracking',
        'Chemical incident reporting',
        'Hygiene compliance reports'
      ]
    },
    {
      category: 'Equipment & Assets',
      icon: Wrench,
      color: 'from-orange-500 to-red-500',
      capabilities: [
        'Asset registry with photos and details',
        'Equipment check logging',
        'Fault reporting and maintenance tracking',
        'Service record history',
        'Equipment health status dashboard',
        'Warranty and compliance tracking',
        'Quick fault report from operations floor'
      ]
    },
    {
      category: 'Reports & Analytics',
      icon: BarChart3,
      color: 'from-violet-500 to-purple-500',
      capabilities: [
        'Operations reports (hygiene, temperature, checklists)',
        'Menu profitability analysis',
        'Inventory cost tracking',
        'Staff performance metrics',
        'Audit center with weekly/monthly reviews',
        'Weekly manager reports',
        'KPI dashboards',
        'Training completion statistics',
        'Compliance audit logs'
      ]
    },
    {
      category: 'Documents & SOPs',
      icon: FileText,
      color: 'from-slate-500 to-gray-500',
      capabilities: [
        'Standard Operating Procedures (SOP) library',
        'Rich text document editor',
        'Document version control',
        'Staff acknowledgment and signatures',
        'Smart linking to recipes, menu items, and assets',
        'Document categorization and tagging',
        'Access control by role',
        'PDF export and printing'
      ]
    },
    {
      category: 'Communication & Collaboration',
      icon: MessageSquare,
      color: 'from-pink-500 to-rose-500',
      capabilities: [
        'Announcements board',
        'Change request system',
        'Shift handover notes',
        'Meeting minutes and action items',
        'Notification system',
        'Training posts and updates',
        'Service recovery feedback',
        'Coaching and performance notes'
      ]
    }
  ];

  const modes = [
    {
      name: 'Operate Mode',
      icon: CookingPot,
      description: 'Frontline operations - menu, prep, safety checks, cleaning, equipment',
      color: 'bg-emerald-500'
    },
    {
      name: 'Train Mode',
      icon: BookOpen,
      description: 'Team development - training academy, culture, leadership pathway',
      color: 'bg-blue-500'
    },
    {
      name: 'Manage Mode',
      icon: TrendingUp,
      description: 'Management control - reports, audits, compliance, data management',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
              AURA
            </h1>
            <p className="text-sm text-slate-600 uppercase tracking-widest">
              Advanced Unified Restaurant Application
            </p>
          </div>
        </div>
        
        <p className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
          A comprehensive restaurant operations platform that unifies menu management, inventory control, 
          staff training, food safety compliance, and operational excellence into one powerful system.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Badge className="px-4 py-2 text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
            UK FSA Compliant
          </Badge>
          <Badge className="px-4 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200">
            HACCP Enabled
          </Badge>
          <Badge className="px-4 py-2 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200">
            Multi-User Platform
          </Badge>
          <Badge className="px-4 py-2 text-sm bg-amber-100 text-amber-700 hover:bg-amber-200">
            Real-Time Operations
          </Badge>
        </div>
      </div>

      {/* Operating Modes */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Three Operating Modes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {modes.map((mode, idx) => (
              <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 rounded-xl ${mode.color} flex items-center justify-center mx-auto mb-3`}>
                    <mode.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-lg">{mode.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 text-center">{mode.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Core Features */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-center text-slate-800">
          Complete Feature Set
        </h2>
        
        <div className="grid gap-6">
          {features.map((feature, idx) => (
            <Card key={idx} className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className={`bg-gradient-to-r ${feature.color} text-white rounded-t-lg`}>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <feature.icon className="w-7 h-7" />
                  {feature.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="grid md:grid-cols-2 gap-3">
                  {feature.capabilities.map((capability, capIdx) => (
                    <li key={capIdx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700">{capability}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Key Benefits */}
      <Card className="border-2 shadow-xl bg-gradient-to-br from-emerald-50 to-amber-50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-600" />
            Key Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-emerald-700">For Management</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2"></div>
                  <span className="text-slate-700">Real-time visibility into all operations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2"></div>
                  <span className="text-slate-700">Automated compliance and audit trails</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2"></div>
                  <span className="text-slate-700">Cost control through menu engineering</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2"></div>
                  <span className="text-slate-700">Staff performance and development tracking</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-amber-700">For Staff</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2"></div>
                  <span className="text-slate-700">Clear visual guides and SOPs</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2"></div>
                  <span className="text-slate-700">Structured training and career progression</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2"></div>
                  <span className="text-slate-700">Mobile-friendly checklists and forms</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2"></div>
                  <span className="text-slate-700">Recognition through certifications</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardTitle className="text-2xl">Perfect For</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Quick Service Restaurants</h4>
              <p className="text-sm text-slate-600">Fast-paced operations with high volume and strict timing</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <h4 className="font-semibold text-emerald-900 mb-2">Casual Dining</h4>
              <p className="text-sm text-slate-600">Complex menus with emphasis on food quality and presentation</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">Multi-Unit Chains</h4>
              <p className="text-sm text-slate-600">Standardized operations across multiple locations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-8 text-slate-600">
        <p className="text-sm">
          AURA - Transforming restaurant operations through digital excellence
        </p>
      </div>
    </div>
  );
}