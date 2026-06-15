import { useEffect, useState } from 'react';
import { useBillingStore } from '../store/billingStore';
import { customerService } from '../services/allServices';
import { useProductStore } from '../store/productStore';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import SearchBar from '../components/common/SearchBar';
import toast from 'react-hot-toast';
import { MdAdd, MdDelete, MdPictureAsPdf, MdSearch, MdReceipt } from 'react-icons/md';

const Billing = () => {
  const { invoices, total, isLoading, fetchInvoices, createInvoice, downloadPDF } = useBillingStore();
  const { products, fetchProducts } = useProductStore();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(null);

  // Invoice form state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [items, setItems] = useState([{ productId: '', productName: '', quantity: 1, unitPrice: 0, discount: 0, gstRate: 18 }]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('');

  useEffect(() => { fetchInvoices({ search, status: statusFilter }); }, [search, statusFilter]);
  useEffect(() => {
    fetchProducts();
    customerService.getAll({ limit: 200 }).then(({ data }) => setCustomers(data.customers));
  }, []);

  const addItem = () => setItems([...items, { productId: '', productName: '', quantity: 1, unitPrice: 0, discount: 0, gstRate: 18 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'productId') {
      const p = products.find(pr => pr._id === value);
      if (p) { updated[index].unitPrice = p.sellingPrice; updated[index].gstRate = p.gstRate; updated[index].productName = p.name; }
    }
    setItems(updated);
  };

  const calcItem = (item) => {
    const base = item.quantity * item.unitPrice;
    const disc = base * (item.discount / 100);
    const taxable = base - disc;
    const gst = taxable * (item.gstRate / 100);
    return { taxable, gst, total: taxable + gst };
  };

  const totals = items.reduce((acc, item) => {
    const c = calcItem(item);
    return { subtotal: acc.subtotal + item.quantity * item.unitPrice, discount: acc.discount + item.quantity * item.unitPrice * (item.discount / 100), gst: acc.gst + c.gst, grand: acc.grand + c.total };
  }, { subtotal: 0, discount: 0, gst: 0, grand: 0 });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return toast.error('Select a customer');
    if (items.some(i => !i.productId || i.quantity < 1)) return toast.error('Fill all item details');
    setSaving(true);
    try {
      const inv = await createInvoice({ customerId: selectedCustomer, items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount, gstRate: i.gstRate })), paymentMethod, paymentStatus, notes });
      toast.success(`Invoice ${inv.invoiceNumber} created!`);
      setShowCreate(false);
      setItems([{ productId: '', productName: '', quantity: 1, unitPrice: 0, discount: 0, gstRate: 18 }]);
      setSelectedCustomer(''); setNotes('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create invoice'); }
    finally { setSaving(false); }
  };

  const handleDownload = async (id, number) => {
    setDownloading(id);
    try { await downloadPDF(id, number); toast.success('PDF downloaded!'); }
    catch { toast.error('PDF generation failed'); }
    finally { setDownloading(null); }
  };

  const statusBadge = (s) => {
    const map = { paid: 'badge-success', pending: 'badge-warning', partial: 'badge-info', cancelled: 'badge-danger' };
    return <span className={map[s] || 'badge-info'}>{s}</span>;
  };

  const columns = [
    { label: 'Invoice #', render: (inv) => <span className="font-mono text-sm font-medium text-primary-700">{inv.invoiceNumber}</span> },
    { label: 'Customer', render: (inv) => <div><p className="font-medium">{inv.customer?.name}</p><p className="text-xs text-gray-400">{inv.customer?.phone}</p></div> },
    { label: 'Date', render: (inv) => new Date(inv.createdAt).toLocaleDateString('en-IN') },
    { label: 'Amount', render: (inv) => <span className="font-semibold">₹{inv.grandTotal?.toFixed(2)}</span> },
    { label: 'Status', render: (inv) => statusBadge(inv.paymentStatus) },
    { label: 'Method', render: (inv) => <span className="text-xs capitalize text-gray-600">{inv.paymentMethod?.replace('_', ' ')}</span> },
    { label: 'Actions', render: (inv) => (
      <button onClick={() => handleDownload(inv._id, inv.invoiceNumber)} disabled={downloading === inv._id}
        className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
        <MdPictureAsPdf /> {downloading === inv._id ? '...' : 'PDF'}
      </button>
    )},
  ];

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Billing</h2><p className="text-sm text-gray-500">{total} invoices</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><MdAdd /> New Invoice</button>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4">
          <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Search by invoice number..." /></div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-36">
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <Table columns={columns} data={invoices} loading={isLoading} emptyMessage="No invoices yet. Create your first invoice!" />
      </div>

      {/* Create Invoice Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Invoice" size="xl">
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Customer Selection */}
          <div>
            <label className="label">Customer *</label>
            <select className="input" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} required>
              <option value="">-- Select Customer --</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="font-semibold text-gray-700 text-sm">Invoice Items</label>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"><MdAdd /> Add Item</button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-xl">
                  <div className="col-span-4">
                    <select className="input text-sm" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required>
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.sellingPrice})</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" placeholder="Qty" min="1" className="input text-sm" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value))} required />
                  </div>
                  <div className="col-span-2">
                    <input type="number" placeholder="Price" className="input text-sm" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value))} step="0.01" required />
                  </div>
                  <div className="col-span-1">
                    <input type="number" placeholder="Disc%" className="input text-sm" value={item.discount} onChange={e => updateItem(i, 'discount', parseFloat(e.target.value))} min="0" max="100" />
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-semibold text-gray-700">₹{calcItem(item).total.toFixed(2)}</span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="p-1 text-red-400 hover:text-red-600"><MdDelete /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal:</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
            {totals.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount:</span><span>-₹{totals.discount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-sm text-gray-600"><span>GST:</span><span>₹{totals.gst.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 text-gray-800"><span>Grand Total:</span><span>₹{totals.grand.toFixed(2)}</span></div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {['cash','upi','bank_transfer','credit','cheque'].map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment Status</label>
              <select className="input" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>

          <div><label className="label">Notes</label><input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." /></div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <MdReceipt /> {saving ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Billing;
