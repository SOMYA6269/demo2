import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingCart } from 'lucide-react';

const Login = () => {
  const { dispatch } = useApp();
  const [formData, setFormData] = useState({
    username: 'xyz',
    password: '123456'
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ Simple authentication check
    if (formData.username === 'xyz' && formData.password === '123456') {
      dispatch({ type: 'LOGIN', payload: formData });
      setError('');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-2xl mx-4">
        {/* DRAG & DROP Logo */}
        <div className="flex justify-center">
          <div className="text-center">
            {/* Logo Graphic */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              {/* Left D (Green) */}
              <div className="absolute left-0 w-12 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-l-full shadow-lg">
                <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                <div className="absolute top-1 left-1 w-2 h-2 bg-green-300 rounded-full"></div>
              </div>
              {/* Right D (Blue) */}
              <div className="absolute right-0 w-12 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-r-full shadow-lg">
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white transform rotate-45"></div>
                </div>
                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-300 rounded-full"></div>
              </div>
            </div>
            
            {/* Logo Text */}
            <h1 className="text-2xl font-bold text-green-700 mb-1">DRAG & DROP</h1>
            <p className="text-sm font-medium text-blue-700">Grocery Management</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-600">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-lg"
          >
            Login
          </button>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
