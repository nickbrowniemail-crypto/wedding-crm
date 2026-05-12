import { useState, useMemo } from 'react';
import {
  LayoutDashboard, Users, Wallet, Briefcase, CheckSquare, Package,
  Menu, ChevronLeft, Calendar, LifeBuoy, LogOut, UserCog, ClipboardList, LayoutGrid
} from 'lucide-react';
import { useTable } from './dataHooks';
import { useAuth } from './auth/AuthContext';
import { canAccess, resolveRole, DEFAULT_VIEW, roleLabel } from './permissions';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import TeamMembersView from './components/TeamMembersView';
import { MyWorkOverview, MyWorkTasksView, MyWorkDeliverablesView } from './pages/MyWorkView';
import {
  DashboardView, ScheduleView, ClientsView, ClientDetailView,
  VendorsView, VendorDetailView, TasksView, DeliverablesView, AccountingView,
  SupportTicketsView
} from './components/Views';

const ALL_NAV_ITEMS = [
  { id: 'dashboard',            label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'mywork',               label: 'My Work Overview',  icon: LayoutGrid },
  { id: 'myworkTasks',          label: 'My Tasks',          icon: CheckSquare },
  { id: 'myworkDeliverables',   label: 'My Deliverables',   icon: Package },
  { id: 'schedule',             label: 'Schedule',          icon: Calendar },
  { id: 'clients',              label: 'Clients',           icon: Users },
  { id: 'vendors',              label: 'Vendors',           icon: Briefcase },
  { id: 'tasks',                label: 'Tasks',             icon: CheckSquare },
  { id: 'support',              label: 'Support Tickets',   icon: LifeBuoy },
  { id: 'deliverables',         label: 'Deliverables',      icon: Package },
  { id: 'accounting',           label: 'Accounting',        icon: Wallet },
  { id: 'team',                 label: 'Team Members',      icon: UserCog },
];

export default function App() {
  const { user, profile, loading, logout, session } = useAuth();

  if (loading) return <AppLoader />;
  if (!user) return <LoginPage />;
  return <CRM user={user} profile={profile} session={session} logout={logout} />;
}

function AppLoader() {
  return (
    <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center">
      <div className="text-center">
        <div className="brand-font text-xl font-semibold tracking-[0.1em] text-stone-900 mb-2 leading-none">
          WeddingQueen
        </div>
        <div className="text-[9px] uppercase tracking-[0.4em] text-stone-500 font-light animate-pulse">
          Loading
        </div>
      </div>
    </div>
  );
}

function CRM({ user, profile, session, logout }) {
  const [view, setView] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = resolveRole(profile?.role);

  // PM filter persists across navigation; RM/admin visibility is automatic
  const [pmFilter, setPmFilter] = useState('my'); // 'my' | 'all' | 'others'

  // Only show nav items this role can access
  const navItems = ALL_NAV_ITEMS.filter(item => canAccess(role, item.id));

  // Guard: redirect to role's default view if current view is forbidden
  const defaultView = DEFAULT_VIEW[role] ?? 'tasks';
  const safeView    = canAccess(role, view) ? view : defaultView;

  const members      = useTable('profiles',      { orderBy: 'full_name',    ascending: true });
  const clients      = useTable('clients',       {
    orderBy:  'created_at',
    ascending: false,
    select:   '*, project_manager:profiles!project_manager_id(id,full_name,email,role), relationship_manager:profiles!relationship_manager_id(id,full_name,email,role)',
  });
  const events       = useTable('events',        { orderBy: 'event_date',   ascending: true });
  const vendors      = useTable('vendors',       { orderBy: 'name',         ascending: true });
  const projectVendors = useTable('project_vendors', { orderBy: 'created_at' });
  const payments     = useTable('payments',      { orderBy: 'payment_date', ascending: false });
  const vendorPayments = useTable('vendor_payments', { orderBy: 'payment_date', ascending: false });
  const expenses     = useTable('expenses',      { orderBy: 'expense_date', ascending: false });
  const tasks        = useTable('tasks',         { orderBy: 'due_date',     ascending: true });
  const deliverables = useTable('deliverables',  { orderBy: 'due_date',     ascending: true });
  const activity     = useTable('activity_log',  { orderBy: 'created_at',   ascending: false });

  // Clients visible to the current user based on role + PM filter
  const visibleClients = useMemo(() => {
    if (!profile) return clients.rows;
    const uid = profile.id;
    if (role === 'relationship_manager') {
      return clients.rows.filter(c => c.relationship_manager_id === uid);
    }
    if (role === 'project_manager') {
      if (pmFilter === 'my')     return clients.rows.filter(c => c.project_manager_id === uid);
      if (pmFilter === 'others') return clients.rows.filter(c => c.project_manager_id !== uid);
      return clients.rows; // 'all'
    }
    return clients.rows; // admin, production_coordinator, editor see everything
  }, [clients.rows, profile, role, pmFilter]);

  const visibleClientIds = useMemo(
    () => new Set(visibleClients.map(c => c.id)),
    [visibleClients]
  );

  const visibleEvents = useMemo(
    () => events.rows.filter(e => visibleClientIds.has(e.client_id)),
    [events.rows, visibleClientIds]
  );

  // Internal tasks (null client_id) always visible; project tasks filtered by scope
  const visibleTasks = useMemo(
    () => tasks.rows.filter(t => !t.client_id || visibleClientIds.has(t.client_id)),
    [tasks.rows, visibleClientIds]
  );

  const visibleDeliverables = useMemo(
    () => deliverables.rows.filter(d => visibleClientIds.has(d.client_id)),
    [deliverables.rows, visibleClientIds]
  );

  const refreshAll = () => {
    members.refresh(); clients.refresh(); events.refresh(); vendors.refresh(); projectVendors.refresh();
    payments.refresh(); vendorPayments.refresh(); expenses.refresh();
    tasks.refresh(); deliverables.refresh(); activity.refresh();
  };

  const data = {
    members:         members.rows,
    // Project-scoped (filtered by role/pmFilter)
    clients:         visibleClients,
    events:          visibleEvents,
    tasks:           visibleTasks,
    deliverables:    visibleDeliverables,
    // Unfiltered — used by My Work personal views
    allClients:      clients.rows,
    allTasks:        tasks.rows,
    allDeliverables: deliverables.rows,
    // Unscoped data
    vendors:         vendors.rows,
    projectVendors:  projectVendors.rows,
    payments:        payments.rows,
    vendorPayments:  vendorPayments.rows,
    expenses:        expenses.rows,
    activity:        activity.rows,
    // Filter controls
    pmFilter,
    setPmFilter,
    userRole: role,
    userId:   profile?.id,
    loading:  clients.loading || vendors.loading,
    refresh: {
      all:            refreshAll,
      members:        members.refresh,
      clients:        clients.refresh,
      events:         events.refresh,
      vendors:        vendors.refresh,
      projectVendors: projectVendors.refresh,
      payments:       payments.refresh,
      vendorPayments: vendorPayments.refresh,
      expenses:       expenses.refresh,
      tasks:          tasks.refresh,
      deliverables:   deliverables.refresh,
      activity:       activity.refresh,
    }
  };

  const navigateTo = (newView) => {
    setView(newView);
    setSelectedClientId(null);
    setSelectedVendorId(null);
  };

  const openClient = (id) => { setView('clientDetail'); setSelectedClientId(id); };
  const openVendor = (id) => { setView('vendorDetail'); setSelectedVendorId(id); };

  return (
    <div className="h-screen w-full flex overflow-hidden">
      <Sidebar navItems={navItems} view={safeView} onNav={navigateTo} hidden="hidden md:flex" />
      {sidebarOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-stone-900/40 z-40" onClick={() => setSidebarOpen(false)} />
          <Sidebar
            navItems={navItems} view={safeView}
            onNav={(v) => { navigateTo(v); setSidebarOpen(false); }}
            mobile onClose={() => setSidebarOpen(false)}
          />
        </>
      )}

      <main className="flex-1 overflow-auto min-w-0">
        <Header
          view={safeView} clients={data.clients} vendors={data.vendors}
          selectedClientId={selectedClientId} selectedVendorId={selectedVendorId}
          onMenuClick={() => setSidebarOpen(true)}
          onBack={() => navigateTo(safeView === 'clientDetail' ? 'clients' : 'vendors')}
          user={user} profile={profile} onLogout={logout}
        />

        {safeView === 'dashboard'          && <DashboardView data={data} openClient={openClient} openVendor={openVendor} navigateTo={navigateTo} />}
        {safeView === 'mywork'             && <MyWorkOverview data={data} profile={profile} />}
        {safeView === 'myworkTasks'        && <MyWorkTasksView data={data} profile={profile} />}
        {safeView === 'myworkDeliverables' && <MyWorkDeliverablesView data={data} profile={profile} />}
        {safeView === 'clients'            && <ClientsView data={data} openClient={openClient} />}
        {safeView === 'schedule'           && <ScheduleView data={data} openClient={openClient} openVendor={openVendor} />}
        {safeView === 'clientDetail'       && <ClientDetailView data={data} clientId={selectedClientId} openVendor={openVendor} />}
        {safeView === 'vendors'            && <VendorsView data={data} openVendor={openVendor} />}
        {safeView === 'vendorDetail'       && <VendorDetailView data={data} vendorId={selectedVendorId} openClient={openClient} />}
        {safeView === 'tasks'              && <TasksView data={data} openClient={openClient} />}
        {safeView === 'support'            && <SupportTicketsView data={data} openClient={openClient} />}
        {safeView === 'deliverables'       && <DeliverablesView data={data} openClient={openClient} />}
        {safeView === 'accounting'         && <AccountingView data={data} openClient={openClient} openVendor={openVendor} />}
        {safeView === 'team'               && canAccess(role, 'team') && <TeamMembersView />}
      </main>
    </div>
  );
}

function Header({ view, clients, vendors, selectedClientId, selectedVendorId, onMenuClick, onBack, user, profile, onLogout }) {
  let eyebrow = '', title = '';
  if (view === 'dashboard')          { eyebrow = 'Overview';         title = 'Good morning, Studio'; }
  else if (view === 'mywork')             { eyebrow = 'My Work';          title = 'Overview'; }
  else if (view === 'myworkTasks')        { eyebrow = 'My Work';          title = 'My Tasks'; }
  else if (view === 'myworkDeliverables') { eyebrow = 'My Work';          title = 'My Deliverables'; }
  else if (view === 'clients')       { eyebrow = 'Couples & Projects'; title = 'All Clients'; }
  else if (view === 'clientDetail')  {
    const c = clients.find(x => x.id === selectedClientId);
    eyebrow = 'Project'; title = c ? `${c.bride_name} & ${c.groom_name}` : 'Client';
  }
  else if (view === 'vendors')       { eyebrow = 'External Team';     title = 'Vendors'; }
  else if (view === 'vendorDetail')  {
    const v = vendors.find(x => x.id === selectedVendorId);
    eyebrow = 'Vendor'; title = v?.name || 'Vendor';
  }
  else if (view === 'tasks')         { eyebrow = 'Work';              title = 'Tasks'; }
  else if (view === 'support')       { eyebrow = 'Client Relations';  title = 'Support Tickets'; }
  else if (view === 'deliverables')  { eyebrow = 'Output';            title = 'Deliverables'; }
  else if (view === 'schedule')      { eyebrow = 'Schedule';          title = 'Event Calendar'; }
  else if (view === 'accounting')    { eyebrow = 'Finance';           title = 'Accounting'; }
  else if (view === 'team')          { eyebrow = 'Administration';    title = 'Team Members'; }

  const isDetail    = view === 'clientDetail' || view === 'vendorDetail';
  const isDashboard = view === 'dashboard';

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials    = displayName.slice(0, 2).toUpperCase();

  return (
    <header className={`px-5 sm:px-8 lg:px-10 ${isDashboard ? 'py-3 sm:py-4' : 'py-5 sm:py-7'} flex items-center justify-between border-b border-stone-200/70 gap-3 bg-[#FDFBF7]`}>
      {/* Left: context */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="md:hidden text-stone-700 flex-shrink-0">
          <Menu size={20} />
        </button>
        <div className="md:hidden min-w-0">
          <div className="brand-font text-base font-semibold tracking-[0.08em] text-stone-900 leading-none whitespace-nowrap">
            WeddingQueen
          </div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-stone-500 mt-0.5 font-light">Master Console</div>
        </div>
        {isDetail && (
          <button onClick={onBack} className="flex items-center gap-1 text-xs uppercase tracking-wider text-stone-500 hover:text-stone-900 mr-2 flex-shrink-0">
            <ChevronLeft size={14} />Back
          </button>
        )}
        <div className="min-w-0">
          {isDashboard ? (
            <h1 className="luxury-heading text-2xl sm:text-3xl font-light tracking-[0.04em] text-stone-900 leading-tight">Welcome Buddy</h1>
          ) : (
            <>
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-stone-500 mb-0.5 sm:mb-1">{eyebrow}</div>
              <h1 className="display text-xl sm:text-2xl lg:text-3xl text-stone-900 truncate">{title}</h1>
            </>
          )}
        </div>
      </div>

      {/* Right: user + logout */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full bg-[#6B1F2E] flex items-center justify-center text-white text-[11px] font-semibold tracking-wide flex-shrink-0"
            title={user?.email}
          >
            {initials}
          </div>
          <div className="hidden lg:block">
            <div className="text-xs text-stone-700 font-medium leading-none truncate max-w-[140px]">{displayName}</div>
            {profile?.role && (
              <div className="text-[10px] text-stone-400 mt-0.5">{roleLabel(profile.role)}</div>
            )}
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 hover:bg-stone-100 px-2.5 py-1.5 rounded-md transition-colors"
        >
          <LogOut size={13} strokeWidth={1.5} />
          <span className="hidden sm:block">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
