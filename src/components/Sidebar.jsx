import { X, Settings } from 'lucide-react';

export default function Sidebar({ navItems, view, onNav, hidden, mobile, onClose }) {

  return (
    <aside className={`${hidden || ''} ${mobile ? 'md:hidden fixed top-0 left-0 bottom-0 z-50' : ''} w-56 lg:w-60 border-r border-stone-200/70 bg-[#FDFBF7] flex flex-col flex-shrink-0`}>
      <div className="px-6 py-5 border-b border-stone-200/70 flex justify-between items-start">
        <div>
          <div className="brand-font text-lg sm:text-xl font-semibold tracking-[0.08em] text-stone-900 leading-none whitespace-nowrap">
            WeddingQueen
          </div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-stone-500 mt-1 font-light">Master Console</div>
        </div>
        {mobile && <button onClick={onClose}><X size={18} className="text-stone-500" /></button>}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = view === item.id ||
            (view === 'clientDetail' && item.id === 'clients') ||
            (view === 'vendorDetail' && item.id === 'vendors');
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                active ? 'bg-[#6B1F2E] text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}>
              <Icon size={16} strokeWidth={1.5} />{item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-200/70 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-stone-600 hover:bg-stone-100">
          <Settings size={16} strokeWidth={1.5} />Settings
        </button>
      </div>
    </aside>
  );
}
