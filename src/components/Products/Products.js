import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle,
  Clock,
  Download,
  ScanLine
} from 'lucide-react';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import BarcodeMachine from '../BarcodeMachine/BarcodeMachine';
import { getPlanLimits } from '../../utils/planUtils';

const Products = () => {
  const { state, dispatch } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');

  const itemsPerPage = 10;

  // Plan limits
  const { maxProducts } = getPlanLimits(state.currentPlan);
  const totalProducts = state.products.length;
  const atProductLimit = maxProducts !== 'unlimited' && totalProducts >= maxProducts;

  // Filter products
  const filteredProducts = state.products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  );

  const handleScan = (barcode) => {
    console.log('Scanned barcode in Products:', barcode);
    setShowScanner(false);
    
    // Check if product exists with this barcode
    const existingProduct = state.products.find(p => p.barcode === barcode);
    
    if (existingProduct) {
      // If product exists, just show info
      alert(`Product "${existingProduct.name}" already exists with this barcode.`);
    } else {
      // If not exists, open add modal with barcode pre-filled
      setScannedBarcode(barcode);
      setShowAddModal(true);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Stats
  const lowStockProducts = state.products.filter(product => 
    (product.stock || 0) <= state.lowStockThreshold
  ).length;

  const expiringProducts = state.products.filter(product => {
    if (!product.expiryDate) return false;
    const expiryDate = new Date(product.expiryDate);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= state.expiryDaysThreshold && diffDays >= 0;
  }).length;

  // CRUD handlers
  const handleAddProduct = (productData) => {
    const newProduct = {
      id: Date.now().toString(),
      ...productData,
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    dispatch({ 
      type: 'ADD_ACTIVITY', 
      payload: {
        id: Date.now().toString(),
        message: `Product "${newProduct.name}" added`,
        timestamp: new Date().toISOString(),
        type: 'product_added'
      }
    });
    setShowAddModal(false);
  };

  const handleEditProduct = (productData) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: productData });
    dispatch({ 
      type: 'ADD_ACTIVITY', 
      payload: {
        id: Date.now().toString(),
        message: `Product "${productData.name}" updated`,
        timestamp: new Date().toISOString(),
        type: 'product_updated'
      }
    });
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleDeleteProduct = (productId) => {
    const product = state.products.find(p => p.id === productId);
    if (window.confirm(`Are you sure you want to delete "${product?.name}"?`)) {
      dispatch({ type: 'DELETE_PRODUCT', payload: productId });
      dispatch({ 
        type: 'ADD_ACTIVITY', 
        payload: {
          id: Date.now().toString(),
          message: `Product "${product?.name}" deleted`,
          timestamp: new Date().toISOString(),
          type: 'product_deleted'
        }
      });
    }
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const exportProducts = () => {
    const csvContent = [
      ['Name', 'Category', 'Price', 'Stock', 'Barcode', 'Expiry Date'],
      ...state.products.map(product => [
        product.name,
        product.category || '',
        product.price || 0,
        product.stock || 0,
        product.barcode || '',
        product.expiryDate || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-600">
            Manage your product inventory
            {maxProducts !== 'unlimited' && (
              <span className="ml-2 text-blue-600 font-medium">
                ({totalProducts}/{maxProducts})
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="btn-secondary flex items-center text-sm"
          >
            <ScanLine className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Barcode Machine</span>
            <span className="sm:hidden">Machine</span>
          </button>
          <button
            onClick={exportProducts}
            className="btn-secondary flex items-center text-sm"
          >
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={() => {
              if (atProductLimit) {
                if (window.showToast) {
                  window.showToast(`Product limit reached! Upgrade your plan to add more products or delete existing ones.`, 'warning');
                }
                return;
              }
              setShowAddModal(true);
            }}
            className={`flex items-center text-sm ${
              atProductLimit 
                ? 'btn-secondary opacity-50 cursor-not-allowed' 
                : 'btn-primary'
            }`}
            disabled={atProductLimit}
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{lowStockProducts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{expiringProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex-1 w-full sm:max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-auto">
            <select className="input-field w-full sm:w-auto">
              <option value="">All Categories</option>
              <option value="grocery">Grocery</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="dairy">Dairy</option>
              <option value="beverages">Beverages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table - Desktop View */}
      <div className="card hidden md:block">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center ${product.imageUrl ? 'hidden' : 'flex'}`}
                        >
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description || 'No description'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.quantityUnit || 'pcs'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (product.stock || 0) <= state.lowStockThreshold 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.stock || 0}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.barcode || 'N/A'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 space-y-3 sm:space-y-0 px-2 sm:px-0">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Cards - Mobile View */}
      <div className="md:hidden space-y-3">
        {paginatedProducts.map((product) => (
          <div key={product.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 h-12 w-12">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center ${product.imageUrl ? 'hidden' : 'flex'}`}
                  >
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                  <div className="text-xs text-gray-500 line-clamp-2">{product.description || 'No description'}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category || 'Uncategorized'}
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                      {product.quantityUnit || 'pcs'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      (product.stock || 0) <= state.lowStockThreshold 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      Stock: {product.stock || 0}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <div>Barcode: {product.barcode || 'N/A'}</div>
                    <div>Expiry: {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2 ml-2">
                <button
                  onClick={() => handleEditClick(product)}
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Pagination - Mobile */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between space-y-3 pt-2">
            <div className="text-xs text-gray-700 text-center">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} results
            </div>
            <div className="flex items-center space-x-2 w-full">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex-1 px-4 py-2 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-xs font-medium text-gray-700 whitespace-nowrap">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex-1 px-4 py-2 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddProductModal
          onClose={() => {
            setShowAddModal(false);
            setScannedBarcode(''); // Reset barcode when closing
          }}
          onSave={(data) => {
            handleAddProduct(data);
            setScannedBarcode(''); // Reset after save
          }}
          scannedBarcode={scannedBarcode}
        />
      )}

      {showEditModal && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onSave={handleEditProduct}
        />
      )}

      {showScanner && (
        <BarcodeMachine
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default Products;
