import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Power, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const CRITICAL_EQUIPMENT = [
  { id: 'dishwasher', label: '🍽️ Dishwasher', icon: '🍽️', requiredDuringService: true, criticalForClosing: true },
  { id: 'gas_interlock', label: '🔥 Gas Interlock', icon: '🔥', requiredDuringService: true, criticalForClosing: true },
  { id: 'hood', label: '💨 Extraction Hood', icon: '💨', requiredDuringService: true, criticalForClosing: true },
  { id: 'combi_oven', label: '🔥 Combi Oven', icon: '🔥', requiredDuringService: false, criticalForClosing: false },
  { id: 'reach_in_fridge', label: '❄️ Reach-in Fridge', icon: '❄️', requiredDuringService: false, criticalForClosing: false }
];

export default function EquipmentStatusIndicator({ myCheckIn, myClosingCompletion, onOpenClosing }) {
  // State to track equipment status - can be toggled by user
  const [equipmentStatus, setEquipmentStatus] = useState({
    dishwasher: myCheckIn ? 'on' : 'off',
    gas_interlock: myCheckIn ? 'on' : 'off',
    hood: myCheckIn ? 'on' : 'off',
    combi_oven: myCheckIn ? 'on' : 'off',
    reach_in_fridge: myCheckIn ? 'on' : 'off'
  });

  // Toggle equipment status
  const toggleEquipment = (equipmentId) => {
    setEquipmentStatus(prev => ({
      ...prev,
      [equipmentId]: prev[equipmentId] === 'on' ? 'off' : 'on'
    }));
  };

  // Check if critical equipment is properly set for service state
  const criticalIssues = CRITICAL_EQUIPMENT.filter(eq => {
    const status = equipmentStatus[eq.id];
    if (myCheckIn && !myClosingCompletion?.status === 'completed') {
      // During service: critical equipment should be ON
      return eq.requiredDuringService && status !== 'on';
    }
    if (myClosingCompletion?.status === 'completed') {
      // After closing: critical equipment should be OFF
      return eq.criticalForClosing && status !== 'off';
    }
    return false;
  });

  const allOk = criticalIssues.length === 0;

  return (
    <Card className={`border-2 shadow-xl transition-all ${
      allOk
        ? 'border-emerald-400 bg-gradient-to-r from-emerald-600 to-emerald-700'
        : 'border-red-400 bg-gradient-to-r from-red-600 to-red-700'
    } text-white`}>
      <CardContent className="pt-6">
        {/* Header Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div>
            <p className="text-emerald-100 text-xs mb-1">Date</p>
            <p className="font-bold">{format(new Date(), 'd MMM')}</p>
          </div>
          <div>
            <p className="text-emerald-100 text-xs mb-1">Shift</p>
            <p className="font-bold">{myCheckIn ? '🟢 LIVE' : '⚫ CLOSED'}</p>
          </div>
          <div>
            <p className="text-emerald-100 text-xs mb-1">Service Status</p>
            <p className="font-bold">{myCheckIn ? 'RUNNING' : 'IDLE'}</p>
          </div>
          <div>
            <p className="text-emerald-100 text-xs mb-1">Equipment</p>
            <p className="font-bold">{CRITICAL_EQUIPMENT.length} monitored</p>
          </div>
          <div>
            <p className="text-emerald-100 text-xs mb-1">Health</p>
            <p className={`font-bold ${allOk ? 'text-emerald-200' : 'text-red-200'}`}>
              {allOk ? '✓ OK' : `⚠️ ${criticalIssues.length} issues`}
            </p>
          </div>
        </div>

        {/* Equipment Status Grid - Click to Toggle */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {CRITICAL_EQUIPMENT.map((eq) => {
            const status = equipmentStatus[eq.id];
            const isOn = status === 'on';
            const shouldBeOn = myCheckIn && eq.requiredDuringService;
            const shouldBeOff = !myCheckIn && eq.criticalForClosing;
            const isCorrect = (shouldBeOn && isOn) || (shouldBeOff && !isOn);

            return (
              <motion.button
                key={eq.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleEquipment(eq.id)}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  isCorrect
                    ? 'border-emerald-300 bg-emerald-500 bg-opacity-30'
                    : 'border-red-300 bg-red-500 bg-opacity-30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{eq.icon}</span>
                  <motion.div 
                    animate={{ scale: isOn ? 1.2 : 1 }}
                    className={`w-3 h-3 rounded-full ${isOn ? 'bg-yellow-300 animate-pulse' : 'bg-slate-400'}`} 
                  />
                </div>
                <p className="text-xs font-semibold text-white mb-1 line-clamp-2">{eq.label.replace(/[🍽️🔥💨❄️]/g, '')}</p>
                <p className="text-xs font-bold text-white">
                  {isOn ? '⚡ ON' : '⭘ OFF'}
                </p>
                <p className="text-xs text-white opacity-70 mt-1">Click to toggle</p>
              </motion.button>
            );
          })}
        </div>

        {/* Alert Banner */}
        {criticalIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900 bg-opacity-50 border border-red-300 rounded-lg p-3 mb-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-200 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-200 mb-2">
                  ⚠️ {criticalIssues.length} Equipment Issue{criticalIssues.length !== 1 ? 's' : ''}
                </p>
                <ul className="text-xs text-red-100 space-y-1">
                  {criticalIssues.map((eq) => (
                    <li key={eq.id}>
                      • {eq.label} should be{' '}
                      <strong>{myCheckIn ? 'ON' : 'OFF'}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <div className="flex-1">
            {myCheckIn ? (
              <Badge className="w-full justify-center py-2 bg-white bg-opacity-20 text-white text-sm">
                <Power className="w-4 h-4 mr-2" />
                Service Running
              </Badge>
            ) : (
              <Badge className="w-full justify-center py-2 bg-slate-600 text-white text-sm">
                <Zap className="w-4 h-4 mr-2" />
                Service Idle
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}