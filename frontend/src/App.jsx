import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './routes/ProtectedRoute';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import ChatBot from './pages/ChatBot';

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '10px', fontSize: '14px', fontWeight: '500' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/chatbot" element={<ChatBot />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
