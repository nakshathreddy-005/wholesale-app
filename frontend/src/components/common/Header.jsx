import { MdMenu, MdNotifications, MdWarning } from 'react-icons/md';
import { useProductStore } from '../../store/productStore';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Header = ({ onMenuClick, title }) => {
  const { lowStockProducts, fetchLowStock } = useProductStore();

  useEffect(() => { fetchLowStock(); }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <MdMenu className="text-xl" />
        </button>
        <h2 className="font-semibold text-gray-800 text-lg">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {lowStockProducts.length > 0 && (
          <Link to="/inventory" className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors">
            <MdWarning className="text-amber-500" />
            <span>{lowStockProducts.length} Low Stock</span>
          </Link>
        )}
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <MdNotifications className="text-primary-600" />
        </div>
      </div>
    </header>
  );
};

export default Header;
