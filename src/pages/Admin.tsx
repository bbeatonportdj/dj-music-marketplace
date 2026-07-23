import { useState } from 'react';
import { 
  LayoutDashboard, Music, BarChart3, Users, Settings, 
  DollarSign, ArrowUpRight,
  Search, Bell, Mail, User
} from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tracks' | 'sales' | 'users' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tracks', label: 'Track Management', icon: Music },
    { id: 'sales', label: 'Sales Reports', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'Site Settings', icon: Settings },
  ];

  const stats = [
    { label: 'Total Sales', value: '$1,245,300', change: '+5% from last month', icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
    { label: 'New Users', value: '3,500', change: '+12% this week', icon: Users, color: 'bg-green-50 text-green-600' },
    { label: 'Top Selling Genre', value: 'Techno', change: '18,000 tracks sold', icon: Music, color: 'bg-purple-50 text-purple-600' },
  ];

  const recentSales = [
    { id: '#ORD-001', user: 'John Doe', tracks: '"Acid Rain" - DJ Kicks, "Groove" - Beatmaster', amount: '$25.00', date: '2023-10-27', status: 'Completed' },
    { id: '#ORD-002', user: 'Sarah Lee', tracks: '"Cosmic" - Starfall', amount: '$12.00', date: '2023-10-26', status: 'Pending' },
    { id: '#ORD-003', user: 'Mike Chen', tracks: '"Deep Dive" - Ocean', amount: '$15.00', date: '2023-10-25', status: 'Completed' },
    { id: '#ORD-004', user: 'John Doe', tracks: '"Cosmic" - Starfall', amount: '$12.00', date: '2023-10-24', status: 'Pending' },
    { id: '#ORD-005', user: 'John Doe', tracks: '"Acid Rain" - Starfall', amount: '$12.00', date: '2023-10-27', status: 'Pending' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-[240px] bg-white border-r border-gray-100 min-h-screen flex-shrink-0 hidden lg:block">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <Music size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-[14px] font-bold text-black">DJ Marketplace</h1>
                <p className="text-[11px] text-gray-400">Admin</p>
              </div>
            </div>
          </div>

          <nav className="p-4">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-medium transition-colors mb-1 ${
                  activeTab === item.id
                    ? 'bg-gray-100 text-black'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                }`}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Global Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-black relative">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 text-gray-400 hover:text-black">
                <Mail size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-black">
                <User size={18} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <>
                <h2 className="text-2xl font-extrabold text-black mb-6">Overview</h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-lg border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                          <stat.icon size={20} />
                        </div>
                        <ArrowUpRight size={16} className="text-green-500" />
                      </div>
                      <h3 className="text-[13px] text-gray-500 mb-1">{stat.label}</h3>
                      <p className="text-2xl font-bold text-black">{stat.value}</p>
                      <p className="text-[12px] text-green-500 mt-1">{stat.change}</p>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent Sales */}
                  <div className="bg-white rounded-lg border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-[16px] font-bold text-black">Recent Sales</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                            <th className="text-left px-6 py-3">Order ID</th>
                            <th className="text-left px-6 py-3">User</th>
                            <th className="text-left px-6 py-3">Tracks</th>
                            <th className="text-left px-6 py-3">Amount</th>
                            <th className="text-left px-6 py-3">Date</th>
                            <th className="text-left px-6 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {recentSales.map((sale, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-[13px] font-medium text-black">{sale.id}</td>
                              <td className="px-6 py-4 text-[13px] text-gray-600">{sale.user}</td>
                              <td className="px-6 py-4 text-[13px] text-gray-600 max-w-[200px] truncate">{sale.tracks}</td>
                              <td className="px-6 py-4 text-[13px] font-medium text-black">{sale.amount}</td>
                              <td className="px-6 py-4 text-[13px] text-gray-600">{sale.date}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-[11px] font-semibold rounded ${
                                  sale.status === 'Completed' 
                                    ? 'bg-green-50 text-green-600' 
                                    : 'bg-yellow-50 text-yellow-600'
                                }`}>
                                  {sale.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Monthly Revenue Chart */}
                  <div className="bg-white rounded-lg border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-[16px] font-bold text-black">Monthly Revenue (Last 6 Months)</h3>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-blue-600 rounded-full" />
                        <span className="text-[12px] text-gray-500">Revenue</span>
                      </div>
                      
                      {/* Simple Chart */}
                      <div className="h-[200px] flex items-end gap-2">
                        {[
                          { month: 'May', value: 80 },
                          { month: 'Jun', value: 100 },
                          { month: 'Jul', value: 120 },
                          { month: 'Aug', value: 130 },
                          { month: 'Sep', value: 160 },
                          { month: 'Oct', value: 180 },
                        ].map((item, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-[10px] text-gray-400">${item.value}K</span>
                            <div 
                              className="w-full bg-blue-600 rounded-t"
                              style={{ height: `${(item.value / 200) * 100}%` }}
                            />
                            <span className="text-[11px] text-gray-500">{item.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'tracks' && (
              <div className="text-center py-20">
                <Music size={48} className="text-gray-200 mx-auto mb-4" />
                <h3 className="text-[16px] font-bold text-black mb-2">Track Management</h3>
                <p className="text-[13px] text-gray-500">Manage your track inventory, uploads, and metadata.</p>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="text-center py-20">
                <BarChart3 size={48} className="text-gray-200 mx-auto mb-4" />
                <h3 className="text-[16px] font-bold text-black mb-2">Sales Reports</h3>
                <p className="text-[13px] text-gray-500">View detailed sales analytics and revenue reports.</p>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="text-center py-20">
                <Users size={48} className="text-gray-200 mx-auto mb-4" />
                <h3 className="text-[16px] font-bold text-black mb-2">User Management</h3>
                <p className="text-[13px] text-gray-500">Manage user accounts, roles, and permissions.</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="text-center py-20">
                <Settings size={48} className="text-gray-200 mx-auto mb-4" />
                <h3 className="text-[16px] font-bold text-black mb-2">Site Settings</h3>
                <p className="text-[13px] text-gray-500">Configure site-wide settings and preferences.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
