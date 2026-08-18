'use me';
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, X, FolderTree, AlertCircle, CheckCircle2 } from 'lucide-react';
import { categorySchema, CategoryFormValues } from '@/lib/validation/schemas';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/firestore/services';
import { Category } from '@/types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      active: true,
    },
  });

  const watchImageUrl = watch('imageUrl');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      name: '',
      description: '',
      imageUrl: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    reset({
      name: cat.name,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      active: cat.active !== false,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, values);
        setToastMsg('Category updated successfully.');
      } else {
        await createCategory({
          ...values,
          slug: values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        });
        setToastMsg('Category created successfully.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to save category:', err);
      alert(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteCategory(id);
      if (!res.success) {
        alert(res.message || 'Cannot delete category.');
        return;
      }
      setToastMsg('Category deleted successfully.');
      loadData();
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      alert('Failed to delete category.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="flex items-center justify-between p-4 bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="p-1 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Category Management</h1>
          <p className="text-xs text-slate-500 mt-1">Organize hardware products into clear lines for customer browsing.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* CATEGORIES GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <FolderTree className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-navy-950 text-sm">No Categories Defined</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow"
          >
            Create First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <FolderTree className="w-8 h-8 text-slate-300" />
                  )}
                  <span
                    className={`absolute top-2 right-2 px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                      cat.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat.active !== false ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="text-sm font-bold text-navy-950">{cat.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{cat.description || 'No description provided.'}</p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(cat)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-navy-950">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  placeholder="e.g. Plumbing & Pipes"
                />
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  placeholder="Pipes, fittings, valves..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  {...register('imageUrl')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  placeholder="https://images.unsplash.com/..."
                />
                {errors.imageUrl && <p className="mt-1 text-xs text-rose-500">{errors.imageUrl.message}</p>}
              </div>

              {watchImageUrl && watchImageUrl.trim() !== '' && (
                <div className="h-24 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                  <img
                    src={watchImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  {...register('active')}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="activeCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Active (Visible on public site)
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
