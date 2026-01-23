import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export const DetailedCheckInsSection = ({ checkIns }) => {
  if (!checkIns || checkIns.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-emerald-300">
        ✅ Detailed Daily Check-Ins
      </h2>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-emerald-100">
              <th className="border border-slate-300 p-2 text-left font-semibold">Date</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Shift</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Performed By</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Station</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Check-In Time</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {checkIns.map((checkIn, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-300 p-2">{format(new Date(checkIn.shift_date), 'MMM d')}</td>
                <td className="border border-slate-300 p-2 font-semibold text-slate-700">{checkIn.shift_type}</td>
                <td className="border border-slate-300 p-2">{checkIn.staff_name}</td>
                <td className="border border-slate-300 p-2">{checkIn.staff_role}</td>
                <td className="border border-slate-300 p-2">{format(new Date(checkIn.check_in_time), 'HH:mm')}</td>
                <td className="border border-slate-300 p-2">
                  <Badge className={checkIn.status === 'checked_out' ? 'bg-slate-600' : 'bg-blue-600'}>
                    {checkIn.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DetailedTemperaturesSection = ({ temperatures }) => {
  if (!temperatures || temperatures.length === 0) return null;

  const compliant = temperatures.filter(t => t.is_in_range).length;
  const percentage = temperatures.length > 0 ? Math.round((compliant / temperatures.length) * 100) : 0;

  const getStatusIcon = (isInRange) => {
    if (isInRange) return '✅';
    return '🔴';
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-2 pb-2 border-b-2 border-emerald-300">
        🕒 Detailed Temperature Logs
      </h2>
      <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-sm font-semibold text-blue-900">
          Compliance Rate: {compliant}/{temperatures.length} ({percentage}%) ✓
        </p>
      </div>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-blue-100">
              <th className="border border-slate-300 p-2 text-left font-semibold">Date & Time</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Equipment</th>
              <th className="border border-slate-300 p-2 text-center font-semibold">Temp (°C)</th>
              <th className="border border-slate-300 p-2 text-center font-semibold">Target Range</th>
              <th className="border border-slate-300 p-2 text-center font-semibold">Status</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Logged By</th>
            </tr>
          </thead>
          <tbody>
            {temperatures.map((temp, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-300 p-2">{format(new Date(temp.created_date), 'MMM d HH:mm')}</td>
                <td className="border border-slate-300 p-2 font-semibold">{temp.equipment_name}</td>
                <td className="border border-slate-300 p-2 text-center font-bold text-lg">{temp.temperature}°</td>
                <td className="border border-slate-300 p-2 text-center text-slate-600">0-4°C</td>
                <td className="border border-slate-300 p-2 text-center">
                  <span className="text-lg">{getStatusIcon(temp.is_in_range)}</span>
                </td>
                <td className="border border-slate-300 p-2 text-xs">{temp.logged_by_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DetailedLabelsSection = ({ labels }) => {
  if (!labels || labels.length === 0) return null;

  const expired = labels.filter(l => new Date(l.use_by_date) < new Date());
  const active = labels.filter(l => new Date(l.use_by_date) >= new Date());

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-2 pb-2 border-b-2 border-emerald-300">
        🏷️ Detailed Label Print Log
      </h2>
      <div className="mb-3 p-3 bg-purple-50 rounded border border-purple-200">
        <p className="text-sm font-semibold text-purple-900">
          Active: {active.length} | Expired: {expired.length}
        </p>
      </div>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-purple-100">
              <th className="border border-slate-300 p-2 text-left font-semibold">Dish Name</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Prepared By</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Printed On</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Expiry Date</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Shelf Life</th>
              <th className="border border-slate-300 p-2 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label, idx) => {
              const isExpired = new Date(label.use_by_date) < new Date();
              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-300 p-2 font-semibold">{label.item_name}</td>
                  <td className="border border-slate-300 p-2">{label.prepared_by_name}</td>
                  <td className="border border-slate-300 p-2">{format(new Date(label.prep_date), 'MMM d HH:mm')}</td>
                  <td className="border border-slate-300 p-2 font-semibold text-red-600">
                    {format(new Date(label.use_by_date), 'MMM d')}
                  </td>
                  <td className="border border-slate-300 p-2">{label.shelf_life || 'N/A'}</td>
                  <td className="border border-slate-300 p-2 text-center">
                    <Badge className={isExpired ? 'bg-red-600' : 'bg-emerald-600'}>
                      {isExpired ? 'EXPIRED' : 'ACTIVE'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {expired.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
          <p className="font-semibold text-red-900 mb-2">⚠️ {expired.length} Expired Labels Detected</p>
          <ul className="text-sm text-red-800 space-y-1">
            {expired.map((label, idx) => (
              <li key={idx}>• {label.item_name} - Expired {format(new Date(label.use_by_date), 'MMM d')}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const DetailedHandoversSection = ({ handovers }) => {
  if (!handovers || handovers.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-emerald-300">
        🔁 Detailed Shift Handovers
      </h2>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-amber-100">
              <th className="border border-slate-300 p-2 text-left font-semibold">Date</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Shift</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">From</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">To</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Issues Noted</th>
              <th className="border border-slate-300 p-2 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {handovers.map((h, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-300 p-2">{format(new Date(h.shift_date), 'MMM d')}</td>
                <td className="border border-slate-300 p-2 font-semibold">{h.shift_type}</td>
                <td className="border border-slate-300 p-2">{h.handover_from_name}</td>
                <td className="border border-slate-300 p-2">{h.handover_to_name || '-'}</td>
                <td className="border border-slate-300 p-2 text-xs">
                  {h.stock_issues || h.equipment_issues ? '⚠️ Yes' : '✓ No'}
                </td>
                <td className="border border-slate-300 p-2 text-center">
                  <Badge className={h.acknowledged_by ? 'bg-emerald-600' : 'bg-amber-600'}>
                    {h.acknowledged_by ? 'ACK' : 'PENDING'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DetailedIssuesSection = ({ issues = [] }) => {
  if (!issues || issues.length === 0) return null;

  const bySeverity = {
    high: issues.filter(i => i.severity === 'high'),
    medium: issues.filter(i => i.severity === 'medium'),
    low: issues.filter(i => i.severity === 'low')
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-2 pb-2 border-b-2 border-emerald-300">
        ⚠️ Incidents & Issues Log
      </h2>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="p-2 bg-red-100 rounded">
          <p className="text-xs font-semibold text-red-900">High Severity</p>
          <p className="text-lg font-bold text-red-700">{bySeverity.high.length}</p>
        </div>
        <div className="p-2 bg-amber-100 rounded">
          <p className="text-xs font-semibold text-amber-900">Medium Severity</p>
          <p className="text-lg font-bold text-amber-700">{bySeverity.medium.length}</p>
        </div>
        <div className="p-2 bg-blue-100 rounded">
          <p className="text-xs font-semibold text-blue-900">Low Severity</p>
          <p className="text-lg font-bold text-blue-700">{bySeverity.low.length}</p>
        </div>
      </div>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-red-100">
              <th className="border border-slate-300 p-2 text-left font-semibold">Date</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Type</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Description</th>
              <th className="border border-slate-300 p-2 text-center font-semibold">Severity</th>
              <th className="border border-slate-300 p-2 text-left font-semibold">Action Taken</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-300 p-2">{format(new Date(issue.created_date || issue.date), 'MMM d')}</td>
                <td className="border border-slate-300 p-2">{issue.issue_type || issue.type}</td>
                <td className="border border-slate-300 p-2 text-xs">{issue.description || 'N/A'}</td>
                <td className="border border-slate-300 p-2 text-center">
                  <Badge className={
                    issue.severity === 'high' ? 'bg-red-600' :
                    issue.severity === 'medium' ? 'bg-amber-600' :
                    'bg-blue-600'
                  }>
                    {issue.severity?.toUpperCase()}
                  </Badge>
                </td>
                <td className="border border-slate-300 p-2 text-xs">{issue.action_taken || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};