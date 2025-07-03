import AdminLayout from '../../layouts/AdminLayout';
import { FaSearch } from 'react-icons/fa';

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
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search stock counts..."
                className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg w-full text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
              />
            </div>
          </div>
          <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-900 transition ml-auto" type="button">Count</button>
        </div>
        <div className="bg-white rounded-xl shadow p-0 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-semibold"><input type="checkbox" /></th>
                <th className="p-4 text-left font-semibold">Date</th>
                <th className="p-4 text-left font-semibold">Warehouse</th>
                <th className="p-4 text-left font-semibold">File</th>
              </tr>
            </thead>
            <tbody>
              {mockCounts.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-400" colSpan={4}>No stock counts found</td>
                </tr>
              ) : (
                mockCounts.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="p-4"><input type="checkbox" /></td>
                    <td className="p-4">{row.date}</td>
                    <td className="p-4">{row.warehouse}</td>
                    <td className="p-4">
                      <a href={row.file} className="text-purple-600 hover:underline">Download</a>
                    </td>
                  </tr>
                ))
              )}
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