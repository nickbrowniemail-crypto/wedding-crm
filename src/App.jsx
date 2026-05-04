import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Wallet, Briefcase, CheckSquare, Package,
  Menu, ChevronLeft
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { useTable } from './dataHooks';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import {
  DashboardView, ClientsView, ClientDetailView,
  VendorsView, VendorDetailView, TasksView, DeliverablesView, AccountingView
} from './components/Views';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'vendors', label: 'Vendors', icon: Briefcase },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'deliverables', label: 'Deliverables', icon: Package },
  { id: 'accounting', label: 'Accounting', icon: Wallet },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!authReady) return <div className="min-h-screen flex items-center justify-center text-stone-500">Loading…</div>;
  if (!session) return <AuthScreen />;

  return <CRM session={session} />;
}

function CRM({ session }) {
  const [view, setView] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // All data hooks
  const clients = useTable('clients', { orderBy: 'created_at', ascending: false });
  const events = useTable('events', { orderBy: 'event_date', ascending: true });
  const vendors = useTable('vendors', { orderBy: 'name', ascending: true });
  const projectVendors = useTable('project_vendors', { orderBy: 'created_at' });
  const payments = useTable('payments', { orderBy: 'payment_date', ascending: false });
  const vendorPayments = useTable('vendor_payments', { orderBy: 'payment_date', ascending: false });
  const expenses = useTable('expenses', { orderBy: 'expense_date', ascending: false });
  const tasks = useTable('tasks', { orderBy: 'due_date', ascending: true });
  const deliverables = useTable('deliverables', { orderBy: 'due_date', ascending: true });
  const activity = useTable('activity_log', { orderBy: 'created_at', ascending: false });

  const refreshAll = () => {
    clients.refresh(); events.refresh(); vendors.refresh(); projectVendors.refresh();
    payments.refresh(); vendorPayments.refresh(); expenses.refresh();
    tasks.refresh(); deliverables.refresh(); activity.refresh();
  };

  const data = {
    clients: clients.rows,
    events: events.rows,
    vendors: vendors.rows,
    projectVendors: projectVendors.rows,
    payments: payments.rows,
    vendorPayments: vendorPayments.rows,
    expenses: expenses.rows,
    tasks: tasks.rows,
    deliverables: deliverables.rows,
    activity: activity.rows,
    loading: clients.loading || vendors.loading,
    refresh: {
      all: refreshAll,
      clients: clients.refresh,
      events: events.refresh,
      vendors: vendors.refresh,
      projectVendors: projectVendors.refresh,
      payments: payments.refresh,
      vendorPayments: vendorPayments.refresh,
      expenses: expenses.refresh,
      tasks: tasks.refresh,
      deliverables: deliverables.refresh,
      activity: activity.refresh,
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
      <Sidebar navItems={navItems} view={view} onNav={navigateTo} hidden="hidden md:flex" userEmail={session.user?.email} />
      {sidebarOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-stone-900/40 z-40" onClick={() => setSidebarOpen(false)} />
          <Sidebar navItems={navItems} view={view} onNav={(v) => { navigateTo(v); setSidebarOpen(false); }} mobile onClose={() => setSidebarOpen(false)} userEmail={session.user?.email} />
        </>
      )}

      <main className="flex-1 overflow-auto min-w-0">
        <Header
          view={view} clients={data.clients} vendors={data.vendors}
          selectedClientId={selectedClientId} selectedVendorId={selectedVendorId}
          onMenuClick={() => setSidebarOpen(true)}
          onBack={() => navigateTo(view === 'clientDetail' ? 'clients' : 'vendors')}
        />

        {view === 'dashboard' && <DashboardView data={data} openClient={openClient} openVendor={openVendor} />}
        {view === 'clients' && <ClientsView data={data} openClient={openClient} />}
        {view === 'clientDetail' && <ClientDetailView data={data} clientId={selectedClientId} openVendor={openVendor} />}
        {view === 'vendors' && <VendorsView data={data} openVendor={openVendor} />}
        {view === 'vendorDetail' && <VendorDetailView data={data} vendorId={selectedVendorId} openClient={openClient} />}
        {view === 'tasks' && <TasksView data={data} openClient={openClient} />}
        {view === 'deliverables' && <DeliverablesView data={data} openClient={openClient} />}
        {view === 'accounting' && <AccountingView data={data} openClient={openClient} openVendor={openVendor} />}
      </main>
    </div>
  );
}

function Header({ view, clients, vendors, selectedClientId, selectedVendorId, onMenuClick, onBack }) {
  let eyebrow = '', title = '';
  if (view === 'dashboard') { eyebrow = 'Overview'; title = 'Good morning, Studio'; }
  else if (view === 'clients') { eyebrow = 'Couples & Projects'; title = 'All Clients'; }
  else if (view === 'clientDetail') {
    const c = clients.find(x => x.id === selectedClientId);
    eyebrow = 'Project'; title = c ? `${c.bride_name} & ${c.groom_name}` : 'Client';
  }
  else if (view === 'vendors') { eyebrow = 'External Team'; title = 'Vendors'; }
  else if (view === 'vendorDetail') {
    const v = vendors.find(x => x.id === selectedVendorId);
    eyebrow = 'Vendor'; title = v?.name || 'Vendor';
  }
  else if (view === 'tasks') { eyebrow = 'Work'; title = 'Tasks'; }
  else if (view === 'deliverables') { eyebrow = 'Output'; title = 'Deliverables'; }
  else if (view === 'accounting') { eyebrow = 'Finance'; title = 'Accounting'; }

  const isDetail = view === 'clientDetail' || view === 'vendorDetail';

  return (
    <header className="px-5 sm:px-8 lg:px-10 py-5 sm:py-7 flex items-center justify-between border-b border-stone-200/70 gap-3 bg-[#FDFBF7]">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="md:hidden text-stone-700 flex-shrink-0">
          <Menu size={20} />
        </button>
        {isDetail && (
          <button onClick={onBack} className="flex items-center gap-1 text-xs uppercase tracking-wider text-stone-500 hover:text-stone-900 mr-2 flex-shrink-0">
            <ChevronLeft size={14} />Back
          </button>
        )}
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-stone-500 mb-0.5 sm:mb-1">{eyebrow}</div>
          <h1 className="display text-xl sm:text-2xl lg:text-3xl text-stone-900 truncate">{title}</h1>
        </div>
      </div>
    </header>
  );
}
