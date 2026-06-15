import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers',
  '/billing': 'Billing',
  '/reports': 'Reports & Analytics',
  '/chatbot': 'AI Billing Bot',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || 'WholeSale Pro';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
