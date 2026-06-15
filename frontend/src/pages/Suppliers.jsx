import { useEffect, useState } from 'react';
import { supplierService } from '../services/allServices';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import SearchBar from '../components/common/SearchBar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdPhone, MdBusiness } from 'react-icons/md';

const EMPTY = { name: '', phone: '', email: '', address: '', gstin: '', contactPerson: '', paymentTerms: '30 days' };

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [detailSupplier, setDetailSupplier] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await supplierService.getAll({ search }); setSuppliers(data.suppliers); setTotal(data.total); }
    catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openEdit = (s) => { setForm(s); setEditItem(s); setModal(true); };
  const openCreate = () => { setForm(EMPTY); setEditItem(null); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) { await supplierService.update(editItem._id, form); toast.success('Supplier updated!'); }
      else { await supplierService.create(form); toast.success('Supplier added!'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await supplierService.delete(deleteId); toast.success('Supplier removed'); setDeleteId(null); load(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const openDetail = async (id) => {
    try { const { data } = await supplierService.getById(id); setDetailSupplier(data); }
    catch { toast.error('Failed to load details'); }
  };

  const columns = [
    { label: 'Supplier', render: (s) => (
      <button onClick={() => openDetail(s._id)} className="text-left hover:text-primary-600">
        <p className="font-medium text-gray-800">{s.name}</p>
        <p className="text-xs text-gray-400">{s.contactPerson}</p>
      </button>
    )},
    { label: 'Phone', key: 'phone' },
    { label: 'Email', render: (s) => s.email || '—' },
    { label: 'GSTIN', render: (s) => <span className="text-xs font-mono">{s.gstin || '—'}</span> },
    { label: 'Payment Terms', key: 'paymentTerms' },
    { label: 'Actions', render: (s) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><MdEdit /></button>
        <button onClick={() => setDeleteId(s._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><MdDelete /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Suppliers</h2><p className="text-sm text-gray-500">{total} suppliers</p></div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><MdAdd /> Add Supplier</button>
      </div>

      <div className="card">
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search suppliers..." /></div>
        <Table columns={columns} data={suppliers} loading={loading} emptyMessage="No suppliers yet." />
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Supplier' : 'Add Supplier'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Company Name *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Supplier company name" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required /></div>
            <div><label className="label">Contact Person</label><input className="input" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><label className="label">GSTIN</label><input className="input" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value})} /></div>
          </div>
          <div><label className="label">Address</label><textarea className="input resize-none h-16" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div><label className="label">Payment Terms</label>
            <select className="input" value={form.paymentTerms} onChange={e => setForm({...form, paymentTerms: e.target.value})}>
              {['Immediate', '7 days', '15 days', '30 days', '45 days', '60 days'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editItem ? 'Update' : 'Add Supplier'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detailSupplier} onClose={() => setDetailSupplier(null)} title="Supplier Details" size="lg">
        {detailSupplier && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
              <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                <MdBusiness />
              </div>
              <div>
                <h3 className="text-lg font-bold">{detailSupplier.supplier?.name}</h3>
                <p className="text-sm text-gray-500">{detailSupplier.supplier?.contactPerson} · {detailSupplier.supplier?.phone}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Purchase History</h4>
              {detailSupplier.history?.length > 0 ? (
                <div className="space-y-2">
                  {detailSupplier.history.map(log => (
                    <div key={log._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div><p className="text-sm font-medium">{log.product?.name}</p><p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleDateString('en-IN')}</p></div>
                      <span className="badge-success">+{log.quantity} units</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm">No purchase history yet</p>}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} />
    </div>
  );
};

export default Suppliers;
