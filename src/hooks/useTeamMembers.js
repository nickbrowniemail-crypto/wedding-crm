import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export function useTeamMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setMembers(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function updateMember(id, updates) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(error.message);
    await fetchMembers();
  }

  async function createMember({ email, password, full_name, role }, accessToken) {
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ email, password, full_name, role }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create member');
    await fetchMembers();
    return data;
  }

  return { members, loading, error, refresh: fetchMembers, updateMember, createMember };
}
