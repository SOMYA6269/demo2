import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  Receipt, 
  User, 
  Package,
  Trash2,
  Download,
  Calculator,
  ScanLine,
  QrCode,
  Share2
} from 'lucide-react';
import jsPDF from 'jspdf';
import { calculatePriceWithUnitConversion, checkStockAvailability, convertToBaseUnit, convertFromBaseUnit } from '../../utils/unitConversion';
import QuantityModal from './QuantityModal';
import BarcodeMachine from '../BarcodeMachine/BarcodeMachine';
import UPIPaymentModal from './UPIPaymentModal';
import { getTranslation } from '../../utils/translations';

const Billing = () => {
  const { state, dispatch } = useApp();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [billItems, setBillItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showBarcodeMachine, setShowBarcodeMachine] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showUPIPayment, setShowUPIPayment] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);

  const showToast = (message, type = 'info') => {
    if (window.showToast) {
      window.showToast(message, type, 4000);
    }
  };

  // Get customers from state
  const allCustomers = state.customers;

  // Filter products based on search
  const filteredProducts = state.products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const subtotal = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = ((subtotal - discountAmount) * tax) / 100;
  const total = subtotal - discountAmount + taxAmount;

  const handleBarcodeScan = (barcode) => {
    console.log('Barcode scan handler called with:', barcode);
    console.log('All products:', state.products.map(p => ({ name: p.name, barcode: p.barcode })));
    
    const product = state.products.find(p => p.barcode === barcode);
    console.log('Found product:', product);
    
    if (product) {
      handleAddProduct(product); // Open quantity modal
    } else {
      const message = state.currentLanguage === 'hi' 
        ? `${getTranslation('productNotFound', state.currentLanguage)}: ${barcode}. ${getTranslation('pleaseAddProductFirst', state.currentLanguage)}.`
        : `${getTranslation('productNotFound', state.currentLanguage)}: ${barcode}. ${getTranslation('pleaseAddProductFirst', state.currentLanguage)}.`;
      showToast(message, 'error');
    }
    setBarcodeInput('');
  };

  const handleAddProduct = (product) => {
    setSelectedProduct(product);
    setShowQuantityModal(true);
  };

  const handleAddWithQuantity = (product, quantity, unit) => {
    // Use proper unit conversion to check stock availability
    const stockCheck = checkStockAvailability(product, quantity, unit);
    
    if (!stockCheck.available) {
      if (stockCheck.error) {
        showToast(stockCheck.error, 'error');
        return;
      }
      
      const message = state.currentLanguage === 'hi'
        ? `⚠️ ${getTranslation('lowStockWarning', state.currentLanguage)}! ${getTranslation('available', state.currentLanguage)}: ${stockCheck.stockDisplay}, ${getTranslation('requested', state.currentLanguage)}: ${stockCheck.requestedDisplay}. ${getTranslation('pleaseReduceQuantity', state.currentLanguage)}.`
        : `⚠️ ${getTranslation('lowStockWarning', state.currentLanguage)}! ${getTranslation('available', state.currentLanguage)}: ${stockCheck.stockDisplay}, ${getTranslation('requested', state.currentLanguage)}: ${stockCheck.requestedDisplay}. ${getTranslation('pleaseReduceQuantity', state.currentLanguage)}.`;
      showToast(message, 'warning');
      return;
    }
    
    // Check if product is already in bill and get total quantity requested
    const existingItemInBill = billItems.find(item => item.id === product.id);
    if (existingItemInBill) {
      // Check total quantity including existing items
      const totalStockCheck = checkStockAvailability(product, existingItemInBill.quantity + quantity, unit);
      if (!totalStockCheck.available) {
        const message = state.currentLanguage === 'hi'
          ? `⚠️ ${getTranslation('lowStockWarning', state.currentLanguage)}! Total ${getTranslation('requested', state.currentLanguage)}: ${totalStockCheck.requestedDisplay} exceeds ${getTranslation('available', state.currentLanguage)}: ${totalStockCheck.stockDisplay}.`
          : `⚠️ ${getTranslation('lowStockWarning', state.currentLanguage)}! Total ${getTranslation('requested', state.currentLanguage)}: ${totalStockCheck.requestedDisplay} exceeds ${getTranslation('available', state.currentLanguage)}: ${totalStockCheck.stockDisplay}.`;
        showToast(message, 'warning');
        return;
      }
    }
    
    const existingItem = billItems.find(item => 
      item.id === product.id && item.unit === unit
    );
    
    if (existingItem) {
      setBillItems(prev => prev.map(item =>
        item.id === product.id && item.unit === unit
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      const priceCalculation = calculatePriceWithUnitConversion(
        quantity, 
        unit, 
        product.sellingPrice || product.costPrice || 0,
        product.quantityUnit || 'pcs'
      );
      
      setBillItems(prev => [...prev, {
        id: product.id,
        name: product.name,
        price: priceCalculation.totalPrice / quantity, // Price per unit
        quantity: quantity,
        unit: unit,
        quantityUnit: product.quantityUnit || 'pcs',
        category: product.category,
        displayQuantity: priceCalculation.displayQuantity,
        maxStock: product.stock || 0, // Store original stock for reference
        baseUnit: stockCheck.baseUnit // Store base unit for proper comparison
      }]);
    }
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setBillItems(prev => prev.filter(item => item.id !== productId));
    } else {
      // Find the item and check stock with proper unit conversion
      const item = billItems.find(item => item.id === productId);
      if (item) {
        const product = state.products.find(p => p.id === productId);
        if (product) {
          const stockCheck = checkStockAvailability(product, quantity, item.unit);
          if (!stockCheck.available) {
            if (stockCheck.error) {
              showToast(stockCheck.error, 'error');
              return;
            }
            
            const message = state.currentLanguage === 'hi'
              ? `⚠️ ${getTranslation('lowStock', state.currentLanguage)}! ${getTranslation('available', state.currentLanguage)}: ${stockCheck.stockDisplay}. ${getTranslation('youCannotAddMore', state.currentLanguage)}.`
              : `⚠️ ${getTranslation('lowStock', state.currentLanguage)}! ${getTranslation('available', state.currentLanguage)}: ${stockCheck.stockDisplay}. ${getTranslation('youCannotAddMore', state.currentLanguage)}.`;
            showToast(message, 'warning');
            return;
          }
        }
      }
      
      setBillItems(prev => prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromBill = (productId) => {
    setBillItems(prev => prev.filter(item => item.id !== productId));
  };

  const generateBill = () => {
    console.log('🔧 Generate Bill clicked');
    console.log('🔧 Bill items:', billItems);
    console.log('🔧 Selected customer:', selectedCustomer);
    console.log('🔧 Use custom name:', useCustomName);
    console.log('🔧 Custom customer name:', customCustomerName);
    
    if (billItems.length === 0) {
      showToast(getTranslation('pleaseAddItems', state.currentLanguage), 'warning');
      return;
    }

    // Final stock validation before generating bill with proper unit conversion
    for (const billItem of billItems) {
      const product = state.products.find(p => p.id === billItem.id);
      if (product) {
        const stockCheck = checkStockAvailability(product, billItem.quantity, billItem.unit);
        if (!stockCheck.available) {
          if (stockCheck.error) {
            showToast(stockCheck.error, 'error');
            return;
          }
          
          const message = state.currentLanguage === 'hi'
            ? `⚠️ ${getTranslation('stockError', state.currentLanguage)}! ${getTranslation('product', state.currentLanguage)}: ${product.name} (${getTranslation('available', state.currentLanguage)}: ${stockCheck.stockDisplay}, ${getTranslation('requested', state.currentLanguage)}: ${stockCheck.requestedDisplay}). ${getTranslation('cannotGenerateBill', state.currentLanguage)}.`
            : `⚠️ ${getTranslation('stockError', state.currentLanguage)}! ${getTranslation('product', state.currentLanguage)}: ${product.name} (${getTranslation('available', state.currentLanguage)}: ${stockCheck.stockDisplay}, ${getTranslation('requested', state.currentLanguage)}: ${stockCheck.requestedDisplay}). ${getTranslation('cannotGenerateBill', state.currentLanguage)}.`;
          showToast(message, 'error');
          return;
        }
      }
    }

    const customerName = useCustomName ? customCustomerName : (state.customers.find(c => c.name === selectedCustomer)?.name || selectedCustomer);
    
    if (!customerName || customerName.trim() === '') {
      showToast(getTranslation('pleaseEnterCustomerName', state.currentLanguage), 'warning');
      return;
    }
    
    const bill = {
      id: Date.now().toString(),
      customerId: useCustomName ? null : selectedCustomer,
      customerName: customerName,
      items: billItems,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      paymentMethod,
      date: new Date().toISOString(),
      status: 'completed'
    };

    // Add transaction
    dispatch({ type: 'ADD_TRANSACTION', payload: bill });

    // Update stock for each item with proper unit conversion
    billItems.forEach(item => {
      const product = state.products.find(p => p.id === item.id);
      if (product) {
        // Convert the billed quantity to the product's unit
        const billedQuantityInProductUnit = convertFromBaseUnit(
          convertToBaseUnit(item.quantity, item.unit), 
          product.quantityUnit || 'pcs'
        );
        
        dispatch({
          type: 'UPDATE_PRODUCT',
          payload: {
            ...product,
            stock: Math.max(0, (product.stock || 0) - billedQuantityInProductUnit)
          }
        });
      }
    });

    // Update customer balance if due
    if (paymentMethod === 'due' || paymentMethod === 'credit') {
      let customer = allCustomers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
      if (customer) {
        const updatedCustomer = {
          ...customer,
          balanceDue: (customer.balanceDue || 0) + total
        };
        dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
      } else {
        // Create new customer with balance
        const newCustomer = {
          id: Date.now().toString(),
          name: customerName,
          balanceDue: total,
          phone: '',
          email: '',
          address: '',
          createdAt: new Date().toISOString()
        };
        dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
      }
    }

    // Add activity
    dispatch({ type: 'ADD_ACTIVITY', payload: {
      id: Date.now().toString(),
      message: `Bill generated for ${customerName} - ₹${total.toFixed(2)}`,
      timestamp: new Date().toISOString(),
      type: 'bill_generated'
    }});

    // Reset form
    setBillItems([]);
    setSelectedCustomer('');
    setCustomCustomerName('');
    setUseCustomName(false);
    setDiscount(0);
    setTax(0);
    setPaymentMethod('cash');

    // Show UPI Payment Modal
    console.log('🔧 Setting current bill:', bill);
    setCurrentBill(bill);
    console.log('🔧 Opening UPI payment modal');
    setShowUPIPayment(true);
    
    const successMessage = `${getTranslation('billGeneratedSuccessfully', state.currentLanguage)}! ${getTranslation('customers', state.currentLanguage)}: ${bill.customerName}, ${getTranslation('total', state.currentLanguage)}: ₹${bill.total.toFixed(2)}`;
    showToast(successMessage, 'success');
  };

  const handlePaymentReceived = (paymentSummary) => {
    // Update bill status to paid
    if (currentBill) {
      const updatedBill = {
        ...currentBill,
        paymentStatus: 'paid',
        paymentMethod: 'upi',
        paymentDetails: paymentSummary,
        paidAt: new Date().toISOString()
      };
      
      // Update transaction in state
      dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedBill });
      
      // Add payment activity
      dispatch({ type: 'ADD_ACTIVITY', payload: {
        id: Date.now().toString(),
        message: `UPI Payment received for Bill #${currentBill.id} - ₹${currentBill.total.toFixed(2)}`,
        timestamp: new Date().toISOString(),
        type: 'payment_received'
      }});
      
      showToast(`Payment of ₹${currentBill.total.toFixed(2)} received successfully!`, 'success');
    }
    
    setShowUPIPayment(false);
    setCurrentBill(null);
  };

  const generateQRCode = (bill) => {
    try {
      // Create bill data for QR code
      const billData = {
        billId: bill.id,
        customerName: bill.customerName,
        items: bill.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.total
        })),
        subtotal: bill.subtotal,
        discount: bill.discount,
        tax: bill.tax,
        total: bill.total,
        paymentMethod: bill.paymentMethod,
        date: bill.date,
        storeName: state.storeName || 'Grocery Store'
      };

      setQrCodeData(billData);
      setShowQRCode(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      showToast('Error generating QR code', 'error');
    }
  };

  const generateAndDownloadPDF = (bill) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFont('helvetica');
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(16, 185, 129);
      pdf.text('Grocery Store Invoice', 105, 15, { align: 'center' });
      
      // Customer & Invoice Details
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Customer Name: ${bill.customerName}`, 20, 25);
      pdf.text(`Date: ${new Date(bill.date).toLocaleDateString()}`, 20, 30);
      pdf.text(`Invoice #: ${bill.id}`, 20, 35);
      if (state.gstNumber) {
        pdf.text(`GST #: ${state.gstNumber}`, 105, 25, { align: 'right' });
      }
      
      // Table Header
      pdf.setFillColor(243, 244, 246);
      pdf.rect(20, 42, 170, 8, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Product Name', 22, 48);
      pdf.text('Qty', 110, 48);
      pdf.text('Price', 135, 48);
      pdf.text('Total', 170, 48);
      
      // Table Rows
      let yPosition = 54;
      bill.items.forEach(item => {
        pdf.setFontSize(9);
        // Product Name (wrapped if too long)
        const productName = item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name;
        pdf.text(productName, 22, yPosition);
        
        // Quantity with unit
        const qty = item.displayQuantity || `${item.quantity} ${item.unit || item.quantityUnit || 'pcs'}`;
        pdf.text(qty, 110, yPosition);
        
        // Price per unit
        pdf.text(`INR ${item.price.toFixed(2)}`, 135, yPosition);
        
        // Total
        pdf.text(`INR ${(item.price * item.quantity).toFixed(2)}`, 170, yPosition);
        
        yPosition += 7;
      });
      
      // Totals Section
      yPosition += 5;
      pdf.setLineWidth(0.5);
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 5;
      
      pdf.setFontSize(10);
      pdf.text(`Subtotal:`, 120, yPosition);
      pdf.text(`INR ${bill.subtotal.toFixed(2)}`, 170, yPosition, { align: 'right' });
      
      if (bill.discount > 0) {
        yPosition += 5;
        pdf.text(`Discount:`, 120, yPosition);
        pdf.text(`INR -${bill.discount.toFixed(2)}`, 170, yPosition, { align: 'right' });
      }
      
      if (bill.tax > 0) {
        yPosition += 5;
        pdf.text(`Tax:`, 120, yPosition);
        pdf.text(`INR ${bill.tax.toFixed(2)}`, 170, yPosition, { align: 'right' });
      }
      
      yPosition += 5;
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 5;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Amount:`, 120, yPosition);
      pdf.text(`INR ${bill.total.toFixed(2)}`, 170, yPosition, { align: 'right' });
      
      // Payment Method
      yPosition += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Payment Method: ${bill.paymentMethod.toUpperCase()}`, 20, yPosition);
      
      // Thank you message
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.text('Thank you for your business!', 105, yPosition, { align: 'center' });
      
      // Download
      pdf.save(`invoice_${bill.customerName.replace(/\s+/g, '_')}_${bill.id}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const makePayment = () => {
    if (billItems.length === 0) return;
    
    console.log('=== MAKE PAYMENT DEBUG ===');
    console.log('Bill Items:', billItems);
    console.log('All Products:', state.products);
    console.log('========================');
    
    try {
      // Reduce stock quantities for each item
      billItems.forEach(billItem => {
        const product = state.products.find(p => p.id === billItem.productId);
        if (product) {
          console.log('=== STOCK REDUCTION DEBUG ===');
          console.log('Product:', product.name);
          console.log('Current Stock:', product.stock, product.unit);
          console.log('Billing Quantity:', billItem.quantity, billItem.unit || product.unit);
          
          // Simple stock reduction - if units match, subtract directly
          let newStock = product.stock;
          if (billItem.unit === product.unit || !billItem.unit) {
            // Same units, direct subtraction
            newStock = product.stock - billItem.quantity;
            console.log('Direct subtraction:', product.stock, '-', billItem.quantity, '=', newStock);
          } else {
            // Different units, use conversion
            const billingQuantityInBaseUnit = convertToBaseUnit(billItem.quantity, billItem.unit || product.unit);
            const currentStockInBaseUnit = convertToBaseUnit(product.stock, product.unit);
            const newStockInBaseUnit = currentStockInBaseUnit - billingQuantityInBaseUnit;
            newStock = convertFromBaseUnit(newStockInBaseUnit, product.unit);
            console.log('Unit conversion - New stock:', newStock);
          }
          
          const finalStock = Math.max(0, newStock);
          console.log('Final Stock:', finalStock);
          console.log('========================');
          
          // Update product stock
          dispatch({
            type: 'UPDATE_PRODUCT',
            payload: {
              ...product,
              stock: finalStock
            }
          });
        } else {
          console.error('Product not found for bill item:', billItem);
        }
      });
      
      // Add transaction record
      const transaction = {
        id: Date.now(),
        customerId: selectedCustomer,
        customerName: useCustomName ? customCustomerName : (state.customers.find(c => c.id === selectedCustomer)?.name || 'Walk-in Customer'),
        items: billItems.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal: subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total: total,
        paymentMethod: paymentMethod,
        date: new Date().toISOString(),
        status: 'completed'
      };
      
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      
      // Update customer balance if payment method is 'due'
      if (paymentMethod === 'due') {
        const customer = state.customers.find(c => c.id === selectedCustomer);
        if (customer) {
          const newBalance = (customer.balanceDue || 0) + total;
          dispatch({
            type: 'UPDATE_CUSTOMER',
            payload: {
              ...customer,
              balanceDue: newBalance
            }
          });
        }
      }
      
      // Clear the bill
      setBillItems([]);
      setDiscount(0);
      setTax(0);
      setSelectedCustomer('');
      setCustomCustomerName('');
      setUseCustomName(false);
      
      // Force UI refresh by dispatching a dummy action to trigger re-render
      dispatch({ type: 'FORCE_REFRESH' });
      
      if (window.showToast) {
        window.showToast(`Payment completed! Stock reduced for ${billItems.length} item(s) and transaction recorded.`, 'success');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      if (window.showToast) {
        window.showToast('Error processing payment. Please try again.', 'error');
      }
    }
  };

  const shareBillToWhatsApp = () => {
    if (billItems.length === 0) return;
    
    try {
      // Generate PDF first
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFont('helvetica', 'normal');

      // Title
      pdf.setFontSize(18);
      pdf.text('TAX INVOICE', pageWidth / 2, 15, { align: 'center' });

      // Store & GST
      pdf.setFontSize(11);
      const storeName = state.username || 'Grocery Store';
      const gstNo = state.gstNumber || 'N/A';
      pdf.text(storeName, 14, 26);
      pdf.text(`GST: ${gstNo}`, 14, 32);

      // Invoice meta & customer
      const billId = `BILL-${Date.now().toString().slice(-6)}`;
      const customerName = useCustomName ? customCustomerName : (state.customers.find(c => c.id === selectedCustomer)?.name || 'Walk-in Customer');
      pdf.text(`Invoice: ${billId}`, pageWidth - 14, 26, { align: 'right' });
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 32, { align: 'right' });
      pdf.text(`Customer: ${customerName}`, 14, 42);
      pdf.text(`Payment: ${paymentMethod.toUpperCase()}`, 14, 48);

      // Table header
      const headerY = 58;
      pdf.setFillColor(234, 238, 243);
      pdf.setDrawColor(220);
      pdf.rect(10, headerY - 6, pageWidth - 20, 8, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(30);
      pdf.text('Item', 14, headerY);
      pdf.text('Qty', 100, headerY);
      pdf.text('Rate (Rs)', 130, headerY, { align: 'right' });
      pdf.text('Amount (Rs)', pageWidth - 14, headerY, { align: 'right' });

      // Rows
      let y = headerY + 6;
      pdf.setTextColor(50);
      pdf.setFontSize(9);
      billItems.forEach(item => {
        if (y > pageHeight - 40) {
          pdf.addPage();
          // redraw header
          pdf.setFillColor(234, 238, 243);
          pdf.setDrawColor(220);
          pdf.rect(10, 10, pageWidth - 20, 8, 'F');
          pdf.setFontSize(10);
          pdf.setTextColor(30);
          pdf.text('Item', 14, 16);
          pdf.text('Qty', 100, 16);
          pdf.text('Rate (Rs)', 130, 16, { align: 'right' });
          pdf.text('Amount (Rs)', pageWidth - 14, 16, { align: 'right' });
          y = 24;
          pdf.setTextColor(50);
          pdf.setFontSize(9);
        }
        const amount = (item.price * item.quantity).toFixed(2);
        pdf.text(item.name.substring(0, 30), 14, y);
        pdf.text(`${item.quantity} ${item.unit || ''}`, 100, y);
        pdf.text(`${item.price.toFixed(2)}`, 130, y, { align: 'right' });
        pdf.text(`${amount}`, pageWidth - 14, y, { align: 'right' });
        y += 5;
      });

      // Totals box
      y += 4;
      pdf.setDrawColor(220);
      pdf.rect(pageWidth - 80, y, 70, 28);
      pdf.setFontSize(10);
      pdf.text(`Subtotal: Rs ${subtotal.toFixed(2)}`, pageWidth - 76, y + 8);
      pdf.text(`Discount: Rs ${discountAmount.toFixed(2)}`, pageWidth - 76, y + 14);
      pdf.text(`Tax: Rs ${taxAmount.toFixed(2)}`, pageWidth - 76, y + 20);
      pdf.setFontSize(12);
      pdf.text(`TOTAL: Rs ${total.toFixed(2)}`, pageWidth - 76, y + 26);

      // Footer
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Generate PDF blob for sharing
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create a temporary link to download the PDF
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `invoice-${customerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Open WhatsApp Web with file sharing
      const whatsappMessage = `Invoice from ${storeName}\nCustomer: ${customerName}\nTotal: Rs ${total.toFixed(2)}\n\nPlease check the downloaded PDF file.`;
      const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
      
      // Open WhatsApp Web
      window.open(whatsappUrl, '_blank');
      
      // Clean up the URL
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
      
      if (window.showToast) {
        window.showToast('PDF downloaded! WhatsApp Web opened - attach the PDF file manually.', 'success');
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      if (window.showToast) {
        window.showToast('Error sharing to WhatsApp. Please try again.', 'error');
      }
    }
  };

  const downloadBill = () => {
    if (billItems.length === 0) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFont('helvetica', 'normal');

      // Title
      pdf.setFontSize(18);
      pdf.text('TAX INVOICE', pageWidth / 2, 15, { align: 'center' });

      // Store & GST
      pdf.setFontSize(11);
      const storeName = state.username || 'Grocery Store';
      const gstNo = state.gstNumber || 'N/A';
      pdf.text(storeName, 14, 26);
      pdf.text(`GST: ${gstNo}`, 14, 32);

      // Invoice meta & customer
      const billId = `BILL-${Date.now().toString().slice(-6)}`;
      const customerName = useCustomName ? customCustomerName : (state.customers.find(c => c.id === selectedCustomer)?.name || 'Walk-in Customer');
      pdf.text(`Invoice: ${billId}`, pageWidth - 14, 26, { align: 'right' });
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 32, { align: 'right' });
      pdf.text(`Customer: ${customerName}`, 14, 42);
      pdf.text(`Payment: ${paymentMethod.toUpperCase()}`, 14, 48);

      // Table header
      const headerY = 58;
      pdf.setFillColor(234, 238, 243);
      pdf.setDrawColor(220);
      pdf.rect(10, headerY - 6, pageWidth - 20, 8, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(30);
      pdf.text('Item', 14, headerY);
      pdf.text('Qty', 100, headerY);
      pdf.text('Rate (Rs)', 130, headerY, { align: 'right' });
      pdf.text('Amount (Rs)', pageWidth - 14, headerY, { align: 'right' });

      // Rows
      let y = headerY + 6;
      pdf.setTextColor(50);
      pdf.setFontSize(9);
      billItems.forEach(item => {
        if (y > pageHeight - 40) {
          pdf.addPage();
          // redraw header
          pdf.setFillColor(234, 238, 243);
          pdf.setDrawColor(220);
          pdf.rect(10, 10, pageWidth - 20, 8, 'F');
          pdf.setFontSize(10);
          pdf.setTextColor(30);
          pdf.text('Item', 14, 16);
          pdf.text('Qty', 100, 16);
          pdf.text('Rate (Rs)', 130, 16, { align: 'right' });
          pdf.text('Amount (Rs)', pageWidth - 14, 16, { align: 'right' });
          y = 24;
          pdf.setTextColor(50);
          pdf.setFontSize(9);
        }
        const amount = (item.price * item.quantity).toFixed(2);
        pdf.text(item.name.substring(0, 30), 14, y);
        pdf.text(`${item.quantity} ${item.unit || ''}`, 100, y);
        pdf.text(`${item.price.toFixed(2)}`, 130, y, { align: 'right' });
        pdf.text(`${amount}`, pageWidth - 14, y, { align: 'right' });
        y += 5;
      });

      // Totals box
      y += 4;
      pdf.setDrawColor(220);
      pdf.rect(pageWidth - 80, y, 70, 28);
      pdf.setFontSize(10);
      pdf.text(`Subtotal: Rs ${subtotal.toFixed(2)}`, pageWidth - 76, y + 8);
      pdf.text(`Discount: Rs ${discountAmount.toFixed(2)}`, pageWidth - 76, y + 14);
      pdf.text(`Tax: Rs ${taxAmount.toFixed(2)}`, pageWidth - 76, y + 20);
      pdf.setFontSize(12);
      pdf.text(`TOTAL: Rs ${total.toFixed(2)}`, pageWidth - 76, y + 26);

      // Footer
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, { align: 'center' });

      pdf.save(`invoice-${customerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`);

      if (window.showToast) {
        window.showToast('Bill downloaded successfully!', 'success');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (window.showToast) {
        window.showToast('Error generating PDF. Please try again.', 'error');
      }
    }
  };

  return (
    <div className="space-y-8 fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{getTranslation('billingSystem', state.currentLanguage)}</h2>
          <p className="text-gray-600 mt-2">{getTranslation('createAndManageBills', state.currentLanguage)}</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={downloadBill}
            className="btn-secondary flex items-center"
            disabled={billItems.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Bill
          </button>
          
          <button
            onClick={makePayment}
            className="btn-primary flex items-center bg-blue-600 hover:bg-blue-700"
            disabled={billItems.length === 0}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Make Payment
          </button>
          
          {(state.currentPlan === 'standard' || state.currentPlan === 'premium') && (
            <button
              onClick={shareBillToWhatsApp}
              className="btn-primary flex items-center bg-green-600 hover:bg-green-700"
              disabled={billItems.length === 0}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share WhatsApp
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Selection & Bill Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              {getTranslation('customerInformation', state.currentLanguage)}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="customName"
                      checked={useCustomName}
                      onChange={(e) => setUseCustomName(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="customName" className="text-sm font-medium text-gray-700">
                      Use custom customer name
                    </label>
                  </div>
                  
                  {useCustomName ? (
                    <input
                      type="text"
                      value={customCustomerName}
                      onChange={(e) => setCustomCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className="input-field"
                    />
                  ) : (
                    <select
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Choose a customer</option>
                      {allCustomers.map(customer => (
                        <option key={customer.id} value={customer.name}>
                          {customer.name} {customer.balanceDue ? `(₹${customer.balanceDue.toFixed(2)} due)` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input-field"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="due">Due (Credit)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-green-600" />
              Add Products
            </h3>
            
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              
              {/* Barcode Machine Input */}
              <div className="relative">
                <ScanLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-600" />
                <input
                  type="text"
                  placeholder="Enter barcode from machine..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const barcode = barcodeInput.trim();
                      if (barcode) {
                        handleBarcodeScan(barcode);
                      }
                    }
                  }}
                  className="input-field pl-12 pr-20"
                />
                <button
                  onClick={() => setShowBarcodeMachine(true)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  title="Open Barcode Machine"
                >
                  <ScanLine className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">₹{product.sellingPrice || product.costPrice || 0} per {product.quantityUnit || 'pcs'} • Stock: {product.stock || 0}</p>
                  </div>
                  <button
                    onClick={() => handleAddProduct(product)}
                    className="btn-primary text-sm px-3 py-1"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Items */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-purple-600" />
              Bill Items
            </h3>

            {billItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No items added to bill yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {billItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">₹{item.price} per {item.unit || item.quantityUnit || 'pcs'}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <span className="text-xs text-gray-500">{item.unit || item.quantityUnit || 'pcs'}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      
                      <span className="font-semibold text-gray-900 w-20 text-right">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                      
                      <button
                        onClick={() => removeFromBill(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="space-y-6">
          <div className="card sticky top-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-indigo-600" />
              Bill Summary
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-semibold text-green-600">-₹{discountAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
              </div>

              <hr className="border-gray-200" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-blue-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDiscount(value === '' ? 0 : parseFloat(value) || 0);
                  }}
                  className="input-field"
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax (%)
                </label>
                <input
                  type="number"
                  value={tax || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTax(value === '' ? 0 : parseFloat(value) || 0);
                  }}
                  className="input-field"
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>

              <button
                onClick={generateBill}
                className="w-full btn-primary flex items-center justify-center"
                disabled={
                  billItems.length === 0 ||
                  (!useCustomName && !selectedCustomer) ||
                  (useCustomName && !customCustomerName)
                }
              >
                <Receipt className="h-4 w-4 mr-2" />
                Generate Bill
              </button>
            </div>
          </div>
        </div>

        {showQuantityModal && selectedProduct && (
          <QuantityModal
            product={selectedProduct}
            onClose={() => {
              setShowQuantityModal(false);
              setSelectedProduct(null);
            }}
            onAdd={handleAddWithQuantity}
          />
        )}

        {showBarcodeMachine && (
          <BarcodeMachine
            onScan={(barcode) => {
              setBarcodeInput(barcode);
              handleBarcodeScan(barcode);
              setShowBarcodeMachine(false);
            }}
            onClose={() => setShowBarcodeMachine(false)}
          />
        )}

        {/* QR Code Modal */}
        {showQRCode && qrCodeData && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-blue-600" />
                  Bill QR Code
                </h3>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <div className="text-sm text-gray-600 mb-2">Bill ID: {qrCodeData.billId}</div>
                  <div className="text-sm text-gray-600 mb-2">Customer: {qrCodeData.customerName}</div>
                  <div className="text-sm text-gray-600 mb-2">Total: ₹{qrCodeData.total.toFixed(2)}</div>
                  <div className="text-sm text-gray-600 mb-2">Date: {new Date(qrCodeData.date).toLocaleDateString()}</div>
                </div>
                
                {/* Simple QR Code representation */}
                <div className="bg-white border-2 border-gray-300 p-4 rounded-lg mb-4 inline-block">
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: 64 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mb-4">
                  Scan this QR code to view bill details
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      generateAndDownloadPDF(qrCodeData);
                      setShowQRCode(false);
                    }}
                    className="flex-1 btn-secondary flex items-center justify-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowQRCode(false)}
                    className="flex-1 btn-primary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPI Payment Modal */}
        {showUPIPayment && currentBill && (
          <UPIPaymentModal
            bill={currentBill}
            onClose={() => {
              setShowUPIPayment(false);
              setCurrentBill(null);
            }}
            onPaymentReceived={handlePaymentReceived}
          />
        )}
      </div>
    </div>
  );
};

export default Billing;