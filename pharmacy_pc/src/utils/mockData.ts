export const dashboardStats = {
  todaysOrders: { value: 24, trend: '+8% from yesterday' },
  pendingOrders: { value: 7, text: 'Requires your attention' },
  lowStockItems: { value: 12, text: 'Review inventory' },
  todaysSales: { value: '₹18,450', trend: '+12% from yesterday' },
};

export const recentOrders = [
  { id: '#PC-1024', customer: 'Rahul Patel', items: 3, amount: '₹840', status: 'Pending', time: '10:42 AM' },
  { id: '#PC-1023', customer: 'Neha Shah', items: 2, amount: '₹1,250', status: 'Preparing', time: '10:18 AM' },
  { id: '#PC-1022', customer: 'Amit Joshi', items: 5, amount: '₹560', status: 'Ready', time: '09:54 AM' },
  { id: '#PC-1021', customer: 'Pooja Desai', items: 1, amount: '₹320', status: 'Completed', time: '09:31 AM' },
];

export const lowStockItems = [
  { medicine: 'Paracetamol 500mg', currentStock: 8, minStock: 20, status: 'Low Stock' },
  { medicine: 'Amoxicillin 500mg', currentStock: 5, minStock: 15, status: 'Low Stock' },
  { medicine: 'Azithromycin 500mg', currentStock: 2, minStock: 10, status: 'Critical' },
  { medicine: 'Cetirizine 10mg', currentStock: 12, minStock: 25, status: 'Low Stock' },
];

export const orderOverviewStatus = [
  { label: 'Pending', count: 7, color: 'bg-orange-500' },
  { label: 'Reviewing', count: 3, color: 'bg-yellow-500' },
  { label: 'Bill Ready', count: 2, color: 'bg-blue-400' },
  { label: 'Confirmed', count: 4, color: 'bg-blue-600' },
  { label: 'Preparing', count: 5, color: 'bg-purple-500' },
  { label: 'Ready', count: 6, color: 'bg-pharmacy-500' },
  { label: 'Out for Delivery', count: 4, color: 'bg-teal-500' },
  { label: 'Completed', count: 24, color: 'bg-slate-500' },
];
