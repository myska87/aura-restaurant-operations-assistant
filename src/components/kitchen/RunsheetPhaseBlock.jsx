import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * A single phase block rendered as an Excel-style table of rows.
 * Supports checkbox, number, text, and temp input types.
 */
export default function RunsheetPhaseBlock({ title, time, icon, color, rows, onToggle, onValueChange, highlight }) {
  return (
    <div className={`rounded-lg border-2 ${highlight ? 'border-amber-400 shadow-amber-100 shadow-lg' : 'border-slate-200'} overflow-hidden`}>
      {/* Phase Header */}
      <div className={`${color} px-4 py-2 flex items-center gap-2`}>
        <span className="text-lg">{icon}</span>
        <div>
          <span className="font-bold text-white text-sm">{time && <span className="opacity-80 mr-2">{time}</span>}{title}</span>
        </div>
      </div>

      {/* Rows */}
      <table className="w-full text-sm bg-white">
        <tbody>
          {rows.map((row, i) => {
            if (row.type === 'header') {
              return (
                <tr key={i} className="bg-slate-100 border-b border-slate-200">
                  {row.cols.map((col, j) => (
                    <th key={j} className="px-3 py-2 text-left font-semibold text-slate-700 text-xs uppercase tracking-wide" style={{ width: col.width }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              );
            }

            if (row.type === 'divider') {
              return (
                <tr key={i} className="bg-amber-50 border-y border-amber-200">
                  <td colSpan={99} className="px-3 py-1 text-xs font-bold text-amber-800">{row.label}</td>
                </tr>
              );
            }

            if (row.type === 'info') {
              return (
                <tr key={i} className="border-b border-slate-100 bg-slate-50">
                  <td colSpan={99} className="px-3 py-2 text-xs text-slate-600 italic">{row.label}</td>
                </tr>
              );
            }

            if (row.type === 'temp_row') {
              return (
                <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-3 py-2 text-slate-500 text-xs w-8">{row.num}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{row.label}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-mono">{row.target}</span>
                  </td>
                  {['morning', 'midday', 'evening'].map(period => (
                    <td key={period} className="px-2 py-1 w-24">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="—"
                        value={row.values?.[period] || ''}
                        onChange={e => onValueChange && onValueChange(row.id, period, e.target.value)}
                        className="h-7 text-center text-xs font-mono border-slate-300 focus:border-blue-400 focus:ring-blue-200 px-1"
                        onKeyDown={e => e.key === 'Enter' || e.key === 'Tab' ? e.target.blur() : null}
                      />
                    </td>
                  ))}
                </tr>
              );
            }

            if (row.type === 'prep_row') {
              return (
                <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-3 py-2 font-medium text-slate-800">{row.label}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="text-slate-500 text-xs font-mono">{row.target}</span>
                  </td>
                  <td className="px-2 py-1 w-28">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Actual"
                      value={row.value || ''}
                      onChange={e => onValueChange && onValueChange(row.id, 'done', e.target.value)}
                      className="h-7 text-center text-xs font-mono border-slate-300 focus:border-emerald-400 focus:ring-emerald-200 px-1"
                    />
                  </td>
                  <td className="px-2 py-1 w-10 text-center">
                    <button onClick={() => onToggle && onToggle(row.id)} className="text-emerald-600 hover:text-emerald-800 transition-colors">
                      {row.checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-300" />}
                    </button>
                  </td>
                </tr>
              );
            }

            // Default: checkbox row
            return (
              <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${row.checked ? 'bg-emerald-50/60' : ''}`} onClick={() => onToggle && onToggle(row.id)}>
                <td className="px-3 py-2 w-10">
                  <button className="text-emerald-600 hover:text-emerald-800 transition-colors" onClick={e => { e.stopPropagation(); onToggle && onToggle(row.id); }}>
                    {row.checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-300" />}
                  </button>
                </td>
                <td className={`px-3 py-2 flex-1 ${row.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {row.label}
                </td>
                {row.badge && (
                  <td className="px-3 py-2 w-24 text-right">
                    <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-semibold">{row.badge}</span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}