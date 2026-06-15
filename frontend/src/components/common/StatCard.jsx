const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', text: 'text-green-600' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-600' },
    red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', text: 'text-red-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
              <span className="text-gray-400 font-normal">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.icon}`}>
            <Icon className="text-2xl" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
