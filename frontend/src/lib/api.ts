/**
 * REST client for the FastAPI backend. Sends Supabase access_token as Bearer JWT.
 */
import type {
  Address,
  CartItem,
  Dashboard,
  Me,
  Order,
  OrderDayPoint,
  Product,
  ProductPage,
} from "@/types/models";

const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: string = res.statusText;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
      else if (Array.isArray(body?.detail)) detail = JSON.stringify(body.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

function jsonAuthHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

/** -------- Public -------- */
export function getProducts(params: {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
}): Promise<ProductPage> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  if (params.search) q.set("search", params.search);
  if (params.category) q.set("category", params.category);
  return fetch(`${base}/products?${q.toString()}`).then((r) => parse<ProductPage>(r));
}

/** -------- Auth profile -------- */
export function getMe(token: string): Promise<Me> {
  return fetch(`${base}/auth/me`, { headers: jsonAuthHeaders(token) }).then((r) => parse<Me>(r));
}

/** -------- Cart -------- */
export function getCart(token: string): Promise<CartItem[]> {
  return fetch(`${base}/cart`, { headers: jsonAuthHeaders(token) }).then((r) => parse<CartItem[]>(r));
}

export function upsertCart(token: string, productId: string, quantity: number): Promise<CartItem[]> {
  return fetch(`${base}/cart`, {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ product_id: productId, quantity }),
  }).then((r) => parse<CartItem[]>(r));
}

export function patchCartLine(token: string, cartId: string, quantity: number): Promise<CartItem[]> {
  return fetch(`${base}/cart/${cartId}`, {
    method: "PATCH",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ quantity }),
  }).then((r) => parse<CartItem[]>(r));
}

export function removeCartLine(token: string, cartId: string): Promise<CartItem[]> {
  return fetch(`${base}/cart/${cartId}`, { method: "DELETE", headers: jsonAuthHeaders(token) }).then((r) =>
    parse<CartItem[]>(r)
  );
}

/** -------- Orders -------- */
export function getMyOrders(token: string): Promise<Order[]> {
  return fetch(`${base}/orders`, { headers: jsonAuthHeaders(token) }).then((r) => parse<Order[]>(r));
}

export function placeOrder(token: string, addressId?: string | null): Promise<Order> {
  return fetch(`${base}/orders`, {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ address_id: addressId ?? null }),
  }).then((r) => parse<Order>(r));
}

/** -------- Addresses -------- */
export function getAddresses(token: string): Promise<Address[]> {
  return fetch(`${base}/addresses`, { headers: jsonAuthHeaders(token) }).then((r) => parse<Address[]>(r));
}

export function createAddress(token: string, payload: { address_text: string; label?: string }) {
  return fetch(`${base}/addresses`, {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(payload),
  }).then((r) => parse<Address>(r));
}

export function updateAddress(
  token: string,
  id: string,
  payload: { address_text?: string; label?: string }
) {
  return fetch(`${base}/addresses/${id}`, {
    method: "PATCH",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(payload),
  }).then((r) => parse<Address>(r));
}

export function deleteAddress(token: string, id: string) {
  return fetch(`${base}/addresses/${id}`, { method: "DELETE", headers: jsonAuthHeaders(token) }).then((r) =>
    parse<{ ok: boolean }>(r)
  );
}

/** -------- Admin -------- */
export function adminDashboard(token: string): Promise<Dashboard> {
  return fetch(`${base}/admin/dashboard`, { headers: jsonAuthHeaders(token) }).then((r) =>
    parse<Dashboard>(r)
  );
}

export function adminOrdersDaily(token: string): Promise<OrderDayPoint[]> {
  return fetch(`${base}/admin/analytics/orders-per-day`, { headers: jsonAuthHeaders(token) }).then((r) =>
    parse<OrderDayPoint[]>(r)
  );
}

export function adminProducts(token: string): Promise<Product[]> {
  return fetch(`${base}/admin/products`, { headers: jsonAuthHeaders(token) }).then((r) => parse<Product[]>(r));
}

export function adminLowStock(token: string): Promise<Product[]> {
  return fetch(`${base}/admin/products/low-stock`, { headers: jsonAuthHeaders(token) }).then((r) =>
    parse<Product[]>(r)
  );
}

export function adminCreateProduct(
  token: string,
  body: { name: string; price: number; category: string; stock: number; image_url?: string | null }
): Promise<Product> {
  return fetch(`${base}/admin/products`, {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(body),
  }).then((r) => parse<Product>(r));
}

export function adminUpdateProduct(
  token: string,
  id: string,
  body: Partial<{ name: string; price: number; category: string; stock: number; image_url: string | null }>
): Promise<Product> {
  return fetch(`${base}/admin/products/${id}`, {
    method: "PATCH",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(body),
  }).then((r) => parse<Product>(r));
}

export function adminDeleteProduct(token: string, id: string) {
  return fetch(`${base}/admin/products/${id}`, { method: "DELETE", headers: jsonAuthHeaders(token) }).then((r) =>
    parse<{ ok: boolean }>(r)
  );
}

export function adminListOrders(token: string): Promise<Order[]> {
  return fetch(`${base}/admin/orders`, { headers: jsonAuthHeaders(token) }).then((r) => parse<Order[]>(r));
}

export function adminPatchOrderStatus(token: string, orderId: string, status: string) {
  return fetch(`${base}/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ status }),
  }).then((r) => parse<Order>(r));
}
