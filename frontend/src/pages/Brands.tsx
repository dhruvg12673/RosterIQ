import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Brand } from '../types';
import { Plus, Search, UserCheck, Layers, Trash2, Pencil, AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react';

export const Brands: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    brand_name: '',
    brand_code: '',
    description: '',
  });

  const [editBrandFormData, setEditBrandFormData] = useState({
    brand_name: '',
    brand_code: '',
    description: '',
    status: 'ACTIVE',
  });

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands', search],
    queryFn: () => api.getBrands({ search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: api.createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsModalOpen(false);
      setActionSuccess('Brand added successfully!');
      setTimeout(() => setActionSuccess(null), 4000);
      setFormData({ brand_name: '', brand_code: '', description: '' });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to create brand');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Brand> }) =>
      api.updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEditingBrand(null);
      setActionSuccess('Brand details updated successfully!');
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to update brand');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['working-rules'] });
      setBrandToDelete(null);
      setActionSuccess('Brand deleted successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to delete brand');
    },
  });

  const filteredBrands = brands.filter((b) => {
    if (filterType === 'single') return b.resource_type === 'single';
    if (filterType === 'multi') return b.resource_type === 'multi';
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    createMutation.mutate(formData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    setActionError(null);
    updateMutation.mutate({
      id: editingBrand.id,
      data: editBrandFormData,
    });
  };

  const startEditing = (brand: Brand) => {
    setEditingBrand(brand);
    setActionError(null);
    setEditBrandFormData({
      brand_name: brand.brand_name,
      brand_code: brand.brand_code,
      description: brand.description || '',
      status: brand.status || 'ACTIVE',
    });
  };

  const handleDelete = () => {
    if (!brandToDelete) return;
    setActionError(null);
    deleteMutation.mutate(brandToDelete.id);
  };

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800 text-xs">
            &times;
          </button>
        </div>
      )}

      {/* Error Notification */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-800 text-xs">
            &times;
          </button>
        </div>
      )}

      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({brands.length})
            </button>
            <button
              onClick={() => setFilterType('single')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'single' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Single-Resource
            </button>
            <button
              onClick={() => setFilterType('multi')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'multi' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Multi-Resource
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setActionError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add D2C Brand</span>
        </button>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-4 text-center py-12 text-slate-500 text-xs">Loading brands...</div>
        ) : filteredBrands.length === 0 ? (
          <div className="col-span-4 text-center py-12 text-slate-500 text-xs">No brands found.</div>
        ) : (
          filteredBrands.map((brand) => {
            const isSingle = brand.resource_type === 'single';

            return (
              <div
                key={brand.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {brand.brand_code}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isSingle
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {isSingle ? 'Single-Resource' : 'Multi-Resource'}
                      </span>
                      <button
                        onClick={() => startEditing(brand)}
                        title={`Edit ${brand.brand_name}`}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-80 group-hover:opacity-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setBrandToDelete(brand)}
                        title={`Delete ${brand.brand_name}`}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-80 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2.5">{brand.brand_name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {brand.description || 'Fast-growing D2C client account.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                    <span>{brand.employee_count} {brand.employee_count === 1 ? 'Dedicated' : 'Staff'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    <span>{brand.process_count} Processes</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Brand Modal */}
      {editingBrand && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit D2C Brand</h3>
                <p className="text-xs text-slate-500 mt-0.5">Modify brand details and settings.</p>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                {editingBrand.brand_code}
              </span>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  required
                  value={editBrandFormData.brand_name}
                  onChange={(e) => setEditBrandFormData({ ...editBrandFormData, brand_name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Brand Code</label>
                  <input
                    type="text"
                    required
                    value={editBrandFormData.brand_code}
                    onChange={(e) => setEditBrandFormData({ ...editBrandFormData, brand_code: e.target.value.toUpperCase() })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={editBrandFormData.status}
                    onChange={(e) => setEditBrandFormData({ ...editBrandFormData, status: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editBrandFormData.description}
                  onChange={(e) => setEditBrandFormData({ ...editBrandFormData, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Brand Confirmation Modal */}
      {brandToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Delete D2C Brand</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-800">{brandToDelete.brand_name}</span> (
                  <span className="font-mono text-purple-600">{brandToDelete.brand_code}</span>)?
                </p>
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 text-[11px] text-red-700">
                  This action will permanently remove this brand, its process operating rules, employee assignments, and roster records.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBrandToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Brand'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add New D2C Brand</h3>
            <p className="text-xs text-slate-500 mb-4">Configure a new client account.</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZenGlow Essentials"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Brand Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BRD-ZEN"
                  value={formData.brand_code}
                  onChange={(e) => setFormData({ ...formData, brand_code: e.target.value.toUpperCase() })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brand category, product focus, SLA notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
