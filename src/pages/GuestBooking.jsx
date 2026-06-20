import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

export default function GuestBooking({ onBookingSuccess }) {
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nomor_identitas: '',
    no_telp: '',
    email: '',
    alamat: '',
    id_jenis_kamar: '',
    check_in: '',
    check_out: '',
    nominal_pembayaran: '',
    id_metode: '2' // default Bank Transfer
  });

  const [roomTypes, setRoomTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch catalogs
  useEffect(() => {
    Promise.all([
      fetch('/api/room-types').then(r => r.json()),
      fetch('/api/catalogs/payment-methods').then(r => r.json())
    ]).then(([types, methods]) => {
      setRoomTypes(types);
      setPaymentMethods(methods);
      if (types.length > 0) {
        setFormData(prev => ({ ...prev, id_jenis_kamar: types[0].id_jenis_kamar.toString() }));
      }
    }).catch(err => console.error('Error fetching checkout catalogs:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Call checkout api
    fetch('/api/reservations/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        id_jenis_kamar: parseInt(formData.id_jenis_kamar),
        id_metode: parseInt(formData.id_metode),
        nominal_pembayaran: formData.nominal_pembayaran ? parseFloat(formData.nominal_pembayaran) : 0
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Server rejected checkout transaction');
        }
        return data;
      })
      .then(data => {
        setLoading(false);
        if (data.success && data.reservationId) {
          onBookingSuccess(data.reservationId);
        }
      })
      .catch(err => {
        setLoading(false);
        setErrorMsg(err.message);
      });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Direct Guest Checkout</h2>
        <p className="text-sm text-slate-500">Fast checkout engine assigning rooms dynamically based on category inventory.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#C6C6CD] shadow-sm overflow-hidden divide-y divide-[#E6E8EA]">
        {/* Customer Identity Section */}
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">1. Guest Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
              <input
                type="text"
                name="nama_lengkap"
                required
                value={formData.nama_lengkap}
                onChange={handleChange}
                placeholder="e.g. Amanda Jones"
                className="w-full px-3 py-2 border border-[#C6C6CD] rounded text-sm focus:outline-none focus:border-slate-800"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Identity card NIK / Passport</label>
              <input
                type="text"
                name="nomor_identitas"
                required
                value={formData.nomor_identitas}
                onChange={handleChange}
                placeholder="National Identity card number"
                className="w-full px-3 py-2 border border-[#C6C6CD] rounded text-sm focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
              <input
                type="text"
                name="no_telp"
                required
                value={formData.no_telp}
                onChange={handleChange}
                placeholder="Active mobile number"
                className="w-full px-3 py-2 border border-[#C6C6CD] rounded text-sm focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="guest@domain.com"
                className="w-full px-3 py-2 border border-[#C6C6CD] rounded text-sm focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Home Address</label>
              <textarea
                name="alamat"
                rows="2"
                value={formData.alamat}
                onChange={handleChange}
                placeholder="Street address details..."
                className="w-full px-3 py-2 border border-[#C6C6CD] rounded text-sm focus:outline-none focus:border-slate-800"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Room selection & stay duration */}
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">2. Booking Allocation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Room Category</label>
              <select
                name="id_jenis_kamar"
                value={formData.id_jenis_kamar}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#C6C6CD] rounded text-sm bg-white focus:outline-none focus:border-slate-800"
              >
                {roomTypes.map(t => (
                  <option key={t.id_jenis_kamar} value={t.id_jenis_kamar}>
                    {t.nama_jenis} (Rp {parseFloat(t.harga_master).toLocaleString('id-ID')}/night)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Check-in Date</label>
              <input
                type="date"
                name="check_in"
                required
                value={formData.check_in}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#C6C6CD] rounded text-sm focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Check-out Date</label>
              <input
                type="date"
                name="check_out"
                required
                value={formData.check_out}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#C6C6CD] rounded text-sm focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Financial & Mock payment */}
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">3. Midtrans Payment Mock</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Method</label>
              <select
                name="id_metode"
                value={formData.id_metode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#C6C6CD] rounded text-sm bg-white focus:outline-none focus:border-slate-800"
              >
                {paymentMethods.map(m => (
                  <option key={m.id_metode} value={m.id_metode}>{m.nama_metode}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Down Payment / Total Paid (Rp)</label>
              <input
                type="number"
                name="nominal_pembayaran"
                required
                value={formData.nominal_pembayaran}
                onChange={handleChange}
                placeholder="Nominal deposit amount"
                className="w-full px-3 py-2 border border-[#C6C6CD] rounded text-sm focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-[#E6E8EA] rounded flex items-center gap-3">
            <CreditCard className="text-slate-400" size={24} />
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-700 block">Midtrans Mock Payment Enabled</span>
              Transactions automatically clear with status &apos;DP&apos; upon execution.
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="p-6 bg-slate-50 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded text-sm font-semibold hover:bg-slate-800 transition-colors disabled:bg-slate-500"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Confirm Checkout & Allocate Room
          </button>
        </div>
      </form>
    </div>
  );
}
