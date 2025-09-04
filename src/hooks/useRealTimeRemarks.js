import { useState, useEffect } from 'react';
import { supabase } from '../config/db.config.js';

export function useRealTimeRemarks(ticketId) {
  const [remarks, setRemarks] = useState([]);

  useEffect(() => {
    // Function to fetch initial remarks
    async function fetchRemarks() {
      const { data, error } = await supabase
        .from('remark_per_ticket')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('id', { ascending: true });
      if (!error && data) {
        setRemarks(data);
      }
    }

    // Fetch initial remarks
    fetchRemarks();

    // Subscribe to real-time changes on remark_per_ticket for this ticketId
    const subscription = supabase
      .from(`remark_per_ticket:ticket_id=eq.${ticketId}`)
      .on('*', payload => {
        console.log("Real-time payload:", payload);
        // Re-fetch remarks whenever a change occurs
        fetchRemarks();
      })
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [ticketId]);

  return remarks;
}
