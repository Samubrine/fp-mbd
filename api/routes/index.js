import express from 'express';
import { pool } from '../config/db.js';

export const router = express.Router();

// ==========================================
// 1. DASHBOARD OVERVIEW METRICS
// ==========================================
router.get('/dashboard/metrics', async (req, res) => {
  try {
    // a. Occupancy Metrics
    const activeRoomsQuery = await pool.query('SELECT COUNT(*) FROM kamar');
    const occupiedRoomsQuery = await pool.query(
      `SELECT COUNT(*) FROM kamar k 
       JOIN status_kamar sk ON k.id_status_kamar = sk.id_status_kamar 
       WHERE sk.nama_status = 'Occupied'`
    );
    const cleaningRoomsQuery = await pool.query(
      `SELECT COUNT(*) FROM kamar k 
       JOIN status_kamar sk ON k.id_status_kamar = sk.id_status_kamar 
       WHERE sk.nama_status = 'Cleaning'`
    );

    const totalRooms = parseInt(activeRoomsQuery.rows[0].count) || 1;
    const occupiedRooms = parseInt(occupiedRoomsQuery.rows[0].count) || 0;
    const cleaningRooms = parseInt(cleaningRoomsQuery.rows[0].count) || 0;
    const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

    // b. Today Check-ins and Check-outs
    const checkInsQuery = await pool.query(
      `SELECT COUNT(*) FROM detail_reservasi dr
       JOIN reservasi r ON dr.id_reservasi = r.id_reservasi
       JOIN status_reservasi sr ON r.id_status_res = sr.id_status_res
       WHERE dr.check_in = CURRENT_DATE AND sr.nama_status NOT IN ('Cancelled')`
    );
    const checkOutsQuery = await pool.query(
      `SELECT COUNT(*) FROM detail_reservasi dr
       JOIN reservasi r ON dr.id_reservasi = r.id_reservasi
       JOIN status_reservasi sr ON r.id_status_res = sr.id_status_res
       WHERE dr.check_out = CURRENT_DATE AND sr.nama_status NOT IN ('Cancelled')`
    );

    // c. Revenue overview (Aggregated monthly)
    const revenueQuery = await pool.query(
      `SELECT 
         TO_CHAR(COALESCE(p.waktu_pembayaran, CURRENT_TIMESTAMP), 'YYYY-MM') AS month,
         SUM(CASE WHEN sb.nama_status IN ('DP', 'Pelunasan') THEN p.nominal_bayar ELSE 0 END) AS cash_in,
         SUM(CASE WHEN sb.nama_status = 'Refund' THEN p.nominal_bayar ELSE 0 END) AS cash_out
       FROM pembayaran p
       JOIN status_pembayaran sb ON p.id_status_bayar = sb.id_status_bayar
       GROUP BY TO_CHAR(COALESCE(p.waktu_pembayaran, CURRENT_TIMESTAMP), 'YYYY-MM')
       ORDER BY month DESC LIMIT 6`
    );

    res.json({
      occupancy: {
        total: totalRooms,
        occupied: occupiedRooms,
        cleaning: cleaningRooms,
        rate: occupancyRate
      },
      today: {
        checkIns: parseInt(checkInsQuery.rows[0].count) || 0,
        checkOuts: parseInt(checkOutsQuery.rows[0].count) || 0
      },
      revenue: revenueQuery.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ROOM & AVAILABILITY ENDPOINTS
// ==========================================

// Get Room Categories & Prices
router.get('/room-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jenis_kamar ORDER BY id_jenis_kamar ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Live Rooms List & Statuses
router.get('/rooms', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT k.id_kamar, k.nomor_kamar, jk.nama_jenis, sk.nama_status 
       FROM kamar k
       JOIN jenis_kamar jk ON k.id_jenis_kamar = jk.id_jenis_kamar
       JOIN status_kamar sk ON k.id_status_kamar = sk.id_status_kamar
       ORDER BY k.nomor_kamar ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check availability for a specific category and date range
router.get('/rooms/available-types', async (req, res) => {
  const { check_in, check_out } = req.query;
  if (!check_in || !check_out) {
    return res.status(400).json({ error: 'Check-in and check-out dates are required' });
  }
  try {
    // Find count of booked rooms per category in that range
    const bookedQuery = await pool.query(
      `SELECT k.id_jenis_kamar, COUNT(*) as count 
       FROM detail_reservasi dr
       JOIN kamar k ON dr.id_kamar = k.id_kamar
       JOIN reservasi r ON dr.id_reservasi = r.id_reservasi
       JOIN status_reservasi sr ON r.id_status_res = sr.id_status_res
       WHERE sr.nama_status NOT IN ('Cancelled')
         AND $1 < dr.check_out
         AND $2 > dr.check_in
       GROUP BY k.id_jenis_kamar`,
      [check_in, check_out]
    );

    const totalRoomsQuery = await pool.query(
      `SELECT id_jenis_kamar, COUNT(*) as total FROM kamar GROUP BY id_jenis_kamar`
    );

    const typesQuery = await pool.query(`SELECT * FROM jenis_kamar`);

    const bookedMap = {};
    bookedQuery.rows.forEach(r => { bookedMap[r.id_jenis_kamar] = parseInt(r.count); });

    const totalMap = {};
    totalRoomsQuery.rows.forEach(r => { totalMap[r.id_jenis_kamar] = parseInt(r.total); });

    const availableTypes = typesQuery.rows.map(type => {
      const bookedCount = bookedMap[type.id_jenis_kamar] || 0;
      const totalCount = totalMap[type.id_jenis_kamar] || 0;
      return {
        ...type,
        available: Math.max(0, totalCount - bookedCount)
      };
    });

    res.json(availableTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. RESERVATION LIFECYCLE
// ==========================================

// List reservations (Admin side)
router.get('/reservations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id_reservasi, p.nama_lengkap, p.email, sr.nama_status as status_reservasi,
              r.total_tagihan, r.total_terbayar, r.tanggal_dibuat
       FROM reservasi r
       JOIN pelanggan p ON r.id_pelanggan = p.id_pelanggan
       JOIN status_reservasi sr ON r.id_status_res = sr.id_status_res
       ORDER BY r.id_reservasi DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Detail Folio for a Specific Reservation
router.get('/reservations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resHeader = await pool.query(
      `SELECT r.id_reservasi, p.nama_lengkap, p.nomor_identitas, p.no_telp, p.email, p.alamat,
              sr.nama_status as status_reservasi, r.total_tagihan, r.total_terbayar
       FROM reservasi r
       JOIN pelanggan p ON r.id_pelanggan = p.id_pelanggan
       JOIN status_reservasi sr ON r.id_status_res = sr.id_status_res
       WHERE r.id_reservasi = $1`,
      [id]
    );

    if (resHeader.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const resDetails = await pool.query(
      `SELECT dr.id_detail_res, k.nomor_kamar, jk.nama_jenis, dr.check_in, dr.check_out, 
              dr.harga_kamar_snapshot, dr.diskon_kamar, dr.subtotal
       FROM detail_reservasi dr
       JOIN kamar k ON dr.id_kamar = k.id_kamar
       JOIN jenis_kamar jk ON k.id_jenis_kamar = jk.id_jenis_kamar
       WHERE dr.id_reservasi = $1`,
      [id]
    );

    const resServices = await pool.query(
      `SELECT tl.id_transaksi_layanan, lt.nama_layanan, tl.jumlah, 
              tl.harga_layanan_snapshot, tl.subtotal, peg.nama_pegawai, tl.waktu_pesan
       FROM transaksi_layanan tl
       JOIN layanan_tambahan lt ON tl.id_layanan = lt.id_layanan
       JOIN detail_reservasi dr ON tl.id_detail_res = dr.id_detail_res
       JOIN pegawai peg ON tl.id_pegawai_pencatat = peg.id_pegawai
       WHERE dr.id_reservasi = $1`,
      [id]
    );

    const resPayments = await pool.query(
      `SELECT p.id_pembayaran, mp.nama_metode, sp.nama_status as status_pembayaran, 
              p.nominal_bayar, p.waktu_pembayaran, peg.nama_pegawai as nama_kasir
       FROM pembayaran p
       JOIN metode_pembayaran mp ON p.id_metode = mp.id_metode
       JOIN status_pembayaran sp ON p.id_status_bayar = sp.id_status_bayar
       JOIN pegawai peg ON p.id_pegawai_kasir = peg.id_pegawai
       WHERE p.id_reservasi = $1`,
      [id]
    );

    const resLogs = await pool.query(
      `SELECT rp.id_log_pegawai, peg.nama_pegawai, rp.waktu_log, rp.keterangan_aktivitas
       FROM reservasi_pegawai rp
       JOIN pegawai peg ON rp.id_pegawai = peg.id_pegawai
       WHERE rp.id_reservasi = $1
       ORDER BY rp.waktu_log ASC`,
      [id]
    );

    res.json({
      header: resHeader.rows[0],
      details: resDetails.rows,
      services: resServices.rows,
      payments: resPayments.rows,
      logs: resLogs.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Guest Checkout Endpoint (Creates Customer, Reservation, Detail & Mock Payment)
router.post('/reservations/checkout', async (req, res) => {
  const {
    nama_lengkap,
    nomor_identitas,
    no_telp,
    email,
    alamat,
    id_jenis_kamar,
    check_in,
    check_out,
    nominal_pembayaran,
    id_metode // standard methods 1-4 (Cash, Bank Transfer, CC, E-Wallet)
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find or create Pelanggan
    let customerId;
    const existingCust = await client.query(
      'SELECT id_pelanggan FROM pelanggan WHERE nomor_identitas = $1',
      [nomor_identitas]
    );

    if (existingCust.rows.length > 0) {
      customerId = existingCust.rows[0].id_pelanggan;
    } else {
      const newCust = await client.query(
        `INSERT INTO pelanggan (nama_lengkap, nomor_identitas, no_telp, email, alamat) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id_pelanggan`,
        [nama_lengkap, nomor_identitas, no_telp, email, alamat]
      );
      customerId = newCust.rows[0].id_pelanggan;
    }

    // 2. Select first available Kamar of category id_jenis_kamar between check_in and check_out
    // We apply PESSIMISTIC LOCKING using FOR UPDATE on rooms to prevent double-allocation
    const availableRoomQuery = await client.query(
      `SELECT k.id_kamar, jk.harga_master
       FROM kamar k
       JOIN jenis_kamar jk ON k.id_jenis_kamar = jk.id_jenis_kamar
       WHERE k.id_jenis_kamar = $1
         AND k.id_kamar NOT IN (
           SELECT dr.id_kamar 
           FROM detail_reservasi dr
           JOIN reservasi r ON dr.id_reservasi = r.id_reservasi
           JOIN status_reservasi sr ON r.id_status_res = sr.id_status_res
           WHERE sr.nama_status NOT IN ('Cancelled')
             AND $2 < dr.check_out
             AND $3 > dr.check_in
         )
       ORDER BY k.nomor_kamar ASC
       LIMIT 1
       FOR UPDATE`,
      [id_jenis_kamar, check_in, check_out]
    );

    if (availableRoomQuery.rows.length === 0) {
      throw new Error('OVERBOOKING ERROR: No rooms available in this category for the requested dates.');
    }

    const { id_kamar, harga_master } = availableRoomQuery.rows[0];

    // 3. Create active Confirmed Reservation (id_status_res = 1)
    const newReservation = await client.query(
      `INSERT INTO reservasi (id_pelanggan, id_status_res) 
       VALUES ($1, 1) RETURNING id_reservasi`,
      [customerId]
    );
    const reservationId = newReservation.rows[0].id_reservasi;

    // 4. Create Detail_Reservasi (this automatically fires the overlapping and price constraints trigger)
    await client.query(
      `INSERT INTO detail_reservasi (id_reservasi, id_kamar, check_in, check_out, harga_kamar_snapshot) 
       VALUES ($1, $2, $3, $4, $5)`,
      [reservationId, id_kamar, check_in, check_out, harga_master]
    );

    // 5. Log activity
    await client.query(
      `INSERT INTO reservasi_pegawai (id_reservasi, id_pegawai, keterangan_aktivitas) 
       VALUES ($1, 1, 'Pemesanan otomatis dari Customer Booking Engine')`,
      [reservationId]
    );

    // 6. If payment is supplied, insert payment record
    if (nominal_pembayaran && parseFloat(nominal_pembayaran) > 0) {
      // Find standard DP status
      const dpStatusQuery = await client.query(
        "SELECT id_status_bayar FROM status_pembayaran WHERE nama_status = 'DP'"
      );
      const dpStatusId = dpStatusQuery.rows[0].id_status_bayar;

      await client.query(
        `INSERT INTO pembayaran (id_reservasi, id_metode, id_status_bayar, id_pegawai_kasir, nominal_bayar) 
         VALUES ($1, $2, $3, 3, $4)`,
        [reservationId, id_metode, dpStatusId, nominal_pembayaran]
      );
    }

    await client.query('COMMIT');
    client.release();

    res.json({ success: true, message: 'Reservation checked out successfully!', reservationId });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    res.status(409).json({ error: err.message });
  }
});

// Admin mutate state endpoints (Check-In, Check-Out, Add payments, Add services)
router.patch('/reservations/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status_name, id_pegawai } = req.body; // e.g., 'Checked In' or 'Checked Out'

  try {
    const statusQuery = await pool.query(
      'SELECT id_status_res FROM status_reservasi WHERE nama_status = $1',
      [status_name]
    );

    if (statusQuery.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid status mutation requested' });
    }

    const id_status_res = statusQuery.rows[0].id_status_res;

    await pool.query(
      'UPDATE reservasi SET id_status_res = $1 WHERE id_reservasi = $2',
      [id_status_res, id]
    );

    // Log the mutation
    await pool.query(
      `INSERT INTO reservasi_pegawai (id_reservasi, id_pegawai, keterangan_aktivitas) 
       VALUES ($1, $2, $3)`,
      [id, id_pegawai || 2, `Mengubah status reservasi menjadi: ${status_name}`]
    );

    res.json({ success: true, message: `Reservation status updated to: ${status_name}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record new service request
router.post('/reservations/:id/services', async (req, res) => {
  const { id } = req.params;
  const { id_layanan, id_pegawai, jumlah } = req.body;

  try {
    // 1. Get first detail_reservasi linked to this header
    const detailQuery = await pool.query(
      'SELECT id_detail_res FROM detail_reservasi WHERE id_reservasi = $1 LIMIT 1',
      [id]
    );

    if (detailQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation details not found' });
    }
    const id_detail_res = detailQuery.rows[0].id_detail_res;

    // 2. Fetch service snapshot price
    const serviceQuery = await pool.query(
      'SELECT harga_layanan FROM layanan_tambahan WHERE id_layanan = $1',
      [id_layanan]
    );
    const harga_layanan_snapshot = serviceQuery.rows[0].harga_layanan;

    await pool.query(
      `INSERT INTO transaksi_layanan (id_detail_res, id_layanan, id_pegawai_pencatat, jumlah, harga_layanan_snapshot) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id_detail_res, id_layanan, id_pegawai, jumlah, harga_layanan_snapshot]
    );

    res.json({ success: true, message: 'Service requested successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record new payment
router.post('/reservations/:id/payments', async (req, res) => {
  const { id } = req.params;
  const { id_metode, id_status_bayar, id_pegawai, nominal_bayar } = req.body;

  try {
    await pool.query(
      `INSERT INTO pembayaran (id_reservasi, id_metode, id_status_bayar, id_pegawai_kasir, nominal_bayar) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id, id_metode, id_status_bayar, id_pegawai, nominal_bayar]
    );
    res.json({ success: true, message: 'Payment recorded successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get additional catalog items for forms
router.get('/catalogs/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM layanan_tambahan WHERE status_aktif = TRUE');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalogs/payment-statuses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM status_pembayaran');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalogs/payment-methods', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM metode_pembayaran');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
