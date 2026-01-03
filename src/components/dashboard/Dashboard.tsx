import { useState } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatCard } from './StatCard';
import { FileUpload } from './FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Eye,
  Stethoscope,
  Baby,
  UserCheck,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  Database,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { insertMockPatients, insertMockDonors } from '@/lib/mockData';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const CHART_COLORS = [
  'hsl(195, 70%, 40%)',
  'hsl(170, 60%, 45%)',
  'hsl(220, 70%, 50%)',
  'hsl(280, 60%, 55%)',
  'hsl(340, 65%, 50%)',
];

export function Dashboard() {
  const { data: stats, isLoading, refetch } = useDashboardStats();
  const { isAdmin } = useAuth();
  const [isDetailedOpen, setIsDetailedOpen] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [isSeedingData, setIsSeedingData] = useState(false);

  const handleSeedMockData = async () => {
    if (!confirm('This will add 100 mock patients and 100 mock donors. Continue?')) return;
    
    setIsSeedingData(true);
    try {
      const [patientResult, donorResult] = await Promise.all([
        insertMockPatients(100),
        insertMockDonors(100),
      ]);
      
      toast.success(`Added ${patientResult.success} patients and ${donorResult.success} donors`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed data');
    } finally {
      setIsSeedingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2">
          <FileUpload />
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedMockData}
              disabled={isSeedingData}
              className="flex items-center gap-2"
            >
              {isSeedingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {isSeedingData ? 'Seeding...' : 'Seed Data'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {showCharts ? 'Hide Charts' : 'Charts'}
          </Button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Eyes Retrieved"
          value={stats.totalEyesCurrentYear}
          subtitle={`${stats.totalEyesLifetime} lifetime`}
          icon={<Eye className="w-5 h-5" />}
        />
        <StatCard
          title="Surgeries Done"
          value={stats.totalSurgeriesCurrentYear}
          subtitle={`${stats.totalSurgeriesLifetime} lifetime`}
          icon={<Stethoscope className="w-5 h-5" />}
        />
        <StatCard
          title="Pediatric (<18y)"
          value={stats.pediatricPatients}
          subtitle="patients operated"
          icon={<Baby className="w-5 h-5" />}
        />
        <StatCard
          title="Adults (≥18y)"
          value={stats.adultPatients}
          subtitle="patients operated"
          icon={<UserCheck className="w-5 h-5" />}
        />
      </div>

      {/* Detailed Procedure Stats */}
      <Collapsible open={isDetailedOpen} onOpenChange={setIsDetailedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between py-3 h-auto">
            <span className="font-medium">Detailed Procedure Statistics</span>
            {isDetailedOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground font-medium">PK (Penetrating Keratoplasty)</p>
              <p className="text-lg font-bold">{stats.pkCurrentYear} <span className="text-sm font-normal text-muted-foreground">/ {stats.pkLifetime} lifetime</span></p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground font-medium">DSAEK</p>
              <p className="text-lg font-bold">{stats.dsaekCurrentYear} <span className="text-sm font-normal text-muted-foreground">/ {stats.dsaekLifetime} lifetime</span></p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground font-medium">DALK</p>
              <p className="text-lg font-bold">{stats.dalkCurrentYear} <span className="text-sm font-normal text-muted-foreground">/ {stats.dalkLifetime} lifetime</span></p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground font-medium">DMEK</p>
              <p className="text-lg font-bold">{stats.dmekCurrentYear} <span className="text-sm font-normal text-muted-foreground">/ {stats.dmekLifetime} lifetime</span></p>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Charts Section */}
      {showCharts && (
        <div className="space-y-4">
          {/* Monthly Trends */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Monthly Trends ({currentYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="surgeries"
                      stroke="hsl(195, 70%, 40%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(195, 70%, 40%)' }}
                      name="Surgeries"
                    />
                    <Line
                      type="monotone"
                      dataKey="eyes"
                      stroke="hsl(170, 60%, 45%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(170, 60%, 45%)' }}
                      name="Eyes Retrieved"
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Surgery Type Distribution */}
          {stats.surgeryTypeDistribution.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Surgery Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.surgeryTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.surgeryTypeDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="surgeries" fill="hsl(195, 70%, 40%)" name="Surgeries" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="eyes" fill="hsl(170, 60%, 45%)" name="Eyes" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}