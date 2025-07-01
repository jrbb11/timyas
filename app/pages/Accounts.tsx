import React from 'react';

const Accounts = () => {
  // TODO: Implement fetching, searching, pagination, and CRUD logic
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <button className="bg-primary text-white px-4 py-2 rounded">Create Account</button>
      </div>
      {/* Table placeholder */}
      <div className="bg-white rounded shadow p-4">Accounts table here</div>
    </div>
  );
};

export default Accounts; 