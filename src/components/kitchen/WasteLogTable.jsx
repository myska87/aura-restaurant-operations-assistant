import React from 'react';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function WasteLogTable({ rows, onChange, onAdd, onRemove }) {
  return (
    <div className="rounded-lg border-2 border-red-200 overflow-hidden">
      <div className="bg-red-600 px-4 py-2 flex items-center justify-between">
        <span className="font-bold text-white text-sm">🗑️ WASTE CONTROL LOG</span>
        <Button size="sm" variant="ghost" className="h-7 text-white hover:bg-red-500 border border-white/30" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Row
        </Button>
      </div>
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700 text-xs w-1/4">Item</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700 text-xs w-20">Qty Discarded</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700 text-xs">Reason</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-700 text-xs w-20">Chef Initial</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-700 text-xs w-20">Mgr ✓</th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-2 py-1">
                  <Input value={row.item || ''} onChange={e => onChange(i, 'item', e.target.value)} placeholder="e.g. Tikka Base" className="h-7 text-xs border-slate-200" />
                </td>
                <td className="px-2 py-1">
                  <Input value={row.qty || ''} onChange={e => onChange(i, 'qty', e.target.value)} placeholder="e.g. 2L" className="h-7 text-xs border-slate-200 text-center" />
                </td>
                <td className="px-2 py-1">
                  <Input value={row.reason || ''} onChange={e => onChange(i, 'reason', e.target.value)} placeholder="Expired / Overproduced / Spill" className="h-7 text-xs border-slate-200" />
                </td>
                <td className="px-2 py-1">
                  <Input value={row.chef_initial || ''} onChange={e => onChange(i, 'chef_initial', e.target.value)} placeholder="Initials" className="h-7 text-xs border-slate-200 text-center" maxLength={4} />
                </td>
                <td className="px-2 py-1 text-center">
                  <button onClick={() => onChange(i, 'manager_check', !row.manager_check)} className="text-emerald-600 hover:text-emerald-800">
                    {row.manager_check ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-300" />}
                  </button>
                </td>
                <td className="px-2 py-1">
                  <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-4 text-slate-400 text-xs">No waste logged yet — tap "+ Add Row"</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}