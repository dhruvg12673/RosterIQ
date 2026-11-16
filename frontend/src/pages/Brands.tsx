import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Brand } from '../types';
import { Store, Plus, Search, UserCheck, Layers, CheckCircle2 } from 'lucide-react';

export const Brands: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    brand_name: '',
    brand_code: '',
    description: '',
  });

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands', search],
    queryFn: () => api.getBrands({ search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: api.createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setIsModalOpen(false);
      setFormData({ brand_name: '', brand_code: '', description: '' });
    },
  });

  const filteredBrands = brands.filter((b) => {
    if (filterType === 'single') return b.resource_type === 'single';
    if (filterType === 'multi') return b.resource_type === 'multi';
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
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
              All (20)
            </button>
            <button
              onClick={() => setFilterType('single')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'single' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Single-Resource (80%)
            </button>
            <button
              onClick={() => setFilterType('multi')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'multi' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Multi-Resource (20%)
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
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
        ) : (
          filteredBrands.map((brand) => {
            const isSingle = brand.resource_type === 'single';

            return (
              <div
                key={brand.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {brand.brand_code}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isSingle
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {isSingle ? 'Single-Resource' : 'Multi-Resource'}
                    </span>
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
