import AdminLayout from '../../layouts/AdminLayout';
import { FaSearch } from 'react-icons/fa';

interface Shipment {
  id: number;
  date: string;
  shipmentRef: string;
  saleRef: string;
  customer: string;
  warehouse: string;
  status: string;
}

const mockShipments: Shipment[] = [
  // Example: { id: 1, date: '2025-02-14', shipmentRef: 'SH_1001', saleRef: 'SL_1606', customer: 'Ronald Estrella', warehouse: 'Main Timyas Lechon Manok', status: 'Shipped' },
];

const Shipments = () => {
  return (
    <AdminLayout
      title="Shipments"
      breadcrumb={<span>Sales &gt; <span className="text-gray-900">Shipments</span></span>}
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
                placeholder="Search shipments..."
                className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg w-full text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
              />
            </div>
          </div>
          {/* Add action buttons here if needed */}
        </div>
        <div className="bg-white rounded-xl shadow p-0 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-semibold"><input type="checkbox" /></th>
                <th className="p-4 text-left font-semibold">Date</th>
                <th className="p-4 text-left font-semibold">Shipment Ref</th>
                <th className="p-4 text-left font-semibold">Sale Ref</th>
                <th className="p-4 text-left font-semibold">Customer</th>
                <th className="p-4 text-left font-semibold">Warehouse</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockShipments.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-400" colSpan={8}>No data for table</td>
                </tr>
              ) : (
                mockShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b hover:bg-gray-50">
                    <td className="p-4"><input type="checkbox" /></td>
                    <td className="p-4">{shipment.date}</td>
                    <td className="p-4">{shipment.shipmentRef}</td>
                    <td className="p-4">{shipment.saleRef}</td>
                    <td className="p-4">{shipment.customer}</td>
                    <td className="p-4">{shipment.warehouse}</td>
                    <td className="p-4">{shipment.status}</td>
                    <td className="p-4">...</td>
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
            0 of 0
            <button className="ml-4 px-2 py-1" disabled>prev</button>
            <button className="ml-2 px-2 py-1" disabled>next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Shipments; 