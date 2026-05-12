// Formatting helpers
export const fmtINR = (n) => '₹' + Math.abs(Number(n) || 0).toLocaleString('en-IN');
export const fmtINRshort = (n) => {
  const v = Math.abs(Number(n) || 0);
  return v >= 100000 ? '₹' + (v / 100000).toFixed(1) + 'L' : '₹' + v.toLocaleString('en-IN');
};
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
export const fmtDateLong = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const daysLeft = (d) => Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));

// Color tokens
export const statusColor = (s) => ({
  'Lead': 'bg-amber-50 text-amber-800 border-amber-200',
  'Booked': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Shoot Done': 'bg-blue-50 text-blue-800 border-blue-200',
  'Editing': 'bg-purple-50 text-purple-800 border-purple-200',
  'Delivered': 'bg-stone-100 text-stone-700 border-stone-300',
}[s] || 'bg-stone-100 text-stone-700 border-stone-300');

export const taskStatusColor = (s) => ({
  'pending': 'bg-amber-50 text-amber-800 border-amber-200',
  'in_progress': 'bg-blue-50 text-blue-800 border-blue-200',
  'done': 'bg-emerald-50 text-emerald-800 border-emerald-200',
}[s] || 'bg-stone-100 text-stone-700 border-stone-300');

export const vendorTypeLabel = (t) => ({
  photographer: 'Photographer',
  cinematic_editor: 'Cinematic Editor',
  traditional_editor: 'Traditional Editor',
  album_printer: 'Album Printer',
  other: 'Other',
}[t] || t);

// Constants
export const VENDOR_TYPES = [
  { value: 'photographer', label: 'Photographer' },
  { value: 'cinematic_editor', label: 'Cinematic Editor' },
  { value: 'traditional_editor', label: 'Traditional Editor' },
  { value: 'album_printer', label: 'Album Printer' },
  { value: 'other', label: 'Other' },
];

export const EVENT_TYPES = [
  'Pre-wedding', 'Engagement', 'Roka', 'Wedding', 'Reception',
  'Haldi (Combined)', 'Haldi - Groom', 'Haldi - Bride',
  'Mehndi (Combined)', 'Mehndi - Groom', 'Mehndi - Bride',
  'Sangeet (Combined)', 'Sangeet - Groom', 'Sangeet - Bride',
  'Other',
];

export const CREW_FIELDS = [
  { key: 'crew_still',       label: 'Still'       },
  { key: 'crew_video',       label: 'Video'       },
  { key: 'crew_still_video', label: 'Still/Video' },
  { key: 'crew_candid',      label: 'Candid'      },
  { key: 'crew_cine',        label: 'Cine'        },
  { key: 'crew_drone',       label: 'Drone'       },
  { key: 'crew_standee',     label: 'Standee'     },
];

export const CREW_DEFAULT = {
  crew_still: 0, crew_video: 0, crew_still_video: 0,
  crew_candid: 0, crew_cine: 0, crew_drone: 0, crew_standee: 0,
};

export const CLIENT_STATUSES = ['Lead', 'Booked', 'Shoot Done', 'Editing', 'Delivered'];
export const TASK_STATUSES = ['pending', 'in_progress', 'done'];
export const PRIORITIES = ['low', 'medium', 'high'];
export const PACKAGES = ['Silver', 'Gold', 'Platinum', 'Bespoke'];
export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];
export const PAYMENT_TYPES = ['Advance', 'Token', 'Other'];
export const EXPENSE_CATEGORIES = ['Salary', 'Rent', 'Utilities', 'Equipment', 'Marketing', 'Other'];
