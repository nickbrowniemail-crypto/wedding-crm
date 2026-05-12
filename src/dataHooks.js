import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

// Generic hook to fetch a table
export function useTable(table, { select = '*', orderBy, ascending = false, deps = [] } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = supabase.from(table).select(select);
    if (orderBy) q = q.order(orderBy, { ascending });
    const { data, error } = await q;
    if (error) console.error(`Error loading ${table}:`, error);
    setRows(data || []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, select, orderBy, ascending, ...deps]);

  useEffect(() => { refresh(); }, [refresh]);

  return { rows, loading, refresh, setRows };
}

const CLIENT_SELECT = '*, project_manager:profiles!project_manager_id(id,full_name,email,role), relationship_manager:profiles!relationship_manager_id(id,full_name,email,role)';

// Paginated clients hook — applies role filter, search, and date-based ID filter at DB level
export function useClientsPaged({ page = 1, limit = 10, search = '', dateIds = null, role, uid, pmFilter }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Serialize Set deps to strings for stable comparison
  const dateKey = dateIds != null ? [...dateIds].sort().join(',') : '';

  useEffect(() => {
    if (dateIds !== null && dateIds.size === 0) {
      setRows([]); setTotal(0); setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const offset = (page - 1) * limit;

      let q = supabase
        .from('clients')
        .select(CLIENT_SELECT, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (role === 'relationship_manager' && uid) {
        q = q.eq('relationship_manager_id', uid);
      } else if (role === 'project_manager' && uid) {
        if (pmFilter === 'my')     q = q.eq('project_manager_id', uid);
        else if (pmFilter === 'others') q = q.neq('project_manager_id', uid);
      }

      if (search.trim()) {
        const s = search.trim();
        q = q.or(`bride_name.ilike.%${s}%,groom_name.ilike.%${s}%,city.ilike.%${s}%`);
      }

      if (dateIds !== null) {
        q = q.in('id', [...dateIds]);
      }

      const { data, error, count } = await q;
      if (!cancelled) {
        if (error) console.error('Error fetching clients page:', error);
        setRows(data || []);
        setTotal(count || 0);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, dateKey, role, uid, pmFilter, tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);
  return { rows, total, loading, refresh };
}

// Client-side pagination over an already-filtered array
export function usePaginated(items, defaultPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const pageItems  = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  const setPageSize = useCallback((size) => { setPageSizeRaw(size); setPage(1); }, []);

  return { page: safePage, setPage, pageSize, setPageSize, totalPages, pageItems, total: items.length };
}

// CRUD helpers
export async function insertRow(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) { console.error(error); throw error; }
  return data;
}

export async function updateRow(table, id, payload) {
  const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
  if (error) { console.error(error); throw error; }
  return data;
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) { console.error(error); throw error; }
  return true;
}
