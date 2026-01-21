import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

// Core modules that should not be modified without explicit unlock
const PROTECTED_MODULES = {
  VisualProcedures: {
    name: 'Visual Procedures',
    description: 'Core training and safety procedures',
    files: ['pages/VisualProcedureForm.js', 'pages/VisualProcedures.js']
  },
  MenuManager: {
    name: 'Menu Manager',
    description: 'Menu items, costing, and profitability',
    files: ['pages/MenuManager.js', 'pages/MenuItemDetail.js']
  },
  VisualDishGuides: {
    name: 'Visual Dish Guides',
    description: 'Recipe and preparation guides',
    files: ['pages/VisualDishGuides.js', 'pages/VisualDishGuideForm.js']
  },
  CommandCenter: {
    name: 'Command Center',
    description: 'Central KPI dashboard and analytics',
    files: ['pages/CommandCenter.js']
  },
  ChemicalSafety: {
    name: 'Chemical Safety',
    description: 'Chemical management and incident tracking',
    files: ['pages/ChemicalDashboard.js', 'pages/ChemicalDetail.js']
  }
};

export function getCoreModules() {
  return PROTECTED_MODULES;
}

export function isCoreModule(moduleName) {
  return moduleName in PROTECTED_MODULES;
}

export function getModuleProtectionStatus(moduleName) {
  if (!isCoreModule(moduleName)) {
    return { protected: false, module: null };
  }
  return { protected: true, module: PROTECTED_MODULES[moduleName] };
}

export default function CoreModuleProtectionWarning({ moduleName, onUnderstand }) {
  const { protected: isProtected, module } = getModuleProtectionStatus(moduleName);

  if (!isProtected) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">⚠️ Core Module Protected</h3>
              <p className="text-sm text-amber-800 mb-2">
                <strong>{module.name}</strong> is a core module that affects critical business operations. {module.description}
              </p>
              <p className="text-xs text-amber-700">
                This module is monitored for changes. Unauthorized modifications may break existing workflows. 
                <strong> Make sure you understand the impact before saving.</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}