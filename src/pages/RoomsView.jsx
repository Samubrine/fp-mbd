import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function RoomsView() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rooms')
      .then(res => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setRooms(data);
        } else {
          setRooms([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching rooms:', err);
        // Fallback mock database items
        setRooms([
          { id_kamar: 1, nomor_kamar: '101', nama_jenis: 'Standard Room', nama_status: 'Available' },
          { id_kamar: 2, nomor_kamar: '102', nama_jenis: 'Standard Room', nama_status: 'Available' },
          { id_kamar: 3, nomor_kamar: '201', nama_jenis: 'Superior Room', nama_status: 'Occupied' },
          { id_kamar: 4, nomor_kamar: '202', nama_jenis: 'Superior Room', nama_status: 'Cleaning' },
          { id_kamar: 5, nomor_kamar: '301', nama_jenis: 'Deluxe Room', nama_status: 'Available' },
          { id_kamar: 6, nomor_kamar: '302', nama_jenis: 'Deluxe Room', nama_status: 'Available' },
          { id_kamar: 7, nomor_kamar: '501', nama_jenis: 'Executive Suite', nama_status: 'Available' },
          { id_kamar: 8, nomor_kamar: '901', nama_jenis: 'Presidential Suite', nama_status: 'Available' }
        ]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 font-medium">Querying physical room states...</div>
      </div>
    );
  }

  const roomStatusConfig = {
    'Available': {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle2 size={16} className="text-green-500" />
    },
    'Occupied': {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <ShieldAlert size={16} className="text-blue-500" />
    },
    'Cleaning': {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: <Sparkles size={16} className="text-amber-500 animate-pulse" />
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Rooms & Assets</h2>
        <p className="text-sm text-slate-500">Live indicators representing physical rooms status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {rooms.map((room) => {
          const config = roomStatusConfig[room.nama_status] || {
            bg: 'bg-slate-50',
            border: 'border-slate-200',
            text: 'text-slate-800',
            icon: null
          };

          return (
            <div
              key={room.id_kamar}
              className={`p-6 rounded-lg border bg-white flex flex-col justify-between shadow-sm border-l-4 ${config.border}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Room
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                  {config.icon}
                  {room.nama_status}
                </span>
              </div>
              
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-800">{room.nomor_kamar}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">{room.nama_jenis}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
