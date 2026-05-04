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
