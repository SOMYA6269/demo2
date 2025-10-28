import React from 'react';
import { useApp } from '../../context/AppContext';
import Dashboard from '../Dashboard/Dashboard';
import Customers from '../Customers/Customers';
import Billing from '../Billing/Billing';
import Products from '../Products/Products';
import Inventory from '../Inventory/Inventory';
import Purchase from '../Purchase/Purchase';
import Financial from '../Financial/Financial';
import Assistant from '../Assistant/Assistant';
import Reports from '../Reports/Reports';
import Upgrade from '../Upgrade/Upgrade';
import Settings from '../Settings/Settings';

const Routes = () => {
  const { state } = useApp();

  const renderCurrentView = () => {
    switch (state.currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <Customers />;
      case 'billing':
        return <Billing />;
      case 'products':
        return <Products />;
      case 'inventory':
        return <Inventory />;
      case 'purchase':
        return <Purchase />;
      case 'financial':
        return <Financial />;
      case 'assistant':
        return <Assistant />;
      case 'reports':
        return <Reports />;
      case 'upgrade':
        return <Upgrade />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-full">
      {renderCurrentView()}
    </div>
  );
};

export default Routes;
