import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  MdDashboard, MdInventory, MdPeople, MdLocalShipping,
  MdReceipt, MdBarChart, MdChatBubble, MdLogout, MdStore,
  MdCategory, MdWarning
} from 'react-icons/md';

const navItems = [
  { to: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
  { to: '/products', icon: MdCategory, label: 'Products' },
  { to: '/inventory', icon: MdInventory, label: 'Inventory' },
  { to: '/customers', icon: MdPeople, label: 'Customers' },
  { to: '/suppliers', icon: MdLocalShipping, label: 'Suppliers' },
  { to: '/billing', icon: MdReceipt, label: 'Billing' },
  { to: '/reports', icon: MdBarChart, label: 'Reports' },
  { to: '/chatbot', icon: MdChatBubble, label: 'AI Bot' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-primary-900 to-primary-800
        z-30 flex flex-col transition-transform duration-300 shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <MdStore className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">WholeSale Pro</h1>
              <p className="text-primary-300 text-xs">Inventory & Billing</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="text-lg flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-primary-300 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-300 hover:text-red-200 hover:bg-red-500/20"
          >
            <MdLogout className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
