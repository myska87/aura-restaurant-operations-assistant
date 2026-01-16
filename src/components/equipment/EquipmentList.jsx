import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, AlertCircle, Clock } from 'lucide-react';

export default function EquipmentList({ equipment, todayChecks, onCheck, onReportFault }) {
  const getCheckStatus = (equipmentId) => {
    const check = todayChecks.find(c => c.equipment_id === equipmentId);
    if (!check) return { status: 'not_checked', label: 'Not Checked', icon: Clock, color: 'text-slate-500' };
    
    if (check.status === 'ok') return { status: 'ok', label: 'OK', icon: CheckCircle, color: 'text-emerald-600' };
    if (check.status === 'warning') return { status: 'warning', label: 'Warning', icon: AlertCircle, color: 'text-amber-600' };
    return { status: 'fault', label: 'Fault', icon: AlertTriangle, color: 'text-red-600' };
  };

  // Prioritize equipment by check status
  const sortedEquipment = [...equipment].sort((a, b) => {
    const aStatus = getCheckStatus(a.id).status;
    const bStatus = getCheckStatus(b.id).status;
    const priority = { 'fault': 0, 'warning': 1, 'not_checked': 2, 'ok': 3 };
    return priority[aStatus] - priority[bStatus];
  });

  return (
    <div className="space-y-3">
      {sortedEquipment.map(eq => {
        const checkStatus = getCheckStatus(eq.id);
        const StatusIcon = checkStatus.icon;
        
        return (
          <Card key={eq.id} className={
            checkStatus.status === 'fault' ? 'border-red-300 bg-red-50' :
            checkStatus.status === 'warning' ? 'border-amber-300 bg-amber-50' :
            checkStatus.status === 'not_checked' ? 'border-slate-300 bg-slate-50' :
            'border-emerald-300 bg-emerald-50'
          }>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <StatusIcon className={`w-6 h-6 ${checkStatus.color}`} />
                  <div>
                    <h3 className="font-semibold">{eq.name}</h3>
                    <p className="text-sm text-slate-600">{eq.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={
                    checkStatus.status === 'fault' ? 'bg-red-100 text-red-800 border-red-300' :
                    checkStatus.status === 'warning' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    checkStatus.status === 'not_checked' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                    'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }>
                    {checkStatus.label}
                  </Badge>
                  
                  {checkStatus.status !== 'ok' && (
                    <Button size="sm" onClick={() => onCheck(eq)} variant="outline">
                      Check Now
                    </Button>
                  )}
                  
                  {(checkStatus.status === 'warning' || checkStatus.status === 'fault') && (
                    <Button size="sm" onClick={() => onReportFault(eq)} className="bg-red-600 hover:bg-red-700">
                      Report Fault
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}