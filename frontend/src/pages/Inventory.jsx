import { useEffect, useState } from 'react';
import { inventoryService } from '../services/allServices';
import { useProductStore } from '../store/productStore';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import SearchBar from '../components/common/SearchBar';
import toast from 'react-hot-toast';
import { MdAdd, MdRemove, MdTune, MdWarning } from 'react-icons/md';

const Inventory = () => {
  const { products, lowStockProducts, fetchProducts, fetchLowStock } = useProductStore();
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [modal, setModal] = useState(null); // 'in' | 'out' | 'adjust'
  const [form, setForm] = useState({ productId: '', quantity: '', supplierId: '', notes: '', newQuantity: '' });
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => { fetchLogs(); fetchProducts(); fetchLowStock(); }, [typeFilter]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data } = await inventoryService.getLogs({ type: typeFilter, limit: 50 });
      setLogs(data.logs);
    } catch (err) { toast.error('Failed to load logs'); }
    finally { setLoadingLogs(false); }
  };

  const handleStockIn = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await inventoryService.stockIn({ productId: form.productId, quantity: parseInt(form.quantity), notes: form.notes });
      toast.success('Stock added successfully!');
      setModal(null); fetchLogs(); fetchProducts(); fetchLowStock();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleStockOut = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await inventoryService.stockOut({ productId: form.productId, quantity: parseInt(form.quantity), notes: form.notes });
      toast.success('Stock removed!');
      setModal(null); fetchLogs(); fetchProducts(); fetchLowStock();
    } catch (err) { toast.error(err.response?.data?.message || 'Insufficient stock'); }
    finally { setSaving(false); }
  };

  const handleAdjust = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await inventoryService.adjust({ productId: form.productId, newQuantity: parseInt(form.newQuantity), notes: form.notes });
      toast.success('Stock adjusted!');
      setModal(null); fetchLogs(); fetchProducts(); fetchLowStock();
    } catch (err) { toast.error('Adjustment failed'); }
    finally { setSaving(false); }
  };

  const openModal = (type) => {
    setForm({ productId: '', quantity: '', notes: '', newQuantity: '' });
    setModal(type);
  };

  const logColumns = [
    { label: 'Date', render: (l) => new Date(l.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) },
    { label: 'Product', render: (l) => <span className="font-medium">{l.product?.name}</span> },
    { label: 'Type', render: (l) => {
      const map = { stock_in: 'badge-success', stock_out: 'badge-danger', adjustment: 'badge-info', sale: 'badge-warning', return: 'badge-info' };
      return <span className={map[l.type] || 'badge-info'}>{l.type.replace('_', ' ')}</span>;
    }},
    { label: 'Qty', render: (l) => (
      <span className={l.type === 'stock_in' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
        {l.type === 'stock_in' ? '+' : '-'}{l.quantity}
      </span>
    )},
    { label: 'Before', render: (l) => l.previousStock },
    { label: 'After', render: (l) => l.newStock },
    { label: 'By', render: (l) => l.createdBy?.name || 'System' },
    { label: 'Notes', render: (l) => <span className="text-xs text-gray-400">{l.notes || '—'}</span> },
  ];

  const ProductSelect = () => (
    <div>
      <label className="label">Select Product *</label>
      <select className="input" value={form.productId} onChange={e => setForm({...form, productId: e.target.value})} required>
        <option value="">-- Choose Product --</option>
        {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock} {p.unit})</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-sm text-gray-500">Track stock movements and adjustments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => openModal('in')} className="btn-success flex items-center gap-1.5 text-sm"><MdAdd /> Stock In</button>
          <button onClick={() => openModal('out')} className="btn-danger flex items-center gap-1.5 text-sm"><MdRemove /> Stock Out</button>
          <button onClick={() => openModal('adjust')} className="btn-secondary flex items-center gap-1.5 text-sm"><MdTune /> Adjust</button>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MdWarning className="text-amber-500 text-xl" />
            <h3 className="font-semibold text-amber-800">Low Stock Alert — {lowStockProducts.length} item(s) need restocking</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {lowStockProducts.map(p => (
              <div key={p._id} className="bg-white rounded-lg p-3 border border-amber-100">
                <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                <p className="text-xs text-red-500 font-semibold">{p.stock} {p.unit} left</p>
                <p className="text-xs text-gray-400">Min: {p.lowStockThreshold}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Inventory History</h3>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input w-40">
            <option value="">All Types</option>
            <option value="stock_in">Stock In</option>
            <option value="stock_out">Stock Out</option>
            <option value="adjustment">Adjustment</option>
            <option value="sale">Sale</option>
          </select>
        </div>
        <Table columns={logColumns} data={logs} loading={loadingLogs} emptyMessage="No inventory movements yet" />
      </div>

      {/* Stock In Modal */}
      <Modal isOpen={modal === 'in'} onClose={() => setModal(null)} title="Stock In" size="md">
        <form onSubmit={handleStockIn} className="space-y-4">
          <ProductSelect />
          <div><label className="label">Quantity *</label><input type="number" className="input" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="Enter quantity" required min="1" /></div>
          <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Purchase reference, supplier info..." /></div>
          <div className="flex gap-3"><button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button><button type="submit" disabled={saving} className="btn-success flex-1">{saving ? 'Saving...' : 'Add Stock'}</button></div>
        </form>
      </Modal>

      {/* Stock Out Modal */}
      <Modal isOpen={modal === 'out'} onClose={() => setModal(null)} title="Stock Out" size="md">
        <form onSubmit={handleStockOut} className="space-y-4">
          <ProductSelect />
          <div><label className="label">Quantity *</label><input type="number" className="input" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="Enter quantity" required min="1" /></div>
          <div><label className="label">Reason / Notes</label><input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Damaged, expired, etc." /></div>
          <div className="flex gap-3"><button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button><button type="submit" disabled={saving} className="btn-danger flex-1">{saving ? 'Saving...' : 'Remove Stock'}</button></div>
        </form>
      </Modal>

      {/* Adjust Modal */}
      <Modal isOpen={modal === 'adjust'} onClose={() => setModal(null)} title="Adjust Stock" size="md">
        <form onSubmit={handleAdjust} className="space-y-4">
          <ProductSelect />
          <div><label className="label">New Stock Quantity *</label><input type="number" className="input" value={form.newQuantity} onChange={e => setForm({...form, newQuantity: e.target.value})} placeholder="Set exact quantity" required min="0" /></div>
          <div><label className="label">Adjustment Reason *</label><input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Physical count, correction..." required /></div>
          <div className="flex gap-3"><button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button><button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Apply Adjustment'}</button></div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
