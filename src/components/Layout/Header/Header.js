import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Menu, Bell, Clock, Globe } from 'lucide-react';
import NotificationsModal from '../NotificationsModal/NotificationsModal';
import { getTranslation } from '../../../utils/translations';

const Header = ({ onMenuClick }) => {
  const { state, dispatch } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const getViewTitle = (view) => {
    return getTranslation(view, state.currentLanguage);
  };

  const toggleLanguage = () => {
    const newLanguage = state.currentLanguage === 'en' ? 'hi' : 'en';
    dispatch({ type: 'SET_LANGUAGE', payload: newLanguage });
  };

  return (
    <header className="bg-gradient-to-r from-green-500 to-blue-500 shadow-lg border-b border-green-300 px-4 py-4 flex justify-between items-center flex-shrink-0 z-10">
      <div className="flex items-center space-x-6">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-white hover:text-green-100 hover:bg-green-400 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Page title */}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-sm">
          {getViewTitle(state.currentView)}
        </h1>

        {/* Current Time Display - Inline */}
        <div className="hidden sm:flex items-center space-x-2 text-white">
          <Clock className="w-5 h-5 text-green-100" />
          <span className="font-mono text-lg font-semibold tracking-wide">
            {state.currentTime}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-md text-white hover:text-green-100 hover:bg-green-400 transition-colors flex items-center space-x-1"
          title={`Switch to ${state.currentLanguage === 'en' ? 'Hindi' : 'English'}`}
        >
          <Globe className="h-5 w-5" />
          <span className="text-sm font-medium">
            {state.currentLanguage === 'en' ? 'हिं' : 'EN'}
          </span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(true)}
            className="p-2 rounded-md text-white hover:text-green-100 hover:bg-green-400 transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {/* Badge for alerts */}
            {(() => {
              const lowStockCount = state.products.filter(p => (p.stock || 0) <= state.lowStockThreshold).length;
              const expiringCount = state.products.filter(p => {
                if (!p.expiryDate) return false;
                const expiryDate = new Date(p.expiryDate);
                const now = new Date();
                const diffTime = expiryDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= state.expiryDaysThreshold;
              }).length;
              const totalAlerts = lowStockCount + expiringCount;
              return totalAlerts > 0 ? (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                  {totalAlerts}
                </span>
              ) : null;
            })()}
          </button>
        </div>

        {/* User menu */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-white">
              {state.currentUser?.username || 'User'}
            </p>
            <p className="text-xs text-orange-100">Admin</p>
          </div>
          <div className="flex-shrink-0">
            <img
              className="h-8 w-8 rounded-full ring-2 ring-white shadow-lg"
              src={`https://placehold.co/40x40/ffedd5/f97316?text=${state.currentUser?.username?.charAt(0).toUpperCase()}`}
              alt="User avatar"
            />
          </div>
        </div>
      </div>

      {showNotifications && (
        <NotificationsModal onClose={() => setShowNotifications(false)} />
      )}
    </header>
  );
};

export default Header;
