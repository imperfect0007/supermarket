/** Shared API models aligned with FastAPI + Supabase schema. */

export type Category = "Vegetables" | "Fruits" | "Dairy" | "Snacks";

export interface Product {
  id: string;
  name: string;
  price: string;
  category: Category;
  stock: number;
  image_url: string | null;
  created_at?: string;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  name: string;
  price: string;
  category: string;
  image_url: string | null;
  stock: number;
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: string;
  product_name: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  total_price: string;
  status: "pending" | "delivered" | "cancelled";
  delivery_address_text: string | null;
  created_at: string;
  items: OrderItem[];
}

export interface Address {
  id: string;
  user_id: string;
  address_text: string;
  label: string | null;
  created_at: string;
}

export interface Me {
  id: string;
  email: string;
  role: "admin" | "user";
}

export interface Dashboard {
  total_users: number;
  total_orders: number;
  revenue_delivered: number;
  low_stock_count: number;
}

export interface OrderDayPoint {
  date: string;
  orders: number;
}
