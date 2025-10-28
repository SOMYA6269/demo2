import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Package, 
  Receipt, 
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  ShoppingCart,
  Truck,
  BarChart3,
  Calendar,
  CreditCard,
  Activity,
  Zap,
  Target,
  Award,
  PieChart,
  LineChart
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Dashboard = () => {
  const { state, dispatch } = useApp();
  const [timeRange, setTimeRange] = useState('7d');

  // Calculate days remaining in subscription
  const calculateDaysRemaining = () => {
    if (!state.subscription || !state.subscription.expiresAt) {
      return 0;
    }
    const expiresAt = new Date(state.subscription.expiresAt);
    const now = new Date();
    const diffTime = expiresAt - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = calculateDaysRemaining();

  const getDaysRemainingColor = (days) => {
    if (days >= 30) return 'text-green-600 bg-green-50 border-green-200';
    if (days >= 20) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (days >= 10) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-red-700 bg-red-100 border-red-300';
  };

  const getDaysRemainingMessage = (days) => {
    if (days === 0) return 'Subscription Expired';
    if (days <= 3) return 'Recharge Now!';
    if (days <= 10) return `${days} Days Left - Recharge Soon!`;
    if (days <= 20) return `${days} Days Remaining`;
    return `${days} Days Remaining`;
  };

  // Calculate comprehensive dashboard stats
  const totalCustomers = state.customers.length;
  const totalProducts = state.products.length;
  const totalTransactions = state.transactions.length;
  const totalPurchaseOrders = state.purchaseOrders.length;
  
  // Calculate total balance due
  const totalBalanceDue = state.customers.reduce((sum, customer) => {
    return sum + (customer.balanceDue || 0);
  }, 0);

  // Calculate total sales
  const totalSales = state.transactions.reduce((sum, transaction) => {
    return sum + (transaction.total || 0);
  }, 0);

  // Calculate total purchase value
  const totalPurchaseValue = state.purchaseOrders.reduce((sum, order) => {
    return sum + (order.total || 0);
  }, 0);

  // Calculate low stock products
  const lowStockProducts = state.products.filter(product => 
    (product.stock || 0) <= state.lowStockThreshold
  );

  // Calculate expiring products
  const expiringProducts = state.products.filter(product => {
    if (!product.expiryDate) return false;
    const expiryDate = new Date(product.expiryDate);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= state.expiryDaysThreshold && diffDays >= 0;
  });

  // Calculate pending payments
  const pendingPayments = state.customers.filter(customer => 
    (customer.balanceDue || 0) > 0
  ).length;

  // Calculate profit margin (simplified)
  const profitMargin = totalSales > 0 ? ((totalSales - totalPurchaseValue) / totalSales * 100) : 0;

  // Calculate daily profit
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const todayTransactions = state.transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= todayStart && transactionDate < todayEnd;
  });
  
  const todaySales = todayTransactions.reduce((sum, transaction) => sum + (transaction.total || 0), 0);
  const todayPurchaseValue = state.purchaseOrders.filter(order => {
    const orderDate = new Date(order.date);
    return orderDate >= todayStart && orderDate < todayEnd;
  }).reduce((sum, order) => sum + (order.total || 0), 0);
  
  const dailyProfit = todaySales - todayPurchaseValue;

  // Calculate monthly profit
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
  const monthlyTransactions = state.transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= monthStart && transactionDate < monthEnd;
  });
  
  const monthlySales = monthlyTransactions.reduce((sum, transaction) => sum + (transaction.total || 0), 0);
  const monthlyPurchaseValue = state.purchaseOrders.filter(order => {
    const orderDate = new Date(order.date);
    return orderDate >= monthStart && orderDate < monthEnd;
  }).reduce((sum, order) => sum + (order.total || 0), 0);
  
  const monthlyProfit = monthlySales - monthlyPurchaseValue;

  // Recent transactions
  const recentTransactions = state.transactions.slice(0, 5);

  // Comprehensive stats array
  const stats = [
    {
      name: 'Total Customers',
      value: totalCustomers,
      icon: Users,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      change: '+12%',
      changeType: 'positive',
      description: 'Active customers'
    },
    {
      name: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      change: '+8%',
      changeType: 'positive',
      description: 'Items in inventory'
    },
    {
      name: 'Total Sales',
      value: `₹${totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      change: '+15%',
      changeType: 'positive',
      description: 'Revenue this month'
    },
    {
      name: 'Balance Due',
      value: `₹${totalBalanceDue.toLocaleString()}`,
      icon: CreditCard,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      change: '-5%',
      changeType: 'negative',
      description: 'Outstanding payments'
    },
    {
      name: 'Purchase Orders',
      value: totalPurchaseOrders,
      icon: Truck,
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      change: '+3%',
      changeType: 'positive',
      description: 'Orders placed'
    },
    {
      name: 'Profit Margin',
      value: `${profitMargin.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      change: '+2%',
      changeType: 'positive',
      description: 'Net profit ratio'
    },
    {
      name: 'Daily Profit',
      value: `₹${dailyProfit.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      change: dailyProfit >= 0 ? '+₹' + Math.abs(dailyProfit).toLocaleString() : '-₹' + Math.abs(dailyProfit).toLocaleString(),
      changeType: dailyProfit >= 0 ? 'positive' : 'negative',
      description: 'Today\'s profit/loss'
    },
    {
      name: 'Monthly Profit',
      value: `₹${monthlyProfit.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-teal-500 to-teal-600',
      change: monthlyProfit >= 0 ? '+₹' + Math.abs(monthlyProfit).toLocaleString() : '-₹' + Math.abs(monthlyProfit).toLocaleString(),
      changeType: monthlyProfit >= 0 ? 'positive' : 'negative',
      description: 'This month\'s profit/loss'
    }
  ];

  // Chart data
  const salesChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales (₹)',
        data: [12000, 19000, 3000, 5000, 2000, 3000, 8000],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const categoryChartData = {
    labels: ['Grocery', 'Vegetables', 'Fruits', 'Dairy', 'Beverages'],
    datasets: [
      {
        data: [30, 25, 20, 15, 10],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
    },
  };

  return (
    <div className="space-y-8 fade-in-up">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-xl shadow-lg p-8 text-white animate-pulse-glow">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="animate-fadeInUp">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-emerald-100 text-lg">Welcome back, {state.currentUser?.username || 'User'}! 👋</p>
            <div className="mt-3 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-emerald-100">System Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-emerald-100">All Systems Operational</span>
              </div>
            </div>
          </div>
          <div className="text-right animate-slideInRight">
            <div className="text-emerald-100 text-sm mb-1">Current Time</div>
            <div className="text-xl font-semibold">
              {new Date().toLocaleDateString()}
            </div>
            <div className="text-lg font-medium">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      {/* Subscription Status Alert */}
      {daysRemaining > 0 && (
        <div className={`rounded-xl border-2 p-4 ${getDaysRemainingColor(daysRemaining)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6" />
              <div>
                <p className="font-semibold text-lg">{getDaysRemainingMessage(daysRemaining)}</p>
                <p className="text-sm opacity-80">Your subscription will expire soon. Please recharge to continue using all features.</p>
              </div>
            </div>
            {daysRemaining <= 3 && (
              <button
                onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'upgrade' })}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Recharge Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Business Overview</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="input-field w-40"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="stat-card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color} mr-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
            Important Alerts
          </h3>
          <div className="space-y-4">
            {lowStockProducts.length > 0 && (
              <div className="flex items-center p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-400">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-800">
                    {lowStockProducts.length} products low in stock
                  </p>
                  <p className="text-sm text-yellow-600">
                    {lowStockProducts.slice(0, 3).map(product => product.name).join(', ')}
                    {lowStockProducts.length > 3 && ` and ${lowStockProducts.length - 3} more`}
                  </p>
                </div>
              </div>
            )}
            
            {expiringProducts.length > 0 && (
              <div className="flex items-center p-4 bg-red-50 rounded-xl border-l-4 border-red-400">
                <Clock className="h-6 w-6 text-red-600 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">
                    {expiringProducts.length} products expiring soon
                  </p>
                  <p className="text-sm text-red-600">
                    {expiringProducts.slice(0, 3).map(product => product.name).join(', ')}
                    {expiringProducts.length > 3 && ` and ${expiringProducts.length - 3} more`}
                  </p>
                </div>
              </div>
            )}

            {pendingPayments > 0 && (
              <div className="flex items-center p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                <CreditCard className="h-6 w-6 text-blue-600 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-800">
                    {pendingPayments} customers have pending payments
                  </p>
                  <p className="text-sm text-blue-600">
                    Total outstanding: ₹{totalBalanceDue.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            
            {lowStockProducts.length === 0 && expiringProducts.length === 0 && pendingPayments === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-green-600 font-semibold">All good! No alerts at this time</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Receipt className="h-5 w-5 mr-2 text-green-600" />
            Recent Transactions
          </h3>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <Receipt className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.customerName || 'Unknown Customer'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.type} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{transaction.total?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-green-600">Completed</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No recent transactions</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;