import AdminLayout from '../layouts/AdminLayout';

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
      <div className="py-6 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search this table"
              className="border rounded px-3 py-2 w-full max-w-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="border px-4 py-2 rounded text-green-600 border-green-400 hover:bg-green-50">PDF</button>
            <button className="border px-4 py-2 rounded text-red-600 border-red-400 hover:bg-red-50">EXCEL</button>
          </div>
        </div>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-semibold"><input type="checkbox" /></th>
                <th className="p-3 text-left font-semibold">Date</th>
                <th className="p-3 text-left font-semibold">Shipment Ref</th>
                <th className="p-3 text-left font-semibold">Sale Ref</th>
                <th className="p-3 text-left font-semibold">Customer</th>
                <th className="p-3 text-left font-semibold">Warehouse</th>
                <th className="p-3 text-left font-semibold">Status</th>
                <th className="p-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockShipments.length === 0 ? (
                <tr>
                  <td className="p-3 text-center text-gray-400" colSpan={8}>No data for table</td>
                </tr>
              ) : (
                mockShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3"><input type="checkbox" /></td>
                    <td className="p-3">{shipment.date}</td>
                    <td className="p-3">{shipment.shipmentRef}</td>
                    <td className="p-3">{shipment.saleRef}</td>
                    <td className="p-3">{shipment.customer}</td>
                    <td className="p-3">{shipment.warehouse}</td>
                    <td className="p-3">{shipment.status}</td>
                    <td className="p-3">...</td>
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