import { useState, useEffect, useCallback } from 'react';
import { CATEGORIES, type Status, type Category, type Reaction } from './data';

/* ── Persistence ─────────────────────────────────────────── */
const STORAGE_KEY = 'jee_rx_statuses_v1';

function loadStatuses(): Record<string, Status> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStatuses(s: Record<string, Status>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/* ── Colours ──────────────────────────────────────────────── */
const C = {
  known:    { bar: '#22c55e', pill: 'bg-green-500/20 text-green-400 border-green-500/30',    btn: 'bg-green-600 text-white hover:bg-green-500',    left: 'border-l-green-500'   },
  revision: { bar: '#3b82f6', pill: 'bg-blue-500/20  text-blue-400  border-blue-500/30',     btn: 'bg-blue-600  text-white hover:bg-blue-500',     left: 'border-l-blue-500'    },
  unknown:  { bar: '#ef4444', pill: 'bg-red-500/20   text-red-400   border-red-500/30',      btn: 'bg-red-600   text-white hover:bg-red-500',      left: 'border-l-red-500'     },
  unset:    { bar: '#374151', pill: 'bg-white/5      text-gray-400  border-white/10',        btn: '',                                               left: 'border-l-white/10'    },
};

/* ── Sub-components ───────────────────────────────────────── */
function Pill({ status, count }: { status: Status; count: number }) {
  const c = C[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${c.pill}`}>
      {count}
    </span>
  );
}

function StatusBtn({
  label, active, color, onClick,
}: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded transition-all ${
        active ? color : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function ReactionRow({
  reaction, status, onSet,
}: { reaction: Reaction; status: Status; onSet: (s: Status) => void }) {
  const left = C[status].left;
  return (
    <div className={`border-l-2 pl-3 py-2 ${left} transition-colors`}>
      <div className="flex items-start gap-3">
        {reaction.num && (
          <span className="text-xs text-gray-600 tabular-nums pt-0.5 w-7 shrink-0">
            {reaction.num}.
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm text-gray-200 leading-relaxed">{reaction.eq}</p>
          <p className="text-xs text-gray-500 italic mt-1 leading-relaxed">{reaction.tip}</p>
        </div>
        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
          <StatusBtn
            label="Know it"
            active={status === 'known'}
            color={C.known.btn}
            onClick={() => onSet(status === 'known' ? 'unset' : 'known')}
          />
          <StatusBtn
            label="Revise"
            active={status === 'revision'}
            color={C.revision.btn}
            onClick={() => onSet(status === 'revision' ? 'unset' : 'revision')}
          />
          <StatusBtn
            label="Forgot"
            active={status === 'unknown'}
            color={C.unknown.btn}
            onClick={() => onSet(status === 'unknown' ? 'unset' : 'unknown')}
          />
        </div>
      </div>
    </div>
  );
}

function CategoryCard({
  category, statuses, statusFilter, onSet,
}: {
  category: Category;
  statuses: Record<string, Status>;
  statusFilter: Status | 'all';
  onSet: (id: string, s: Status) => void;
}) {
  const [open, setOpen] = useState(false);
  const getS = (id: string): Status => statuses[id] ?? 'unset';

  const known    = category.reactions.filter(r => getS(r.id) === 'known').length;
  const revision = category.reactions.filter(r => getS(r.id) === 'revision').length;
  const unknown  = category.reactions.filter(r => getS(r.id) === 'unknown').length;
  const total    = category.reactions.length;

  const filtered = statusFilter === 'all'
    ? category.reactions
    : category.reactions.filter(r => getS(r.id) === statusFilter);

  if (filtered.length === 0 && statusFilter !== 'all') return null;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-gray-400 text-sm">{open ? '▾' : '▸'}</span>
        <span className="text-sm font-medium text-gray-200 flex-1">{category.name}</span>
        <div className="flex items-center gap-2">
          <Pill status="known"    count={known}    />
          <Pill status="revision" count={revision} />
          <Pill status="unknown"  count={unknown}  />
          <span className="text-xs text-gray-600">/ {total}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10">
          <p className="text-xs text-gray-500 px-4 py-2 border-b border-white/5">{category.desc}</p>
          <div className="px-4 py-2 space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-600 py-2">No reactions match the current filter.</p>
            ) : (
              filtered.map(r => (
                <ReactionRow
                  key={r.id}
                  reaction={r}
                  status={getS(r.id)}
                  onSet={s => onSet(r.id, s)}
                />
              ))
            )}
          </div>
          <div className="flex gap-2 px-4 py-2 border-t border-white/10 bg-white/[0.02]">
            <button
              onClick={() => category.reactions.forEach(r => onSet(r.id, 'known'))}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              Mark all Known
            </button>
            <span className="text-gray-700">·</span>
            <button
              onClick={() => category.reactions.forEach(r => onSet(r.id, 'revision'))}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Mark all Revise
            </button>
            <span className="text-gray-700">·</span>
            <button
              onClick={() => category.reactions.forEach(r => onSet(r.id, 'unset'))}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Guide cards ──────────────────────────────────────────── */
function GuideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-4 py-2 border-b border-white/10 bg-white/[0.02]">
        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

/* ── Main App ─────────────────────────────────────────────── */
export default function App() {
  const [statuses, setStatuses] = useState<Record<string, Status>>(loadStatuses);
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  useEffect(() => { saveStatuses(statuses); }, [statuses]);

  const setStatus = useCallback((id: string, s: Status) => {
    setStatuses(prev => ({ ...prev, [id]: s }));
  }, []);

  const all        = CATEGORIES.flatMap(c => c.reactions);
  const getS       = (id: string): Status => statuses[id] ?? 'unset';
  const known      = all.filter(r => getS(r.id) === 'known').length;
  const revision   = all.filter(r => getS(r.id) === 'revision').length;
  const unknown    = all.filter(r => getS(r.id) === 'unknown').length;
  const unset      = all.filter(r => getS(r.id) === 'unset').length;
  const total      = all.length;
  const donePct    = total ? Math.round(((known + revision + unknown) / total) * 100) : 0;
  const knownPct   = total ? (known / total) * 100 : 0;
  const revPct     = total ? (revision / total) * 100 : 0;
  const unknownPct = total ? (unknown / total) * 100 : 0;

  const visibleCats = CATEGORIES.filter(c => catFilter === 'all' || c.id === catFilter);

  const filterPills: { val: Status | 'all'; label: string; color: string }[] = [
    { val: 'all',      label: `All (${total})`,             color: 'bg-white/10 text-white' },
    { val: 'known',    label: `Known (${known})`,           color: 'bg-green-600 text-white' },
    { val: 'revision', label: `Revise (${revision})`,       color: 'bg-blue-600 text-white' },
    { val: 'unknown',  label: `Forgot (${unknown})`,        color: 'bg-red-600 text-white' },
    { val: 'unset',    label: `Not set (${unset})`,         color: 'bg-white/10 text-gray-300' },
  ];

  return (
    <div className="min-h-screen bg-[#111] text-[#e4e4e4]">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">JEE 2025 — Inorganic Chemistry</h1>
          <p className="text-sm text-gray-400 mt-1">
            Reaction Tracker · {total} reactions across {CATEGORIES.length} categories · Progress saved in browser
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total',         value: total,         color: 'text-white' },
            { label: 'Known',         value: known,         color: 'text-green-400' },
            { label: 'Need Revision', value: revision,      color: 'text-blue-400' },
            { label: 'Forgotten',     value: unknown,       color: 'text-red-400' },
            { label: 'Assessed',      value: `${donePct}%`, color: 'text-gray-300' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className="h-2.5 rounded-full overflow-hidden flex bg-white/5">
            {knownPct   > 0 && <div style={{ width: `${knownPct}%`,   background: C.known.bar    }} />}
            {revPct     > 0 && <div style={{ width: `${revPct}%`,     background: C.revision.bar }} />}
            {unknownPct > 0 && <div style={{ width: `${unknownPct}%`, background: C.unknown.bar  }} />}
          </div>
          <div className="flex gap-4 mt-2">
            {[
              { label: `Known (${known})`,    color: 'text-green-400' },
              { label: `Revision (${revision})`, color: 'text-blue-400' },
              { label: `Forgot (${unknown})`, color: 'text-red-400' },
              { label: `Not set (${unset})`,  color: 'text-gray-600' },
            ].map(x => (
              <span key={x.label} className={`text-xs ${x.color}`}>{x.label}</span>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter by status</p>
          <div className="flex flex-wrap gap-2">
            {filterPills.map(f => (
              <button
                key={f.val}
                onClick={() => setStatusFilter(f.val)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                  statusFilter === f.val ? f.color : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter by category</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCatFilter('all')}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                catFilter === 'all' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.id)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                  catFilter === c.id ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {c.name.split('(')[0].trim().split(' ').slice(0, 3).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Divider + heading */}
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Reactions</h2>
          <div className="flex-1 border-t border-white/10" />
          <button
            onClick={() => { if (window.confirm('Reset ALL progress?')) setStatuses({}); }}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors"
          >
            Reset all
          </button>
        </div>

        {/* Category cards */}
        <div className="space-y-3">
          {visibleCats.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              statuses={statuses}
              statusFilter={statusFilter}
              onSet={setStatus}
            />
          ))}
        </div>

        {/* Memory guides */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <GuideCard title="No Reaction with H₂O — 9 Exceptions">
              <div className="space-y-1.5">
                {[
                  ['CO',   'C≡O stable; steam reforming needs ~1000°C'],
                  ['N₂O',  'Stable; N has no d-orbitals'],
                  ['NF₃',  'No d-orbitals on N, F too electronegative to leave'],
                  ['CCl₄', 'No d-orbitals on C (SiCl₄ DOES react!)'],
                  ['SF₆',  'All 6 positions blocked by F; kinetically inert'],
                  ['SiO₂', 'Giant covalent solid; Si–O polymer too stable'],
                  ['P₄',   'Stored under water but does NOT react'],
                  ['S₈',   'Hydrophobic solid; no reaction'],
                  ['I₂',   'Dissolves in KI as I₃⁻, barely reacts with H₂O'],
                ].map(([c, r]) => (
                  <div key={c} className="flex gap-3">
                    <span className="font-mono text-xs text-gray-300 w-10 shrink-0 pt-0.5">{c}</span>
                    <span className="text-xs text-gray-500">{r}</span>
                  </div>
                ))}
              </div>
            </GuideCard>

            <GuideCard title="Acid Anhydrides + HNO₃ Rules">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400">Anhydride → Oxyacid</p>
                  {[
                    ['N₂O₃',  '2HNO₂ (nitrous acid)'],
                    ['N₂O₅',  '2HNO₃ (nitric acid)'],
                    ['SO₂',   'H₂SO₃ (sulfurous)'],
                    ['SO₃',   'H₂SO₄ (sulfuric)'],
                    ['Cl₂O',  '2HClO (hypochlorous)'],
                    ['Cl₂O₇', '2HClO₄ (perchloric)'],
                    ['I₂O₅',  '2HIO₃ (iodic)'],
                    ['P₄O₁₀', '4H₃PO₄ (phosphoric)'],
                  ].map(([a, acid]) => (
                    <div key={a} className="flex gap-3">
                      <span className="font-mono text-xs text-gray-300 w-14 shrink-0">{a}</span>
                      <span className="text-xs text-gray-500">→ {acid}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-3 space-y-1">
                  <p className="text-xs font-semibold text-gray-400">HNO₃ Concentration Rules</p>
                  <p className="text-xs text-gray-500">Conc. HNO₃ → NO₂ (brown fumes)</p>
                  <p className="text-xs text-gray-500">Dil. HNO₃ → NO (colourless)</p>
                  <p className="text-xs text-gray-500">V.Dil. + active metal → NH₄⁺</p>
                  <p className="text-xs text-green-600 font-medium">Fe / Al / Cr + conc. → Passivation</p>
                </div>
              </div>
            </GuideCard>

            <GuideCard title="Xenon Fluoride Synthesis Ratios">
              <div className="space-y-3">
                {[
                  { ratio: '1:1 (Xe excess)', product: 'XeF₂', shape: 'Linear',              cond: '400°C, sealed Ni tube' },
                  { ratio: '1:5',             product: 'XeF₄', shape: 'Square planar',        cond: '400°C, Ni vessel' },
                  { ratio: '1:20',            product: 'XeF₆', shape: 'Distorted octahedral', cond: '300°C, high pressure' },
                ].map(x => (
                  <div key={x.product} className="border-b border-white/5 pb-2">
                    <p className="text-xs font-semibold text-gray-300">Xe:F₂ = {x.ratio} → {x.product}</p>
                    <p className="text-xs text-gray-500">{x.shape} · {x.cond}</p>
                  </div>
                ))}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400">Hydrolysis pattern</p>
                  <p className="text-xs text-green-600">XeF₂ → clean (Xe⁰ + HF + O₂)</p>
                  <p className="text-xs text-red-500">XeF₄ → violent disproportionation (Xe⁰ + XeO₃)</p>
                  <p className="text-xs text-blue-400">XeF₆ → XeO₃ + HF (complete, no disprop.)</p>
                </div>
              </div>
            </GuideCard>

            <GuideCard title="NCl₃ vs PCl₃ — Key Hydrolysis Exception">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-300">PCl₃ + H₂O → H₃PO₃ + HCl</p>
                  <p className="text-xs text-gray-500 mt-1">P is less electronegative than Cl → Cl leaves as HCl. O from water attaches to P → oxyacid.</p>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs font-semibold text-yellow-400">NCl₃ + H₂O → HOCl + NH₃ ← exception!</p>
                  <p className="text-xs text-gray-500 mt-1">N is MORE electronegative than Cl → Cl leaves as Cl⁻ → picks up OH⁻ → HOCl. N takes H → NH₃. No N-oxyacid!</p>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs font-semibold text-gray-300">NF₃ + H₂O → No reaction</p>
                  <p className="text-xs text-gray-500 mt-1">F is more electronegative than N, blocks nucleophilic attack. No d-orbitals on N.</p>
                </div>
              </div>
            </GuideCard>

          </div>
        </div>

        <p className="text-xs text-gray-700 text-center pb-4">
          JEE 2025 Inorganic Chemistry · Progress saved in this browser's local storage
        </p>
      </div>
    </div>
  );
}
