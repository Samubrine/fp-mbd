import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, DollarSign, RefreshCw, Printer, AlertCircle } from 'lucide-react';

export default function ReservationFolio({ reservationId, onBack }) {
  const [folio, setFolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [servicesCatalog, setServicesCatalog] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);

  // Form states for mutations
  const [serviceForm, setServiceForm] = useState({ id_layanan: '', jumlah: 1 });
  const [paymentForm, setPaymentForm] = useState({ id_metode: '', id_status_bayar: '', nominal_bayar: '' });

  const fetchFolioData = () => {
    setLoading(true);
    fetch(`/api/reservations/${reservationId}`)
      .then(res => res.json())
      .then(data => {
        setFolio(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching reservation folio:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFolioData();
    // Load catalogs
    Promise.all([
      fetch('/api/catalogs/services').then(r => r.json()),
      fetch('/api/catalogs/payment-methods').then(r => r.json()),
      fetch('/api/catalogs/payment-statuses').then(r => r.json())
    ]).then(([services, methods, statuses]) => {
      setServicesCatalog(services);
      setPaymentMethods(methods);
      setPaymentStatuses(statuses);
      if (services.length > 0) setServiceForm(prev => ({ ...prev, id_layanan: services[0].id_layanan.toString() }));
      if (methods.length > 0) setPaymentForm(prev => ({ ...prev, id_metode: methods[0].id_metode.toString() }));
      if (statuses.length > 0) setPaymentForm(prev => ({ ...prev, id_status_bayar: statuses[0].id_status_bayar.toString() }));
    }).catch(err => console.error('Error loading mutations metadata:', err));
  }, [reservationId]);

  const handleStatusMutation = (newStatus) => {
    fetch(`/api/reservations/${reservationId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_name: newStatus, id_pegawai: 2 }) // Receptionist 
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        fetchFolioData();
      })
      .catch(err => alert(err.message));
  };

  const handleAddService = (e) => {
    e.preventDefault();
    fetch(`/api/reservations/${reservationId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_layanan: parseInt(serviceForm.id_layanan),
        jumlah: parseInt(serviceForm.jumlah),
        id_pegawai: 1 // Receptionist/Admin staff
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        fetchFolioData();
      })
      .catch(err => alert(err.message));
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    fetch(`/api/reservations/${reservationId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_metode: parseInt(paymentForm.id_metode),
        id_status_bayar: parseInt(paymentForm.id_status_bayar),
        nominal_bayar: parseFloat(paymentForm.nominal_bayar),
        id_pegawai: 3 // Cashier Hendra
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPaymentForm(prev => ({ ...prev, nominal_bayar: '' }));
        fetchFolioData();
      })
      .catch(err => alert(err.message));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 font-medium">Reconstruction of financial folio...</div>
      </div>
    );
  }

  const { header, details, services, payments, logs } = folio;

  // Calculate balances
  const netBalance = parseFloat(header.total_tagihan) - parseFloat(header.total_terbayar);

  return (
    <div className="space-y-8">
      {/* Header controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Reservations
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#C6C6CD] rounded text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Printer size={16} />
            Print Folio
          </button>
        </div>
      </div>

      {/* Reservation Header Card */}
      <div className="bg-white rounded-lg border border-[#C6C6CD] shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Details</span>
          <p className="font-bold text-slate-800 text-lg mt-1">{header.nama_lengkap}</p>
          <p className="text-xs text-slate-500 mt-1">NIK: {header.nomor_identitas}</p>
          <p className="text-xs text-slate-500">{header.email}</p>
        </div>
        
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stay Details</span>
          {details.map((d, index) => (
            <div key={index} className="mt-1">
              <p className="font-bold text-slate-700">Room {d.nomor_kamar} ({d.nama_jenis})</p>
              <p className="text-xs text-slate-500 mt-1">In: {new Date(d.check_in).toLocaleDateString()}</p>
              <p className="text-xs text-slate-500">Out: {new Date(d.check_out).toLocaleDateString()}</p>
            </div>
          ))}
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Folio Status</span>
          <span className="inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            {header.status_reservasi}
          </span>
          
          <div className="flex gap-2 mt-3">
            {header.status_reservasi === 'Confirmed' && (
              <button
                onClick={() => handleStatusMutation('Checked In')}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
              >
                Check In
              </button>
            )}
            {header.status_reservasi === 'Checked In' && (
              <button
                onClick={() => handleStatusMutation('Checked Out')}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold"
              >
                Check Out
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded border border-[#E6E8EA] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Financial Summary</span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xs text-slate-500">Total Invoice:</span>
              <span className="font-bold text-slate-800">Rp {parseFloat(header.total_tagihan).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500">Total Paid:</span>
              <span className="font-bold text-emerald-600">Rp {parseFloat(header.total_terbayar).toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div className="border-t border-[#E6E8EA] pt-2 mt-2 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-700">Remaining Balance:</span>
            <span className={`font-bold ${netBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              Rp {netBalance.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Bill items table */}
      <div className="bg-white rounded-lg border border-[#C6C6CD] shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-800">Room Charges & Snapshot Prices</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[#E6E8EA] text-slate-400 font-bold uppercase text-[10px]">
              <th className="py-2">Room</th>
              <th className="py-2">Duration</th>
              <th className="py-2 text-right">Master Rate</th>
              <th className="py-2 text-right">Discounts</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E8EA] text-slate-600">
            {details.map((d, index) => {
              const nights = Math.round((new Date(d.check_out) - new Date(d.check_in)) / (1000 * 60 * 60 * 24));
              return (
                <tr key={index}>
                  <td className="py-3 font-semibold text-slate-800">Room {d.nomor_kamar} ({d.nama_jenis})</td>
                  <td className="py-3">{nights} Nights</td>
                  <td className="py-3 text-right">Rp {parseFloat(d.harga_kamar_snapshot).toLocaleString('id-ID')}</td>
                  <td className="py-3 text-right text-rose-500">-Rp {parseFloat(d.diskon_kamar).toLocaleString('id-ID')}</td>
                  <td className="py-3 text-right font-bold text-slate-800">Rp {parseFloat(d.subtotal).toLocaleString('id-ID')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Room Services and payment columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Layanan Tambahan */}
        <div className="bg-white rounded-lg border border-[#C6C6CD] shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-[#E6E8EA] pb-3">
            <h3 className="font-bold text-slate-800">Requested Additional Services</h3>
          </div>
          
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#E6E8EA] text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2">Service</th>
                <th className="py-2">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EA] text-slate-600">
              {services.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-slate-400">No additional services requested.</td>
                </tr>
              ) : (
                services.map((s, index) => (
                  <tr key={index}>
                    <td className="py-2">{s.nama_layanan}</td>
                    <td className="py-2">{s.jumlah}</td>
                    <td className="py-2 text-right">Rp {parseFloat(s.harga_layanan_snapshot).toLocaleString('id-ID')}</td>
                    <td className="py-2 text-right font-bold text-slate-800">Rp {parseFloat(s.subtotal).toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Add Service form */}
          <form onSubmit={handleAddService} className="pt-4 border-t border-[#E6E8EA] grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Add Service</label>
              <select
                value={serviceForm.id_layanan}
                onChange={e => setServiceForm(prev => ({ ...prev, id_layanan: e.target.value }))}
                className="w-full px-2 py-1.5 border border-[#C6C6CD] rounded text-xs bg-white focus:outline-none"
              >
                {servicesCatalog.map(item => (
                  <option key={item.id_layanan} value={item.id_layanan}>
                    {item.nama_layanan} (Rp {parseFloat(item.harga_layanan).toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Qty</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  required
                  value={serviceForm.jumlah}
                  onChange={e => setServiceForm(prev => ({ ...prev, jumlah: parseInt(e.target.value) || 1 }))}
                  className="w-16 px-2 py-1.5 border border-[#C6C6CD] rounded text-xs focus:outline-none"
                />
                <button type="submit" className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800">
                  Add
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Pembayaran */}
        <div className="bg-white rounded-lg border border-[#C6C6CD] shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800">Financial Log & Intake</h3>
          
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#E6E8EA] text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2">Method</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EA] text-slate-600">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-slate-400">No payment records logged in this folio.</td>
                </tr>
              ) : (
                payments.map((p, index) => (
                  <tr key={index}>
                    <td className="py-2">{p.nama_metode}</td>
                    <td className="py-2">
                      <span className="font-bold text-xs">{p.status_pembayaran}</span>
                    </td>
                    <td className="py-2 text-right font-bold text-emerald-600">Rp {parseFloat(p.nominal_bayar).toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Add Payment form */}
          <form onSubmit={handleAddPayment} className="pt-4 border-t border-[#E6E8EA] grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Method</label>
              <select
                value={paymentForm.id_metode}
                onChange={e => setPaymentForm(prev => ({ ...prev, id_metode: e.target.value }))}
                className="w-full px-2 py-1.5 border border-[#C6C6CD] rounded text-xs bg-white focus:outline-none"
              >
                {paymentMethods.map(item => (
                  <option key={item.id_metode} value={item.id_metode}>{item.nama_metode}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
              <select
                value={paymentForm.id_status_bayar}
                onChange={e => setPaymentForm(prev => ({ ...prev, id_status_bayar: e.target.value }))}
                className="w-full px-2 py-1.5 border border-[#C6C6CD] rounded text-xs bg-white focus:outline-none"
              >
                {paymentStatuses.map(item => (
                  <option key={item.id_status_bayar} value={item.id_status_bayar}>{item.nama_status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  placeholder="Rp"
                  value={paymentForm.nominal_bayar}
                  onChange={e => setPaymentForm(prev => ({ ...prev, nominal_bayar: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-[#C6C6CD] rounded text-xs focus:outline-none"
                />
                <button type="submit" className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800">
                  Log
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-lg border border-[#C6C6CD] shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-800">Operational Log & Audit Activity</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-[#E6E8EA]">
          {logs.map((log) => (
            <div key={log.id_log_pegawai} className="pt-2 text-xs flex justify-between items-center text-slate-500">
              <div>
                <span className="font-bold text-slate-700">{log.nama_pegawai}</span>: {log.keterangan_aktivitas}
              </div>
              <div className="font-mono text-[10px]">{new Date(log.waktu_log).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
