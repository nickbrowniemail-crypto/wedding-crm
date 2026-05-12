import { useState, useMemo, useEffect } from 'react';
import { CheckSquare, Package, AlertCircle } from 'lucide-react';
import { fmtDateShort, daysLeft, taskStatusColor } from '../utils';
import { StatCard, EmptyState, PaginationBar } from '../components/UI';
import { TaskForm, DeliverableForm } from '../components/Forms';
import { usePaginated } from '../dataHooks';

// ─── Helper: is this row assigned to the logged-in user? ─────────────────────
// Checks new assignee_id field first, falls back to legacy assigned_to name match.
function isAssignedToMe(row, profile) {
  if (!profile) return false;
  if (row.assignee_type === 'team' && row.assignee_id) {
    return row.assignee_id === profile.id;
  }
  if (!row.assignee_id && row.assigned_to) {
    return row.assigned_to === profile.full_name;
  }
  return false;
}

// ─── My Work Overview ─────────────────────────────────────────────────────────
export function MyWorkOverview({ data, profile }) {
  const { allTasks: tasks, allDeliverables: deliverables, allClients: clients, members, vendors, refresh } = data;
  const [taskForm, setTaskForm] = useState({ open: false, initial: null });

  const myTasks = useMemo(
    () => tasks.filter(t => isAssignedToMe(t, profile)),
    [tasks, profile]
  );
  const myDeliverables = useMemo(
    () => deliverables.filter(d => isAssignedToMe(d, profile)),
    [deliverables, profile]
  );

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const weekAgo    = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);

  const todayTasks     = myTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) >= todayStart && new Date(t.due_date) <= todayEnd);
  const overdueTasks   = myTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < todayStart);
  const upcomingTasks  = myTasks
    .filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) > todayEnd)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 8);
  const doneThisWeek   = myTasks.filter(t => t.status === 'done' && t.updated_at && new Date(t.updated_at) >= weekAgo);
  const pendingDels    = myDeliverables.filter(d => d.status !== 'done');

  function TaskRow({ t, hoverCls = 'hover:bg-stone-50' }) {
    const client = clients.find(c => c.id === t.client_id);
    return (
      <button
        onClick={() => setTaskForm({ open: true, initial: t })}
        className={`w-full flex items-center justify-between gap-3 px-2 py-2.5 rounded-md text-left transition-colors ${hoverCls}`}
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm text-stone-900 truncate">{t.title}</div>
          <div className="text-xs text-stone-500 mt-0.5">{client ? `${client.bride_name} & ${client.groom_name}` : 'Internal'}</div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider flex-shrink-0 ${taskStatusColor(t.status)}`}>
          {t.status.replace('_', ' ')}
        </span>
      </button>
    );
  }

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-4 sm:py-5 space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Due Today"       value={todayTasks.length}   sub="tasks today"     accent={todayTasks.length > 0} />
        <StatCard label="Overdue"         value={overdueTasks.length} sub="need attention"  warn={overdueTasks.length > 0} />
        <StatCard label="Upcoming"        value={upcomingTasks.length} sub="in the queue" />
        <StatCard label="Done This Week"  value={doneThisWeek.length} sub="completed" />
      </div>

      {/* Today + Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-stone-200/70 p-5">
          <h2 className="display text-lg text-stone-900 mb-4">Today's Tasks</h2>
          {todayTasks.length === 0 ? (
            <div className="text-sm text-stone-400 py-6 text-center">No tasks due today</div>
          ) : (
            <div className="space-y-0.5">
              {todayTasks.map(t => <TaskRow key={t.id} t={t} />)}
            </div>
          )}
        </div>

        <div className={`bg-white rounded-lg border p-5 ${overdueTasks.length > 0 ? 'border-red-200' : 'border-stone-200/70'}`}>
          <div className="flex items-center gap-2 mb-4">
            {overdueTasks.length > 0 && <AlertCircle size={15} className="text-red-500" />}
            <h2 className="display text-lg text-stone-900">Overdue Tasks</h2>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="text-sm text-stone-400 py-6 text-center">All caught up!</div>
          ) : (
            <div className="space-y-0.5">
              {overdueTasks.map(t => {
                const client = clients.find(c => c.id === t.client_id);
                return (
                  <button key={t.id} onClick={() => setTaskForm({ open: true, initial: t })}
                    className="w-full flex items-center justify-between gap-3 px-2 py-2.5 rounded-md hover:bg-red-50/50 text-left transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-stone-900 truncate">{t.title}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{client ? `${client.bride_name} & ${client.groom_name}` : 'Internal'}</div>
                    </div>
                    <span className="text-xs text-red-600 font-medium flex-shrink-0">{Math.abs(daysLeft(t.due_date))}d late</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming tasks */}
      {upcomingTasks.length > 0 && (
        <div className="bg-white rounded-lg border border-stone-200/70 p-5">
          <h2 className="display text-lg text-stone-900 mb-4">Upcoming Tasks</h2>
          <div className="divide-y divide-stone-100">
            {upcomingTasks.map(t => {
              const client = clients.find(c => c.id === t.client_id);
              return (
                <button key={t.id} onClick={() => setTaskForm({ open: true, initial: t })}
                  className="w-full flex items-center justify-between gap-4 py-3 px-2 rounded hover:bg-stone-50 text-left transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-stone-900 truncate">{t.title}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{client ? `${client.bride_name} & ${client.groom_name}` : 'Internal'}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${taskStatusColor(t.status)}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-stone-500 w-14 text-right">{fmtDateShort(t.due_date)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending deliverables */}
      {pendingDels.length > 0 && (
        <div className="bg-white rounded-lg border border-stone-200/70 p-5">
          <h2 className="display text-lg text-stone-900 mb-4">My Pending Deliverables</h2>
          <div className="divide-y divide-stone-100">
            {pendingDels.slice(0, 6).map(d => {
              const client = clients.find(c => c.id === d.client_id);
              return (
                <div key={d.id} className="flex items-center justify-between gap-4 py-3 px-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-stone-900 truncate">{d.item}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{client ? `${client.bride_name} & ${client.groom_name}` : '—'}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${taskStatusColor(d.status)}`}>
                      {(d.status || 'pending').replace('_', ' ')}
                    </span>
                    {d.due_date && <span className="text-xs text-stone-500 w-14 text-right">{fmtDateShort(d.due_date)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {myTasks.length === 0 && myDeliverables.length === 0 && (
        <EmptyState icon={CheckSquare} title="Nothing assigned to you yet" sub="Tasks and deliverables assigned to you will appear here." />
      )}

      <TaskForm open={taskForm.open} onClose={() => setTaskForm({ open: false, initial: null })}
        onSaved={refresh.all} clients={clients} members={members} vendors={vendors} initial={taskForm.initial} />
    </div>
  );
}

// ─── My Work: Tasks ───────────────────────────────────────────────────────────
export function MyWorkTasksView({ data, profile }) {
  const { allTasks: tasks, allClients: clients, members, vendors, refresh, userRole } = data;
  const [filter, setFilter] = useState('active');
  const [taskForm, setTaskForm] = useState({ open: false, initial: null });

  const isAdmin = userRole === 'admin';

  const myTasks = useMemo(
    () => tasks.filter(t => isAssignedToMe(t, profile)),
    [tasks, profile]
  );

  const filtered = useMemo(() => {
    const base = filter === 'active' ? myTasks.filter(t => t.status !== 'done')
               : filter === 'done'   ? myTasks.filter(t => t.status === 'done')
               : myTasks;
    return [...base].sort((a, b) => {
      const aDate = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
      const bDate = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
      return aDate - bDate;
    });
  }, [myTasks, filter]);

  const { page, setPage, pageSize, setPageSize, totalPages, pageItems, total } = usePaginated(filtered, 30);
  useEffect(() => { setPage(1); }, [filter, setPage]);

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-white border border-stone-200/70 rounded-md p-1">
          {[['active', 'Active'], ['done', 'Done'], ['all', 'All']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase tracking-wider ${filter === val ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>
              {lbl}
            </button>
          ))}
        </div>
        <span className="text-sm text-stone-500">{total} task{total !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title={filter === 'active' ? 'All caught up!' : 'No tasks found'} />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-stone-200/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Due</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Task</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pageItems.map(t => {
                    const client = clients.find(c => c.id === t.client_id);
                    const isOverdue = t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date();
                    return (
                      <tr key={t.id} className="hover:bg-stone-50/50 cursor-pointer" onClick={() => setTaskForm({ open: true, initial: t })}>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-stone-900'}`}>
                          {t.due_date ? fmtDateShort(t.due_date) : '—'}
                          {isOverdue && <span className="ml-1.5 text-[10px] text-red-400">overdue</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-900 max-w-[260px] truncate">{t.title}</td>
                        <td className="px-4 py-3 text-sm text-stone-500">
                          {client ? `${client.bride_name} & ${client.groom_name}` : 'Internal'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 rounded-full border text-xs uppercase tracking-wider ${taskStatusColor(t.status)}`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`capitalize ${t.priority === 'high' ? 'text-red-600' : t.priority === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                            {t.priority || 'medium'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <PaginationBar
            page={page} totalPages={totalPages} total={total} setPage={setPage}
            label={`task${total !== 1 ? 's' : ''}`}
            isAdmin={isAdmin} pageSize={pageSize} pageSizeOptions={[20, 30, 50]} setPageSize={setPageSize}
          />
        </>
      )}

      <TaskForm open={taskForm.open} onClose={() => setTaskForm({ open: false, initial: null })}
        onSaved={refresh.all} clients={clients} members={members} vendors={vendors} initial={taskForm.initial} />
    </div>
  );
}

// ─── My Work: Deliverables ────────────────────────────────────────────────────
export function MyWorkDeliverablesView({ data, profile }) {
  const { allDeliverables: deliverables, allClients: clients, members, vendors, refresh, userRole } = data;
  const [filter, setFilter] = useState('active');
  const [delForm, setDelForm] = useState({ open: false, initial: null });

  const isAdmin = userRole === 'admin';

  const myDels = useMemo(
    () => deliverables.filter(d => isAssignedToMe(d, profile)),
    [deliverables, profile]
  );

  const filtered = useMemo(() => {
    const base = filter === 'active' ? myDels.filter(d => d.status !== 'done')
               : filter === 'done'   ? myDels.filter(d => d.status === 'done')
               : myDels;
    return [...base].sort((a, b) => {
      const aDate = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
      const bDate = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
      return aDate - bDate;
    });
  }, [myDels, filter]);

  const { page, setPage, pageSize, setPageSize, totalPages, pageItems, total } = usePaginated(filtered, 30);
  useEffect(() => { setPage(1); }, [filter, setPage]);

  return (
    <div className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-white border border-stone-200/70 rounded-md p-1">
          {[['active', 'Active'], ['done', 'Done'], ['all', 'All']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase tracking-wider ${filter === val ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}>
              {lbl}
            </button>
          ))}
        </div>
        <span className="text-sm text-stone-500">{total} deliverable{total !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title={filter === 'active' ? 'All deliverables done!' : 'No deliverables found'} />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-stone-200/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Due</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pageItems.map(d => {
                    const client = clients.find(c => c.id === d.client_id);
                    const isOverdue = d.status !== 'done' && d.due_date && new Date(d.due_date) < new Date();
                    return (
                      <tr key={d.id} className="hover:bg-stone-50/50 cursor-pointer" onClick={() => setDelForm({ open: true, initial: d })}>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-stone-900'}`}>
                          {d.due_date ? fmtDateShort(d.due_date) : '—'}
                          {isOverdue && <span className="ml-1.5 text-[10px] text-red-400">overdue</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-900 max-w-[260px] truncate">{d.item}</td>
                        <td className="px-4 py-3 text-sm text-stone-500">
                          {client ? `${client.bride_name} & ${client.groom_name}` : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 rounded-full border text-xs uppercase tracking-wider ${taskStatusColor(d.status || 'pending')}`}>
                            {(d.status || 'pending').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`capitalize ${d.priority === 'high' ? 'text-red-600' : d.priority === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                            {d.priority || 'medium'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <PaginationBar
            page={page} totalPages={totalPages} total={total} setPage={setPage}
            label={`deliverable${total !== 1 ? 's' : ''}`}
            isAdmin={isAdmin} pageSize={pageSize} pageSizeOptions={[20, 30, 50]} setPageSize={setPageSize}
          />
        </>
      )}

      <DeliverableForm open={delForm.open} onClose={() => setDelForm({ open: false, initial: null })}
        onSaved={refresh.all} clients={clients} members={members} vendors={vendors} initial={delForm.initial} />
    </div>
  );
}
