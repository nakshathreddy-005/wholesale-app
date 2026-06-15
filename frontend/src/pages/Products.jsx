import { useEffect, useState } from 'react';
import { useProductStore } from '../store/productStore';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import SearchBar from '../components/common/SearchBar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdFilterList } from 'react-icons/md';

const EMPTY_FORM = { name: '', sku: '', barcode: '', category: '', description: '', purchasePrice: '', sellingPrice: '', stock: '', lowStockThreshold: 10, unit: 'pcs', gstRate: 18 };

const Products = () => {
  const { products, total, isLoading, categories, fetchProducts, fetchCategories, createProduct, updateProduct, deleteProduct } = useProductStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchProducts({ search, category }); }, [search, category]);
  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditItem(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ ...p, purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice }); setEditItem(p); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) { await updateProduct(editItem._id, form); toast.success('Product updated!'); }
      else { await createProduct(form); toast.success('Product created!'); }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Something went wrong'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteProduct(deleteId); toast.success('Product deleted'); setDeleteId(null); }
    catch (err) { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const columns = [
    { label: 'Product', render: (p) => (
      <div>
        <p className="font-medium text-gray-800">{p.name}</p>
        <p className="text-xs text-gray-400">{p.sku || 'No SKU'}</p>
      </div>
    )},
    { label: 'Category', key: 'category' },
    { label: 'Purchase ₹', render: (p) => `₹${p.purchasePrice}` },
    { label: 'Selling ₹', render: (p) => `₹${p.sellingPrice}` },
    { label: 'Stock', render: (p) => (
      <span className={p.isLowStock ? 'badge-danger' : 'badge-success'}>
        {p.stock} {p.unit}
      </span>
    )},
    { label: 'GST%', render: (p) => `${p.gstRate}%` },
    { label: 'Actions', render: (p) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><MdEdit /></button>
        <button onClick={() => setDeleteId(p._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><MdDelete /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Products</h2>
          <p className="text-sm text-gray-500">{total} products total</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <MdAdd /> Add Product
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Search by name, SKU, barcode..." /></div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input w-full sm:w-48">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Table columns={columns} data={products} loading={isLoading} emptyMessage="No products found. Add your first product!" />
      </div>

      {/* Product Form Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Product' : 'Add New Product'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Product Name *</label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Enter product name" required />
            </div>
            <div>
              <label className="label">SKU</label>
              <input className="input" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="e.g. PRD-001" />
            </div>
            <div>
              <label className="label">Barcode</label>
              <input className="input" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="Barcode number" />
            </div>
            <div>
              <label className="label">Category *</label>
              <input className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Electronics" required list="category-list" />
              <datalist id="category-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                {['pcs','kg','g','ltr','ml','box','dozen','pair'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Purchase Price (₹) *</label>
              <input type="number" className="input" value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})} placeholder="0.00" required min="0" step="0.01" />
            </div>
            <div>
              <label className="label">Selling Price (₹) *</label>
              <input type="number" className="input" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: e.target.value})} placeholder="0.00" required min="0" step="0.01" />
            </div>
            <div>
              <label className="label">Stock Quantity</label>
              <input type="number" className="input" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="0" min="0" />
            </div>
            <div>
              <label className="label">Low Stock Threshold</label>
              <input type="number" className="input" value={form.lowStockThreshold} onChange={e => setForm({...form, lowStockThreshold: e.target.value})} min="0" />
            </div>
            <div>
              <label className="label">GST Rate (%)</label>
              <select className="input" value={form.gstRate} onChange={e => setForm({...form, gstRate: e.target.value})}>
                {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input resize-none h-20" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Product description..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editItem ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} message="This will deactivate the product. It won't appear in product listings." />
    </div>
  );
};

export default Products;
