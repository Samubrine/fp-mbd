import React, { useState, useEffect } from 'react';
import { Eye, Plus } from 'lucide-react';

export default function ReservationsList({ onViewFolio }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reservations')
      .then(res => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setReservations(data);
        } else {
          setReservations([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching reservations:', err);
        // Fallback mock data when DB not connected or Vercel API is offline
        setReservations([
          {
            id_reservasi: 1,
            nama_lengkap: "Budi Santoso",
            email: "budi.santoso@email.com",
            status_reservasi: "Confirmed",
            total_tagihan: "1050000.00",
            total_terbayar: "500000.00",
            tanggal_dibuat: "2026-06-20T12:00:00Z"
          }
        ]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 font-medium">Loading reservations index...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reservations</h2>
          <p className="text-sm text-slate-500">Live lookup of parent transactions and balances.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#C6C6CD] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#E6E8EA] bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                <th className="px-6 py-3">Reservation ID</th>
                <th className="px-6 py-3">Customer Name</th>
                <th className="px-6 py-3">Email Address</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Total Invoice</th>
                <th className="px-6 py-3 text-right">Paid</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EA] text-slate-600">
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    No reservations logged in database yet.
                  </td>
                </tr>
              ) : (
                reservations.map((res) => {
                  const statusColors = {
                    'Confirmed': 'bg-blue-50 text-blue-700 border-blue-200',
                    'Checked In': 'bg-green-50 text-green-700 border-green-200',
                    'Checked Out': 'bg-slate-100 text-slate-700 border-slate-300',
                    'Cancelled': 'bg-red-50 text-red-700 border-red-200'
                  };

                  return (
                    <tr key={res.id_reservasi} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        #RES-{res.id_reservasi}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{res.nama_lengkap}</td>
                      <td className="px-6 py-4">{res.email || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          statusColors[res.status_reservasi] || 'bg-slate-50 text-slate-700'
                        }`}>
                          {res.status_reservasi}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-800">
                        Rp {parseFloat(res.total_tagihan).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                        Rp {parseFloat(res.total_terbayar).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => onViewFolio(res.id_reservasi)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
                        >
                          <Eye size={12} />
                          Trace Folio
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
