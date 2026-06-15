const Table = ({ columns, data, loading, emptyMessage = 'No data found' }) => {
  if (loading) {
    return (
      <div className="table-container">
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key || col.label}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || i}>
              {columns.map((col) => (
                <td key={col.key || col.label}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
