import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { insertRow } from '../dataHooks';

// ─── Template config ──────────────────────────────────────────────────────────
// role: 'pm' | 'rm' | null
// date: null | 'today+N' | 'wedding' | 'wedding+N' | 'engagement' | 'engagement±N'

const TEMPLATE_CONFIG = {
  wedding: [
    { title: 'Invitation',                     role: 'rm', date: 'today+1'    },
    { title: 'Assign Photographer',            role: 'pm', date: 'today+3'    },
    { title: 'Discussion Link',                role: 'rm', date: null          },
    { title: 'Add Photographer to Group',      role: 'pm', date: null          },
    { title: 'Wedding Payment Message',        role: 'rm', date: 'wedding'     },
    { title: 'Remove Photographer From Group', role: 'pm', date: 'wedding+1'  },
  ],
  engagement_wedding: [
    { title: 'Invitation',                     role: 'rm', date: 'today+1'        },
    { title: 'Assign Photographer',            role: 'pm', date: 'today+3'        },
    { title: 'Discussion Link',                role: 'rm', date: null              },
    { title: 'Add Photographer to Group',      role: 'pm', date: 'engagement-1'   },
    { title: 'Engagement Payment Message',     role: 'rm', date: 'engagement'     },
    { title: 'Remove Photographer From Group', role: 'pm', date: 'engagement+1'  },
    { title: 'Add Photographer to Group',      role: 'pm', date: null              },
    { title: 'Wedding Payment Message',        role: 'rm', date: 'wedding'         },
    { title: 'Remove Photographer From Group', role: 'pm', date: 'wedding+1'      },
  ],
  prewedding_wedding: [
    { title: 'Invitation',                     role: 'rm', date: 'today+1'   },
    { title: 'Assign Photographer',            role: 'pm', date: 'today+3'   },
    { title: 'PreWedding Discussion Link',     role: 'rm', date: null         },
    { title: 'Discussion Link',                role: 'rm', date: null         },
    { title: 'Add Photographer to Group',      role: 'pm', date: null         },
    { title: 'Wedding Payment Message',        role: 'rm', date: 'wedding'    },
    { title: 'Remove Photographer From Group', role: 'pm', date: 'wedding+1' },
  ],
  prewedding_engagement_wedding: [
    { title: 'Invitation',                     role: 'rm', date: 'today+1'        },
    { title: 'Assign Photographer',            role: 'pm', date: 'today+3'        },
    { title: 'PreWedding Discussion Link',     role: 'rm', date: null              },
    { title: 'Discussion Link',                role: 'rm', date: null              },
    { title: 'Add Photographer to Group',      role: 'pm', date: 'engagement-1'   },
    { title: 'Engagement Payment Message',     role: 'rm', date: 'engagement'     },
    { title: 'Remove Photographer From Group', role: 'pm', date: 'engagement+1'  },
    { title: 'Add Photographer to Group',      role: 'pm', date: null              },
    { title: 'Wedding Payment Message',        role: 'rm', date: 'wedding'         },
    { title: 'Remove Photographer From Group', role: 'pm', date: 'wedding+1'      },
  ],
  prewedding: [
    { title: 'Add Photographer to Group',      role: 'pm', date: null },
    { title: 'PreWedding Payment Message',     role: 'rm', date: null },
    { title: 'Remove Photographer From Group', role: 'pm', date: null },
  ],
};

const TEMPLATE_OPTIONS = [
  { value: 'wedding',                       label: 'Wedding' },
  { value: 'engagement_wedding',            label: 'Engagement + Wedding' },
  { value: 'prewedding_wedding',            label: 'PreWedding + Wedding' },
  { value: 'prewedding_engagement_wedding', label: 'PreWedding + Engagement + Wedding' },
  { value: 'prewedding',                    label: 'PreWedding' },
];

// ─── Date resolver ────────────────────────────────────────────────────────────

function resolveDate(rule, { weddingDate, engagementDate } = {}) {
  if (!rule) return '';
  const todayStr = new Date().toISOString().split('T')[0];
  const shift = (base, n) => {
    if (!base) return '';
    const d = new Date(base + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };
  const todayMatch = rule.match(/^today([+-]\d+)?$/);
  if (todayMatch) return shift(todayStr, todayMatch[1] ? parseInt(todayMatch[1]) : 0);
  const eventMatch = rule.match(/^(wedding|engagement)([+-]\d+)?$/);
  if (eventMatch) {
    const base = eventMatch[1] === 'wedding' ? weddingDate : engagementDate;
    return shift(base, eventMatch[2] ? parseInt(eventMatch[2]) : 0);
  }
  return '';
}

// ─── Row factory ──────────────────────────────────────────────────────────────

let _uid = 0;
function makeRow({ title = '', assigned_to = '', assignee_id = '', assignee_type = '', due_date = '' } = {}) {
  return { _id: ++_uid, title, assigned_to, assignee_id, assignee_type, due_date, priority: 'medium', notes: '' };
}

function buildCtx(client, events) {
  return {
    pm:             client?.project_manager      || null,
    rm:             client?.relationship_manager || null,
    weddingDate:    events?.find(e => e.event_type === 'Wedding')?.event_date    || null,
    engagementDate: events?.find(e => e.event_type === 'Engagement')?.event_date || null,
  };
}

function fromTemplate(key, ctx = {}) {
  const { pm, rm, weddingDate, engagementDate } = ctx;
  const defs = TEMPLATE_CONFIG[key] || TEMPLATE_CONFIG.wedding;
  return defs.map(def => {
    const profile = def.role === 'pm' ? pm : def.role === 'rm' ? rm : null;
    return makeRow({
      title:         def.title,
      assignee_id:   profile?.id        || '',
      assignee_type: profile            ? 'team' : '',
      assigned_to:   profile?.full_name || '',
      due_date:      resolveDate(def.date, { weddingDate, engagementDate }),
    });
  });
}

// ─── Inline assignee picker (native select — avoids z-index clipping in modal) ─

function AssigneePicker({ value, onChange, members, vendors }) {
  const compositeVal = value.assignee_id
    ? `${value.assignee_type}:${value.assignee_id}`
    : '';

  function handleChange(e) {
    const val = e.target.value;
    if (!val) { onChange({ assignee_id: '', assignee_type: '', assigned_to: '' }); return; }
    const [type, id] = val.split(':');
    const name = type === 'team'
      ? members.find(m => m.id === id)?.full_name || ''
      : vendors.find(v => String(v.id) === id)?.name || '';
    onChange({ assignee_id: id, assignee_type: type, assigned_to: name });
  }

  const activeMembers = members.filter(m => m.is_active);

  return (
    <select
      value={compositeVal}
      onChange={handleChange}
      className="w-full px-2 py-1.5 text-sm text-stone-900 bg-stone-50 border border-transparent rounded-md focus:outline-none focus:bg-white focus:border-stone-300 transition-all"
    >
      <option value="">— Assignee —</option>
      {activeMembers.length > 0 && (
        <optgroup label="Team Members">
          {activeMembers.map(m => (
            <option key={m.id} value={`team:${m.id}`}>{m.full_name}</option>
          ))}
        </optgroup>
      )}
      {vendors.length > 0 && (
        <optgroup label="Vendors">
          {vendors.map(v => (
            <option key={v.id} value={`vendor:${v.id}`}>{v.name}</option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorkflowTasksModal({ open, onClose, onSaved, clientId, members = [], vendors = [], client = null, events = [] }) {
  const [template, setTemplate] = useState('wedding');
  const [rows, setRows] = useState(() => fromTemplate('wedding', buildCtx(client, events)));
  const [saving, setSaving] = useState(false);

  // Re-seed with fresh PM/RM + event dates each time the modal opens
  useEffect(() => {
    if (!open) return;
    const ctx = buildCtx(client, events);
    setTemplate('wedding');
    setRows(fromTemplate('wedding', ctx));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  function handleTemplateChange(e) {
    const key = e.target.value;
    setTemplate(key);
    setRows(fromTemplate(key, buildCtx(client, events)));
  }

  function updateRow(id, field, val) {
    setRows(prev => prev.map(r => r._id === id ? { ...r, [field]: val } : r));
  }

  function updateAssignee(id, assignee) {
    setRows(prev => prev.map(r => r._id === id ? { ...r, ...assignee } : r));
  }

  function removeRow(id) {
    setRows(prev => prev.filter(r => r._id !== id));
  }

  function addRow() {
    setRows(prev => [...prev, makeRow()]);
  }

  const validRows = rows.filter(r => r.title.trim());

  async function createAll() {
    if (!validRows.length) return;
    setSaving(true);
    try {
      for (const r of validRows) {
        await insertRow('tasks', {
          client_id:     clientId,
          title:         r.title.trim(),
          assigned_to:   r.assigned_to   || null,
          assignee_id:   r.assignee_id   || null,
          assignee_type: r.assignee_type || null,
          due_date:      r.due_date      || null,
          priority:      r.priority      || 'medium',
          description:   r.notes         || null,
          status:        'pending',
          is_deliverable:  false,
          is_client_issue: false,
        });
      }
      onSaved?.();
      onClose();
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  }

  const colGrid = 'grid grid-cols-[24px_1fr_160px_118px_96px_90px_28px] gap-2 items-center';

  return (
    <div
      className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#FDFBF7] rounded-xl border border-stone-200 w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 flex-shrink-0">
          <div>
            <div className="text-[9px] uppercase tracking-[0.4em] text-stone-400 mb-1">Project Tasks</div>
            <h2 className="display text-2xl text-stone-900 leading-none">Workflow Tasks</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500 hidden sm:block whitespace-nowrap">
                Template
              </label>
              <select
                value={template}
                onChange={handleTemplateChange}
                className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400 transition-colors cursor-pointer"
              >
                {TEMPLATE_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-[760px] px-5 sm:px-6">

            {/* Column headers */}
            <div className={`${colGrid} px-3 pt-4 pb-2`}>
              <div />
              <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Task Title</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Assignee</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Due Date</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Priority</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Notes</div>
              <div />
            </div>

            {/* Task rows */}
            <div className="space-y-1.5 pb-3">
              {rows.map((row, idx) => (
                <div
                  key={row._id}
                  className={`${colGrid} bg-white border border-stone-100 rounded-lg px-3 py-2 hover:border-stone-200 transition-colors group`}
                >
                  {/* Index */}
                  <div className="text-xs text-stone-400 text-center select-none">{idx + 1}</div>

                  {/* Title */}
                  <input
                    value={row.title}
                    onChange={e => updateRow(row._id, 'title', e.target.value)}
                    placeholder="Task title"
                    className="w-full px-2 py-1.5 text-sm text-stone-900 bg-stone-50 border border-transparent rounded-md focus:outline-none focus:bg-white focus:border-stone-300 transition-all placeholder:text-stone-400"
                  />

                  {/* Assignee */}
                  <AssigneePicker
                    value={{ assignee_id: row.assignee_id, assignee_type: row.assignee_type, assigned_to: row.assigned_to }}
                    onChange={assignee => updateAssignee(row._id, assignee)}
                    members={members}
                    vendors={vendors}
                  />

                  {/* Due date */}
                  <input
                    type="date"
                    value={row.due_date}
                    onChange={e => updateRow(row._id, 'due_date', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm text-stone-900 bg-stone-50 border border-transparent rounded-md focus:outline-none focus:bg-white focus:border-stone-300 transition-all"
                  />

                  {/* Priority */}
                  <select
                    value={row.priority}
                    onChange={e => updateRow(row._id, 'priority', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm text-stone-900 bg-stone-50 border border-transparent rounded-md focus:outline-none focus:bg-white focus:border-stone-300 transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>

                  {/* Notes */}
                  <input
                    value={row.notes}
                    onChange={e => updateRow(row._id, 'notes', e.target.value)}
                    placeholder="Notes…"
                    className="w-full px-2 py-1.5 text-sm text-stone-900 bg-stone-50 border border-transparent rounded-md focus:outline-none focus:bg-white focus:border-stone-300 transition-all placeholder:text-stone-400"
                  />

                  {/* Delete */}
                  <button
                    onClick={() => removeRow(row._id)}
                    className="flex justify-center text-stone-200 group-hover:text-stone-400 hover:!text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add custom task */}
            <button
              onClick={addRow}
              className="mb-4 flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <Plus size={13} />Add Custom Task
            </button>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-stone-200 flex-shrink-0 rounded-b-xl bg-stone-50/60">
          <div className="text-sm text-stone-500">
            {rows.length === 0
              ? 'No tasks'
              : `${validRows.length} of ${rows.length} task${rows.length !== 1 ? 's' : ''} ready`}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createAll}
              disabled={saving || validRows.length === 0}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:opacity-80"
              style={{ background: '#6B1F2E' }}
            >
              {saving ? 'Creating…' : `Create ${validRows.length} Task${validRows.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
