import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Category, Product } from "@/types/models";

const CATS: Category[] = ["Vegetables", "Fruits", "Dairy", "Snacks"];

/** Admin CRUD for products + Supabase Storage image upload. */
export function AdminInventory() {
  const { getAccessToken } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("1.99");
  const [stock, setStock] = useState("10");
  const [category, setCategory] = useState<Category>("Vegetables");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  /** Row being edited: draft mirrors form fields for PATCH. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftPrice, setDraftPrice] = useState("");
  const [draftStock, setDraftStock] = useState("");
  const [draftCategory, setDraftCategory] = useState<Category>("Vegetables");
  const [draftImageUrl, setDraftImageUrl] = useState<string | null>(null);

  const products = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.adminProducts(token);
    },
  });

  const low = useQuery({
    queryKey: ["admin", "low-stock"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.adminLowStock(token);
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.adminCreateProduct(token, {
        name,
        price: Number(price),
        category,
        stock: Number(stock),
        image_url: imageUrl,
      });
    },
    onSuccess: () => {
      toast.success("Product created");
      setName("");
      setImageUrl(null);
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["admin", "low-stock"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: {
        name: string;
        price: number;
        category: string;
        stock: number;
        image_url: string | null;
      };
    }) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.adminUpdateProduct(token, id, body);
    },
    onSuccess: () => {
      toast.success("Product updated");
      setEditingId(null);
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["admin", "low-stock"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.adminDeleteProduct(token, id);
    },
    onSuccess: () => {
      toast.success("Deleted");
      setEditingId(null);
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(p: Product) {
    setEditingId(p.id);
    setDraftName(p.name);
    setDraftPrice(String(p.price));
    setDraftStock(String(p.stock));
    setDraftCategory(p.category);
    setDraftImageUrl(p.image_url);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (!editingId) return;
    update.mutate({
      id: editingId,
      body: {
        name: draftName.trim(),
        price: Number(draftPrice),
        category: draftCategory,
        stock: Number(draftStock),
        image_url: draftImageUrl,
      },
    });
  }

  async function onFile(file: File | null, forCreate: boolean) {
    if (!file) return;
    if (!supabase) {
      toast.error("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env for uploads.");
      return;
    }
    setUploading(true);
    try {
      const safe = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
      const { error } = await supabase.storage.from("product-images").upload(safe, file, {
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(safe);
      if (forCreate) {
        setImageUrl(data.publicUrl);
      } else {
        setDraftImageUrl(data.publicUrl);
      }
      toast.success("Image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-market-ink dark:text-white">Inventory</h1>
        <p className="text-sm text-market-muted dark:text-stone-400">
          Create, update, and delete products. Images go to Supabase Storage bucket{" "}
          <code className="rounded-md bg-market-sand/80 px-1.5 py-0.5 font-mono text-xs dark:bg-stone-800">product-images</code>.
        </p>
      </div>

      {low.data && low.data.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <span className="font-bold">Low stock:</span>{" "}
          {low.data.map((p: Product) => `${p.name} (${p.stock})`).join(", ")}
        </div>
      )}

      <form
        className="card-elevated grid gap-4 p-6 md:grid-cols-2 md:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <label className="text-xs font-semibold uppercase text-zinc-500 md:col-span-2">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs font-semibold uppercase text-zinc-500">
          Price
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs font-semibold uppercase text-zinc-500">
          Stock
          <input
            required
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs font-semibold uppercase text-zinc-500 md:col-span-2">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {CATS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase text-zinc-500">Product image</p>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => void onFile(e.target.files?.[0] ?? null, true)}
            className="mt-2 text-sm"
          />
          {imageUrl ? (
            <p className="mt-2 truncate text-xs text-zinc-500">
              URL: <span className="font-mono">{imageUrl}</span>
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-brand-600 md:col-span-2"
        >
          {create.isPending ? "Saving…" : "Add product"}
        </button>
      </form>

      <div className="card-elevated overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-market-sand/80 bg-market-sand/30 text-left text-xs font-bold uppercase tracking-wider text-market-muted dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-market-sand/60 dark:divide-stone-800">
            {(products.data ?? []).map((p) =>
              editingId === p.id ? (
                <tr key={p.id} className="bg-market-terralight/20 dark:bg-stone-900/40">
                  <td className="px-4 py-3 align-top" colSpan={4}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-500">
                        Name
                        <input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </label>
                      <label className="text-[10px] font-bold uppercase text-zinc-500">
                        Category
                        <select
                          value={draftCategory}
                          onChange={(e) => setDraftCategory(e.target.value as Category)}
                          className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          {CATS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-[10px] font-bold uppercase text-zinc-500">
                        Price
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={draftPrice}
                          onChange={(e) => setDraftPrice(e.target.value)}
                          className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </label>
                      <label className="text-[10px] font-bold uppercase text-zinc-500">
                        Stock
                        <input
                          type="number"
                          min="0"
                          value={draftStock}
                          onChange={(e) => setDraftStock(e.target.value)}
                          className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </label>
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-bold uppercase text-zinc-500">Replace image</p>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploading}
                          onChange={(e) => void onFile(e.target.files?.[0] ?? null, false)}
                          className="mt-1 text-xs"
                        />
                        {draftImageUrl ? (
                          <p className="mt-1 truncate text-[10px] text-zinc-500">{draftImageUrl}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit()}
                        disabled={update.isPending}
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {update.isPending ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs font-semibold text-zinc-600 hover:underline dark:text-zinc-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
              <tr key={p.id} className="bg-white/40 dark:bg-transparent">
                <td className="px-4 py-3 font-medium text-market-ink dark:text-white">
                    <div className="flex items-center gap-2">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : null}
                      {p.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.category}</td>
                  <td className="px-4 py-3">${Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock < 10 ? "font-bold text-amber-600" : ""}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="mr-3 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => del.mutate(p.id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
