import React from 'react';

const Transfers = () => {
  // TODO: Implement fetching, searching, pagination, and CRUD logic
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Transfers</h1>
        <button className="bg-primary text-white px-4 py-2 rounded">Create Transfer</button>
      </div>
      {/* Table placeholder */}
      <div className="bg-white rounded shadow p-4">Transfers table here</div>
    </div>
  );
};

export default Transfers; 