import { useState, useEffect } from 'react';
import { Modal, Field, PrimaryButton, SecondaryButton, DangerButton } from './UI';
import { insertRow, updateRow, deleteRow } from '../dataHooks';
import {
  CLIENT_STATUSES, PACKAGES, VENDOR_TYPES, EVENT_TYPES,
  TASK_STATUSES, PRIORITIES, PAYMENT_MODES, PAYMENT_TYPES, EXPENSE_CATEGORIES
} from '../utils';

// ============ CLIENT FORM ============
export function ClientForm({ open, onClose, onSaved, initial }) {
  const [f, setF] = useState({
    bride_name: '', groom_name: '', phone: '', email: '', city: '',
    package: 'Gold', total_amount: '', status: 'Lead', notes: '',
    token_received: false, token_amount: '', token_date: new Date().toISOString().slice(0, 10), token_mode: 'UPI', token_account: '',
    advance_amount: '', advance_date: new Date().toISOString().slice(0, 10), advance_mode: 'UPI', advance_account: '',
    lead_created_at: new Date().toISOString().slice(0, 10)
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (initial) setF({
      ...initial,
      total_amount: initial.total_amount || '',
      token_received: false,
      token_amount: '',
      token_date: new Date().toISOString().slice(0, 10),
      token_mode: 'UPI',
      token_account: '',
      advance_amount: '',
      advance_date: new Date().toISOString().slice(0, 10),
      advance_mode: 'UPI',
      advance_account: '',
      lead_created_at: initial.lead_created_at ? initial.lead_created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
    });
    else setF({
      bride_name: '', groom_name: '', phone: '', email: '', city: '',
      package: 'Gold', total_amount: '', status: 'Lead', notes: '',
      token_received: false, token_amount: '', token_date: new Date().toISOString().slice(0, 10), token_mode: 'UPI', token_account: '',
      advance_amount: '', advance_date: new Date().toISOString().slice(0, 10), advance_mode: 'UPI', advance_account: '',
      lead_created_at: new Date().toISOString().slice(0, 10)
    });
  }, [initial, open]);

  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const tokenValid = !f.token_received || (Number(f.token_amount) > 0 && f.token_date && f.token_mode && f.token_account);
  const advanceValid = Number(f.advance_amount) > 0 ? (f.advance_date && f.advance_mode && f.advance_account) : true;
  const valid = f.bride_name && f.groom_name && f.total_amount !== '' && tokenValid && advanceValid;

  const save = async () => {
    setSaving(true);
    try {
      const tokenReceived = f.token_received && Number(f.token_amount) > 0;
      const advanceReceived = Number(f.advance_amount) > 0;
      const status = advanceReceived ? 'Booked' : 'Lead';
      const clientPayload = {
        bride_name: f.bride_name,
        groom_name: f.groom_name,
        phone: f.phone,
        email: f.email,
        city: f.city,
        package: f.package,
        total_amount: Number(f.total_amount) || 0,
        status,
        notes: f.notes,
        lead_created_at: f.lead_created_at || null,
        booking_date: advanceReceived ? f.advance_date : null
      };

      console.log('[ClientForm] save clientPayload', clientPayload, { tokenReceived, advanceReceived });
      if (isEdit) {
        const updatedClient = await updateRow('clients', initial.id, clientPayload);
        console.log('[ClientForm] updated client', updatedClient);
      } else {
        const newClient = await insertRow('clients', clientPayload);
        console.log('[ClientForm] created client', newClient);

        if (tokenReceived) {
          const tokenPayment = await insertRow('payments', {
            client_id: newClient.id,
            amount: Number(f.token_amount) || 0,
            payment_date: f.token_date,
            mode: f.token_mode,
            notes: `Token · ${f.token_account}`,
            payment_type: 'Token'
          });
          console.log('[ClientForm] created token payment', tokenPayment);
        }

        if (advanceReceived) {
          const advancePayment = await insertRow('payments', {
            client_id: newClient.id,
            amount: Number(f.advance_amount) || 0,
            payment_date: f.advance_date,
            mode: f.advance_mode,
            notes: `Advance · ${f.advance_account}`,
            payment_type: 'Advance'
          });
          console.log('[ClientForm] created advance payment', advancePayment);
        }
      }

      onSaved?.();
      onClose();
    } catch (e) {
      console.error('[ClientForm] save error', e);
      alert(e.message);
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm('Delete this client and all related data?')) return;
    setSaving(true);
    try { await deleteRow('clients', initial.id); onSaved?.(); onClose(); }
    catch (e) { alert(e.message); }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow={isEdit ? 'Edit Client' : 'New Client'} title={isEdit ? 'Update details' : 'Add a wedding'}>
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-[0.35em] text-stone-500">Couple Information</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bride" required value={f.bride_name} onChange={(v) => u('bride_name', v)} placeholder="Aanya" />
            <Field label="Groom" required value={f.groom_name} onChange={(v) => u('groom_name', v)} placeholder="Arjun" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" value={f.phone} onChange={(v) => u('phone', v)} placeholder="+91…" />
            <Field label="City" value={f.city} onChange={(v) => u('city', v)} placeholder="Udaipur" />
          </div>
          <Field label="Email" value={f.email} onChange={(v) => u('email', v)} placeholder="couple@email.com" />
        </div>

        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-[0.35em] text-stone-500">Booking Information</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Deal (₹)" type="number" value={f.total_amount} onChange={(v) => u('total_amount', v)} placeholder="100000" />
            <Field label="Package" type="select" value={f.package} onChange={(v) => u('package', v)} options={PACKAGES} />
          </div>

          {!isEdit && (
            <div className="rounded-xl border border-stone-200/70 bg-stone-50/70 p-4">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={f.token_received} onChange={(e) => u('token_received', e.target.checked)} className="rounded border-stone-300 text-[#6B1F2E] focus:ring-[#6B1F2E]" />
                Token Received
              </label>
              {f.token_received && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Token Amount (₹)" type="number" value={f.token_amount} onChange={(v) => u('token_amount', v)} placeholder="1000" />
                    <Field label="Token Received Date" type="date" value={f.token_date} onChange={(v) => u('token_date', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Token Payment Method" type="select" value={f.token_mode} onChange={(v) => u('token_mode', v)} options={PAYMENT_MODES} />
                    <Field label="Token Account Name" value={f.token_account} onChange={(v) => u('token_account', v)} placeholder="UPI / account name" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-stone-200/70 bg-stone-50/70 p-4">
            <div className="text-sm font-medium text-stone-900 mb-3">Advance Payment</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Advance Amount (₹)" type="number" value={f.advance_amount} onChange={(v) => u('advance_amount', v)} placeholder="10000" />
              <Field label="Advance Received Date" type="date" value={f.advance_date} onChange={(v) => u('advance_date', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Advance Payment Method" type="select" value={f.advance_mode} onChange={(v) => u('advance_mode', v)} options={PAYMENT_MODES} />
              <Field label="Advance Account Name" value={f.advance_account} onChange={(v) => u('advance_account', v)} placeholder="Bank / UPI account" />
            </div>
          </div>
        </div>

        {!isEdit && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.35em] text-stone-500">Lead Information</div>
            <Field label="Lead Created At" type="date" value={f.lead_created_at} onChange={(v) => u('lead_created_at', v)} />
          </div>
        )}

        <Field label="Internal Notes" type="textarea" value={f.notes} onChange={(v) => u('notes', v)} placeholder="Any internal notes…" />
      </div>
      <div className="flex gap-3 mt-7">
        {isEdit && <DangerButton onClick={remove}>Delete</DangerButton>}
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={!valid || saving}>{saving ? 'Saving…' : (isEdit ? 'Update' : 'Add Client')}</PrimaryButton>
      </div>
    </Modal>
  );
}

// ============ EVENT FORM ============
export function EventForm({ open, onClose, onSaved, clientId, initial }) {
  const [f, setF] = useState({ event_type: 'Wedding', event_date: '', event_time: '', venue: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (initial) setF({ ...initial });
    else setF({ event_type: 'Wedding', event_date: '', event_time: '', venue: '', notes: '' });
  }, [initial, open]);

  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.event_type && f.event_date;

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...f, client_id: clientId, event_time: f.event_time || null };
      if (isEdit) await updateRow('events', initial.id, payload);
      else await insertRow('events', payload);
      onSaved?.(); onClose();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm('Delete this event?')) return;
    await deleteRow('events', initial.id); onSaved?.(); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow={isEdit ? 'Edit Event' : 'New Event'} title={isEdit ? 'Update event' : 'Add event'}>
      <div className="space-y-4">
        <Field label="Event Type" type="select" required value={f.event_type} onChange={(v) => u('event_type', v)} options={EVENT_TYPES} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" type="date" required value={f.event_date} onChange={(v) => u('event_date', v)} />
          <Field label="Time" type="time" value={f.event_time} onChange={(v) => u('event_time', v)} />
        </div>
        <Field label="Venue" value={f.venue} onChange={(v) => u('venue', v)} placeholder="Hotel name / address" />
        <Field label="Notes" type="textarea" value={f.notes} onChange={(v) => u('notes', v)} />
      </div>
      <div className="flex gap-3 mt-7">
        {isEdit && <DangerButton onClick={remove}>Delete</DangerButton>}
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={!valid || saving}>{saving ? 'Saving…' : (isEdit ? 'Update' : 'Add Event')}</PrimaryButton>
      </div>
    </Modal>
  );
}

// ============ VENDOR FORM ============
export function VendorForm({ open, onClose, onSaved, initial }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', city: '', vendor_type: 'photographer', description: '' });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (initial) setF({ ...initial });
    else setF({ name: '', phone: '', email: '', city: '', vendor_type: 'photographer', description: '' });
  }, [initial, open]);

  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name && f.vendor_type;

  const save = async () => {
    setSaving(true);
    try {
      if (isEdit) await updateRow('vendors', initial.id, f);
      else await insertRow('vendors', f);
      onSaved?.(); onClose();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm('Delete this vendor? Existing project assignments will block deletion.')) return;
    try { await deleteRow('vendors', initial.id); onSaved?.(); onClose(); }
    catch (e) { alert('Cannot delete: ' + e.message); }
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow={isEdit ? 'Edit Vendor' : 'New Vendor'} title={isEdit ? 'Update vendor' : 'Add vendor'}>
      <div className="space-y-4">
        <Field label="Name" required value={f.name} onChange={(v) => u('name', v)} placeholder="Studio name / person" />
        <Field label="Type" type="select" required value={f.vendor_type} onChange={(v) => u('vendor_type', v)} options={VENDOR_TYPES} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" value={f.phone} onChange={(v) => u('phone', v)} />
          <Field label="Email" value={f.email} onChange={(v) => u('email', v)} />
        </div>
        <Field label="City" value={f.city} onChange={(v) => u('city', v)} placeholder="Udaipur" />
        <Field label="Description" type="textarea" value={f.description} onChange={(v) => u('description', v)} placeholder="Specialty, years of experience…" />
      </div>
      <div className="flex gap-3 mt-7">
        {isEdit && <DangerButton onClick={remove}>Delete</DangerButton>}
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={!valid || saving}>{saving ? 'Saving…' : (isEdit ? 'Update' : 'Add Vendor')}</PrimaryButton>
      </div>
    </Modal>
  );
}

// ============ ASSIGN VENDOR TO PROJECT ============
export function ProjectVendorForm({ open, onClose, onSaved, clientId, vendors, initial }) {
  const [f, setF] = useState({ vendor_id: '', role: 'photographer', agreed_amount: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (initial) setF({ ...initial, agreed_amount: initial.agreed_amount || '' });
    else setF({ vendor_id: '', role: 'photographer', agreed_amount: '', notes: '' });
  }, [initial, open]);

  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.vendor_id && f.role && f.agreed_amount;

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...f, client_id: clientId, vendor_id: Number(f.vendor_id), agreed_amount: Number(f.agreed_amount) || 0 };
      if (isEdit) await updateRow('project_vendors', initial.id, payload);
      else await insertRow('project_vendors', payload);
      onSaved?.(); onClose();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm('Remove this vendor from project? Their payment history will also be removed.')) return;
    await deleteRow('project_vendors', initial.id); onSaved?.(); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow={isEdit ? 'Edit Assignment' : 'Assign Vendor'} title={isEdit ? 'Update assignment' : 'Assign vendor to project'}>
      <div className="space-y-4">
        <Field label="Vendor" type="select" required value={f.vendor_id} onChange={(v) => u('vendor_id', v)}
          options={vendors.map(v => ({ value: v.id, label: `${v.name} (${v.vendor_type})` }))} />
        <Field label="Role" type="select" required value={f.role} onChange={(v) => u('role', v)} options={VENDOR_TYPES} />
        <Field label="Agreed Amount (₹)" type="number" required value={f.agreed_amount} onChange={(v) => u('agreed_amount', v)} placeholder="50000" />
        <Field label="Notes" type="textarea" value={f.notes} onChange={(v) => u('notes', v)} placeholder="Scope, deliverables, terms…" />
      </div>
      <div className="flex gap-3 mt-7">
        {isEdit && <DangerButton onClick={remove}>Remove</DangerButton>}
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={!valid || saving}>{saving ? 'Saving…' : (isEdit ? 'Update' : 'Assign')}</PrimaryButton>
      </div>
    </Modal>
  );
}

// ============ CLIENT PAYMENT (income) ============
export function PaymentForm({ open, onClose, onSaved, clientId, clients, initial }) {
  const [f, setF] = useState({ client_id: clientId || '', amount: '', payment_date: new Date().toISOString().slice(0, 10), mode: 'UPI', payment_type: 'Advance', notes: '' });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (initial) setF({ ...initial, amount: initial.amount || '', payment_type: initial.payment_type || 'Advance' });
    else setF({ client_id: clientId || '', amount: '', payment_date: new Date().toISOString().slice(0, 10), mode: 'UPI', payment_type: 'Advance', notes: '' });
  }, [initial, open, clientId]);

  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.client_id && f.amount && f.payment_date;

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...f, client_id: Number(f.client_id), amount: Number(f.amount) };
      if (isEdit) await updateRow('payments', initial.id, payload);
      else await insertRow('payments', payload);
      onSaved?.(); onClose();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm('Delete this payment?')) return;
    await deleteRow('payments', initial.id); onSaved?.(); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow={isEdit ? 'Edit Payment' : 'Record Payment'} title={isEdit ? 'Update payment' : 'Payment received'}>
      <div className="space-y-4">
        {!clientId && (
          <Field label="Client" type="select" required value={f.client_id} onChange={(v) => u('client_id', v)}
            options={clients?.map(c => ({ value: c.id, label: `${c.bride_name} & ${c.groom_name}` })) || []} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)" type="number" required value={f.amount} onChange={(v) => u('amount', v)} />
          <Field label="Date" type="date" required value={f.payment_date} onChange={(v) => u('payment_date', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type" type="select" value={f.payment_type} onChange={(v) => u('payment_type', v)} options={PAYMENT_TYPES} />
          <Field label="Mode" type="select" value={f.mode} onChange={(v) => u('mode', v)} options={PAYMENT_MODES} />
        </div>
        <Field label="Notes" type="textarea" value={f.notes} onChange={(v) => u('notes', v)} placeholder="Booking advance, balance, etc." />
      </div>
      <div className="flex gap-3 mt-7">
        {isEdit && <DangerButton onClick={remove}>Delete</DangerButton>}
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={!valid || saving}>{saving ? 'Saving…' : (isEdit ? 'Update' : 'Record')}</PrimaryButton>
      </div>
    </Modal>
  );
}

// ============ VENDOR PAYMENT (expense) ============
export function VendorPaymentForm({ open, onClose, onSaved, projectVendorId, projectVendors, initial }) {
  const [f, setF] = useState({ project_vendor_id: projectVendorId || '', amount: '', payment_date: new Date().toISOString().slice(0, 10), mode: 'UPI', notes: '' });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (initial) setF({ ...initial, amount: initial.amount || '' });
    else setF({ project_vendor_id: projectVendorId || '', amount: '', payment_date: new Date().toISOString().slice(0, 10), mode: 'UPI', notes: '' });
  }, [initial, open, projectVendorId]);

  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.project_vendor_id && f.amount && f.payment_date;

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...f, project_vendor_id: Number(f.project_vendor_id), amount: Number(f.amount) };
      if (isEdit) await updateRow('vendor_payments', initial.id, payload);
      else await insertRow('vendor_payments', payload);
      onSaved?.(); onClose();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm('Delete this vendor payment?')) return;
    await deleteRow('vendor_payments', initial.id); onSaved?.(); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow={isEdit ? 'Edit Payment' : 'Pay Vendor'} title={isEdit ? 'Update payment' : 'Record vendor payment'}>
      <div className="space-y-4">
        {!projectVendorId && (
          <Field label="Project + Vendor" type="select" required value={f.project_vendor_id} onChange={(v) => u('project_vendor_id', v)}
            options={projectVendors?.map(pv => ({
              value: pv.id,
              label: `${pv.client_label} → ${pv.vendor_name} (${pv.role})`
            })) || []} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)" type="number" required value={f.amount} onChange={(v) => u('amount', v)} />
          <Field label="Date" type="date" required value={f.payment_date} onChange={(v) => u('payment_date', v)} />
        </div>
        <Field label="Mode" type="select" value={f.mode} onChange={(v) => u('mode', v)} options={PAYMENT_MODES} />
        <Field label="Notes" type="textarea" value={f.notes} onChange={(v) => u('notes', v)} />
      </div>
      <div className="flex gap-3 mt-7">
        {isEdit && <DangerButton onClick={remove}>Delete</DangerButton>}
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={!valid || saving}>{saving ? 'Saving…' : (isEdit ? 'Update' : 'Record')}</PrimaryButton>
      </div>
    </Modal>
  );
}

// ============ TASK FORM ============
export function TaskForm({ open, onClose, onSaved, clients, initial, defaultClientId }) {
  const [f, setF] = useState({
    client_id: defaultClientId || '', title: '', description: '', assigned_to: '',
    due_date: '', status: 'pending', priority: 'medium', is_deliverable: false, is_client_issue: false
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (initial) setF({ ...initial, client_id: initial.client_id || '' });
    else setF({
      client_id: defaultClientId || '', title: '', description: '', assigned_to: '',
      due_date: '', status: 'pending', priority: 'medium', is_deliverable: false, is_client_issue: false
    });
  }, [initial, open, defaultClientId]);

  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.title && f.assigned_to;

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...f,
        client_id: f.client_id ? Number(f.client_id) : null,
        due_date: f.due_date || null
      };
      if (isEdit) await updateRow('tasks', initial.id, payload);
      else await insertRow('tasks', payload);
      onSaved?.(); onClose();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm('Delete this task?')) return;
    await deleteRow('tasks', initial.id); onSaved?.(); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow={isEdit ? 'Edit Task' : 'New Task'} title={isEdit ? 'Update task' : 'Add task'}>
      <div className="space-y-4">
        <Field label="Title" required value={f.title} onChange={(v) => u('title', v)} placeholder="What needs to be done?" />
        <Field label="Project (optional)" type="select" value={f.client_id} onChange={(v) => u('client_id', v)}
          options={[{ value: '', label: '— Internal / No project —' }, ...clients.map(c => ({ value: c.id, label: `${c.bride_name} & ${c.groom_name}` }))]} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Assigned To" required value={f.assigned_to} onChange={(v) => u('assigned_to', v)} placeholder="Sneha / Riya" />
          <Field label="Due Date" type="date" value={f.due_date} onChange={(v) => u('due_date', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status" type="select" value={f.status} onChange={(v) => u('status', v)} options={TASK_STATUSES} />
          <Field label="Priority" type="select" value={f.priority} onChange={(v) => u('priority', v)} options={PRIORITIES} />
        </div>
        <Field label="Description" type="textarea" value={f.description} onChange={(v) => u('description', v)} />
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
          <label className="flex items-center gap-2 text-sm text-stone-800 cursor-pointer font-medium">
            <input type="checkbox" checked={f.is_client_issue} onChange={(e) => u('is_client_issue', e.target.checked)} className="rounded border-red-300 text-[#6B1F2E] focus:ring-[#6B1F2E]" />
            Client Issue
          </label>
          <div className="text-xs text-stone-500 mt-1 ml-5">Appears in Support Tickets section for client-facing issue tracking</div>
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
          <input type="checkbox" checked={f.is_deliverable} onChange={(e) => u('is_deliverable', e.target.checked)} className="rounded" />
          Mark as deliverable (also shows in Deliverables section)
        </label>
      </div>
      <div className="flex gap-3 mt-7">
        {isEdit && <DangerButton onClick={remove}>Delete</DangerButton>}
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={!valid || saving}>{saving ? 'Saving…' : (isEdit ? 'Update' : 'Add Task')}</PrimaryButton>
      </div>
    </Modal>
  );
}

// ============ DELIVERABLE FORM ============
export function DeliverableForm({ open, onClose, onSaved, clients, vendors, initial, defaultClientId }) {
  const [f, setF] = useState({
    client_id: defaultClientId || '', item: '', due_date: '', vendor_id: '',
    status: 'pending', priority: 'medium', delivered_date: '', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (initial) setF({ ...initial, vendor_id: initial.vendor_id || '' });
    else setF({
      client_id: defaultClientId || '', item: '', due_date: '', vendor_id: '',
      status: 'pending', priority: 'medium', delivered_date: '', notes: ''
    });
  }, [initial, open, defaultClientId]);

  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.client_id && f.item;

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...f,
        client_id: Number(f.client_id),
        vendor_id: f.vendor_id ? Number(f.vendor_id) : null,
        due_date: f.due_date || null,
        delivered_date: f.delivered_date || null
      };
      if (isEdit) await updateRow('deliverables', initial.id, payload);
      else await insertRow('deliverables', payload);
      onSaved?.(); onClose();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm('Delete this deliverable?')) return;
    await deleteRow('deliverables', initial.id); onSaved?.(); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow={isEdit ? 'Edit Deliverable' : 'New Deliverable'} title={isEdit ? 'Update' : 'Add deliverable'}>
      <div className="space-y-4">
        <Field label="Item" required value={f.item} onChange={(v) => u('item', v)} placeholder="Edited photos (500), Album, Cinematic video…" />
        <Field label="Project" type="select" required value={f.client_id} onChange={(v) => u('client_id', v)}
          options={clients.map(c => ({ value: c.id, label: `${c.bride_name} & ${c.groom_name}` }))} />
        <Field label="Vendor (optional)" type="select" value={f.vendor_id} onChange={(v) => u('vendor_id', v)}
          options={[{ value: '', label: '— None —' }, ...vendors.map(v => ({ value: v.id, label: v.name }))]} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due Date" type="date" value={f.due_date} onChange={(v) => u('due_date', v)} />
          <Field label="Status" type="select" value={f.status} onChange={(v) => u('status', v)} options={TASK_STATUSES} />
        </div>
        <Field label="Priority" type="select" value={f.priority} onChange={(v) => u('priority', v)} options={PRIORITIES} />
        {f.status === 'done' && (
          <Field label="Delivered On" type="date" value={f.delivered_date} onChange={(v) => u('delivered_date', v)} />
        )}
        <Field label="Notes" type="textarea" value={f.notes} onChange={(v) => u('notes', v)} />
      </div>
      <div className="flex gap-3 mt-7">
        {isEdit && <DangerButton onClick={remove}>Delete</DangerButton>}
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={!valid || saving}>{saving ? 'Saving…' : (isEdit ? 'Update' : 'Add')}</PrimaryButton>
      </div>
    </Modal>
  );
}

// ============ EXPENSE FORM ============
export function ExpenseForm({ open, onClose, onSaved, initial }) {
  const [f, setF] = useState({
    category: 'Salary', amount: '', expense_date: new Date().toISOString().slice(0, 10),
    description: '', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (initial) setF({ ...initial, amount: initial.amount || '' });
    else setF({ category: 'Salary', amount: '', expense_date: new Date().toISOString().slice(0, 10), description: '', notes: '' });
  }, [initial, open]);

  const u = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.category && f.amount && f.expense_date;

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...f, amount: Number(f.amount) };
      if (isEdit) await updateRow('expenses', initial.id, payload);
      else await insertRow('expenses', payload);
      onSaved?.(); onClose();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm('Delete this expense?')) return;
    await deleteRow('expenses', initial.id); onSaved?.(); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow={isEdit ? 'Edit Expense' : 'New Expense'} title={isEdit ? 'Update expense' : 'Add expense'}>
      <div className="space-y-4">
        <Field label="Category" type="select" required value={f.category} onChange={(v) => u('category', v)} options={EXPENSE_CATEGORIES} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)" type="number" required value={f.amount} onChange={(v) => u('amount', v)} />
          <Field label="Date" type="date" required value={f.expense_date} onChange={(v) => u('expense_date', v)} />
        </div>
        <Field label="Description" required value={f.description} onChange={(v) => u('description', v)} placeholder="Sneha - Oct salary, Studio rent…" />
        <Field label="Notes" type="textarea" value={f.notes} onChange={(v) => u('notes', v)} />
      </div>
      <div className="flex gap-3 mt-7">
        {isEdit && <DangerButton onClick={remove}>Delete</DangerButton>}
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={!valid || saving}>{saving ? 'Saving…' : (isEdit ? 'Update' : 'Add')}</PrimaryButton>
      </div>
    </Modal>
  );
}
