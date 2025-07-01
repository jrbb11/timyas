import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Accounts from '../pages/Accounts';
import Deposits from '../pages/Deposits';
import Expenses from '../pages/Expenses';
import Transfers from '../pages/Transfers';
import PaymentMethods from '../pages/PaymentMethods';
import Ledger from '../pages/Ledger';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/deposits" element={<Deposits />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/transfers" element={<Transfers />} />
      <Route path="/payment-methods" element={<PaymentMethods />} />
      <Route path="/ledger" element={<Ledger />} />
    </Routes>
  );
};

export default AppRoutes; 