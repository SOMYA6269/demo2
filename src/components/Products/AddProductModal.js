import React, { useState, useRef, useEffect } from 'react';
import { X, Package, Camera, Mic, MicOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const AddProductModal = ({ onClose, onSave, scannedBarcode = '' }) => {
  const { state } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    stock: '',
    barcode: scannedBarcode, // Use scanned barcode if provided
    expiryDate: '',
    mfgDate: '',
    costPrice: '',
    sellingPrice: '',
    quantityUnit: 'pcs',
    imageUrl: ''
  });

  // Update barcode when scannedBarcode prop changes
  useEffect(() => {
    if (scannedBarcode) {
      setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
    }
  }, [scannedBarcode]);

  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    
    // Strict integer handling for stock
    if (name === 'stock') {
      value = value.replace(/[^0-9]/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-suggest image when product name changes (deterministic mapping)
    if (name === 'name' && value.trim()) {
      const suggestedImageUrl = getSuggestedImageUrl(value);
      setFormData(prev => ({ ...prev, imageUrl: suggestedImageUrl }));
    }
    
    // Search for product by barcode when barcode changes
    if (name === 'barcode' && value.trim()) {
      searchProductByBarcode(value);
    }
  };

  // Search for existing product by barcode
  const searchProductByBarcode = (barcode) => {
    if (!barcode.trim()) return;
    
    // Search in existing products
    const existingProduct = state.products.find(p => p.barcode === barcode);
    
    if (existingProduct) {
      // Auto-fill product details if found
      setFormData(prev => ({
        ...prev,
        name: existingProduct.name,
        description: existingProduct.description || '',
        category: existingProduct.category || '',
        costPrice: existingProduct.costPrice || '',
        sellingPrice: existingProduct.sellingPrice || '',
        quantityUnit: existingProduct.quantityUnit || 'pcs',
        imageUrl: existingProduct.imageUrl || getSuggestedImageUrl(existingProduct.name)
      }));
      
      // Show notification
      window.showToast(`Product "${existingProduct.name}" found! Details auto-filled.`, 'success');
    } else {
      // Clear name if barcode doesn't match any product
      setFormData(prev => ({ ...prev, name: '' }));
    }
  };

  // Get suggested image URL based on product name (deterministic map with fallback)
  const getSuggestedImageUrl = (productName) => {
    const name = productName.toLowerCase().trim();
    
    const imageMap = {
      'sugar': 'https://images.unsplash.com/photo-1603052875692-95b53c0a35d1?w=300&h=300&fit=crop&q=80',
      'chini': 'https://images.unsplash.com/photo-1603052875692-95b53c0a35d1?w=300&h=300&fit=crop&q=80',
      'salt': 'https://images.unsplash.com/photo-1615485737652-4a4a26c7c0e0?w=300&h=300&fit=crop&q=80',
      'namak': 'https://images.unsplash.com/photo-1615485737652-4a4a26c7c0e0?w=300&h=300&fit=crop&q=80',
      'rice': 'https://images.unsplash.com/photo-1604908554049-1c77f8d6502c?w=300&h=300&fit=crop&q=80',
      'chawal': 'https://images.unsplash.com/photo-1604908554049-1c77f8d6502c?w=300&h=300&fit=crop&q=80',
      'atta': 'https://images.unsplash.com/photo-1586201375754-1421dfb9c7f8?w=300&h=300&fit=crop&q=80',
      'aata': 'https://images.unsplash.com/photo-1586201375754-1421dfb9c7f8?w=300&h=300&fit=crop&q=80',
      'flour': 'https://images.unsplash.com/photo-1586201375754-1421dfb9c7f8?w=300&h=300&fit=crop&q=80',
      'dal': 'https://images.unsplash.com/photo-1615485737725-b4f6b8b9a9f7?w=300&h=300&fit=crop&q=80',
      'pulses': 'https://images.unsplash.com/photo-1615485737725-b4f6b8b9a9f7?w=300&h=300&fit=crop&q=80',
      'oil': 'https://images.unsplash.com/photo-1510627498534-cf7e9002facc?w=300&h=300&fit=crop&q=80',
      'milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop&q=80',
      'bread': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300&h=300&fit=crop&q=80',
      'tea': 'https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?w=300&h=300&fit=crop&q=80',
      'chai': 'https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?w=300&h=300&fit=crop&q=80',
      'coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop&q=80',
      'biscuit': 'https://images.unsplash.com/photo-1541976076758-347942db1970?w=300&h=300&fit=crop&q=80',
      'biscuits': 'https://images.unsplash.com/photo-1541976076758-347942db1970?w=300&h=300&fit=crop&q=80',
      'masala': 'https://images.unsplash.com/photo-1604908176997-7a90bf34e66e?w=300&h=300&fit=crop&q=80',
      'spice': 'https://images.unsplash.com/photo-1604908176997-7a90bf34e66e?w=300&h=300&fit=crop&q=80',
      'soap': 'https://images.unsplash.com/photo-1585238342028-4bbc3f52a5c9?w=300&h=300&fit=crop&q=80',
      'shampoo': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=300&fit=crop&q=80',
      'salted peanuts': 'https://images.unsplash.com/photo-1585238342275-1f58b1f11516?w=300&h=300&fit=crop&q=80',
      'butter': 'https://images.unsplash.com/photo-1583947581924-860b9f7a3a26?w=300&h=300&fit=crop&q=80'
    };

    if (imageMap[name]) return imageMap[name];
    for (const key of Object.keys(imageMap)) {
      if (name.includes(key)) return imageMap[key];
    }
    const searchTerm = encodeURIComponent(name);
    return `https://source.unsplash.com/300x300/?${searchTerm},grocery&fit=crop&q=80`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter product name');
      return;
    }
    
    const productData = {
      ...formData,
      stock: parseInt(formData.stock) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      quantityUnit: formData.quantityUnit || 'pcs'
    };
    
    onSave(productData);
  };

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setFormData(prev => ({ ...prev, name: transcript }));
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
      }
    }
  };

  const handleScanResult = (result) => {
    setFormData(prev => ({
      ...prev,
      barcode: result
    }));
    setIsScannerActive(false);
  };

  // Note: Scanner integration would be implemented here
  // For now, this is a placeholder for future barcode scanning functionality

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg mr-2 sm:mr-3">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add New Product</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Product Image Preview */}
          {formData.imageUrl && (
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={formData.imageUrl}
                alt="Product preview"
                className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                  console.log('Image failed to load:', formData.imageUrl);
                }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Product Image Preview</p>
                <p className="text-xs text-gray-500">Auto-suggested based on product name</p>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                  className="text-xs text-red-600 hover:text-red-800 mt-1"
                >
                  Remove Image
                </button>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pr-10 sm:pr-12"
                  placeholder="Enter product name"
                  required
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 sm:p-1.5 rounded-full transition ${
                    isListening 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Mic className="h-3 w-3 sm:h-4 sm:w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select Category</option>
                <option value="grocery">Grocery</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="dairy">Dairy</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
                <option value="household">Household</option>
                <option value="personal-care">Personal Care</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              rows={3}
              placeholder="Enter product description"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price (₹)
              </label>
              <input
                type="number"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Price (₹)
              </label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Unit *
              </label>
              <select
                name="quantityUnit"
                value={formData.quantityUnit || 'pcs'}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="gm">Grams (gm)</option>
                <option value="liters">Liters (L)</option>
                <option value="ml">Milliliters (mL)</option>
                <option value="boxes">Boxes</option>
                <option value="packets">Packets</option>
                <option value="bottles">Bottles</option>
              </select>
            </div>
          </div>

          {/* Inventory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="input-field"
                placeholder="0"
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MFG Date
              </label>
              <input
                type="date"
                name="mfgDate"
                value={formData.mfgDate}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Product Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image URL
            </label>
            <div className="flex space-x-3">
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="input-field flex-1"
                placeholder="Enter image URL or let auto-suggestion work"
              />
              <button
                type="button"
                onClick={() => {
                  const suggested = getSuggestedImageUrl(formData.name);
                  setFormData(prev => ({ ...prev, imageUrl: suggested }));
                }}
                className="btn-secondary flex items-center"
                disabled={!formData.name.trim()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Auto Suggest
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Type product name above to auto-suggest image, or enter custom URL
            </p>
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Enter barcode"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto order-1 sm:order-2"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
