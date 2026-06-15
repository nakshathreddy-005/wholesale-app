import { useEffect } from 'react';
import { useBillingStore } from '../store/billingStore';
import { useProductStore } from '../store/productStore';
import StatCard from '../components/common/StatCard';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { MdAttachMoney, MdReceipt, MdInventory, MdWarning, MdTrendingUp, MdPeople } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const { stats, fetchStats } = useBillingStore();
  const { lowStockProducts, fetchLowStock } = useProductStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchStats();
    fetchLowStock();
  }, []);

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  const weeklyChartData = {
    labels: stats?.weeklyRevenue?.map(d => d._id) || [],
    datasets: [{
      label: 'Revenue',
      data: stats?.weeklyRevenue?.map(d => d.revenue) || [],
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.08)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#2563eb',
      pointRadius: 4,
    }],
  };

  const topSellingData = {
    labels: stats?.topSelling?.map(p => p.name?.slice(0, 15)) || [],
    datasets: [{
      data: stats?.topSelling?.map(p => p.totalSold) || [],
      backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' } } },
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-primary-200 text-sm mt-1">Here's what's happening with your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={fmt(stats?.totalRevenue)} icon={MdAttachMoney} color="blue" subtitle="All time" />
        <StatCard title="Today's Sales" value={fmt(stats?.todayRevenue)} icon={MdTrendingUp} color="green" subtitle={`${stats?.todayInvoices || 0} invoices`} />
        <StatCard title="This Month" value={fmt(stats?.monthRevenue)} icon={MdReceipt} color="purple" subtitle="Month to date" />
        <StatCard title="Pending Payment" value={stats?.pendingInvoices || 0} icon={MdWarning} color="orange" subtitle="Invoices pending" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Weekly Revenue</h3>
          <div className="h-52">
            <Line data={weeklyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Selling Doughnut */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Top Products</h3>
          {stats?.topSelling?.length > 0 ? (
            <>
              <div className="h-40">
                <Doughnut data={topSellingData} options={{ ...chartOptions, cutout: '65%', plugins: { legend: { display: false } } }} />
              </div>
              <div className="mt-3 space-y-1.5">
                {stats.topSelling.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: ['#3b82f6','#10b981','#f59e0b'][i] }} />
                      <span className="text-gray-600 truncate max-w-[100px]">{p.name}</span>
                    </div>
                    <span className="font-medium text-gray-700">{p.totalSold} units</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-gray-400 text-sm text-center py-8">No sales data yet</p>}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <MdWarning className="text-amber-500" /> Low Stock Alerts
            </h3>
            <Link to="/inventory" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">✅ All products are well-stocked</p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((p) => (
                <div key={p._id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500">SKU: {p.sku || 'N/A'}</p>
                  </div>
                  <span className="badge-danger">{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/billing', label: 'New Invoice', icon: '🧾', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
              { to: '/products', label: 'Add Product', icon: '📦', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
              { to: '/customers', label: 'Add Customer', icon: '👤', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
              { to: '/chatbot', label: 'Ask AI Bot', icon: '🤖', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
              { to: '/inventory', label: 'Stock In', icon: '📥', color: 'bg-teal-50 hover:bg-teal-100 text-teal-700' },
              { to: '/reports', label: 'View Reports', icon: '📊', color: 'bg-pink-50 hover:bg-pink-100 text-pink-700' },
            ].map(({ to, label, icon, color }) => (
              <Link key={to} to={to} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${color}`}>
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
