import AdminLayout from '../layouts/AdminLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { productsService } from '../services/productsService';
import { brandsService } from '../services/brandsService';
import { categoriesService } from '../services/categoriesService';
import { unitsService } from '../services/unitsService';
import { customersService } from '../services/customersService';

const CreateProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch brands, categories, units
    brandsService.getAll().then(({ data }) => setBrands(data || []));
    categoriesService.getAll().then(({ data }) => setCategories(data || []));
    unitsService.getAll().then(({ data }) => setUnits(data || []));
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      productsService.getById(id as string).then(({ data, error }) => {
        if (error) setError(error.message);
        else setForm(data || {});
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (isEdit && id) {
      setLoadingAudit(true);
      productsService.getAuditLogs(id as string).then(async ({ data, error }) => {
        if (error) setAuditError(error.message);
        else {
          setAuditLogs(data || []);
          const userIds = Array.from(new Set((data || []).map((log: any) => log.user_id)));
          if (userIds.length) {
            const users = await customersService.getUsersByIds(userIds);
            const map: Record<string, string> = {};
            users.forEach((u: any) => { map[u.user_id] = u.name || u.email || u.user_id; });
            setUserMap(map);
          }
        }
        setLoadingAudit(false);
      });
    }
  }, [isEdit, id]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (isEdit) {
      const { error } = await productsService.update(id as string, form);
      if (error) setError(error.message);
      else {
        setSuccess('Product updated! Redirecting...');
        setTimeout(() => navigate('/products/all'), 1200);
      }
    } else {
      const { error } = await productsService.create(form);
      if (error) setError(error.message);
      else {
        setSuccess('Product created! Redirecting...');
        setTimeout(() => navigate('/products/all'), 1200);
      }
    }
    setLoading(false);
  };

  return (
    <AdminLayout
      title={isEdit ? 'Edit Product' : 'Create product'}
      breadcrumb={<span>Products &gt; <span className="text-gray-900">{isEdit ? 'Edit product' : 'Create product'}</span></span>}
    >
      <form className="grid grid-cols-1 lg:grid-cols-3 gap-6" onSubmit={handleSubmit}>
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input name="name" className="w-full border rounded px-3 py-2" placeholder="Enter Name Product" required value={form.name || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Barcode Symbology *</label>
                <input name="barcode_symbology" className="w-full border rounded px-3 py-2" placeholder="Code 128" required value={form.barcode_symbology || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code Product *</label>
                <input name="code" className="w-full border rounded px-3 py-2" placeholder="Scan your barcode and select the correct symbology below" required value={form.code || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select name="category" className="w-full border rounded px-3 py-2" value={form.category || ''} onChange={handleChange}>
                  <option value="">Choose Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <select name="brand" className="w-full border rounded px-3 py-2" value={form.brand || ''} onChange={handleChange}>
                  <option value="">Choose Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order Tax</label>
                <div className="flex items-center gap-2">
                  <input name="order_tax" className="w-full border rounded px-3 py-2" placeholder="0" type="number" value={form.order_tax || ''} onChange={handleChange} />
                  <span className="text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Type</label>
                <select name="tax_type" className="w-full border rounded px-3 py-2" value={form.tax_type || ''} onChange={handleChange}>
                  <option value="Exclusive">Exclusive</option>
                  <option value="Inclusive">Inclusive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" className="w-full border rounded px-3 py-2" placeholder="A few words ..." rows={2} value={form.description || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select name="type" className="w-full border rounded px-3 py-2" value={form.type || ''} onChange={handleChange}>
                  <option value="Standard Product">Standard Product</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Cost *</label>
                <input name="product_cost" className="w-full border rounded px-3 py-2" placeholder="Enter Product Cost" type="number" required value={form.product_cost || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Price *</label>
                <input name="product_price" className="w-full border rounded px-3 py-2" placeholder="Enter Product Price" type="number" required value={form.product_price || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Unit *</label>
                <select name="product_unit" className="w-full border rounded px-3 py-2" value={form.product_unit || ''} onChange={handleChange}>
                  <option value="">Choose Product Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sale Unit *</label>
                <select name="sale_unit" className="w-full border rounded px-3 py-2" value={form.sale_unit || ''} onChange={handleChange}>
                  <option value="">Choose Sale Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Unit *</label>
                <select name="purchase_unit" className="w-full border rounded px-3 py-2" value={form.purchase_unit || ''} onChange={handleChange}>
                  <option value="">Choose Purchase Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock Alert</label>
                <input name="stock_alert" className="w-full border rounded px-3 py-2" placeholder="0" type="number" value={form.stock_alert || ''} onChange={handleChange} />
              </div>
            </div>
            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input name="has_serial" type="checkbox" className="accent-purple-500" checked={!!form.has_serial} onChange={handleChange} /> Product Has Imei/Serial Number
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="not_for_selling" type="checkbox" className="accent-purple-500" checked={!!form.not_for_selling} onChange={handleChange} /> This Product Not For Selling
              </label>
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" disabled={loading}>{loading ? 'Saving...' : 'Submit'}</button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
          {success && <div className="text-green-600 mt-2">{success}</div>}
          {/* Audit log display */}
          {isEdit && (
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Change History</h3>
              {loadingAudit ? (
                <div className="text-gray-500">Loading history...</div>
              ) : auditError ? (
                <div className="text-red-500">{auditError}</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-gray-400">No changes yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">When</th>
                        <th className="p-2 text-left">Who</th>
                        <th className="p-2 text-left">Changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, idx) => (
                        <tr key={log.id || idx} className="border-t">
                          <td className="p-2 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="p-2 whitespace-nowrap">{userMap[log.user_id] || log.user_id}</td>
                          <td className="p-2">
                            <ul className="list-disc ml-4">
                              {Object.entries(JSON.parse(log.changes)).map(([field, change]: any) => (
                                <li key={field}><b>{field}</b>: {String(change.from)} → {String(change.to)}</li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Image upload */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-2 font-medium text-gray-700">Multiple Image</div>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md h-40 text-gray-400 relative">
              <span className="mb-2">Drag & Drop Multiple images For product</span>
              <span className="text-xs">(or) Select</span>
              <input type="file" multiple className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" style={{ zIndex: 2 }} />
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default CreateProduct; 