import { useEffect, useState } from 'react';
import { reportService } from '../services/allServices';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import Table from '../components/common/Table';
import toast from 'react-hot-toast';
import { MdDownload, MdBarChart, MdInventory, MdPeople, MdLocalShipping } from 'react-icons/md';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [customerData, setCustomerData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState('day');
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const { data } = await reportService.getSales({ startDate, endDate, groupBy });
        setSalesData(data);
      } else if (activeTab === 'inventory') {
        const { data } = await reportService.getInventory();
        setInventoryData(data);
      } else if (activeTab === 'customers') {
        const { data } = await reportService.getCustomers();
        setCustomerData(data.report);
      } else if (activeTab === 'suppliers') {
        const { data } = await reportService.getSuppliers();
        setSupplierData(data.report);
      }
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [activeTab, startDate, endDate, groupBy]);

  const exportCSV = async (type) => {
    try {
      const { data } = await reportService.exportCSV(type);
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `${type}_report_${Date.now()}.csv`; a.click();
      toast.success('CSV exported!');
    } catch { toast.error('Export failed'); }
  };

  const chartData = {
    labels: salesData?.salesData?.map(d => d._id) || [],
    datasets: [{
      label: 'Revenue (₹)',
      data: salesData?.salesData?.map(d => d.revenue) || [],
      backgroundColor: 'rgba(37,99,235,0.7)',
      borderColor: '#2563eb',
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const tabs = [
    { key: 'sales', label: 'Sales', icon: MdBarChart },
    { key: 'inventory', label: 'Inventory', icon: MdInventory },
    { key: 'customers', label: 'Customers', icon: MdPeople },
    { key: 'suppliers', label: 'Suppliers', icon: MdLocalShipping },
  ];

  const salesColumns = [
    { label: 'Period', key: '_id' },
    { label: 'Revenue', render: (r) => <span className="font-semibold text-green-700">₹{r.revenue?.toFixed(2)}</span> },
    { label: 'Invoices', key: 'invoices' },
    { label: 'GST', render: (r) => `₹${r.gst?.toFixed(2)}` },
    { label: 'Discount', render: (r) => `₹${r.discount?.toFixed(2)}` },
  ];

  const invColumns = [
    { label: 'Product', key: 'name' },
    { label: 'SKU', key: 'sku' },
    { label: 'Category', key: 'category' },
    { label: 'Stock', render: (r) => <span className={r.isLowStock ? 'text-red-500 font-medium' : 'text-green-600'}>{r.stock}</span> },
    { label: 'Stock Value', render: (r) => `₹${r.stockValue?.toFixed(2)}` },
    { label: 'Status', render: (r) => r.isLowStock ? <span className="badge-danger">Low</span> : <span className="badge-success">OK</span> },
  ];

  const custColumns = [
    { label: 'Customer', key: 'name' },
    { label: 'Phone', key: 'phone' },
    { label: 'Orders', key: 'totalOrders' },
    { label: 'Total Spent', render: (r) => <span className="font-semibold text-blue-700">₹{r.totalSpent?.toFixed(2)}</span> },
    { label: 'Outstanding', render: (r) => <span className={r.outstanding > 0 ? 'text-red-600' : 'text-gray-400'}>₹{r.outstanding?.toFixed(2)}</span> },
  ];

  const suppColumns = [
    { label: 'Supplier', key: 'name' },
    { label: 'Phone', key: 'phone' },
    { label: 'Contact', key: 'contactPerson' },
    { label: 'Stock Ins', key: 'totalStockIns' },
    { label: 'Units Received', key: 'totalUnitsReceived' },
  ];

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Reports & Analytics</h2><p className="text-sm text-gray-500">Business insights and data export</p></div>
        <button onClick={() => exportCSV(activeTab === 'inventory' ? 'inventory' : 'sales')} className="btn-secondary flex items-center gap-2 text-sm"><MdDownload /> Export CSV</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            <Icon className="text-base" /> {label}
          </button>
        ))}
      </div>

      {/* Summary cards for sales */}
      {activeTab === 'sales' && salesData?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `₹${salesData.summary.totalRevenue?.toFixed(2)}` },
            { label: 'Total Invoices', value: salesData.summary.totalInvoices },
            { label: 'Total GST', value: `₹${salesData.summary.totalGST?.toFixed(2)}` },
            { label: 'Avg Order Value', value: `₹${salesData.summary.avgOrder?.toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center py-4">
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Inventory summary */}
      {activeTab === 'inventory' && inventoryData && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center py-4"><p className="text-2xl font-bold">{inventoryData.totalProducts}</p><p className="text-xs text-gray-500">Total Products</p></div>
          <div className="card text-center py-4"><p className="text-2xl font-bold text-red-600">{inventoryData.lowStockCount}</p><p className="text-xs text-gray-500">Low Stock Items</p></div>
          <div className="card text-center py-4"><p className="text-2xl font-bold text-green-700">₹{inventoryData.totalValue?.toFixed(0)}</p><p className="text-xs text-gray-500">Stock Value</p></div>
        </div>
      )}

      {/* Sales controls + chart */}
      {activeTab === 'sales' && (
        <>
          <div className="card">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2">
                <label className="label mb-0 text-xs">From:</label>
                <input type="date" className="input w-36 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <label className="label mb-0 text-xs">To:</label>
                <input type="date" className="input w-36 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <select className="input w-28 text-sm" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
            <div className="h-64">
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } }} />
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3">Sales Breakdown</h3>
            <Table columns={salesColumns} data={salesData?.salesData || []} loading={loading} />
          </div>
        </>
      )}

      {activeTab === 'inventory' && (
        <div className="card">
          <Table columns={invColumns} data={inventoryData?.report || []} loading={loading} emptyMessage="No inventory data" />
        </div>
      )}
      {activeTab === 'customers' && (
        <div className="card">
          <Table columns={custColumns} data={customerData} loading={loading} emptyMessage="No customer data" />
        </div>
      )}
      {activeTab === 'suppliers' && (
        <div className="card">
          <Table columns={suppColumns} data={supplierData} loading={loading} emptyMessage="No supplier data" />
        </div>
      )}
    </div>
  );
};

export default Reports;
