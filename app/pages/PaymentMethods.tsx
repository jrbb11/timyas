import React from 'react';

const PaymentMethods = () => {
  // TODO: Implement fetching, searching, pagination, and CRUD logic
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <button className="bg-primary text-white px-4 py-2 rounded">Create Payment Method</button>
      </div>
      {/* Table placeholder */}
      <div className="bg-white rounded shadow p-4">Payment Methods table here</div>
    </div>
  );
};

export default PaymentMethods; 