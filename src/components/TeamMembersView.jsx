import { useState } from 'react';
import { UserPlus, AlertCircle, ShieldAlert } from 'lucide-react';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useAuth } from '../auth/AuthContext';
import { Modal, Field, PrimaryButton, SecondaryButton, Loader, EmptyState, PaginationBar } from './UI';
import { usePaginated } from '../dataHooks';
import { ROLES, roleLabel, canAccess } from '../permissions';
import { fmtDate } from '../utils';

const ROLE_STYLES = {
  admin:                  'bg-[#6B1F2E]/10 text-[#6B1F2E] border border-[#6B1F2E]/25',
  project_manager:        'bg-blue-50 text-blue-700 border border-blue-200',
  relationship_manager:   'bg-violet-50 text-violet-700 border border-violet-200',
  production_coordinator: 'bg-amber-50 text-amber-700 border border-amber-200',
  editor:                 'bg-stone-100 text-stone-600 border border-stone-200',
  // legacy slugs — shown gracefully until reassigned
  manager:                'bg-blue-50 text-blue-700 border border-blue-200',
  staff:                  'bg-stone-100 text-stone-600 border border-stone-200',
};

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${ROLE_STYLES[role] ?? ROLE_STYLES.editor}`}>
      {roleLabel(role)}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
      active
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-stone-100 text-stone-500 border border-stone-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-emerald-500' : 'bg-stone-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function Avatar({ name }) {
  const initials = (name ?? '??').slice(0, 2).toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-[#6B1F2E]/10 flex items-center justify-center text-[#6B1F2E] text-[11px] font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

// ── Add Member Modal ──────────────────────────────────────────────────────────

function AddMemberModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'editor' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onAdd(form);
      setForm({ full_name: '', email: '', password: '', role: 'editor' });
      onClose();
    } catch (err) {
      setError(err.message ?? 'Failed to create member');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Team Member" eyebrow="Team" maxWidth="max-w-md">
      {error && (
        <div className="mb-4 flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertCircle size={13} className="text-rose-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full Name" value={form.full_name} onChange={set('full_name')} placeholder="Jane Smith" required />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="jane@studio.com" required />
        <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required />
        <Field label="Role" type="select" value={form.role} onChange={set('role')} options={ROLES} />
        <div className="flex gap-2 pt-1">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Member'}
          </PrimaryButton>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Role Modal ───────────────────────────────────────────────────────────

function EditRoleModal({ member, open, onClose, onSave }) {
  const [role, setRole] = useState(member?.role ?? 'editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setLoading(true);
    try {
      await onSave(member.id, { role });
      onClose();
    } catch (err) {
      setError(err.message ?? 'Failed to update role');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Change Role" eyebrow="Team Member" maxWidth="max-w-sm">
      <p className="text-sm text-stone-600 mb-5">{member?.full_name}</p>
      {error && <p className="text-xs text-rose-600 mb-3">{error}</p>}
      <Field label="Role" type="select" value={role} onChange={setRole} options={ROLES} />
      <div className="flex gap-2 mt-5">
        <PrimaryButton onClick={handleSave} disabled={loading}>
          {loading ? 'Saving…' : 'Save Role'}
        </PrimaryButton>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
      </div>
    </Modal>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export default function TeamMembersView() {
  const { profile: currentProfile, session } = useAuth();
  const { members, loading, error, updateMember, createMember } = useTeamMembers();
  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // member id being mutated

  // Guard: only admins should reach this view
  if (!canAccess(currentProfile?.role, 'team')) {
    return (
      <div className="p-10">
        <EmptyState
          icon={ShieldAlert}
          title="Admin access required"
          sub="Only administrators can manage team members."
        />
      </div>
    );
  }

  async function handleAdd(form) {
    await createMember(form, session?.access_token);
  }

  async function handleToggleActive(member) {
    setActionLoading(member.id);
    try {
      await updateMember(member.id, { is_active: !member.is_active });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveAccess(member) {
    if (!window.confirm(`Remove access for ${member.full_name}?\n\nThey will be deactivated and cannot log in. CRM data is preserved.`)) return;
    setActionLoading(member.id);
    try {
      await updateMember(member.id, { is_active: false });
    } finally {
      setActionLoading(null);
    }
  }

  const isAdmin = currentProfile?.role === 'admin';
  const { page, setPage, pageSize, setPageSize, totalPages, pageItems, total } = usePaginated(members, 20);

  if (loading) return <Loader label="Loading team…" />;

  return (
    <div className="p-5 sm:p-8 lg:p-10">
      {/* Page actions */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <p className="text-xs text-stone-500">{total} {total === 1 ? 'member' : 'members'}</p>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-[#6B1F2E] hover:bg-[#5a1926] active:bg-[#4a1520] text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <UserPlus size={14} strokeWidth={1.75} />
          Add Member
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800">{error}</p>
        </div>
      )}

      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-[#FDFBF7] border border-stone-200/70 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200/70 bg-stone-50/60">
              {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                <th key={h} className={`px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium ${i === 5 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {total === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-stone-400 text-sm">
                  No team members yet. Add your first member above.
                </td>
              </tr>
            )}
            {pageItems.map(m => {
              const busy = actionLoading === m.id;
              return (
                <tr key={m.id} className={`transition-colors ${!m.is_active ? 'opacity-55' : 'hover:bg-stone-50/50'}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={m.full_name} />
                      <span className="text-stone-900 font-medium">{m.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-stone-600 text-xs">{m.email ?? '—'}</td>
                  <td className="px-5 py-3.5"><RoleBadge role={m.role} /></td>
                  <td className="px-5 py-3.5"><StatusBadge active={m.is_active} /></td>
                  <td className="px-5 py-3.5 text-stone-500 text-xs">{fmtDate(m.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditMember(m)}
                        className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-100 transition-colors"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleToggleActive(m)}
                        disabled={busy}
                        className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-40 ${
                          m.is_active
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {busy ? '…' : m.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      {m.is_active && (
                        <button
                          onClick={() => handleRemoveAccess(m)}
                          disabled={busy}
                          className="text-xs text-rose-500 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 transition-colors disabled:opacity-40"
                        >
                          Remove Access
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-3">
        {total === 0 && (
          <p className="text-center py-10 text-stone-400 text-sm">No team members yet.</p>
        )}
        {pageItems.map(m => {
          const busy = actionLoading === m.id;
          return (
            <div
              key={m.id}
              className={`bg-[#FDFBF7] border border-stone-200/70 rounded-xl p-4 transition-opacity ${!m.is_active ? 'opacity-55' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={m.full_name} />
                  <div className="min-w-0">
                    <div className="text-stone-900 font-medium text-sm truncate">{m.full_name ?? '—'}</div>
                    <div className="text-stone-500 text-xs truncate">{m.email ?? '—'}</div>
                  </div>
                </div>
                <StatusBadge active={m.is_active} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <RoleBadge role={m.role} />
                <span className="text-stone-400 text-xs">{fmtDate(m.created_at)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-stone-100">
                <button onClick={() => setEditMember(m)} className="text-xs text-stone-600 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-100 transition-colors">
                  Edit Role
                </button>
                <button
                  onClick={() => handleToggleActive(m)}
                  disabled={busy}
                  className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-40 ${m.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                >
                  {busy ? '…' : m.is_active ? 'Deactivate' : 'Activate'}
                </button>
                {m.is_active && (
                  <button onClick={() => handleRemoveAccess(m)} disabled={busy} className="text-xs text-rose-500 hover:bg-rose-50 px-2 py-1 rounded transition-colors disabled:opacity-40">
                    Remove Access
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <PaginationBar
        page={page} totalPages={totalPages} total={total} setPage={setPage}
        label={`member${total !== 1 ? 's' : ''}`}
        isAdmin={isAdmin} pageSize={pageSize} pageSizeOptions={[20, 50]} setPageSize={setPageSize}
      />

      {/* ── Modals ── */}
      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      {editMember && (
        <EditRoleModal
          member={editMember}
          open
          onClose={() => setEditMember(null)}
          onSave={async (id, updates) => { await updateMember(id, updates); }}
        />
      )}
    </div>
  );
}
