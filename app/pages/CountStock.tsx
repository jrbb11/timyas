import AdminLayout from '../layouts/AdminLayout';

const mockCounts = [
  { id: 1, date: '2025-02-14', warehouse: 'Commisary', file: '#' },
  { id: 2, date: '2024-03-19', warehouse: 'Timyas Laguna', file: '#' },
];

const CountStock = () => {
  return (
    <AdminLayout
      title="Count Stock"
      breadcrumb={<span>Products &gt; <span className="text-gray-900">Count Stock</span></span>}
    >
      <div className="py-6 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search this table"
              className="border rounded px-3 py-2 w-full max-w-xs"
            />
          </div>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Count</button>
        </div>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-semibold"><input type="checkbox" /></th>
                <th className="p-3 text-left font-semibold">Date</th>
                <th className="p-3 text-left font-semibold">Warehouse</th>
                <th className="p-3 text-left font-semibold">File</th>
              </tr>
            </thead>
            <tbody>
              {mockCounts.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="p-3"><input type="checkbox" /></td>
                  <td className="p-3">{row.date}</td>
                  <td className="p-3">{row.warehouse}</td>
                  <td className="p-3">
                    <a href={row.file} className="text-purple-600 hover:underline">Download</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div>
            Rows per page:
            <select className="ml-2 border rounded px-2 py-1">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
          <div>
            1 - {mockCounts.length} of {mockCounts.length}
            <button className="ml-4 px-2 py-1" disabled>prev</button>
            <button className="ml-2 px-2 py-1" disabled>next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CountStock; 