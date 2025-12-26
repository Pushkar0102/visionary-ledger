import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = async (
    action: string,
    tableName: string,
    recordId?: string,
    oldData?: Record<string, unknown>,
    newData?: Record<string, unknown>
  ) => {
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user?.id,
        user_email: user?.email,
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData as any,
        new_data: newData as any,
      }]);
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  return { logAction };
}