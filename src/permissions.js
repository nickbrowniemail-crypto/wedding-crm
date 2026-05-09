// ─── Role catalogue ──────────────────────────────────────────────────────────
// value = DB slug  |  label = display name shown in UI
export const ROLES = [
  { value: 'admin',                  label: 'Admin' },
  { value: 'project_manager',        label: 'Project Manager' },
  { value: 'relationship_manager',   label: 'Relationship Manager' },
  { value: 'production_coordinator', label: 'Production Coordinator' },
  { value: 'editor',                 label: 'Editor' },
];

// Slugs that existed before this update — mapped to nearest equivalent
const LEGACY_MAP = {
  manager: 'project_manager',
  staff:   'production_coordinator',
};

// Views each role is permitted to access
// clientDetail / vendorDetail inherit from 'clients' / 'vendors' (see canAccess)
const ALLOWED_VIEWS = {
  admin:                  ['dashboard','schedule','clients','vendors','tasks','support','deliverables','accounting','team'],
  project_manager:        ['dashboard','schedule','clients','vendors','tasks','support','deliverables','accounting'],
  relationship_manager:   ['dashboard','schedule','clients','vendors','tasks','support','deliverables','accounting'],
  production_coordinator: ['dashboard','schedule','clients','vendors','tasks','support','deliverables'],
  editor:                 ['tasks','deliverables'],
};

// First view to land on after login per role
export const DEFAULT_VIEW = {
  admin:                  'dashboard',
  project_manager:        'dashboard',
  relationship_manager:   'dashboard',
  production_coordinator: 'dashboard',
  editor:                 'tasks',
};

// Resolve any stored slug (including legacy) to a canonical role
export function resolveRole(role) {
  if (ALLOWED_VIEWS[role])  return role;
  if (LEGACY_MAP[role])     return LEGACY_MAP[role];
  return 'editor'; // safe fallback for unknown roles
}

// Can a given role access a view?
export function canAccess(role, view) {
  const r = resolveRole(role);
  if (view === 'clientDetail') return ALLOWED_VIEWS[r].includes('clients');
  if (view === 'vendorDetail') return ALLOWED_VIEWS[r].includes('vendors');
  return ALLOWED_VIEWS[r].includes(view);
}

// All top-level views visible in the sidebar for a role
export function allowedViews(role) {
  return ALLOWED_VIEWS[resolveRole(role)] ?? ALLOWED_VIEWS.editor;
}

// Human-readable label for a stored role slug
export function roleLabel(slug) {
  return ROLES.find(r => r.value === slug)?.label
    ?? LEGACY_MAP[slug]?.replace(/_/g, ' ')   // graceful legacy fallback
    ?? (slug ? slug.replace(/_/g, ' ') : '—');
}
