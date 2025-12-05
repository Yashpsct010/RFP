import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FilePlus, Users, Menu, X } from 'lucide-react';
import CreateRFP from './pages/CreateRFP';
import VendorManagement from './pages/VendorManagement';
import Dashboard from './pages/Dashboard';

function App() {
  const [page, setPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rfp', label: 'Create RFP', icon: FilePlus },
    { id: 'vendors', label: 'Vendors', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: 240 }}
        animate={{ width: isSidebarOpen ? 240 : 80 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="bg-white border-r border-slate-200 h-screen sticky top-0 z-10 flex flex-col shadow-sm"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-bold text-primary-600 tracking-tight"
            >
              ProcureAI
            </motion.span>
          ) : null}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-100 rounded-md text-slate-500">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${page === item.id
                ? 'bg-primary-50 text-primary-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <item.icon size={20} className={isSidebarOpen ? "mr-3" : "mx-auto"} />
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            {page === 'dashboard' && <Dashboard onCreateNew={() => setPage('rfp')} />}
            {page === 'rfp' && <CreateRFP />}
            {page === 'vendors' && <VendorManagement />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
