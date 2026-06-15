import { useEffect, useState } from 'react';
import { customerService } from '../services/allServices';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import SearchBar from '../components/common/SearchBar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdPerson, MdPhone, MdEmail } from 'react-icons/md';

const EMPTY = { name: '', phone: '', email: '', address: '', gstin: '', creditLimit: 0 };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await customerService.getAll({ search }); setCustomers(data.customers); setTotal(data.total); }
    catch (e) { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setForm(EMPTY); setEditItem(null); setModal(true); };
  const openEdit = (c) => { setForm(c); setEditItem(c); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) { await customerService.update(editItem._id, form); toast.success('Customer updated!'); }
      else { await customerService.create(form); toast.success('Customer added!'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await customerService.delete(deleteId); toast.success('Customer removed'); setDeleteId(null); load(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const openDetail = async (id) => {
    try { const { data } = await customerService.getById(id); setDetailCustomer(data); }
    catch { toast.error('Failed to load'); }
  };

  const columns = [
    { label: 'Customer', render: (c) => (
      <button onClick={() => openDetail(c._id)} className="text-left hover:text-primary-600">
        <p className="font-medium text-gray-800">{c.name}</p>
        <p className="text-xs text-gray-400">{c.phone}</p>
      </button>
    )},
    { label: 'Email', render: (c) => <span className="text-sm text-gray-600">{c.email || '—'}</span> },
    { label: 'GSTIN', render: (c) => <span className="text-xs font-mono">{c.gstin || '—'}</span> },
    { label: 'Total Purchases', render: (c) => <span className="font-medium text-green-700">₹{(c.totalPurchases || 0).toLocaleString('en-IN')}</span> },
    { label: 'Outstanding', render: (c) => (
      <span className={c.outstandingBalance > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
        ₹{(c.outstandingBalance || 0).toLocaleString('en-IN')}
      </span>
    )},
    { label: 'Actions', render: (c) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><MdEdit /></button>
        <button onClick={() => setDeleteId(c._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><MdDelete /></button>
      </div>
    )},
  ];

  const Field = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      {Icon && <Icon className="text-gray-400 mt-0.5" />}
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-sm font-medium">{value || '—'}</p></div>
    </div>
  );

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Customers</h2><p className="text-sm text-gray-500">{total} customers</p></div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><MdAdd /> Add Customer</button>
      </div>

      <div className="card">
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, email..." /></div>
        <Table columns={columns} data={customers} loading={loading} emptyMessage="No customers yet. Add your first customer!" />
      </div>

      {/* Form Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Customer' : 'Add Customer'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Customer name" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 98765 43210" required /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" /></div>
          </div>
          <div><label className="label">Address</label><textarea className="input resize-none h-16" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Customer address" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">GSTIN</label><input className="input" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value})} placeholder="GST number" /></div>
            <div><label className="label">Credit Limit (₹)</label><input type="number" className="input" value={form.creditLimit} onChange={e => setForm({...form, creditLimit: e.target.value})} min="0" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editItem ? 'Update' : 'Add Customer'}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detailCustomer} onClose={() => setDetailCustomer(null)} title="Customer Details" size="lg">
        {detailCustomer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
              <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {detailCustomer.customer?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold">{detailCustomer.customer?.name}</h3>
                <p className="text-sm text-gray-500">Customer since {new Date(detailCustomer.customer?.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" value={detailCustomer.customer?.phone} icon={MdPhone} />
              <Field label="Email" value={detailCustomer.customer?.email} icon={MdEmail} />
              <Field label="Total Purchases" value={`₹${(detailCustomer.customer?.totalPurchases || 0).toLocaleString()}`} />
              <Field label="Outstanding Balance" value={`₹${(detailCustomer.customer?.outstandingBalance || 0).toLocaleString()}`} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Recent Invoices</h4>
              {detailCustomer.invoices?.length > 0 ? (
                <div className="space-y-2">
                  {detailCustomer.invoices.map(inv => (
                    <div key={inv._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div><p className="text-sm font-medium">{inv.invoiceNumber}</p><p className="text-xs text-gray-400">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</p></div>
                      <div className="text-right"><p className="font-semibold">₹{inv.grandTotal?.toFixed(2)}</p><span className={`text-xs ${inv.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-500'}`}>{inv.paymentStatus}</span></div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm">No invoices yet</p>}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} />
    </div>
  );
};

export default Customers;
