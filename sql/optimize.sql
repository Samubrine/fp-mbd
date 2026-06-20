CREATE INDEX idx_dates_detail_res ON Detail_Reservasi (check_in, check_out);
-- Optimasi akselerasi relasi filter antara Header dan Detail Reservasi
CREATE INDEX idx_detail_res_id_reservasi ON Detail_Reservasi(id_reservasi);

-- Sinkronisasi pelacakan log transaksi layanan pada setiap unit inap
CREATE INDEX idx_transaksi_layanan_id_detail ON Transaksi_Layanan(id_detail_res);

-- Peningkatan efisiensi lookup histori keuangan pelanggan
CREATE INDEX idx_pembayaran_id_reservasi ON Pembayaran(id_reservasi);

-- Mempercepat proses klasifikasi unit berdasarkan tipe jenis kamar
CREATE INDEX idx_kamar_id_jenis_kamar ON Kamar(id_jenis_kamar);


EXPLAIN ANALYZE 
SELECT COUNT(*) 
FROM Detail_Reservasi dr
WHERE dr.id_kamar = 1
  AND '2026-06-18' < dr.check_out
  AND '2026-06-21' > dr.check_in;


  -- Proteksi integritas baris unit kamar sebelum inisiasi reservasi baru
SELECT id_status_kamar 
FROM Kamar 
WHERE id_kamar = 1 
FOR UPDATE;