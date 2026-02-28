import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Printer, RefreshCw, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import RunsheetPhaseBlock from '@/components/kitchen/RunsheetPhaseBlock';
import WasteLogTable from '@/components/kitchen/WasteLogTable';
import DailySignOff from '@/components/kitchen/DailySignOff';

// ─── Static structure of the runsheet ──────────────────────────────────────────
const EQUIPMENT_LIST = [
  { id: 'eq1', label: 'Freezer', target: '< -18°C' },
  { id: 'eq2', label: 'Single Door Fridge', target: '< 5°C' },
  { id: 'eq3', label: 'Double Fridge', target: '< 5°C' },
  { id: 'eq4', label: 'Double Door Table Fridge', target: '< 5°C' },
  { id: 'eq5', label: '3 Door Fridge', target: '< 5°C' },
  { id: 'eq6', label: 'Undercounter Table Fridge', target: '< 5°C' },
  { id: 'eq7', label: 'Undercounter Display Fridge', target: '< 5°C' },
  { id: 'eq8', label: 'Large Display Tall Fridge', target: '< 5°C' },
  { id: 'eq9', label: 'Narrow Tall Drink Fridge', target: '< 5°C' },
  { id: 'eq10', label: 'Spare / Other Fridge', target: '< 5°C' },
];

const PREP_ITEMS = [
  { id: 'prep_tikka', label: 'Tikka Base', target: '10L' },
  { id: 'prep_makhani', label: 'Makhani Base', target: '8L' },
  { id: 'prep_keema', label: 'Keema', target: '5kg' },
  { id: 'prep_beans', label: 'Masala Beans', target: '5L' },
  { id: 'prep_chole', label: 'Chole', target: '4L' },
  { id: 'prep_batter', label: 'Crepe Batter', target: '3L' },
  { id: 'prep_rice', label: 'Rice (cooked)', target: '15kg' },
  { id: 'prep_mint', label: 'Mint Yogurt', target: '3kg' },
  { id: 'prep_crispion', label: 'Crisp Onion', target: '2kg' },
  { id: 'prep_pickled', label: 'Pickled Onion', target: '2kg' },
  { id: 'prep_chicken', label: 'Chicken (marinated)', target: '6kg' },
  { id: 'prep_paneer', label: 'Paneer (cubed)', target: '4kg' },
];

const PHASES = [
  {
    id: 'phase1_safety',
    title: 'OPENING PROCESS — SAFETY CHECK',
    time: '05:45',
    icon: '🛡️',
    color: 'bg-red-700',
    checkIds: ['safe_temps', 'safe_gas', 'safe_cleaning', 'safe_hothold_off', 'safe_handwash', 'safe_dishwasher'],
    checks: [
      { id: 'safe_temps', label: 'Fridge & Freezer temps logged' },
      { id: 'safe_gas', label: 'Gas / burners checked & safe' },
      { id: 'safe_cleaning', label: 'Cleaning checklist signed' },
      { id: 'safe_hothold_off', label: 'Hot holding unit OFF', badge: 'OFF' },
      { id: 'safe_handwash', label: 'Handwash station stocked' },
      { id: 'safe_dishwasher', label: 'Turn on the dishwasher' },
    ],
  },
  {
    id: 'phase1_bases',
    title: 'CORE BASE COOKING — Stage 1',
    time: '06:10',
    icon: '🍲',
    color: 'bg-orange-600',
    checkIds: ['base_tikka', 'base_makhani', 'base_keema', 'base_beans', 'base_chole'],
    checks: [
      { id: 'base_tikka', label: 'Tikka Base  (25 min · 75°C min · Fridge 1 Top)' },
      { id: 'base_makhani', label: 'Makhani Base  (20 min · 75°C min · Fridge 1 Mid)' },
      { id: 'base_keema', label: 'Keema  (25 min · 75°C min · Fridge 1 Mid)' },
      { id: 'base_beans', label: 'Masala Beans  (15 min · 75°C min · Fridge 1 Bottom)' },
      { id: 'base_chole', label: 'Chole  (20 min · 75°C min · Fridge 1 Bottom)' },
    ],
  },
  {
    id: 'phase1_protein',
    title: 'PROTEIN PREP — Stage 2',
    time: '06:40',
    icon: '🥩',
    color: 'bg-pink-700',
    checkIds: ['prot_chicken', 'prot_paneer', 'prot_keema'],
    checks: [
      { id: 'prot_chicken', label: 'Chicken Tikka — Marinate · 500g trays · RAW FRIDGE Top', badge: 'RAW' },
      { id: 'prot_paneer', label: 'Paneer — Cube from block · 200g portions · RAW FRIDGE Mid', badge: 'RAW' },
      { id: 'prot_keema', label: 'Keema — Portion to trays · COOKED FRIDGE Labelled', badge: 'COOKED' },
    ],
  },
  {
    id: 'phase1_garnish',
    title: 'COLD & GARNISH PREP — Stage 3',
    time: '06:55',
    icon: '🌿',
    color: 'bg-green-700',
    checkIds: ['garn_all'],
    checks: [
      { id: 'garn_all', label: 'All items prepped, labelled & stored — Mint Yogurt, Crisp Onion, Pickled Onion, Coriander, Micro Herbs, Sweet Creams' },
    ],
  },
  {
    id: 'phase1_bev',
    title: 'BEVERAGE HOLD POLICY',
    time: '07:15',
    icon: '☕',
    color: 'bg-amber-700',
    checkIds: ['bev_milk', 'bev_coffee'],
    checks: [
      { id: 'bev_milk', label: 'Milk-based (Karak/Coffee Fusion) — Max 2h, then Discard' },
      { id: 'bev_coffee', label: 'Black Coffee — Max 3h (4h Safety), then Discard' },
    ],
  },
  {
    id: 'phase1_setup',
    title: 'REHEAT & HOT HOLD SETUP',
    time: '07:30',
    icon: '🔥',
    color: 'bg-red-600',
    checkIds: ['setup_paratha', 'setup_protein', 'setup_grill', 'setup_tikka', 'setup_makhani', 'setup_keema', 'setup_batter', 'setup_fillings', 'setup_yogurt', 'setup_creams', 'setup_herbs', 'setup_chutney', 'setup_base_sauces'],
    checks: [
      { id: 'setup_paratha', label: 'HOT — Paratha stock' },
      { id: 'setup_protein', label: 'HOT — Protein trays' },
      { id: 'setup_grill', label: 'HOT — Grill turned on' },
      { id: 'setup_tikka', label: 'SAUCE — Tikka base' },
      { id: 'setup_makhani', label: 'SAUCE — Makhani base' },
      { id: 'setup_keema', label: 'SAUCE — Keema' },
      { id: 'setup_batter', label: 'CREPE — Crepe batter' },
      { id: 'setup_fillings', label: 'CREPE — Fillings ready' },
      { id: 'setup_yogurt', label: 'COLD — Yogurt squeeze' },
      { id: 'setup_creams', label: 'COLD — Sweet creams' },
      { id: 'setup_herbs', label: 'COLD — Herbs portioned' },
      { id: 'setup_chutney', label: 'COLD — Chutney pots' },
      { id: 'setup_base_sauces', label: 'COLD — Base sauces' },
    ],
  },
  {
    id: 'phase1_final',
    title: 'FINAL MANAGER WALK',
    time: '07:45',
    icon: '👁️',
    color: 'bg-slate-700',
    checkIds: ['final_labels', 'final_raw', 'final_timers', 'final_chai', 'final_70'],
    checks: [
      { id: 'final_labels', label: 'Containers labelled?' },
      { id: 'final_raw', label: 'No raw in cooked fridge?' },
      { id: 'final_timers', label: 'Timers set?' },
      { id: 'final_chai', label: 'Chai timer visible?' },
      { id: 'final_70', label: 'Stations at 70% capacity?' },
    ],
  },
  {
    id: 'phase3_transition',
    title: 'TRANSITION',
    time: '10:45',
    icon: '🔄',
    color: 'bg-blue-600',
    checkIds: ['trans_refill', 'trans_reset', 'trans_walk'],
    checks: [
      { id: 'trans_refill', label: 'Refill sauces if below 50%' },
      { id: 'trans_reset', label: 'Reset stations & replace breakfast trays with main menu' },
      { id: 'trans_walk', label: 'Manager Walk — Inspect kitchen before rush' },
    ],
  },
  {
    id: 'phase4_midday',
    title: 'MIDDAY CONTROL AUDIT',
    time: '13:30',
    icon: '📋',
    color: 'bg-violet-700',
    checkIds: ['mid_sauce', 'mid_protein', 'mid_garnish', 'mid_rice', 'mid_hothold', 'mid_waste'],
    checks: [
      { id: 'mid_sauce', label: 'Sauce levels checked' },
      { id: 'mid_protein', label: 'Protein levels checked' },
      { id: 'mid_garnish', label: 'Garnish freshness checked' },
      { id: 'mid_rice', label: 'Rice timer verified' },
      { id: 'mid_hothold', label: 'Hot hold temps verified > 63°C and recorded' },
      { id: 'mid_waste', label: 'Waste accumulation checked' },
    ],
  },
  {
    id: 'phase7_closing',
    title: 'CLOSING PROCEDURE',
    time: 'CLOSE',
    icon: '🔒',
    color: 'bg-slate-800',
    checkIds: ['close_stop', 'close_labels', 'close_temps', 'close_clean'],
    checks: [
      { id: 'close_stop', label: 'Stop service. Record final waste.' },
      { id: 'close_labels', label: 'Label all overnight items. Discard all expired product.' },
      { id: 'close_temps', label: 'Log fridge temps again. Record final hot hold temps.' },
      { id: 'close_clean', label: 'Deep clean. Turn off gas.' },
    ],
  },
  {
    id: 'handover_notes',
    title: 'HANDOVER NOTES',
    time: 'CLOSE',
    icon: '📝',
    color: 'bg-indigo-700',
    checkIds: ['ho_stock', 'ho_prep', 'ho_equip', 'ho_forecast'],
    checks: [
      { id: 'ho_stock', label: 'Low stock items logged' },
      { id: 'ho_prep', label: 'Prep required tomorrow highlighted' },
      { id: 'ho_equip', label: 'Equipment issues reported' },
      { id: 'ho_forecast', label: 'Forecast alerts communicated' },
    ],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getPhaseProgress(phase, checks) {
  const ids = phase.checkIds || [];
  if (ids.length === 0) return 100;
  const done = ids.filter(id => checks[id]).length;
  return Math.round((done / ids.length) * 100);
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function KitchenRunsheet() {
  const [user, setUser] = useState(null);
  const today = format(new Date(), 'yyyy-MM-dd');
  const queryClient = useQueryClient();

  // Check state: { [checkId]: bool }
  const [checks, setChecks] = useState({});
  // Temp readings: { [equipId]: { morning, midday, evening } }
  const [tempReadings, setTempReadings] = useState({});
  // Prep quantities: { [prepId]: { value, checked } }
  const [prepQty, setPrepQty] = useState({});
  // Waste log rows
  const [wasteLogs, setWasteLogs] = useState([]);
  // Sign-off
  const [signOff, setSignOff] = useState({ opening: '', midday: '', closing: '' });
  // Collapsed phases
  const [collapsed, setCollapsed] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['kitchen_runsheet', today],
    queryFn: () => base44.entities.KitchenRunsheet.filter({ date: today }, '-created_date', 1),
    enabled: !!user,
  });

  // Hydrate from existing record
  useEffect(() => {
    if (existing && existing.length > 0) {
      const rec = existing[0];
      if (rec.items) {
        const c = {};
        rec.items.forEach(i => { if (i.type === 'checkbox') c[i.item_id] = !!i.checked; });
        setChecks(c);
      }
      if (rec.temperature_readings) setTempReadings(rec.temperature_readings);
      if (rec.prep_quantities) {
        const pq = {};
        Object.entries(rec.prep_quantities).forEach(([k, v]) => { pq[k] = typeof v === 'object' ? v : { value: v, checked: false }; });
        setPrepQty(pq);
      }
      if (rec.waste_log) setWasteLogs(rec.waste_log);
      if (rec.notes) {
        try { const so = JSON.parse(rec.notes); setSignOff(so); } catch { }
      }
    }
  }, [existing]);

  const toggleCheck = useCallback((id) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleTempChange = useCallback((equipId, period, value) => {
    setTempReadings(prev => ({
      ...prev,
      [equipId]: { ...(prev[equipId] || {}), [period]: value },
    }));
  }, []);

  const handlePrepChange = useCallback((prepId, field, value) => {
    if (field === 'done') {
      setPrepQty(prev => ({ ...prev, [prepId]: { ...(prev[prepId] || {}), value } }));
    }
  }, []);

  const togglePrepCheck = useCallback((prepId) => {
    setPrepQty(prev => ({ ...prev, [prepId]: { ...(prev[prepId] || {}), checked: !prev[prepId]?.checked } }));
  }, []);

  const handleWasteChange = (i, field, value) => {
    setWasteLogs(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n; });
  };

  // KPI: total completed checks
  const allCheckIds = PHASES.flatMap(p => p.checkIds);
  const completedCount = allCheckIds.filter(id => checks[id]).length;
  const totalCount = allCheckIds.length;
  const pct = Math.round((completedCount / totalCount) * 100);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const items = allCheckIds.map(id => ({ item_id: id, type: 'checkbox', checked: !!checks[id], timestamp: new Date().toISOString() }));
      const payload = {
        date: today,
        items,
        temperature_readings: tempReadings,
        prep_quantities: prepQty,
        waste_log: wasteLogs,
        notes: JSON.stringify(signOff),
        signed_by: user?.email,
        signed_by_name: user?.full_name || user?.email,
        signed_at: new Date().toISOString(),
        status: pct === 100 ? 'completed' : 'in_progress',
      };
      if (existing && existing.length > 0) {
        return base44.entities.KitchenRunsheet.update(existing[0].id, payload);
      }
      return base44.entities.KitchenRunsheet.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kitchen_runsheet']);
      toast.success('✅ Runsheet saved');
      setSaving(false);
    },
    onError: () => { toast.error('Error saving runsheet'); setSaving(false); },
  });

  const handleSave = () => { setSaving(true); saveMutation.mutate(); };

  // Auto-save debounce
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => { if (Object.keys(checks).length > 0 || wasteLogs.length > 0) saveMutation.mutate(); }, 4000);
    return () => clearTimeout(t);
  }, [checks, tempReadings, prepQty, wasteLogs]);

  if (!user || isLoading) return <LoadingSpinner message="Loading runsheet..." />;

  const toggleCollapse = (id) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-24">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3 sticky top-0 z-10 bg-white/90 backdrop-blur-sm py-3 px-1 -mx-1 rounded-b-xl border-b border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">🍃 CHAI PATTA — Kitchen Runsheet</h1>
          <p className="text-slate-500 text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')} · Non-Negotiable Operational Standard</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-sm px-3 py-1 ${pct === 100 ? 'bg-emerald-100 text-emerald-700' : pct > 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            {pct}% Complete ({completedCount}/{totalCount})
          </Badge>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving || saveMutation.isPending}>
            {saving || saveMutation.isPending ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>

      {/* ── KPI Bar ── */}
      <Card className="border-2 border-emerald-200 bg-emerald-50">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-6 flex-wrap text-sm font-semibold">
            <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-600" /> KPI Targets</span>
            {['Waste < 3%', 'Zero temp breaches', 'Zero expired', 'Zero cross-contamination', 'No double reheat'].map(kpi => (
              <span key={kpi} className="text-emerald-700">✅ {kpi}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Phase Checklist Blocks ── */}
      {PHASES.map(phase => {
        const prog = getPhaseProgress(phase, checks);
        const isCollapsed = collapsed[phase.id];
        return (
          <div key={phase.id}>
            {/* Phase header with collapse toggle */}
            <button
              className="w-full text-left flex items-center justify-between px-4 py-2 rounded-t-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              onClick={() => toggleCollapse(phase.id)}
            >
              <span className="font-semibold text-slate-700 text-sm">
                {phase.icon} {phase.time && <span className="text-slate-400 font-mono mr-2">{phase.time}</span>}{phase.title}
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${prog === 100 ? 'text-emerald-600' : prog > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {prog}%
                </span>
                {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {!isCollapsed && (
              <RunsheetPhaseBlock
                title={phase.title}
                time={phase.time}
                icon={phase.icon}
                color={phase.color}
                rows={phase.checks.map(c => ({ ...c, type: 'checkbox', checked: !!checks[c.id] }))}
                onToggle={toggleCheck}
              />
            )}
          </div>
        );
      })}

      {/* ── Daily Temperature Log ── */}
      <div>
        <button
          className="w-full text-left flex items-center justify-between px-4 py-2 rounded-t-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
          onClick={() => toggleCollapse('temp_table')}
        >
          <span className="font-semibold text-slate-700 text-sm">🌡️ DAILY TEMPERATURE LOG</span>
          {collapsed['temp_table'] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>
        {!collapsed['temp_table'] && (
          <div className="rounded-b-lg border-2 border-blue-300 overflow-hidden">
            <div className="bg-blue-700 px-4 py-2"><span className="font-bold text-white text-sm">🌡️ DAILY TEMPERATURE LOG — Log morning, midday & evening</span></div>
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-8">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Equipment Name</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 w-24">Target</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-blue-700 w-24">🌅 Morning</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-amber-700 w-24">☀️ Midday</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-indigo-700 w-24">🌙 Evening</th>
                  </tr>
                </thead>
                <tbody>
                  {EQUIPMENT_LIST.map((eq, i) => {
                    const vals = tempReadings[eq.id] || {};
                    const getCellClass = (v, target) => {
                      if (!v) return '';
                      const num = parseFloat(v);
                      const isFreezer = target.includes('-18');
                      if (isFreezer) return num <= -18 ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold bg-red-50';
                      return num <= 5 ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold bg-red-50';
                    };
                    return (
                      <tr key={eq.id} className={`border-b hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                        <td className="px-3 py-1.5 text-slate-400 text-xs">{i + 1}</td>
                        <td className="px-3 py-1.5 font-medium text-slate-800">{eq.label}</td>
                        <td className="px-3 py-1.5 text-center">
                          <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{eq.target}</span>
                        </td>
                        {['morning', 'midday', 'evening'].map(period => (
                          <td key={period} className="px-2 py-1">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="—"
                              value={vals[period] || ''}
                              onChange={e => handleTempChange(eq.id, period, e.target.value)}
                              className={`w-full h-7 text-center text-xs font-mono border border-slate-200 rounded px-1 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 ${getCellClass(vals[period], eq.target)}`}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Night-before Prep Log ── */}
      <div>
        <button
          className="w-full text-left flex items-center justify-between px-4 py-2 rounded-t-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
          onClick={() => toggleCollapse('prep_table')}
        >
          <span className="font-semibold text-slate-700 text-sm">📦 NIGHT-BEFORE BASE PREP / PRODUCTION FORECAST</span>
          {collapsed['prep_table'] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>
        {!collapsed['prep_table'] && (
          <div className="rounded-b-lg border-2 border-amber-300 overflow-hidden">
            <div className="bg-amber-600 px-4 py-2"><span className="font-bold text-white text-sm">📦 PREP QUANTITIES — Enter actuals, tick when done</span></div>
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Item</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 w-24">Target</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 w-28">Actual Done</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 w-12">✓</th>
                  </tr>
                </thead>
                <tbody>
                  {PREP_ITEMS.map((item, i) => {
                    const entry = prepQty[item.id] || {};
                    return (
                      <tr key={item.id} className={`border-b hover:bg-slate-50 ${entry.checked ? 'bg-emerald-50/60' : ''} ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                        <td className={`px-3 py-1.5 font-medium ${entry.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.label}</td>
                        <td className="px-3 py-1.5 text-center"><span className="font-mono text-xs text-slate-500">{item.target}</span></td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            value={entry.value || ''}
                            onChange={e => handlePrepChange(item.id, 'done', e.target.value)}
                            className="w-full h-7 text-center text-xs font-mono border border-slate-200 rounded px-1 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <button onClick={() => togglePrepCheck(item.id)} className="text-emerald-600 hover:text-emerald-800">
                            {entry.checked
                              ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              : <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Waste Log ── */}
      <WasteLogTable
        rows={wasteLogs}
        onChange={handleWasteChange}
        onAdd={() => setWasteLogs(prev => [...prev, { item: '', qty: '', reason: '', chef_initial: '', manager_check: false }])}
        onRemove={i => setWasteLogs(prev => prev.filter((_, idx) => idx !== i))}
      />

      {/* ── Daily Sign-Off ── */}
      <DailySignOff
        openingBy={{ name: signOff.opening, onChange: v => setSignOff(p => ({ ...p, opening: v })) }}
        middayBy={{ name: signOff.midday, onChange: v => setSignOff(p => ({ ...p, midday: v })) }}
        closingBy={{ name: signOff.closing, onChange: v => setSignOff(p => ({ ...p, closing: v })) }}
        onSave={handleSave}
        saving={saving || saveMutation.isPending}
      />

      {/* ── Full Day Flow Summary ── */}
      <Card className="border border-slate-200">
        <CardContent className="py-3 px-4">
          <p className="text-xs font-bold text-slate-700 mb-2">🔁 FULL DAY FLOW SUMMARY</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-xs text-slate-600">
            {[
              ['05:45', 'Safety & Emergency Checks'],
              ['06:00', 'Forecast & Capacity Check'],
              ['06:10', 'Bases & Probe Calibration'],
              ['06:40', 'Protein'],
              ['06:55', 'Garnish'],
              ['07:15', 'Beverage'],
              ['07:30', 'Setup & Bain-Marie'],
              ['07:45', 'Check'],
              ['08:00', '✅ SERVICE'],
              ['10:45', 'Transition'],
              ['11:00', 'Breakfast Cut-Off'],
              ['13:30', 'Midday Audit'],
              ['15:00', 'Controlled Refill'],
              ['~1hr before close', 'Wind Down'],
              ['CLOSE', 'Waste + Handover + Clean'],
            ].map(([t, l]) => (
              <div key={t} className="flex gap-2 items-start">
                <span className="font-mono font-bold text-slate-400 w-16 shrink-0">{t}</span>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}