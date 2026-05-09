import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';

// ─── AssigneeCell — used in table cells to display a resolved assignee ────────
// Handles new records (with assignee_id + assignee_type) and legacy records
// (assigned_to text only). Shows only the person's name — no type/role labels.

export function AssigneeCell({ row }) {
  const name = row?.assigned_to;
  if (!name && !row?.assignee_id) return <span className="text-stone-400">—</span>;
  return <span className="truncate text-stone-900">{name || '—'}</span>;
}

// ─── AssigneeSelect — searchable combobox for picking a team member or vendor ─
// value = { assignee_id, assignee_type, assigned_to } | null | { assigned_to } (legacy)
// onChange receives { assignee_id, assignee_type, assigned_to }

export function AssigneeSelect({ label = 'Assigned To', required, members = [], vendors = [], value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function onOutsideClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const activeMembers = members.filter(m => m.is_active);
  const q = search.toLowerCase();
  const filteredMembers = q ? activeMembers.filter(m => m.full_name?.toLowerCase().includes(q)) : activeMembers;
  const filteredVendors = q ? vendors.filter(v => v.name?.toLowerCase().includes(q)) : vendors;
  const hasResults = filteredMembers.length > 0 || filteredVendors.length > 0;

  const displayName = value?.assigned_to || '';
  const selectedMember = value?.assignee_type === 'team' ? members.find(m => m.id === value.assignee_id) : null;
  const selectedVendor = value?.assignee_type === 'vendor' ? vendors.find(v => String(v.id) === value.assignee_id) : null;

  function select(opt) {
    onChange(opt);
    setOpen(false);
    setSearch('');
  }

  function clear(e) {
    e.stopPropagation();
    onChange({ assignee_id: '', assignee_type: '', assigned_to: '' });
  }

  const baseCls = 'w-full mt-1.5 px-3 py-2 bg-white border border-stone-200 rounded-md text-sm focus:outline-none focus:border-stone-400';

  return (
    <div ref={ref} className="relative">
      <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
        {label}{required && <span className="text-red-600 ml-0.5">*</span>}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(''); }}
        className={`${baseCls} flex items-center justify-between gap-2 text-left`}
      >
        {displayName ? (
          <span className="flex items-center gap-2 min-w-0 flex-1">
            <span className="truncate text-stone-900">{displayName}</span>
          </span>
        ) : (
          <span className="text-stone-400 flex-1">Select assignee…</span>
        )}
        <span className="flex items-center gap-1 flex-shrink-0">
          {displayName && (
            <span onClick={clear} className="text-stone-400 hover:text-stone-700 p-0.5 rounded hover:bg-stone-100">
              <X size={12} />
            </span>
          )}
          <ChevronDown size={14} className={`text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-md shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="px-3 py-2 border-b border-stone-100 flex items-center gap-2">
            <Search size={12} className="text-stone-400 flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {!hasResults && (
              <div className="px-3 py-5 text-sm text-stone-400 text-center">No results</div>
            )}

            {/* Team Members group */}
            {filteredMembers.length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium bg-stone-50/60">
                  Team Members
                </div>
                {filteredMembers.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => select({ assignee_id: m.id, assignee_type: 'team', assigned_to: m.full_name })}
                    className={`w-full px-3 py-2.5 text-sm hover:bg-stone-50 text-left transition-colors ${
                      value?.assignee_id === m.id ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <span className="text-stone-900">{m.full_name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Vendors group */}
            {filteredVendors.length > 0 && (
              <div className={filteredMembers.length > 0 ? 'border-t border-stone-100' : ''}>
                <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium bg-stone-50/60">
                  Vendors
                </div>
                {filteredVendors.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => select({ assignee_id: String(v.id), assignee_type: 'vendor', assigned_to: v.name })}
                    className={`w-full px-3 py-2.5 text-sm hover:bg-stone-50 text-left transition-colors ${
                      value?.assignee_id === String(v.id) ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    <span className="text-stone-900">{v.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
