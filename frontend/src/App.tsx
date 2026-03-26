import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layouts/AppLayout";
import { RouteFallback } from "@/components/RouteFallback";
import { AdminRoute } from "@/routes/AdminRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

const Home = lazy(() => import("@/pages/Home").then((m) => ({ default: m.Home })));
const Login = lazy(() => import("@/pages/Login").then((m) => ({ default: m.Login })));
const Register = lazy(() =>
  import("@/pages/Register").then((m) => ({ default: m.Register }))
);
const Cart = lazy(() => import("@/pages/Cart").then((m) => ({ default: m.Cart })));
const Orders = lazy(() => import("@/pages/Orders").then((m) => ({ default: m.Orders })));
const Addresses = lazy(() =>
  import("@/pages/Addresses").then((m) => ({ default: m.Addresses }))
);
const AdminDashboard = lazy(() =>
  import("@/pages/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard }))
);
const AdminInventory = lazy(() =>
  import("@/pages/admin/AdminInventory").then((m) => ({ default: m.AdminInventory }))
);
const AdminOrders = lazy(() =>
  import("@/pages/admin/AdminOrders").then((m) => ({ default: m.AdminOrders }))
);

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<Orders />} />
          <Route path="addresses" element={<Addresses />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/inventory" element={<AdminInventory />} />
          <Route path="admin/orders" element={<AdminOrders />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
