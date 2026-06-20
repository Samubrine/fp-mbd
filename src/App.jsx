import React, { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import ReservationsList from './pages/ReservationsList.jsx';
import RoomsView from './pages/RoomsView.jsx';
import GuestBooking from './pages/GuestBooking.jsx';
import ReservationFolio from './pages/ReservationFolio.jsx';
import { LayoutDashboard, CalendarRange, Bed, UserRound, ArrowLeftRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'reservations', 'rooms', 'booking', 'folio'
  const [selectedResId, setSelectedResId] = useState(null);

  const viewFolio = (id) => {
    setSelectedResId(id);
    setActiveTab('folio');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F9FB]">
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-[#C6C6CD] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-[#E6E8EA] flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-xl">
              H
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-none">Grand Horizon</h1>
              <span className="text-xs text-slate-500 font-medium">Hotel PMS Admin</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-[#D5E3FD] text-[#0D1C2F]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('reservations')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded font-medium text-sm transition-colors ${
                activeTab === 'reservations'
                  ? 'bg-[#D5E3FD] text-[#0D1C2F]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CalendarRange size={18} />
              Reservations
            </button>

            <button
              onClick={() => setActiveTab('rooms')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded font-medium text-sm transition-colors ${
                activeTab === 'rooms'
                  ? 'bg-[#D5E3FD] text-[#0D1C2F]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Bed size={18} />
              Rooms View
            </button>

            <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Booking Engine
            </div>

            <button
              onClick={() => setActiveTab('booking')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded font-medium text-sm transition-colors ${
                activeTab === 'booking'
                  ? 'bg-[#D5E3FD] text-[#0D1C2F]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <UserRound size={18} />
              Guest Checkout
            </button>
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#E6E8EA] text-center text-xs text-slate-400 font-medium">
          Integrated Hotel System v1.0
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-[#C6C6CD] px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-slate-400" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Operational Traceability Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-slate-600">Database Sync Active</span>
          </div>
        </header>

        <div className="p-8 flex-1">
          {activeTab === 'dashboard' && <Dashboard onViewFolio={viewFolio} />}
          {activeTab === 'reservations' && <ReservationsList onViewFolio={viewFolio} />}
          {activeTab === 'rooms' && <RoomsView />}
          {activeTab === 'booking' && <GuestBooking onBookingSuccess={(id) => viewFolio(id)} />}
          {activeTab === 'folio' && <ReservationFolio reservationId={selectedResId} onBack={() => setActiveTab('reservations')} />}
        </div>
      </main>
    </div>
  );
}
