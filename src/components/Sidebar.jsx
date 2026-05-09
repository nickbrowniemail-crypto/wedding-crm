import { useState, useEffect } from 'react';
import {
  X, Settings, ChevronRight,
  LayoutDashboard, Users, Wallet, Briefcase, CheckSquare,
  Package, Calendar, LifeBuoy, UserCog, Folder, ClipboardList, LayoutGrid,
} from 'lucide-react';

const PROJECT_CHILDREN = ['clients', 'schedule', 'tasks', 'deliverables'];
const MYWORK_CHILDREN  = ['mywork', 'myworkTasks', 'myworkDeliverables'];

const ITEM_META = {
  dashboard:            { label: 'Dashboard',       icon: LayoutDashboard },
  // My Work sub-items
  mywork:               { label: 'Overview',         icon: LayoutGrid },
  myworkTasks:          { label: 'Tasks',            icon: CheckSquare },
  myworkDeliverables:   { label: 'Deliverables',     icon: Package },
  // Projects sub-items
  clients:              { label: 'Clients',          icon: Users },
  schedule:             { label: 'Schedule',         icon: Calendar },
  tasks:                { label: 'Tasks',            icon: CheckSquare },
  deliverables:         { label: 'Deliverables',     icon: Package },
  // Standalone
  support:              { label: 'Support Tickets',  icon: LifeBuoy },
  vendors:              { label: 'Vendors',          icon: Briefcase },
  accounting:           { label: 'Accounting',       icon: Wallet },
  team:                 { label: 'Team Members',     icon: UserCog },
};

export default function Sidebar({ navItems, view, onNav, hidden, mobile, onClose }) {
  const accessible = new Set(navItems.map(n => n.id));

  const isInMyWork   = MYWORK_CHILDREN.includes(view);
  const isInProjects = PROJECT_CHILDREN.includes(view) || view === 'clientDetail';

  const [myworkOpen,   setMyworkOpen]   = useState(isInMyWork);
  const [projectsOpen, setProjectsOpen] = useState(isInProjects);

  useEffect(() => { if (isInMyWork)   setMyworkOpen(true);   }, [isInMyWork]);
  useEffect(() => { if (isInProjects) setProjectsOpen(true); }, [isInProjects]);

  const myworkChildren  = MYWORK_CHILDREN.filter(id => accessible.has(id));
  const projectChildren = PROJECT_CHILDREN.filter(id => accessible.has(id));

  function handleMyWorkClick() {
    if (isInMyWork) return;
    if (myworkOpen) {
      setMyworkOpen(false);
    } else {
      setMyworkOpen(true);
      if (myworkChildren.length > 0) onNav(myworkChildren[0]);
    }
  }

  function handleProjectsClick() {
    if (isInProjects) return;
    if (projectsOpen) {
      setProjectsOpen(false);
    } else {
      setProjectsOpen(true);
      if (projectChildren.length > 0) onNav(projectChildren[0]);
    }
  }

  function navBtn(id, indent = false) {
    if (!accessible.has(id)) return null;
    const meta = ITEM_META[id];
    if (!meta) return null;
    const Icon = meta.icon;
    const active =
      view === id ||
      (view === 'clientDetail' && id === 'clients') ||
      (view === 'vendorDetail' && id === 'vendors');

    return (
      <button
        key={id}
        onClick={() => onNav(id)}
        className={`w-full flex items-center gap-3 rounded-md text-sm transition-all
          ${indent ? 'pl-9 pr-3 py-2' : 'px-3 py-2.5'}
          ${active ? 'bg-[#6B1F2E] text-white' : 'text-stone-600 hover:bg-stone-100'}`}
      >
        <Icon size={15} strokeWidth={1.5} />
        {meta.label}
      </button>
    );
  }

  function GroupHeader({ label, icon: Icon, isActive, isOpen, onClick }) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all
          ${isActive ? 'text-stone-900 font-medium' : 'text-stone-600 hover:bg-stone-100'}`}
      >
        <Icon size={15} strokeWidth={1.5} className={isActive ? 'text-[#6B1F2E]' : ''} />
        <span className="flex-1 text-left">{label}</span>
        <ChevronRight
          size={13}
          className={`text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
    );
  }

  return (
    <aside className={`${hidden || ''} ${mobile ? 'md:hidden fixed top-0 left-0 bottom-0 z-50' : ''} w-56 lg:w-60 border-r border-stone-200/70 bg-[#FDFBF7] flex flex-col flex-shrink-0`}>

      {/* Brand header */}
      <div className="px-6 py-5 border-b border-stone-200/70 flex justify-between items-start">
        <div>
          <div className="brand-font text-lg sm:text-xl font-semibold tracking-[0.08em] text-stone-900 leading-none whitespace-nowrap">
            WeddingQueen
          </div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-stone-500 mt-1 font-light">Master Console</div>
        </div>
        {mobile && <button onClick={onClose}><X size={18} className="text-stone-500" /></button>}
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">

        {/* Dashboard */}
        {navBtn('dashboard')}

        {/* My Work group */}
        {myworkChildren.length > 0 && (
          <div>
            <GroupHeader
              label="My Work"
              icon={ClipboardList}
              isActive={isInMyWork}
              isOpen={myworkOpen}
              onClick={handleMyWorkClick}
            />
            {myworkOpen && (
              <div className="mt-0.5 space-y-0.5">
                {myworkChildren.map(id => navBtn(id, true))}
              </div>
            )}
          </div>
        )}

        {/* Projects group */}
        {projectChildren.length > 0 && (
          <div>
            <GroupHeader
              label="Projects"
              icon={Folder}
              isActive={isInProjects}
              isOpen={projectsOpen}
              onClick={handleProjectsClick}
            />
            {projectsOpen && (
              <div className="mt-0.5 space-y-0.5">
                {projectChildren.map(id => navBtn(id, true))}
              </div>
            )}
          </div>
        )}

        {/* Standalone items */}
        {navBtn('support')}
        {navBtn('vendors')}
        {navBtn('accounting')}

      </nav>

      {/* Bottom: Team Members + Settings */}
      <div className="p-4 border-t border-stone-200/70 space-y-0.5">
        {navBtn('team')}
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-stone-600 hover:bg-stone-100">
          <Settings size={15} strokeWidth={1.5} />Settings
        </button>
      </div>

    </aside>
  );
}
