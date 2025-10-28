import React, { createContext, useContext, useReducer, useEffect } from 'react';


// Initial state - Complete system state
const initialState = {
  // Authentication
  
  isAuthenticated: false,
  currentUser: {
    username: 'xyz',
    password: '123456'
    
  },
  
  // Language settings
  currentLanguage: 'en',
  voiceAssistantLanguage: 'en-US',
  voiceAssistantEnabled: true,
  
  // Data
  customers: [],
  products: [],
  purchaseOrders: [],
  transactions: [],
  activities: [],
  
  // UI state
  currentView: 'dashboard',
  isListening: false,
  isLoading: false,
  refreshTrigger: 0,
  
  // Pagination
  customerCurrentPage: 1,
  productCurrentPage: 1,
  itemsPerPage: 50,
  
  // Current operations
  currentBillItems: [],
  currentPOItems: [],
  
  // Settings
  expiryDaysThreshold: 3,
  lowStockThreshold: 10,
  
  // Subscription system
  subscriptionDays: 30,
  isSubscriptionActive: true,
  currentPlan: 'basic', // 'basic', 'standard', 'premium'
  
  // Business details
  gstNumber: '',
  storeName: 'Grocery Store',
  
  // Scanner state
  isScannerActive: false,
  scannerType: 'html5-qrcode',
  
  // Charts and reports
  salesChartData: null,
  profitChartData: null,
  inventoryChartData: null,
  customerChartData: null,
  
  // Time and status
  currentTime: new Date().toLocaleTimeString(),
  systemStatus: 'online'
};

// Action types
export const ActionTypes = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  
  // Language
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_VOICE_LANGUAGE: 'SET_VOICE_LANGUAGE',
  
  // Plan management
  SET_CURRENT_PLAN: 'SET_CURRENT_PLAN',
  
  // Data management
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  ADD_CUSTOMER: 'ADD_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER: 'DELETE_CUSTOMER',
  
  SET_PRODUCTS: 'SET_PRODUCTS',
  ADD_PRODUCT: 'ADD_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  
  SET_PURCHASE_ORDERS: 'SET_PURCHASE_ORDERS',
  ADD_PURCHASE_ORDER: 'ADD_PURCHASE_ORDER',
  UPDATE_PURCHASE_ORDER: 'UPDATE_PURCHASE_ORDER',
  DELETE_PURCHASE_ORDER: 'DELETE_PURCHASE_ORDER',
  
  SET_TRANSACTIONS: 'SET_TRANSACTIONS',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  
  SET_ACTIVITIES: 'SET_ACTIVITIES',
  ADD_ACTIVITY: 'ADD_ACTIVITY',
  
  // UI state
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_LISTENING: 'SET_LISTENING',
  SET_LOADING: 'SET_LOADING',
  FORCE_REFRESH: 'FORCE_REFRESH',
  
  // Pagination
  SET_CUSTOMER_PAGE: 'SET_CUSTOMER_PAGE',
  SET_PRODUCT_PAGE: 'SET_PRODUCT_PAGE',
  
  // Current operations
  SET_BILL_ITEMS: 'SET_BILL_ITEMS',
  ADD_BILL_ITEM: 'ADD_BILL_ITEM',
  REMOVE_BILL_ITEM: 'REMOVE_BILL_ITEM',
  CLEAR_BILL_ITEMS: 'CLEAR_BILL_ITEMS',
  
  SET_PO_ITEMS: 'SET_PO_ITEMS',
  ADD_PO_ITEM: 'ADD_PO_ITEM',
  REMOVE_PO_ITEM: 'REMOVE_PO_ITEM',
  CLEAR_PO_ITEMS: 'CLEAR_PO_ITEMS',
  
  // Settings
  SET_LOW_STOCK_THRESHOLD: 'SET_LOW_STOCK_THRESHOLD',
  SET_EXPIRY_DAYS_THRESHOLD: 'SET_EXPIRY_DAYS_THRESHOLD',
  
  // Subscription
  SET_SUBSCRIPTION_DAYS: 'SET_SUBSCRIPTION_DAYS',
  SET_SUBSCRIPTION_ACTIVE: 'SET_SUBSCRIPTION_ACTIVE',
  
  // Business details
  SET_GST_NUMBER: 'SET_GST_NUMBER',
  SET_STORE_NAME: 'SET_STORE_NAME',
  
  // User
  UPDATE_USER: 'UPDATE_USER',
  SET_VOICE_ASSISTANT_LANGUAGE: 'SET_VOICE_ASSISTANT_LANGUAGE',
  SET_VOICE_ASSISTANT_ENABLED: 'SET_VOICE_ASSISTANT_ENABLED',
  
  // Scanner
  SET_SCANNER_ACTIVE: 'SET_SCANNER_ACTIVE',
  SET_SCANNER_TYPE: 'SET_SCANNER_TYPE',
  
  // Charts
  SET_SALES_CHART_DATA: 'SET_SALES_CHART_DATA',
  SET_PROFIT_CHART_DATA: 'SET_PROFIT_CHART_DATA',
  SET_INVENTORY_CHART_DATA: 'SET_INVENTORY_CHART_DATA',
  SET_CUSTOMER_CHART_DATA: 'SET_CUSTOMER_CHART_DATA',
  
  // Time and status
  UPDATE_CURRENT_TIME: 'UPDATE_CURRENT_TIME',
  SET_SYSTEM_STATUS: 'SET_SYSTEM_STATUS'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN:
      return {
        ...state,
        isAuthenticated: true,
        currentUser: action.payload
      };
      
    case ActionTypes.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        currentUser: null
      };
      
    case ActionTypes.SET_LANGUAGE:
      return {
        ...state,
        currentLanguage: action.payload
      };
      
    case ActionTypes.SET_CURRENT_PLAN:
      return {
        ...state,
        currentPlan: action.payload
      };
      
    case ActionTypes.SET_VOICE_LANGUAGE:
      return {
        ...state,
        voiceAssistantLanguage: action.payload
      };
      
    case ActionTypes.SET_CUSTOMERS:
      return {
        ...state,
        customers: action.payload
      };
      
    case ActionTypes.ADD_CUSTOMER:
      return {
        ...state,
        customers: [action.payload, ...state.customers]
      };
      
    case ActionTypes.UPDATE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer.id === action.payload.id ? action.payload : customer
        )
      };
      
    case ActionTypes.DELETE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload)
      };
      
    case ActionTypes.SET_PRODUCTS:
      return {
        ...state,
        products: action.payload
      };
      
    case ActionTypes.ADD_PRODUCT:
      return {
        ...state,
        products: [action.payload, ...state.products]
      };
      
    case ActionTypes.UPDATE_PRODUCT:
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id ? action.payload : product
        )
      };
      
    case ActionTypes.DELETE_PRODUCT:
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload)
      };
      
    case ActionTypes.SET_PURCHASE_ORDERS:
      return {
        ...state,
        purchaseOrders: action.payload
      };
      
    case ActionTypes.ADD_PURCHASE_ORDER:
      return {
        ...state,
        purchaseOrders: [action.payload, ...state.purchaseOrders]
      };
      
    case ActionTypes.UPDATE_PURCHASE_ORDER:
      return {
        ...state,
        purchaseOrders: state.purchaseOrders.map(po =>
          po.id === action.payload.id ? action.payload : po
        )
      };
      
    case ActionTypes.DELETE_PURCHASE_ORDER:
      return {
        ...state,
        purchaseOrders: state.purchaseOrders.filter(po => po.id !== action.payload)
      };
      
    case ActionTypes.SET_TRANSACTIONS:
      return {
        ...state,
        transactions: action.payload
      };
      
    case ActionTypes.ADD_TRANSACTION:
      return {
        ...state,
        transactions: [action.payload, ...state.transactions]
      };
      
    case ActionTypes.UPDATE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map(transaction =>
          transaction.id === action.payload.id ? action.payload : transaction
        )
      };
      
    case ActionTypes.SET_ACTIVITIES:
      return {
        ...state,
        activities: action.payload
      };
      
    case ActionTypes.ADD_ACTIVITY:
      return {
        ...state,
        activities: [action.payload, ...state.activities]
      };
      
    case ActionTypes.SET_CURRENT_VIEW:
      return {
        ...state,
        currentView: action.payload
      };
      
    case ActionTypes.SET_LISTENING:
      return {
        ...state,
        isListening: action.payload
      };
      
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case ActionTypes.FORCE_REFRESH:
      return {
        ...state,
        refreshTrigger: Date.now() // This will force re-render
      };
      
    case ActionTypes.SET_CUSTOMER_PAGE:
      return {
        ...state,
        customerCurrentPage: action.payload
      };
      
    case ActionTypes.SET_PRODUCT_PAGE:
      return {
        ...state,
        productCurrentPage: action.payload
      };
      
    case ActionTypes.SET_BILL_ITEMS:
      return {
        ...state,
        currentBillItems: action.payload
      };
      
    case ActionTypes.ADD_BILL_ITEM:
      return {
        ...state,
        currentBillItems: [...state.currentBillItems, action.payload]
      };
      
    case ActionTypes.REMOVE_BILL_ITEM:
      return {
        ...state,
        currentBillItems: state.currentBillItems.filter((_, index) => index !== action.payload)
      };
      
    case ActionTypes.CLEAR_BILL_ITEMS:
      return {
        ...state,
        currentBillItems: []
      };
      
    case ActionTypes.SET_PO_ITEMS:
      return {
        ...state,
        currentPOItems: action.payload
      };
      
    case ActionTypes.ADD_PO_ITEM:
      return {
        ...state,
        currentPOItems: [...state.currentPOItems, action.payload]
      };
      
    case ActionTypes.REMOVE_PO_ITEM:
      return {
        ...state,
        currentPOItems: state.currentPOItems.filter((_, index) => index !== action.payload)
      };
      
    case ActionTypes.CLEAR_PO_ITEMS:
      return {
        ...state,
        currentPOItems: []
      };
      
    case ActionTypes.SET_LOW_STOCK_THRESHOLD:
      return {
        ...state,
        lowStockThreshold: action.payload
      };
      
    case ActionTypes.SET_EXPIRY_DAYS_THRESHOLD:
      return {
        ...state,
        expiryDaysThreshold: action.payload
      };
      
    case ActionTypes.SET_SUBSCRIPTION_DAYS:
      return {
        ...state,
        subscriptionDays: action.payload
      };
      
    case ActionTypes.SET_SUBSCRIPTION_ACTIVE:
      return {
        ...state,
        isSubscriptionActive: action.payload
      };
      
    case ActionTypes.SET_SCANNER_ACTIVE:
      return {
        ...state,
        isScannerActive: action.payload
      };
      
    case ActionTypes.SET_SCANNER_TYPE:
      return {
        ...state,
        scannerType: action.payload
      };
      
    case ActionTypes.SET_SALES_CHART_DATA:
      return {
        ...state,
        salesChartData: action.payload
      };
      
    case ActionTypes.SET_PROFIT_CHART_DATA:
      return {
        ...state,
        profitChartData: action.payload
      };
      
    case ActionTypes.SET_INVENTORY_CHART_DATA:
      return {
        ...state,
        inventoryChartData: action.payload
      };
      
    case ActionTypes.SET_CUSTOMER_CHART_DATA:
      return {
        ...state,
        customerChartData: action.payload
      };
      
    case ActionTypes.UPDATE_CURRENT_TIME:
      return {
        ...state,
        currentTime: action.payload
      };
      
    case ActionTypes.SET_SYSTEM_STATUS:
      return {
        ...state,
        systemStatus: action.payload
      };
      
    case ActionTypes.SET_GST_NUMBER:
      return {
        ...state,
        gstNumber: action.payload
      };
      
    case ActionTypes.SET_STORE_NAME:
      return {
        ...state,
        storeName: action.payload
      };
      
    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        currentUser: action.payload
      };
      
    case ActionTypes.SET_VOICE_ASSISTANT_LANGUAGE:
      return {
        ...state,
        voiceAssistantLanguage: action.payload
      };
      
    case ActionTypes.SET_VOICE_ASSISTANT_ENABLED:
      return {
        ...state,
        voiceAssistantEnabled: action.payload
      };
      
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedCustomers = localStorage.getItem('customers');
    const savedProducts = localStorage.getItem('products');
    const savedTransactions = localStorage.getItem('transactions');
    const savedPurchaseOrders = localStorage.getItem('purchaseOrders');
    const savedActivities = localStorage.getItem('activities');
    const savedSettings = localStorage.getItem('settings');
    
    if (savedCustomers) {
      dispatch({ type: ActionTypes.SET_CUSTOMERS, payload: JSON.parse(savedCustomers) });
    }
    
    if (savedProducts) {
      dispatch({ type: ActionTypes.SET_PRODUCTS, payload: JSON.parse(savedProducts) });
    }
    
    if (savedTransactions) {
      dispatch({ type: ActionTypes.SET_TRANSACTIONS, payload: JSON.parse(savedTransactions) });
    }
    
    if (savedPurchaseOrders) {
      dispatch({ type: ActionTypes.SET_PURCHASE_ORDERS, payload: JSON.parse(savedPurchaseOrders) });
    }
    
    if (savedActivities) {
      dispatch({ type: ActionTypes.SET_ACTIVITIES, payload: JSON.parse(savedActivities) });
    }
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      dispatch({ type: ActionTypes.SET_LOW_STOCK_THRESHOLD, payload: settings.lowStockThreshold });
      dispatch({ type: ActionTypes.SET_EXPIRY_DAYS_THRESHOLD, payload: settings.expiryDaysThreshold });
      dispatch({ type: ActionTypes.SET_SUBSCRIPTION_DAYS, payload: settings.subscriptionDays });
      dispatch({ type: ActionTypes.SET_SUBSCRIPTION_ACTIVE, payload: settings.isSubscriptionActive });
      if (settings.gstNumber) {
        dispatch({ type: ActionTypes.SET_GST_NUMBER, payload: settings.gstNumber });
      }
      if (settings.storeName) {
        dispatch({ type: 'SET_STORE_NAME', payload: settings.storeName });
      }
      if (settings.voiceAssistantEnabled !== undefined) {
        dispatch({ type: ActionTypes.SET_VOICE_ASSISTANT_ENABLED, payload: settings.voiceAssistantEnabled });
      }
      if (settings.voiceAssistantLanguage) {
        dispatch({ type: ActionTypes.SET_VOICE_ASSISTANT_LANGUAGE, payload: settings.voiceAssistantLanguage });
      }
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(state.customers));
  }, [state.customers]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(state.products));
  }, [state.products]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(state.transactions));
  }, [state.transactions]);

  useEffect(() => {
    localStorage.setItem('purchaseOrders', JSON.stringify(state.purchaseOrders));
  }, [state.purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(state.activities));
  }, [state.activities]);

  useEffect(() => {
    const settings = {
      lowStockThreshold: state.lowStockThreshold,
      expiryDaysThreshold: state.expiryDaysThreshold,
      subscriptionDays: state.subscriptionDays,
      isSubscriptionActive: state.isSubscriptionActive,
      gstNumber: state.gstNumber,
      storeName: state.storeName,
      voiceAssistantEnabled: state.voiceAssistantEnabled,
      voiceAssistantLanguage: state.voiceAssistantLanguage
    };
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [state.lowStockThreshold, state.expiryDaysThreshold, state.subscriptionDays, state.isSubscriptionActive, state.gstNumber, state.storeName, state.voiceAssistantEnabled, state.voiceAssistantLanguage]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: ActionTypes.UPDATE_CURRENT_TIME, payload: new Date().toLocaleTimeString() });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const value = {
    state,
    dispatch
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
