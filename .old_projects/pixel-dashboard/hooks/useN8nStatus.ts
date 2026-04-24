import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useN8nStatus() {
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        // 1. Fetch initial status (latest by ID)
        const fetchStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from('n8n')
                    .select('status')
                    .order('id', { ascending: false })
                    .limit(1);

                if (error) {
                    console.error('Error fetching initial status (details):', error);
                } else if (data && data.length > 0) {
                    setStatus(data[0].status);
                } else {
                    console.warn('No rows found in n8n table. Check RLS policies?');
                }
            } catch (err) {
                console.error('Unexpected error fetching status:', err);
            }
        };

        fetchStatus();

        // 2. Subscribe to real-time changes
        const channel = supabase
            .channel('n8n-status-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to All changes (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'n8n',
                },
                (payload) => {
                    console.log('Real-time update received:', payload);
                    const newData = payload.new as { status: string } | undefined;
                    if (newData && newData.status) {
                        setStatus(newData.status);
                    }
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return status;
}
