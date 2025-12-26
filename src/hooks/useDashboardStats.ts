import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalEyesLifetime: number;
  totalEyesCurrentYear: number;
  totalSurgeriesLifetime: number;
  totalSurgeriesCurrentYear: number;
  pediatricPatients: number;
  adultPatients: number;
  pkCurrentYear: number;
  pkLifetime: number;
  dsaekCurrentYear: number;
  dsaekLifetime: number;
  dalkCurrentYear: number;
  dalkLifetime: number;
  dmekCurrentYear: number;
  dmekLifetime: number;
  monthlyData: { month: string; surgeries: number; eyes: number }[];
  surgeryTypeDistribution: { name: string; value: number }[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const currentYear = new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01`;

      // Fetch donors for eye counts
      const { data: donors } = await supabase
        .from('donors')
        .select('*');

      // Fetch patients for surgery counts
      const { data: patients } = await supabase
        .from('patients')
        .select('*');

      const allDonors = donors || [];
      const allPatients = patients || [];

      // Calculate stats
      const totalEyesLifetime = allDonors.length * 2;
      const currentYearDonors = allDonors.filter(
        (d) => new Date(d.retrieval_date).getFullYear() === currentYear
      );
      const totalEyesCurrentYear = currentYearDonors.length * 2;

      const operatedPatients = allPatients.filter((p) => p.is_operated);
      const totalSurgeriesLifetime = operatedPatients.length;
      const currentYearSurgeries = operatedPatients.filter(
        (p) => p.operation_date && new Date(p.operation_date).getFullYear() === currentYear
      );
      const totalSurgeriesCurrentYear = currentYearSurgeries.length;

      const pediatricPatients = operatedPatients.filter((p) => p.age < 18).length;
      const adultPatients = operatedPatients.filter((p) => p.age >= 18).length;

      // Surgery type counts
      const countSurgeryType = (patients: typeof allPatients, type: string) =>
        patients.filter((p) => p.is_operated && p.surgery_type === type).length;

      const pkLifetime = countSurgeryType(allPatients, 'PK');
      const pkCurrentYear = countSurgeryType(currentYearSurgeries, 'PK');
      const dsaekLifetime = countSurgeryType(allPatients, 'DSAEK');
      const dsaekCurrentYear = countSurgeryType(currentYearSurgeries, 'DSAEK');
      const dalkLifetime = countSurgeryType(allPatients, 'DALK');
      const dalkCurrentYear = countSurgeryType(currentYearSurgeries, 'DALK');
      const dmekLifetime = countSurgeryType(allPatients, 'DMEK');
      const dmekCurrentYear = countSurgeryType(currentYearSurgeries, 'DMEK');

      // Monthly data for charts
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      const monthlyData = months.map((month, index) => {
        const monthSurgeries = currentYearSurgeries.filter(
          (p) => p.operation_date && new Date(p.operation_date).getMonth() === index
        ).length;
        const monthEyes = currentYearDonors.filter(
          (d) => new Date(d.retrieval_date).getMonth() === index
        ).length * 2;
        return { month, surgeries: monthSurgeries, eyes: monthEyes };
      });

      // Surgery type distribution
      const surgeryTypeDistribution = [
        { name: 'PK', value: pkLifetime },
        { name: 'DSAEK', value: dsaekLifetime },
        { name: 'DALK', value: dalkLifetime },
        { name: 'DMEK', value: dmekLifetime },
        { name: 'Others', value: operatedPatients.filter(
          (p) => !['PK', 'DSAEK', 'DALK', 'DMEK'].includes(p.surgery_type || '')
        ).length },
      ].filter((item) => item.value > 0);

      return {
        totalEyesLifetime,
        totalEyesCurrentYear,
        totalSurgeriesLifetime,
        totalSurgeriesCurrentYear,
        pediatricPatients,
        adultPatients,
        pkCurrentYear,
        pkLifetime,
        dsaekCurrentYear,
        dsaekLifetime,
        dalkCurrentYear,
        dalkLifetime,
        dmekCurrentYear,
        dmekLifetime,
        monthlyData,
        surgeryTypeDistribution,
      };
    },
  });
}