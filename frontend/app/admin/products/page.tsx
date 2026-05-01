"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Product } from "../../types";

const initialForm = {
  id: 0,
  name: "",
  description: "",
  image: "",
  price: "",
  stock: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  const loadProducts = async () => {
    if (!supabase) {
      setMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      setProducts([]);
      return;
    }

    const { data, error } = await supabase.from("products").select("id, name, description, image, price, stock").order("created_at", { ascending: false });
    if (error) {
      setMessage(error.message);
      setProducts([]);
      return;
    }

    setProducts((data || []) as Product[]);
  };

  useEffect(() => {
    // Initial async fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const imageUrl = form.image.trim();

    if (!imageUrl) {
      setMessage("Please add an image URL so the product photo appears on the storefront.");
      return;
    }

    if (!supabase) {
      setMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      image: imageUrl,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    if (form.id) {
      const { error } = await supabase.from("products").update(payload).eq("id", form.id);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Product added");
    }

    setForm(initialForm);
    await loadProducts();
  };

  const handleDelete = async (id: number) => {
    if (!supabase) {
      setMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Product deleted");
    await loadProducts();
  };

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Product Management</h1>
        <p className="text-lg text-gray-600">Add, edit, and manage your farm products</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="sticky top-24 rounded-lg border border-gray-200 bg-white p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-gray-900">{form.id ? "Edit Product" : "Add New Product"}</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Fresh Tomatoes"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-7 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
              <input
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                placeholder="0"
                type="number"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL *</label>
              <input
                value={form.image}
                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the product quality, origin, etc."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {message && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                <p className="font-semibold">{message}</p>
              </div>
            )}

            <button type="submit" className="w-full rounded-lg bg-green-700 px-4 py-3 text-white font-semibold hover:bg-green-800 transition-colors shadow-md">
              {form.id ? "Update Product" : "Add Product"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Products List</h2>
          {products.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <p className="text-gray-600">No products yet. Add your first product to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
                  <div className="flex gap-6">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-24 w-24 rounded-lg object-cover bg-gray-100"/>
                    )}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                        {product.description && <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>}
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <p className="text-gray-600">Price</p>
                          <p className="font-bold text-green-700">${Number(product.price).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Stock</p>
                          <p className="font-bold text-gray-900">{product.stock || 0} units</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() =>
                          setForm({
                            id: product.id,
                            name: product.name,
                            description: product.description || "",
                            image: product.image || "",
                            price: String(product.price),
                            stock: String(product.stock || 0),
                          })
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
