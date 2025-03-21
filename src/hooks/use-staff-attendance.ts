
import { useState, useEffect } from 'react';
import { getStaffAttendance, recordAttendance, StaffAttendance } from '@/lib/attendance';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface UseStaffAttendanceProps {
  staffId: number | null;
  month?: number;
  year?: number;
}

interface UseStaffAttendanceReturn {
  attendanceData: any[];
  loading: boolean;
  error: string | null;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const useStaffAttendance = ({ 
  staffId, 
  month,
  year 
}: UseStaffAttendanceProps): UseStaffAttendanceReturn => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAttendanceData = async () => {
    if (!staffId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getStaffAttendance(staffId, month, year);
      setAttendanceData(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance data');
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [staffId, month, year]);

  const checkIn = async () => {
    if (!staffId) {
      setError('Staff ID is required');
      return;
    }

    setLoading(true);
    try {
      // Get site ID from staff job
      const { data: staffJob, error: staffJobError } = await supabase
        .from('nd_staff_job')
        .select('site_id')
        .eq('staff_id', staffId)
        .single();

      if (staffJobError) throw staffJobError;
      if (!staffJob) throw new Error('Staff job information not found');

      const today = new Date();
      const attendancePayload: StaffAttendance = {
        staff_id: staffId,
        site_id: staffJob.site_id,
        attend_date: today.toISOString().split('T')[0],
        check_in: today.toISOString(),
      };

      await recordAttendance(attendancePayload);
      toast({
        title: 'Check-in successful',
        description: `Checked in at ${today.toLocaleTimeString()}`,
      });
      
      await fetchAttendanceData();
    } catch (err: any) {
      setError(err.message || 'Failed to check in');
      toast({
        title: 'Check-in failed',
        description: err.message || 'Failed to check in',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkOut = async () => {
    if (!staffId) {
      setError('Staff ID is required');
      return;
    }

    setLoading(true);
    try {
      // Find today's attendance record that doesn't have check_out
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = attendanceData.find(
        record => 
          record.attend_date === today && 
          record.check_in && 
          !record.check_out
      );

      if (!todayRecord) {
        throw new Error('No active check-in found for today');
      }

      const now = new Date();
      const attendancePayload: StaffAttendance = {
        staff_id: staffId,
        site_id: todayRecord.site_id,
        attend_date: today,
        check_out: now.toISOString(),
      };

      await recordAttendance(attendancePayload);
      toast({
        title: 'Check-out successful',
        description: `Checked out at ${now.toLocaleTimeString()}`,
      });
      
      await fetchAttendanceData();
    } catch (err: any) {
      setError(err.message || 'Failed to check out');
      toast({
        title: 'Check-out failed',
        description: err.message || 'Failed to check out',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    attendanceData,
    loading,
    error,
    checkIn,
    checkOut,
    refreshData: fetchAttendanceData,
  };
};

export default useStaffAttendance;
