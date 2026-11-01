//pārbauda visu ko izsauc caur api 
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Users from './pages/Users.jsx';
import UserForm from './pages/UserForm.jsx';
import Products from './pages/Products.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Orders from './pages/Orders.jsx';
import OrderNew from './pages/OrderNew.jsx';
import Placement from './pages/Placement.jsx';
import DataEntry from './pages/DataEntry.jsx';
import Locations from './pages/Locations.jsx';
import Reports from './pages/Reports.jsx';
import Forbidden from './pages/Forbidden.jsx';

const ROUTES = [
  ['/users', 'user:read', <Users />],
  ['/users/new', 'user:create', <UserForm />],
  ['/users/:id/edit', 'user:update', <UserForm />],
  ['/products', 'product:read', <Products />],
  ['/products/new', 'product:create', <ProductForm />],
  ['/products/:id/edit', 'product:update', <ProductForm />],
  ['/orders', 'order:read', <Orders />],
  ['/orders/new', 'order:create', <OrderNew />],
  ['/placement', 'placement:write', <Placement />],
  ['/data-entry', 'placement:write', <DataEntry />],
  ['/locations', 'location:manage', <Locations />],
  ['/reports', 'report:read', <Reports />],
];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        {ROUTES.map(([path, perm, page]) => (
          <Route key={path} path={path} element={<ProtectedRoute permission={perm}>{page}</ProtectedRoute>} />
        ))}
        <Route path="*" element={<Forbidden />} />
      </Route>
    </Routes>
  );
}
