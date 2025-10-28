import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, MicOff } from 'lucide-react';

const AddCustomerModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    balanceDue: 0
  });
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [currentField, setCurrentField] = useState('name');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'balanceDue' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter customer name');
      return;
    }
    onSubmit(formData);
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
        console.log('Current field:', currentField, 'Transcript:', transcript);
        // Only update the current field that was being recorded
        setFormData(prev => {
          const updated = { ...prev };
          // If this is the first time for this field, use transcript directly
          // Otherwise append
          updated[currentField] = prev[currentField] ? prev[currentField] + ' ' + transcript : transcript;
          return updated;
        });
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      // Cleanup on unmount or when currentField changes
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentField]);

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

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Add New Customer</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">
              Customer Name *
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setCurrentField('name')}
                className="input-field pr-12"
                placeholder="Enter customer name"
                required
              />
              <button
                type="button"
                onClick={() => { setCurrentField('name'); toggleListening(); }}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                  isListening 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-600 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onFocus={() => setCurrentField('phone')}
                className="input-field pr-12"
                placeholder="Enter phone number"
              />
              <button
                type="button"
                onClick={() => { setCurrentField('phone'); toggleListening(); }}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                  isListening 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title="Start voice input for phone"
              >
                {isListening && currentField === 'phone' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
              Email (Optional)
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setCurrentField('email')}
                className="input-field pr-12"
                placeholder="Enter email address"
              />
              <button
                type="button"
                onClick={() => { setCurrentField('email'); toggleListening(); }}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                  isListening 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title="Start voice input for email"
              >
                {isListening && currentField === 'email' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-600 mb-1">
              Address (Optional)
            </label>
            <div className="relative">
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onFocus={() => setCurrentField('address')}
                rows={3}
                className="input-field pr-12"
                placeholder="Enter address"
              />
              <button
                type="button"
                onClick={() => { setCurrentField('address'); toggleListening(); }}
                className={`absolute right-3 top-2 p-1 rounded-full ${
                  isListening 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title="Start voice input for address"
              >
                {isListening && currentField === 'address' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="balanceDue" className="block text-sm font-medium text-gray-600 mb-1">
              Initial Balance Due (₹)
            </label>
            <input
              type="number"
              id="balanceDue"
              name="balanceDue"
              value={formData.balanceDue}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="input-field"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;
