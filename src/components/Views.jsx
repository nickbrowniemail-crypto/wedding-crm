import { useState, useMemo } from 'react';
import {
  Plus, Search, MapPin, ChevronRight, ChevronLeft, Clock,
  AlertCircle, Phone, Mail, Camera, Filter, FileText,
  ArrowDownLeft, ArrowUpRight, Package, Edit2, Calendar, Wallet
} from 'lucide-react';
import {
  fmtINR, fmtINRshort, fmtDate, fmtDateShort, fmtDateLong, daysLeft,
  statusColor, taskStatusColor, vendorTypeLabel, CLIENT_STATUSES
} from '../utils';
import { StatCard, SmallStat, EmptyState, Loader } from './UI';
import {
  ClientForm, EventForm, VendorForm, ProjectVendorForm,
  PaymentForm, VendorPaymentForm, TaskForm, DeliverableForm, ExpenseForm
} from './Forms';

// ============ DASHBOARD ============
export function DashboardView({ data, openClient, openVendor }) {
  const { clients, events, payments, vendorPayments, projectVendors, vendors, tasks, expenses, activity, loading } = data;
  if (loading) return <Loader label="Loading dashboard…" />;

  const totalRevenue = clients.reduce((s, c) => s + Number(c.total_amount || 0), 0);
  const totalReceived = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalVendorPaid = vendorPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalVendorBills = projectVendors.reduce((s, v) => s + Number(v.agreed_amount || 0), 0);
  const otherExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = totalReceived - totalVendorPaid - otherExpenses;

  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date());
  const upcomingTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) >= new Date()).slice(0, 4);
  const todaysTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString());

  const groupedEvents = useMemo(() => {
    const upcoming = events.filter(e => new Date(e.event_date) >= new Date()).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    const groups = {};
    upcoming.forEach(e => {
      const key = `${e.client_id}_${e.event_date}`;
      if (!groups[key]) groups[key] = { date: e.event_date, clientId: e.client_id, events: [] };
      groups[key].events.push(e);
    });
    return Object.values(groups).slice(0, 6);
  }, [events]);

  const getProjectPhotographer = (clientId) => {
    const pv = projectVendors.find(v => v.client_id === clientId && v.role === 'photographer');
    return pv ? vendors.find(v => v.id === pv.vendor_id) : null;
  };

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Income Received" value={fmtINRshort(totalReceived)} sub={`of ${fmtINRshort(totalRevenue)} booked`} accent />
        <StatCard label="Vendor Bills" value={fmtINRshort(totalVendorBills)} sub={`${fmtINRshort(totalVendorPaid)} paid`} />
        <StatCard label="Net Profit" value={fmtINRshort(profit)} sub="this period" />
        <StatCard label="Overdue Tasks" value={overdueTasks.length} sub="need attention" warn={overdueTasks.length > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-stone-200/70 p-5 sm:p-6">
          <h2 className="display text-lg sm:text-xl text-stone-900 mb-4">Upcoming Events</h2>
          {groupedEvents.length === 0 ? (
            <EmptyState icon={Calendar} title="No upcoming events" sub="Add events from the client detail page." />
          ) : (
            <div className="space-y-4">
              {groupedEvents.map(({ date, clientId, events: evts }) => {
                const d = new Date(date);
                const client = clients.find(c => c.id === clientId);
                const photographer = getProjectPhotographer(clientId);
                return (
                  <div key={`${clientId}-${date}`} className="flex gap-3 sm:gap-4">
                    <div className="w-14 text-center flex-shrink-0 pt-1">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">{d.toLocaleDateString('en-IN', { month: 'short' })}</div>
                      <div className="display text-2xl text-stone-900 leading-none mt-0.5">{d.getDate()}</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                    </div>
                    <div className="flex-1 min-w-0 border-l border-stone-200 pl-3 sm:pl-4">
                      <button onClick={() => openClient(clientId)} className="display text-base sm:text-lg text-stone-900 hover:text-[#6B1F2E] text-left">
                        {client?.bride_name} <span className="display-italic text-stone-400">&</span> {client?.groom_name}
                      </button>
                      <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <Camera size={10} />
                        {photographer ? (
                          <button onClick={() => openVendor(photographer.id)} className="hover:text-stone-900 hover:underline">{photographer.name}</button>
                        ) : <span className="text-amber-700">Not assigned</span>}
                      </div>
                      <div className="space-y-1 mt-2">
                        {evts.map(e => (
                          <div key={e.id} className="text-sm text-stone-700 flex items-baseline gap-2 flex-wrap">
                            {e.event_time && <span className="text-stone-500 text-xs tabular-nums">{e.event_time.slice(0, 5)}</span>}
                            <span className="text-stone-900">{e.event_type}</span>
                            {e.venue && <span className="text-xs text-stone-500 truncate">· {e.venue}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-stone-200/70 p-5 sm:p-6">
          <h2 className="display text-lg sm:text-xl text-stone-900 mb-4">Today's Tasks</h2>
          {todaysTasks.length === 0 ? (
            <div className="text-sm text-stone-500">No tasks due today.</div>
          ) : (
            <div className="space-y-2">
              {todaysTasks.map(t => {
                const client = clients.find(c => c.id === t.client_id);
                return (
                  <button key={t.id} onClick={() => t.client_id && openClient(t.client_id)} className="w-full flex items-start justify-between gap-3 p-2 rounded hover:bg-stone-50 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-stone-900">{t.title}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{client ? `${client.bride_name} & ${client.groom_name}` : 'Internal'} · {t.assigned_to}</div>
                    </div>
                    <div className="text-xs text-stone-700 flex-shrink-0">{t.status}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {overdueTasks.length > 0 && (
          <div className="bg-white rounded-lg border border-red-200 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="text-red-600" />
              <h2 className="display text-lg sm:text-xl text-stone-900">Overdue Tasks</h2>
            </div>
            <div className="space-y-2">
              {overdueTasks.map(t => {
                const client = clients.find(c => c.id === t.client_id);
                return (
                  <button key={t.id} onClick={() => t.client_id && openClient(t.client_id)} className="w-full flex items-start justify-between gap-3 p-2 rounded hover:bg-red-50/50 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-stone-900">{t.title}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{client ? `${client.bride_name} & ${client.groom_name}` : 'Internal'} · {t.assigned_to}</div>
                    </div>
                    <div className="text-xs text-red-700 flex-shrink-0">{Math.abs(daysLeft(t.due_date))}d late</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg border border-stone-200/70 p-5 sm:p-6">
          <h2 className="display text-lg sm:text-xl text-stone-900 mb-4">Upcoming Tasks</h2>
          {upcomingTasks.length === 0 ? (
            <div className="text-sm text-stone-500">No upcoming tasks.</div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map(t => {
                const client = clients.find(c => c.id === t.client_id);
                return (
                  <button key={t.id} onClick={() => t.client_id && openClient(t.client_id)} className="w-full flex items-start justify-between gap-3 p-2 rounded hover:bg-stone-50 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-stone-900">{t.title}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{client ? `${client.bride_name} & ${client.groom_name}` : 'Internal'} · {t.assigned_to}</div>
                    </div>
                    <div className="text-xs text-stone-700 flex-shrink-0">{daysLeft(t.due_date)}d left</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ScheduleView({ data, openClient }) {
  const { events, clients, projectVendors, vendors, loading } = data;
  if (loading) return <Loader label="Loading schedule…" />;

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aDate = new Date(a.event_date);
      const bDate = new Date(b.event_date);
      if (aDate.getTime() !== bDate.getTime()) return aDate - bDate;
      return (a.event_time || '').localeCompare(b.event_time || '');
    });
  }, [events]);

  const grouped = useMemo(() => {
    const map = new Map();
    sortedEvents.forEach((event) => {
      const key = event.event_date;
      if (!map.has(key)) map.set(key, { date: new Date(event.event_date), events: [] });
      map.get(key).events.push(event);
    });
    return Array.from(map.values());
  }, [sortedEvents]);

  const getPhotographer = (clientId) => {
    const pv = projectVendors.find(v => v.client_id === clientId && v.role === 'photographer');
    return pv ? vendors.find(v => v.id === pv.vendor_id) : null;
  };

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-4">
      {grouped.length === 0 ? (
        <EmptyState icon={Calendar} title="No events scheduled" sub="Add events from the client detail page." />
      ) : (
        <div className="overflow-x-auto pb-3">
          <div className="min-w-[900px]">
            <div className="grid grid-flow-col auto-cols-min gap-2">
              {grouped.map(({ date, events: dayEvents }) => (
                <div key={date.toISOString()} className="min-w-[180px] bg-white rounded-2xl border border-stone-200 overflow-hidden">
                  <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-2.5 py-2.5">
                    <div className="text-[10px] uppercase tracking-[0.35em] text-stone-500">{date.toLocaleDateString('en-IN', { month: 'short' })}</div>
                    <div className="text-xl font-semibold text-stone-900 leading-none">{date.getDate()}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">{date.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                  </div>
                  <div className="divide-y divide-stone-200">
                    {dayEvents.map((event) => {
                      const client = clients.find(c => c.id === event.client_id);
                      const photographer = getPhotographer(event.client_id);
                      return (
                        <button key={event.id} onClick={() => event.client_id && openClient(event.client_id)}
                          className="w-full text-left px-2.5 py-2.5 hover:bg-stone-50 transition-colors">
                          <div className="space-y-0.5">
                            <div className="text-sm font-semibold text-stone-900 truncate">{client ? `${client.bride_name} & ${client.groom_name}` : 'Unknown Client'}</div>
                            <div className="text-[11px] text-stone-500 uppercase tracking-[0.2em] truncate">{event.event_type}</div>
                            <div className="flex flex-wrap items-center gap-1 text-[11px] text-stone-600">
                              <span className="inline-flex items-center gap-1"><Clock size={12} />{event.event_time ? event.event_time.slice(0, 5) : 'TBD'}</span>
                              <span className="inline-flex items-center gap-1 truncate"><MapPin size={12} />{event.venue || 'Venue TBD'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-stone-600 truncate">
                              <Camera size={12} />
                              <span className="truncate">{photographer?.name || 'Photographer TBD'}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ CLIENTS LIST ============
export function ClientsView({ data, openClient }) {
  const { clients, events, payments, projectVendors, vendors, refresh, loading } = data;
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const getMainWeddingDate = (clientId) => {
    const list = events.filter(e => e.client_id === clientId);
    const wedding = list.find(e => e.event_type === 'Wedding');
    if (wedding) return wedding.event_date;
    return list.sort((a, b) => new Date(b.event_date) - new Date(a.event_date))[0]?.event_date;
  };

  const getProjectPhotographer = (clientId) => {
    const pv = projectVendors.find(v => v.client_id === clientId && v.role === 'photographer');
    return pv ? vendors.find(v => v.id === pv.vendor_id) : null;
  };

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const wd = getMainWeddingDate(c.id);
      const matchesSearch = `${c.bride_name} ${c.groom_name} ${c.city || ''}`.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (dateFilter === 'all' || !wd) return dateFilter === 'all';
      const wdt = new Date(wd), now = new Date();
      if (dateFilter === 'upcoming') return wdt >= now;
      if (dateFilter === 'past') return wdt < now;
      if (dateFilter === 'this_month') return wdt.getMonth() === now.getMonth() && wdt.getFullYear() === now.getFullYear();
      return true;
    }).sort((a, b) => new Date(getMainWeddingDate(a.id) || 0) - new Date(getMainWeddingDate(b.id) || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, events, search, dateFilter]);

  if (loading) return <Loader />;

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search couples, cities…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-md text-sm focus:outline-none focus:border-stone-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-stone-200 rounded-md text-sm">
            <option value="all">All dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="this_month">This month</option>
            <option value="past">Past</option>
          </select>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-stone-900 text-white px-3 sm:px-4 py-2.5 rounded-md text-xs sm:text-sm hover:bg-stone-800">
            <Plus size={14} /><span className="hidden sm:inline">New Client</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No clients yet" sub="Add your first wedding to get started." />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-stone-200/70 overflow-x-auto hidden md:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-stone-200/70 bg-stone-50/50">
                  {['Wedding Date', 'Couple', 'Location', 'Photographer', 'Booking', 'Received', 'Pending', 'Status', ''].map(h =>
                    <th key={h} className="text-left text-[10px] uppercase tracking-[0.2em] text-stone-500 px-3 py-2.5 font-normal">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const wd = getMainWeddingDate(c.id);
                  const photographer = getProjectPhotographer(c.id);
                  const received = payments.filter(p => p.client_id === c.id).reduce((s, p) => s + Number(p.amount), 0);
                  const pending = Number(c.total_amount || 0) - received;
                  return (
                    <tr key={c.id} onClick={() => openClient(c.id)} className="border-b border-stone-100 hover:bg-stone-50/50 cursor-pointer">
                      <td className="px-3 py-2.5 whitespace-nowrap text-sm text-stone-900">
                        <div>{wd ? fmtDateShort(wd) : '—'}</div>
                        <div className="text-xs text-stone-500">{wd ? new Date(wd).getFullYear() : ''}</div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-stone-900 max-w-[220px] truncate">
                        <div className="truncate">{c.bride_name} <span className="text-stone-400">&</span> {c.groom_name}</div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-stone-700 whitespace-nowrap">{c.city || '—'}</td>
                      <td className="px-3 py-2.5 text-sm text-stone-700 max-w-[180px] truncate">{photographer?.name || <span className="text-amber-700">—</span>}</td>
                      <td className="px-3 py-2.5 text-sm text-stone-900 whitespace-nowrap">{fmtINRshort(c.total_amount)}</td>
                      <td className="px-3 py-2.5 text-sm text-emerald-700 whitespace-nowrap">{fmtINRshort(received)}</td>
                      <td className="px-3 py-2.5 text-sm whitespace-nowrap" style={{ color: pending > 0 ? '#b45309' : '#57534e' }}>{fmtINRshort(pending)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 rounded-full border text-[10px] uppercase tracking-wider ${statusColor(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-stone-400"><ChevronRight size={14} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map(c => {
              const wd = getMainWeddingDate(c.id);
              const photographer = getProjectPhotographer(c.id);
              const received = payments.filter(p => p.client_id === c.id).reduce((s, p) => s + Number(p.amount), 0);
              const pending = Number(c.total_amount || 0) - received;
              return (
                <button key={c.id} onClick={() => openClient(c.id)} className="w-full bg-white rounded-lg border border-stone-200/70 p-4 text-left">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="display text-lg text-stone-900">{c.bride_name} <span className="display-italic text-stone-400">&</span> {c.groom_name}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{wd ? fmtDate(wd) : 'Date TBD'} · {c.city || '—'}</div>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-wider ${statusColor(c.status)} flex-shrink-0`}>{c.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-stone-100">
                    <div><div className="text-stone-500">Photographer</div><div className="text-stone-900 mt-0.5">{photographer?.name || '—'}</div></div>
                    <div className="text-right"><div className="text-stone-500">Pending</div><div className="text-stone-900 mt-0.5">{fmtINRshort(pending)} of {fmtINRshort(c.total_amount)}</div></div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <ClientForm open={showForm} onClose={() => setShowForm(false)} onSaved={refresh.clients} />
    </div>
  );
}

// ============ CLIENT DETAIL ============
export function ClientDetailView({ data, clientId, openVendor }) {
  const { clients, events, payments, projectVendors, vendorPayments, vendors, tasks, deliverables, refresh } = data;
  const [tab, setTab] = useState('overview');
  const [editClient, setEditClient] = useState(false);
  const [eventForm, setEventForm] = useState({ open: false, initial: null });
  const [pvForm, setPvForm] = useState({ open: false, initial: null });
  const [paymentForm, setPaymentForm] = useState({ open: false, initial: null });
  const [vpForm, setVpForm] = useState({ open: false, projectVendorId: null, initial: null });
  const [taskForm, setTaskForm] = useState({ open: false, initial: null });
  const [delForm, setDelForm] = useState({ open: false, initial: null });

  const c = clients.find(x => x.id === clientId);
  if (!c) return <div className="p-10 text-stone-500">Client not found</div>;

  const cEvents = events.filter(e => e.client_id === clientId).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  const cPayments = payments.filter(p => p.client_id === clientId).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  const cPV = projectVendors.filter(v => v.client_id === clientId);
  const cTasks = tasks.filter(t => t.client_id === clientId);
  const cDel = [
    ...deliverables.filter(d => d.client_id === clientId).map(d => ({ ...d, source: 'deliverable' })),
    ...tasks.filter(t => t.client_id === clientId && t.is_deliverable).map(t => ({
      id: 't' + t.id,
      client_id: t.client_id,
      item: t.title,
      due_date: t.due_date,
      vendor_id: null,
      status: t.status,
      priority: t.priority || 'medium',
      notes: t.description,
      assigned_to: t.assigned_to,
      source: 'task'
    }))
  ].sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));

  const received = cPayments.reduce((s, p) => s + Number(p.amount), 0);
  const pending = Number(c.total_amount || 0) - received;
  const totalExpense = cPV.reduce((s, v) => s + Number(v.agreed_amount || 0), 0);
  const expensePaid = cPV.reduce((s, v) => s + vendorPayments.filter(vp => vp.project_vendor_id === v.id).reduce((ss, vp) => ss + Number(vp.amount), 0), 0);
  const profit = Number(c.total_amount || 0) - totalExpense;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'events', label: `Events (${cEvents.length})` },
    { id: 'payments', label: `Payments (${cPayments.length})` },
    { id: 'vendors', label: `Vendors (${cPV.length})` },
    { id: 'tasks', label: `Tasks (${cTasks.length})` },
    { id: 'deliverables', label: `Deliverables (${cDel.length})` },
  ];

  const refreshAll = () => { refresh.all(); };

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6">
      <div className="bg-white rounded-lg border border-stone-200/70 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className={`inline-block px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-wider ${statusColor(c.status)}`}>{c.status}</span>
              <span className="text-xs text-stone-500">{c.package}</span>
              <button onClick={() => setEditClient(true)} className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 ml-auto sm:ml-0">
                <Edit2 size={11} />Edit
              </button>
            </div>
            <div className="text-xs text-stone-500 space-y-1">
              {c.phone && <div className="flex items-center gap-2"><Phone size={11} />{c.phone}</div>}
              {c.email && <div className="flex items-center gap-2"><Mail size={11} />{c.email}</div>}
              {c.city && <div className="flex items-center gap-2"><MapPin size={11} />{c.city}</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 flex-1">
            <SmallStat label="Booking" value={fmtINRshort(c.total_amount)} />
            <SmallStat label="Received" value={fmtINRshort(received)} color="text-emerald-700" />
            <SmallStat label="Pending" value={fmtINRshort(pending)} color={pending > 0 ? "text-amber-700" : "text-stone-700"} />
            <SmallStat label="Profit" value={fmtINRshort(profit)} color={profit > 0 ? "text-emerald-700" : "text-red-700"} />
          </div>
        </div>
      </div>

      <div className="border-b border-stone-200/70 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === t.id ? 'border-[#6B1F2E] text-[#6B1F2E]' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg border border-stone-200/70 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="display text-base text-stone-900">Next Event</h3>
              <button onClick={() => setTab('events')} className="text-[10px] uppercase tracking-wider text-stone-500 hover:text-stone-900">View all</button>
            </div>
            {cEvents.find(e => new Date(e.event_date) >= new Date()) ? (() => {
              const next = cEvents.find(e => new Date(e.event_date) >= new Date());
              return (
                <div>
                  <div className="display text-xl text-stone-900">{next.event_type}</div>
                  <div className="text-sm text-stone-700 mt-1">{fmtDateLong(next.event_date)}{next.event_time ? ` · ${next.event_time.slice(0, 5)}` : ''}</div>
                  {next.venue && <div className="text-xs text-stone-500 mt-1 flex items-center gap-1"><MapPin size={11} />{next.venue}</div>}
                </div>
              );
            })() : <div className="text-sm text-stone-500">No upcoming events</div>}
          </div>
          <div className="bg-white rounded-lg border border-stone-200/70 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="display text-base text-stone-900">Latest Payment</h3>
              <button onClick={() => setTab('payments')} className="text-[10px] uppercase tracking-wider text-stone-500 hover:text-stone-900">View all</button>
            </div>
            {cPayments[0] ? (
              <div>
                <div className="display text-xl text-emerald-700">+{fmtINR(cPayments[0].amount)}</div>
                <div className="text-sm text-stone-700 mt-1">{fmtDateLong(cPayments[0].payment_date)} · {cPayments[0].mode}</div>
                {cPayments[0].notes && <div className="text-xs text-stone-500 mt-1">{cPayments[0].notes}</div>}
              </div>
            ) : <div className="text-sm text-stone-500">No payments yet</div>}
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setEventForm({ open: true, initial: null })} className="flex items-center gap-2 bg-stone-900 text-white px-3 py-2 rounded-md text-xs">
              <Plus size={12} />Add Event
            </button>
          </div>
          {cEvents.length === 0 ? <EmptyState icon={Calendar} title="No events yet" /> : (
            <div className="bg-white rounded-lg border border-stone-200/70 overflow-hidden">
              {cEvents.map((e, i) => (
                <button key={e.id} onClick={() => setEventForm({ open: true, initial: e })} className={`w-full flex items-center gap-4 p-4 hover:bg-stone-50/50 text-left ${i !== cEvents.length - 1 ? 'border-b border-stone-100' : ''}`}>
                  <div className="w-14 text-center flex-shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-stone-500">{new Date(e.event_date).toLocaleDateString('en-IN', { month: 'short' })}</div>
                    <div className="display text-2xl text-stone-900 leading-none mt-0.5">{new Date(e.event_date).getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="display text-base text-stone-900">{e.event_type}</div>
                    <div className="text-xs text-stone-500 mt-1 flex items-center gap-3 flex-wrap">
                      {e.event_time && <span className="flex items-center gap-1"><Clock size={11} />{e.event_time.slice(0, 5)}</span>}
                      {e.venue && <span className="flex items-center gap-1"><MapPin size={11} />{e.venue}</span>}
                    </div>
                  </div>
                  <Edit2 size={12} className="text-stone-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setPaymentForm({ open: true, initial: null })} className="flex items-center gap-2 bg-stone-900 text-white px-3 py-2 rounded-md text-xs">
              <Plus size={12} />Record Payment
            </button>
          </div>
          {cPayments.length === 0 ? <EmptyState icon={Wallet} title="No payments yet" /> : (
            <div className="bg-white rounded-lg border border-stone-200/70 overflow-hidden">
              {cPayments.map((p, i) => (
                <button key={p.id} onClick={() => setPaymentForm({ open: true, initial: p })} className={`w-full flex items-center justify-between gap-4 p-4 hover:bg-stone-50/50 text-left ${i !== cPayments.length - 1 ? 'border-b border-stone-100' : ''}`}>
                  <div>
                    <div className="text-sm text-stone-900">{p.notes || 'Payment'}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{fmtDate(p.payment_date)} · {p.mode}</div>
                  </div>
                  <div className="display text-lg text-emerald-700">+{fmtINR(p.amount)}</div>
                </button>
              ))}
              <div className="flex items-center justify-between gap-4 p-4 bg-stone-50/50 border-t border-stone-200">
                <div className="text-xs uppercase tracking-wider text-stone-500">Total Received</div>
                <div className="display text-lg text-stone-900">{fmtINR(received)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'vendors' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setPvForm({ open: true, initial: null })} className="flex items-center gap-2 bg-stone-900 text-white px-3 py-2 rounded-md text-xs">
              <Plus size={12} />Assign Vendor
            </button>
          </div>
          {cPV.length === 0 ? <EmptyState title="No vendors assigned yet" /> : (
            <div className="space-y-3">
              {cPV.map(pv => {
                const v = vendors.find(x => x.id === pv.vendor_id);
                const vps = vendorPayments.filter(p => p.project_vendor_id === pv.id);
                const paid = vps.reduce((s, p) => s + Number(p.amount), 0);
                const pendingV = Number(pv.agreed_amount) - paid;
                return (
                  <div key={pv.id} className="bg-white rounded-lg border border-stone-200/70 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <button onClick={() => openVendor(v.id)} className="display text-lg text-stone-900 hover:text-[#6B1F2E] text-left">{v?.name}</button>
                        <div className="text-[10px] uppercase tracking-wider text-stone-500 mt-0.5">{vendorTypeLabel(pv.role)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setVpForm({ open: true, projectVendorId: pv.id, initial: null })} className="text-xs text-stone-700 hover:text-stone-900 px-2 py-1 border border-stone-200 rounded">+ Pay</button>
                        <button onClick={() => setPvForm({ open: true, initial: pv })} className="text-xs text-stone-500 hover:text-stone-900"><Edit2 size={12} /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs pt-3 border-t border-stone-100 mb-3">
                      <div><div className="text-stone-500 text-[9px] uppercase">Agreed</div><div className="text-sm display mt-0.5">{fmtINRshort(pv.agreed_amount)}</div></div>
                      <div><div className="text-stone-500 text-[9px] uppercase">Paid</div><div className="text-sm display text-emerald-700 mt-0.5">{fmtINRshort(paid)}</div></div>
                      <div><div className="text-stone-500 text-[9px] uppercase">Pending</div><div className="text-sm display mt-0.5" style={{ color: pendingV > 0 ? '#b45309' : '#57534e' }}>{fmtINRshort(pendingV)}</div></div>
                    </div>
                    {vps.length > 0 && (
                      <div className="pt-3 border-t border-stone-100">
                        <div className="text-[10px] uppercase tracking-wider text-stone-500 mb-2">Payments</div>
                        <div className="space-y-1">
                          {vps.map(vp => (
                            <button key={vp.id} onClick={() => setVpForm({ open: true, projectVendorId: pv.id, initial: vp })} className="w-full flex items-center justify-between text-xs text-left hover:bg-stone-50 p-1 rounded">
                              <span className="text-stone-700">{fmtDate(vp.payment_date)} · {vp.mode}</span>
                              <span className="display text-emerald-700">{fmtINR(vp.amount)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="bg-stone-50 rounded-lg border border-stone-200/70 p-4 flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-stone-500">Total Vendor Bills</div>
                <div className="display text-lg text-stone-900">{fmtINR(totalExpense)} <span className="text-sm text-stone-500">({fmtINRshort(expensePaid)} paid)</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setTaskForm({ open: true, initial: null })} className="flex items-center gap-2 bg-stone-900 text-white px-3 py-2 rounded-md text-xs">
              <Plus size={12} />Add Task
            </button>
          </div>
          {cTasks.length === 0 ? <EmptyState title="No tasks for this project" /> : (
            <div className="bg-white rounded-lg border border-stone-200/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Assignee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {cTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-stone-50/50 cursor-pointer" onClick={() => setTaskForm({ open: true, initial: t })}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-stone-900">
                          {t.due_date ? fmtDateShort(t.due_date) : '—'}
                        </td>
                        <td className="px-4 py-4 text-sm text-stone-900">
                          <div className="flex items-center gap-2">
                            {t.title}
                            {t.is_deliverable && <Package size={12} className="text-[#6B1F2E]" />}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-stone-900">
                          {t.assigned_to || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 rounded-full border text-xs uppercase tracking-wider ${taskStatusColor(t.status)}`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className={`capitalize ${t.priority === 'high' ? 'text-red-600' : t.priority === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                            {t.priority || 'medium'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-stone-500 max-w-xs truncate" title={t.description || undefined}
                          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'deliverables' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setDelForm({ open: true, initial: null })} className="flex items-center gap-2 bg-stone-900 text-white px-3 py-2 rounded-md text-xs">
              <Plus size={12} />Add Deliverable
            </button>
          </div>
          {cDel.length === 0 ? <EmptyState title="No deliverables added yet" /> : (
            <div className="bg-white rounded-lg border border-stone-200/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Assignee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {cDel.map((d) => {
                      const v = vendors.find(x => x.id === d.vendor_id);
                      const onClick = () => d.source === 'deliverable' ? setDelForm({ open: true, initial: d }) : setTaskForm({ open: true, initial: tasks.find(t => 't' + t.id === d.id) });
                      return (
                        <tr key={d.id} className="hover:bg-stone-50/50 cursor-pointer" onClick={onClick}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-stone-900">
                            {d.due_date ? fmtDateShort(d.due_date) : '—'}
                          </td>
                          <td className="px-4 py-4 text-sm text-stone-900">
                            {d.item}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-stone-900">
                            {d.assigned_to || '—'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-block px-2 py-1 rounded-full border text-xs uppercase tracking-wider ${taskStatusColor(d.status)}`}>
                              {d.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`capitalize ${d.priority === 'high' ? 'text-red-600' : d.priority === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                              {d.priority || 'medium'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-stone-500 max-w-xs truncate" title={d.notes || undefined}
                            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {d.notes || '—'}
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
      )}

      <ClientForm open={editClient} onClose={() => setEditClient(false)} onSaved={refreshAll} initial={c} />
      <EventForm open={eventForm.open} onClose={() => setEventForm({ open: false, initial: null })} onSaved={refreshAll} clientId={clientId} initial={eventForm.initial} />
      <ProjectVendorForm open={pvForm.open} onClose={() => setPvForm({ open: false, initial: null })} onSaved={refreshAll} clientId={clientId} vendors={vendors} initial={pvForm.initial} />
      <PaymentForm open={paymentForm.open} onClose={() => setPaymentForm({ open: false, initial: null })} onSaved={refreshAll} clientId={clientId} initial={paymentForm.initial} />
      <VendorPaymentForm open={vpForm.open} onClose={() => setVpForm({ open: false, projectVendorId: null, initial: null })} onSaved={refreshAll} projectVendorId={vpForm.projectVendorId} initial={vpForm.initial} />
      <TaskForm open={taskForm.open} onClose={() => setTaskForm({ open: false, initial: null })} onSaved={refreshAll} clients={clients} defaultClientId={clientId} initial={taskForm.initial} />
      <DeliverableForm open={delForm.open} onClose={() => setDelForm({ open: false, initial: null })} onSaved={refreshAll} clients={clients} vendors={vendors} defaultClientId={clientId} initial={delForm.initial} />
    </div>
  );
}

// ============ VENDORS LIST ============
export function VendorsView({ data, openVendor }) {
  const { vendors, projectVendors, vendorPayments, refresh } = data;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const filtered = vendors.filter(v => {
    const matches = `${v.name} ${v.city || ''} ${v.description || ''}`.toLowerCase().includes(search.toLowerCase());
    return matches && (typeFilter === 'all' || v.vendor_type === typeFilter);
  });

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-md text-sm" />
        </div>
        <div className="flex gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-stone-200 rounded-md text-sm">
            <option value="all">All types</option>
            <option value="photographer">Photographer</option>
            <option value="cinematic_editor">Cinematic Editor</option>
            <option value="traditional_editor">Traditional Editor</option>
            <option value="album_printer">Album Printer</option>
            <option value="other">Other</option>
          </select>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-stone-900 text-white px-3 sm:px-4 py-2.5 rounded-md text-xs sm:text-sm">
            <Plus size={14} /><span className="hidden sm:inline">Add Vendor</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No vendors yet" sub="Add photographers, editors, album printers." />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-stone-200/70 overflow-x-auto hidden md:block">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-stone-200/70 bg-stone-50/50">
                  {['Name', 'Type', 'City', 'Projects', 'Billed', 'Paid', 'Pending', ''].map(h =>
                    <th key={h} className="text-left text-[10px] uppercase tracking-[0.2em] text-stone-500 px-4 py-3 font-normal">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const projects = projectVendors.filter(pv => pv.vendor_id === v.id);
                  const billed = projects.reduce((s, p) => s + Number(p.agreed_amount || 0), 0);
                  const paid = projects.reduce((s, p) => s + vendorPayments.filter(vp => vp.project_vendor_id === p.id).reduce((ss, vp) => ss + Number(vp.amount), 0), 0);
                  const pending = billed - paid;
                  return (
                    <tr key={v.id} onClick={() => openVendor(v.id)} className="border-b border-stone-100 hover:bg-stone-50/50 cursor-pointer">
                      <td className="px-4 py-3 text-sm text-stone-900">{v.name}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{vendorTypeLabel(v.vendor_type)}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{v.city || '—'}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{projects.length}</td>
                      <td className="px-4 py-3 text-sm text-stone-900">{fmtINRshort(billed)}</td>
                      <td className="px-4 py-3 text-sm text-emerald-700">{fmtINRshort(paid)}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: pending > 0 ? '#b45309' : '#57534e' }}>{fmtINRshort(pending)}</td>
                      <td className="px-4 py-3 text-stone-400"><ChevronRight size={14} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {filtered.map(v => {
              const projects = projectVendors.filter(pv => pv.vendor_id === v.id);
              const billed = projects.reduce((s, p) => s + Number(p.agreed_amount || 0), 0);
              const paid = projects.reduce((s, p) => s + vendorPayments.filter(vp => vp.project_vendor_id === p.id).reduce((ss, vp) => ss + Number(vp.amount), 0), 0);
              const pending = billed - paid;
              return (
                <button key={v.id} onClick={() => openVendor(v.id)} className="w-full bg-white rounded-lg border border-stone-200/70 p-3 text-left">
                  <div className="mb-1"><div className="text-base text-stone-900">{v.name}</div><div className="text-xs text-stone-500 mt-0.5">{vendorTypeLabel(v.vendor_type)} · {v.city || '—'}</div></div>
                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-stone-100">
                    <div><div className="text-stone-500 text-[9px] uppercase">Billed</div><div className="display mt-0.5">{fmtINRshort(billed)}</div></div>
                    <div><div className="text-stone-500 text-[9px] uppercase">Paid</div><div className="display text-emerald-700 mt-0.5">{fmtINRshort(paid)}</div></div>
                    <div><div className="text-stone-500 text-[9px] uppercase">Pending</div><div className="display mt-0.5" style={{ color: pending > 0 ? '#b45309' : '#57534e' }}>{fmtINRshort(pending)}</div></div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <VendorForm open={showForm} onClose={() => setShowForm(false)} onSaved={refresh.vendors} />
    </div>
  );
}

// ============ VENDOR DETAIL ============
export function VendorDetailView({ data, vendorId, openClient }) {
  const { vendors, projectVendors, vendorPayments, clients, events, refresh } = data;
  const [editVendor, setEditVendor] = useState(false);
  const [vpForm, setVpForm] = useState({ open: false, projectVendorId: null, initial: null });

  const v = vendors.find(x => x.id === vendorId);
  if (!v) return <div className="p-10 text-stone-500">Vendor not found</div>;

  const projects = projectVendors.filter(pv => pv.vendor_id === vendorId);
  const billed = projects.reduce((s, p) => s + Number(p.agreed_amount || 0), 0);
  const paid = projects.reduce((s, p) => s + vendorPayments.filter(vp => vp.project_vendor_id === p.id).reduce((ss, vp) => ss + Number(vp.amount), 0), 0);
  const pending = billed - paid;

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6">
      <div className="bg-white rounded-lg border border-stone-200/70 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="text-[10px] uppercase tracking-[0.25em] text-stone-500">{vendorTypeLabel(v.vendor_type)}</div>
              <button onClick={() => setEditVendor(true)} className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1"><Edit2 size={11} />Edit</button>
            </div>
            {v.description && <div className="text-sm text-stone-700 mb-3">{v.description}</div>}
            <div className="text-xs text-stone-500 space-y-1">
              {v.city && <div className="flex items-center gap-2"><MapPin size={11} />{v.city}</div>}
              {v.phone && <div className="flex items-center gap-2"><Phone size={11} />{v.phone}</div>}
              {v.email && <div className="flex items-center gap-2"><Mail size={11} />{v.email}</div>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 flex-1">
            <SmallStat label="Total Billed" value={fmtINRshort(billed)} />
            <SmallStat label="Paid" value={fmtINRshort(paid)} color="text-emerald-700" />
            <SmallStat label="Pending" value={fmtINRshort(pending)} color={pending > 0 ? "text-amber-700" : "text-stone-700"} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="display text-lg sm:text-xl text-stone-900 mb-4">Project History</h2>
        {projects.length === 0 ? <EmptyState title="No projects yet" sub="This vendor hasn't been assigned to any project." /> : (
          <div className="space-y-3">
            {projects.map(pv => {
              const c = clients.find(x => x.id === pv.client_id);
              const wd = events.find(e => e.client_id === pv.client_id && e.event_type === 'Wedding')?.event_date;
              const vps = vendorPayments.filter(p => p.project_vendor_id === pv.id);
              const projectPaid = vps.reduce((s, p) => s + Number(p.amount), 0);
              const projectPending = Number(pv.agreed_amount) - projectPaid;
              return (
                <div key={pv.id} className="bg-white rounded-lg border border-stone-200/70 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <button onClick={() => openClient(c.id)} className="display text-lg text-stone-900 hover:text-[#6B1F2E] text-left">
                        {c?.bride_name} <span className="display-italic text-stone-400">&</span> {c?.groom_name}
                      </button>
                      <div className="text-xs text-stone-500 mt-0.5">{vendorTypeLabel(pv.role)} · Wedding {wd ? fmtDateShort(wd) : 'TBD'}</div>
                    </div>
                    <button onClick={() => setVpForm({ open: true, projectVendorId: pv.id, initial: null })} className="text-xs text-stone-700 px-2 py-1 border border-stone-200 rounded hover:bg-stone-50">+ Pay</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs pt-3 border-t border-stone-100 mb-3">
                    <div><div className="text-stone-500 text-[9px] uppercase">Agreed</div><div className="text-sm display mt-0.5">{fmtINRshort(pv.agreed_amount)}</div></div>
                    <div><div className="text-stone-500 text-[9px] uppercase">Paid</div><div className="text-sm display text-emerald-700 mt-0.5">{fmtINRshort(projectPaid)}</div></div>
                    <div><div className="text-stone-500 text-[9px] uppercase">Pending</div><div className="text-sm display mt-0.5" style={{ color: projectPending > 0 ? '#b45309' : '#57534e' }}>{fmtINRshort(projectPending)}</div></div>
                  </div>
                  {vps.length > 0 && (
                    <div className="pt-3 border-t border-stone-100">
                      <div className="text-[10px] uppercase tracking-wider text-stone-500 mb-2">Payment history</div>
                      <div className="space-y-1">
                        {vps.map(p => (
                          <button key={p.id} onClick={() => setVpForm({ open: true, projectVendorId: pv.id, initial: p })} className="w-full flex items-center justify-between text-xs text-left hover:bg-stone-50 p-1 rounded">
                            <span className="text-stone-700">{fmtDate(p.payment_date)} · {p.mode}</span>
                            <span className="display text-emerald-700">{fmtINR(p.amount)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <VendorForm open={editVendor} onClose={() => setEditVendor(false)} onSaved={refresh.all} initial={v} />
      <VendorPaymentForm open={vpForm.open} onClose={() => setVpForm({ open: false, projectVendorId: null, initial: null })} onSaved={refresh.all} projectVendorId={vpForm.projectVendorId} initial={vpForm.initial} />
    </div>
  );
}

// ============ TASKS ============
export function TasksView({ data, openClient }) {
  const { tasks, clients, refresh } = data;
  const [filter, setFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [taskForm, setTaskForm] = useState({ open: false, initial: null });

  const assignees = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))];

  const filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (scopeFilter === 'project' && !t.client_id) return false;
    if (scopeFilter === 'internal' && t.client_id) return false;
    if (assigneeFilter !== 'all' && t.assigned_to !== assigneeFilter) return false;

    if (dateFilter !== 'all') {
      const due = t.due_date ? new Date(t.due_date) : null;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dueDay = due ? new Date(due.getFullYear(), due.getMonth(), due.getDate()) : null;

      if (dateFilter === 'today') {
        if (!dueDay || dueDay.getTime() !== today.getTime()) return false;
      }
      if (dateFilter === 'overdue') {
        if (!due || due >= now || t.status === 'done') return false;
      }
      if (dateFilter === 'upcoming') {
        if (!due || dueDay < today) return false;
      }
    }

    return true;
  });

  const toggleDeliverable = async (t, e) => {
    e.stopPropagation();
    const { updateRow } = await import('../dataHooks');
    await updateRow('tasks', t.id, { is_deliverable: !t.is_deliverable });
    refresh.all();
  };

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 bg-white border border-stone-200/70 rounded-md p-1">
          {['all', 'pending', 'in_progress', 'done'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded text-[10px] uppercase tracking-wider ${filter === f ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
        <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)} className="px-3 py-2 bg-white border border-stone-200 rounded-md text-sm">
          <option value="all">All scope</option>
          <option value="project">Project tasks</option>
          <option value="internal">Internal tasks</option>
        </select>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 bg-white border border-stone-200 rounded-md text-sm">
          <option value="all">All due dates</option>
          <option value="today">Today</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
        </select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="px-3 py-2 bg-white border border-stone-200 rounded-md text-sm">
          <option value="all">All assignees</option>
          {assignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={() => setTaskForm({ open: true, initial: null })} className="flex items-center gap-2 bg-stone-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm sm:ml-auto">
          <Plus size={14} />Add Task
        </button>
      </div>

      {filtered.length === 0 ? <EmptyState title="No tasks match these filters" /> : (
        <div className="bg-white rounded-lg border border-stone-200/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Title</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Project</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Priority</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((t) => {
                  const client = clients.find(c => c.id === t.client_id);
                  const isOverdue = t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date();
                  return (
                    <tr key={t.id} className="hover:bg-stone-50/50 cursor-pointer" onClick={() => setTaskForm({ open: true, initial: t })}>
                      <td className="px-3 py-2.5 whitespace-nowrap text-sm text-stone-900">
                        {t.due_date ? fmtDateShort(t.due_date) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-stone-900 max-w-[240px] truncate">
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => toggleDeliverable(t, e)} title={t.is_deliverable ? "Marked as deliverable" : "Mark as deliverable"}
                            className={`p-1 rounded ${t.is_deliverable ? 'bg-[#6B1F2E] text-white' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}>
                            <Package size={12} />
                          </button>
                          <span className="truncate" title={t.title}>{t.title}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-stone-900 max-w-[180px] truncate">
                        {client ? (
                          <button onClick={(e) => { e.stopPropagation(); openClient(client.id); }} className="hover:text-stone-900 hover:underline truncate" title={`${client.bride_name} & ${client.groom_name}`}>
                            {client.bride_name} & {client.groom_name}
                          </button>
                        ) : <span className="px-2 py-1 bg-stone-100 rounded text-stone-600 text-xs uppercase tracking-wider">Internal</span>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-sm text-stone-900 max-w-[130px] truncate" title={t.assigned_to}>{t.assigned_to}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 rounded-full border text-xs uppercase tracking-wider ${taskStatusColor(t.status)}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-sm text-stone-900">
                        <span className={`capitalize ${t.priority === 'high' ? 'text-red-600' : t.priority === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-stone-500 max-w-[220px] truncate" title={t.description || undefined}
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TaskForm open={taskForm.open} onClose={() => setTaskForm({ open: false, initial: null })} onSaved={refresh.all} clients={clients} initial={taskForm.initial} />
    </div>
  );
}

// ============ DELIVERABLES ============
export function DeliverablesView({ data, openClient }) {
  const { deliverables, tasks, clients, vendors, refresh } = data;
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [delForm, setDelForm] = useState({ open: false, initial: null });

  const items = [
    ...deliverables.map(d => ({ ...d, source: 'deliverable' })),
    ...tasks.filter(t => t.is_deliverable).map(t => ({
      id: 't' + t.id,
      client_id: t.client_id,
      item: t.title,
      due_date: t.due_date,
      vendor_id: null,
      status: t.status,
      priority: t.priority || 'medium',
      notes: t.description,
      source: 'task',
      assigned_to: t.assigned_to
    })),
  ].sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));

  const assignees = [...new Set(items.map(d => d.assigned_to).filter(Boolean))];
  const filteredItems = items.filter(d => {
    if (filter !== 'all' && d.status !== filter) return false;
    if (assigneeFilter !== 'all' && d.assigned_to !== assigneeFilter) return false;

    if (dateFilter !== 'all') {
      const due = d.due_date ? new Date(d.due_date) : null;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dueDay = due ? new Date(due.getFullYear(), due.getMonth(), due.getDate()) : null;

      if (dateFilter === 'today') {
        if (!dueDay || dueDay.getTime() !== today.getTime()) return false;
      }
      if (dateFilter === 'overdue') {
        if (!due || due >= now || d.status === 'done') return false;
      }
      if (dateFilter === 'upcoming') {
        if (!dueDay || dueDay.getTime() < today.getTime()) return false;
      }
    }

    return true;
  });

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 bg-white border border-stone-200/70 rounded-md p-1">
          {['all', 'pending', 'in_progress', 'done'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded text-[10px] uppercase tracking-wider ${filter === f ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 bg-white border border-stone-200 rounded-md text-sm">
          <option value="all">All due dates</option>
          <option value="today">Today</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
        </select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="px-3 py-2 bg-white border border-stone-200 rounded-md text-sm">
          <option value="all">All assignees</option>
          {assignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={() => setDelForm({ open: true, initial: null })} className="flex items-center gap-2 bg-stone-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm sm:ml-auto">
          <Plus size={14} />Add Deliverable
        </button>
      </div>

      {filteredItems.length === 0 ? <EmptyState icon={Package} title="No deliverables yet" /> : (
        <div className="bg-white rounded-lg border border-stone-200/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Title</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Project</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Priority</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.map((d) => {
                  const client = clients.find(c => c.id === d.client_id);
                  const vendor = d.vendor_id ? vendors.find(v => v.id === d.vendor_id) : null;
                  const onClick = () => d.source === 'deliverable' ? setDelForm({ open: true, initial: d }) : openClient(d.client_id);
                  return (
                    <tr key={d.id} className="hover:bg-stone-50/50 cursor-pointer" onClick={onClick}>
                      <td className="px-3 py-2.5 whitespace-nowrap text-sm text-stone-900">
                        {d.due_date ? fmtDateShort(d.due_date) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-stone-900 max-w-[240px] truncate" title={d.item}>{d.item}</td>
                      <td className="px-3 py-2.5 text-sm text-stone-900 max-w-[180px] truncate">
                        {client ? (
                          <button onClick={(e) => { e.stopPropagation(); openClient(client.id); }} className="hover:text-stone-900 hover:underline truncate" title={`${client.bride_name} & ${client.groom_name}`}>
                            {client.bride_name} & {client.groom_name}
                          </button>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-sm text-stone-900 max-w-[130px] truncate" title={d.assigned_to}>{d.assigned_to || '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 rounded-full border text-xs uppercase tracking-wider ${taskStatusColor(d.status)}`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-sm">
                        <span className={`capitalize ${d.priority === 'high' ? 'text-red-600' : d.priority === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                          {d.priority || 'medium'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-stone-500 max-w-[220px] truncate" title={d.notes || undefined}
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DeliverableForm open={delForm.open} onClose={() => setDelForm({ open: false, initial: null })} onSaved={refresh.all} clients={clients} vendors={vendors} initial={delForm.initial} />
    </div>
  );
}

// ============ ACCOUNTING ============
export function AccountingView({ data, openClient, openVendor }) {
  const { payments, vendorPayments, projectVendors, vendors, clients, expenses, refresh } = data;
  const [typeFilter, setTypeFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentForm, setPaymentForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState(false);

  const transactions = useMemo(() => {
    const all = [];
    payments.forEach(p => {
      const c = clients.find(x => x.id === p.client_id);
      all.push({
        id: 'p' + p.id, type: 'income', date: p.payment_date, amount: Number(p.amount), mode: p.mode,
        description: p.notes || 'Payment received',
        party: c ? `${c.bride_name} & ${c.groom_name}` : 'Client',
        partyId: p.client_id, partyType: 'client', category: 'Client payment'
      });
    });
    vendorPayments.forEach(vp => {
      const pv = projectVendors.find(x => x.id === vp.project_vendor_id);
      const v = pv ? vendors.find(x => x.id === pv.vendor_id) : null;
      const c = pv ? clients.find(x => x.id === pv.client_id) : null;
      all.push({
        id: 'vp' + vp.id, type: 'expense', date: vp.payment_date, amount: Number(vp.amount), mode: vp.mode,
        description: c ? `Vendor payment for ${c.bride_name} & ${c.groom_name}` : 'Vendor payment',
        party: v?.name || 'Vendor', partyId: v?.id, partyType: 'vendor',
        category: pv ? vendorTypeLabel(pv.role) : 'Vendor'
      });
    });
    expenses.forEach(e => {
      all.push({
        id: 'e' + e.id, type: 'expense', date: e.expense_date, amount: Number(e.amount), mode: '—',
        description: e.description, party: e.category, partyId: null, partyType: null, category: e.category
      });
    });
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [payments, vendorPayments, projectVendors, vendors, clients, expenses]);

  const filtered = transactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (vendorFilter !== 'all' && (t.partyType !== 'vendor' || t.partyId !== Number(vendorFilter))) return false;
    if (clientFilter !== 'all' && (t.partyType !== 'client' || t.partyId !== Number(clientFilter))) return false;
    if (fromDate && new Date(t.date) < new Date(fromDate)) return false;
    if (toDate && new Date(t.date) > new Date(toDate)) return false;
    return true;
  });

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6">
      <div className="bg-white rounded-lg border border-stone-200/70 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 pb-5 border-b border-stone-200">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Lumière Wedding Studio</div>
            <h2 className="display text-xl sm:text-2xl text-stone-900 mt-1">Financial Statement</h2>
            <div className="text-xs text-stone-500 mt-1">{fromDate || toDate ? `${fromDate ? fmtDate(fromDate) : 'Beginning'} — ${toDate ? fmtDate(toDate) : 'Today'}` : 'All time'}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPaymentForm(true)} className="text-xs px-3 py-2 border border-stone-200 rounded hover:bg-stone-50">+ Income</button>
            <button onClick={() => setExpenseForm(true)} className="text-xs px-3 py-2 border border-stone-200 rounded hover:bg-stone-50">+ Expense</button>
            <button onClick={() => window.print()} className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-900 flex items-center gap-1">
              <FileText size={12} />Print
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-700 flex items-center gap-1"><ArrowDownLeft size={11} />Income</div>
            <div className="display text-2xl sm:text-3xl text-stone-900 mt-2">{fmtINRshort(totalIncome)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-red-700 flex items-center gap-1"><ArrowUpRight size={11} />Expense</div>
            <div className="display text-2xl sm:text-3xl text-stone-900 mt-2">{fmtINRshort(totalExpense)}</div>
          </div>
          <div className="border-l border-stone-200 pl-4 sm:pl-6">
            <div className="text-[10px] uppercase tracking-[0.25em] text-stone-500">Net</div>
            <div className="display text-2xl sm:text-3xl mt-2" style={{ color: net >= 0 ? '#15803d' : '#b91c1c' }}>{fmtINRshort(net)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-stone-200/70 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3"><Filter size={14} className="text-stone-500" /><div className="text-[10px] uppercase tracking-[0.25em] text-stone-500">Filters</div></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm">
            <option value="all">All transactions</option><option value="income">Income only</option><option value="expense">Expense only</option>
          </select>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm">
            <option value="all">All clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.bride_name} & {c.groom_name}</option>)}
          </select>
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm">
            <option value="all">All vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-stone-200/70 overflow-hidden">
        <div className="hidden md:grid grid-cols-[110px_1fr_180px_120px_140px] gap-4 px-5 py-3 border-b border-stone-200 bg-stone-50/50 text-[10px] uppercase tracking-[0.2em] text-stone-500">
          <div>Date</div><div>Description</div><div>Category</div><div>Mode</div><div className="text-right">Amount</div>
        </div>
        {filtered.length === 0 ? <div className="p-8 text-center text-sm text-stone-500">No transactions match these filters</div> : filtered.map((t, i) => (
          <div key={t.id} className={`px-5 py-3 hover:bg-stone-50/50 ${i !== filtered.length - 1 ? 'border-b border-stone-100' : ''}`}>
            <div className="hidden md:grid grid-cols-[110px_1fr_180px_120px_140px] gap-4 items-center">
              <div className="text-xs text-stone-700">{fmtDate(t.date)}</div>
              <div>
                <div className="text-sm text-stone-900">{t.description}</div>
                {t.partyType && <button onClick={() => t.partyType === 'client' ? openClient(t.partyId) : openVendor(t.partyId)} className="text-xs text-stone-500 hover:text-stone-900 hover:underline">{t.party}</button>}
              </div>
              <div className="text-xs text-stone-600">{t.category}</div>
              <div className="text-xs text-stone-600">{t.mode}</div>
              <div className={`text-sm display text-right ${t.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}>{t.type === 'income' ? '+' : '−'}{fmtINR(t.amount)}</div>
            </div>
            <div className="md:hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-stone-900">{t.description}</div>
                  {t.partyType && <button onClick={() => t.partyType === 'client' ? openClient(t.partyId) : openVendor(t.partyId)} className="text-xs text-stone-500 hover:underline">{t.party}</button>}
                  <div className="text-xs text-stone-500 mt-0.5">{fmtDate(t.date)} · {t.category}</div>
                </div>
                <div className={`text-sm display whitespace-nowrap ${t.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}>{t.type === 'income' ? '+' : '−'}{fmtINRshort(t.amount)}</div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length > 0 && (
          <div className="px-5 py-4 bg-stone-50/50 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="text-xs text-stone-500">{filtered.length} transactions</div>
            <div className="flex gap-4 sm:gap-6 text-sm">
              <span className="text-emerald-700">Income {fmtINR(totalIncome)}</span>
              <span className="text-red-700">Expense {fmtINR(totalExpense)}</span>
              <span className="display" style={{ color: net >= 0 ? '#15803d' : '#b91c1c' }}>Net {fmtINR(net)}</span>
            </div>
          </div>
        )}
      </div>

      <PaymentForm open={paymentForm} onClose={() => setPaymentForm(false)} onSaved={refresh.all} clients={clients} />
      <ExpenseForm open={expenseForm} onClose={() => setExpenseForm(false)} onSaved={refresh.all} />
    </div>
  );
}
