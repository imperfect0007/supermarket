import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import type { Address } from "@/types/models";

/** User delivery addresses: add, edit, delete (REST via FastAPI). */
export function Addresses() {
  const { getAccessToken } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [label, setLabel] = useState("Home");
  const [editing, setEditing] = useState<Address | null>(null);
  const [editText, setEditText] = useState("");
  const [editLabel, setEditLabel] = useState("");

  const q = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.getAddresses(token);
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.createAddress(token, { address_text: text, label });
    },
    onSuccess: () => {
      toast.success("Address saved");
      setText("");
      void qc.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { address_text: string; label?: string } }) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.updateAddress(token, id, payload);
    },
    onSuccess: () => {
      toast.success("Address updated");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.deleteAddress(token, id);
    },
    onSuccess: () => {
      toast.success("Deleted");
      void qc.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function beginEdit(a: Address) {
    setEditing(a);
    setEditText(a.address_text);
    setEditLabel(a.label ?? "Home");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-market-ink dark:text-white">Addresses</h1>
        <p className="mt-1 text-sm text-market-muted dark:text-stone-400">Where we deliver your orders.</p>
      </div>

      <form
        className="card-elevated space-y-5 p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">
            Label
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="input-market mt-2"
            />
          </label>
        </div>
        <label className="block text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">
          Full address
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="input-market mt-2"
          />
        </label>
        <button type="submit" disabled={create.isPending} className="btn-primary">
          {create.isPending ? "Saving…" : "Add address"}
        </button>
      </form>

      <ul className="space-y-4">
        {(q.data ?? []).map((a) => (
          <li
            key={a.id}
            className="card-elevated flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start"
          >
            {editing?.id === a.id ? (
              <form
                className="flex-1 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  patch.mutate({
                    id: a.id,
                    payload: { address_text: editText.trim(), label: editLabel },
                  });
                }}
              >
                <label className="block text-[10px] font-bold uppercase text-market-muted dark:text-stone-500">
                  Label
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="input-market mt-1 !py-2"
                  />
                </label>
                <label className="block text-[10px] font-bold uppercase text-market-muted dark:text-stone-500">
                  Address
                  <textarea
                    required
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="input-market mt-1"
                  />
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={patch.isPending} className="btn-primary !py-2 !text-xs">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="btn-ghost rounded-full !py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-market-terra dark:text-brand-400">
                  {a.label ?? "Address"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-market-ink dark:text-stone-300">{a.address_text}</p>
              </div>
            )}
            {editing?.id !== a.id ? (
              <div className="flex shrink-0 gap-3 sm:flex-col sm:items-end">
                <button
                  type="button"
                  onClick={() => beginEdit(a)}
                  className="text-xs font-semibold text-market-terra hover:underline dark:text-brand-400"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(a.id)}
                  className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
