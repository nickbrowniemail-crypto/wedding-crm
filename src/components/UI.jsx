import { X } from 'lucide-react';

// ============ MODAL ============
export function Modal({ open, onClose, title, eyebrow, children, footer, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50" onClick={onClose}>
      <div className={`bg-[#FDFBF7] rounded-lg border border-stone-200 ${maxWidth} w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-700">
          <X size={18} />
        </button>
        {eyebrow && <div className="text-xs uppercase tracking-[0.25em] text-stone-500 mb-2">{eyebrow}</div>}
        {title && <h2 className="display text-2xl text-stone-900 mb-6">{title}</h2>}
        {children}
        {footer && <div className="flex gap-3 mt-7">{footer}</div>}
      </div>
    </div>
  );
}

// ============ FIELD ============
export function Field({ label, value, onChange, placeholder, type = 'text', required, options, rows }) {
  const baseCls = "w-full mt-1.5 px-3 py-2 bg-white border border-stone-200 rounded-md text-sm focus:outline-none focus:border-stone-400";
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
        {label}{required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      {type === 'select' ? (
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} className={baseCls}>
          <option value="">— Select —</option>
          {options.map(opt => {
            const v = typeof opt === 'string' ? opt : opt.value;
            const l = typeof opt === 'string' ? opt : opt.label;
            return <option key={v} value={v}>{l}</option>;
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows || 3} className={baseCls} />
      ) : (
        <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={baseCls} />
      )}
    </div>
  );
}

// ============ BUTTONS ============
export function PrimaryButton({ children, onClick, disabled, type = 'button', className = '' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`flex-1 py-2.5 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      style={{ background: '#6B1F2E' }}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick} className={`flex-1 py-2.5 border border-stone-200 rounded-md text-sm hover:bg-stone-50 ${className}`}>
      {children}
    </button>
  );
}

export function DangerButton({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 border border-red-200 text-red-700 rounded-md text-sm hover:bg-red-50 ${className}`}>
      {children}
    </button>
  );
}

// ============ STAT CARD ============
export function StatCard({ label, value, sub, accent, warn }) {
  return (
    <div className={`p-4 sm:p-6 rounded-lg border ${
      accent ? 'bg-[#6B1F2E] text-white border-[#6B1F2E]' :
      warn ? 'bg-red-50 border-red-200' :
      'bg-white border-stone-200/70'
    }`}>
      <div className={`text-[9px] sm:text-[10px] uppercase tracking-[0.25em] ${accent ? 'text-stone-300' : warn ? 'text-red-700' : 'text-stone-500'}`}>{label}</div>
      <div className="display text-2xl sm:text-3xl lg:text-4xl mt-2 sm:mt-3">{value}</div>
      <div className={`text-xs mt-1 sm:mt-2 ${accent ? 'text-stone-300' : warn ? 'text-red-700' : 'text-stone-500'}`}>{sub}</div>
    </div>
  );
}

export function SmallStat({ label, value, color = "text-stone-900" }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-stone-500">{label}</div>
      <div className={`display text-lg sm:text-xl mt-1 ${color}`}>{value}</div>
    </div>
  );
}

// ============ EMPTY STATE ============
export function EmptyState({ icon: Icon, title, sub, action }) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon size={32} className="mx-auto text-stone-300" strokeWidth={1} />}
      <p className="display text-lg text-stone-700 mt-3">{title}</p>
      {sub && <p className="text-sm text-stone-500 mt-1">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============ LOADER ============
export function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-12 text-stone-500 text-sm">
      <div className="animate-pulse">{label}</div>
    </div>
  );
}
