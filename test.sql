-- =========================================================================
-- DATA SEEDING: PENGISIAN DATA MASTER PENDUKUNG
-- =========================================================================

-- Definisi Klasifikasi Jabatan
INSERT INTO Jabatan (nama_jabatan) VALUES 
('General Manager'), 
('Receptionist'), 
('Housekeeping'), 
('Cashier'), 
('F&B Service');

-- Definisi Jadwal Operasional (Shift)
INSERT INTO Shift (nama_shift, jam_mulai, jam_selesai) VALUES 
('Morning', '06:00:00', '14:00:00'), 
('Middle', '10:00:00', '18:00:00'),
('Evening', '14:00:00', '22:00:00'), 
('Night', '22:00:00', '06:00:00');

-- Katalog Jenis dan Kapasitas Kamar
INSERT INTO Jenis_Kamar (nama_jenis, kapasitas, harga_master) VALUES 
('Standard Room', 2, 350000.00), 
('Superior Room', 2, 500000.00), 
('Deluxe Room', 3, 750000.00), 
('Executive Suite', 4, 1500000.00), 
('Presidential Suite', 6, 3500000.00);

-- Daftar Layanan Fasilitas Tambahan
INSERT INTO Layanan_Tambahan (nama_layanan, harga_layanan, status_aktif) VALUES 
('Extra Bed', 150000.00, TRUE), 
('Laundry Express per Kg', 25000.00, TRUE), 
('Breakfast Buffet Room Service', 75000.00, TRUE), 
('Airport Pick-up Service', 200000.00, TRUE), 
('Late Checkout Charge', 100000.00, TRUE);

-- =========================================================================
-- DATA SEEDING: ENTITAS INTI (SUMBER DAYA MANUSIA & ASET)
-- =========================================================================

-- Registrasi Data Tamu (Pelanggan)
INSERT INTO Pelanggan (nama_lengkap, nomor_identitas, no_telp, email, alamat) VALUES 
('Budi Santoso', '3171012345670001', '08123456789', 'budi.santoso@email.com', 'Jl. Merdeka No. 10, Jakarta'),
('Siti Aminah', '3171023456780002', '08134567890', 'siti.aminah@email.com', 'Jl. Sudirman No. 45, Bandung'),
('John Doe', 'A987654321', '+14155552671', 'john.doe@foreign.com', '123 Baker Street, London'),
('Rian Hidayat', '3273019876540003', '08567890123', 'rian.h@email.com', 'Jl. Dago No. 102, Bandung'),
('Dewi Lestari', '3578028765430004', '08190123456', 'dewi.lestari@email.com', 'Jl. Pemuda No. 12, Surabaya');

-- Inventarisasi Data Pegawai
INSERT INTO Pegawai (id_jabatan, id_shift, nama_pegawai, no_telp, status_aktif) VALUES 
(2, 1, 'Andi Wijaya', '08111111111', TRUE),
(2, 3, 'Siska Amelia', '08111111112', TRUE),
(4, 1, 'Hendra Kurnia', '08111111113', TRUE),
(4, 3, 'Rina Permata', '08111111114', TRUE),
(3, 2, 'Joko Susilo', '08111111115', TRUE);

-- Pemetaan Unit Kamar Hotel
INSERT INTO Kamar (nomor_kamar, id_jenis_kamar, id_status_kamar) VALUES 
('101', 1, 1), 
('102', 1, 1), 
('201', 2, 1), 
('202', 2, 1), 
('301', 3, 1), 
('302', 3, 1), 
('501', 4, 1), 
('901', 5, 1);

-- =========================================================================
-- DATA SEEDING: SIMULASI TRANSAKSI DAN OPERASIONAL
-- =========================================================================

-- Pembuatan Reservasi Baru
INSERT INTO Reservasi (id_pelanggan, id_status_res) VALUES (1, 2);

-- Detil Item Reservasi (Kunci Harga & Periode Inap)
INSERT INTO Detail_Reservasi (id_reservasi, id_kamar, check_in, check_out, harga_kamar_snapshot, diskon_kamar) 
VALUES (1, 1, '2026-06-18', '2026-06-21', 350000.00, 50000.00); 

-- Pencatatan Penggunaan Layanan Tambahan
INSERT INTO Transaksi_Layanan (id_detail_res, id_layanan, id_pegawai_pencatat, jumlah, harga_layanan_snapshot)
VALUES (1, 1, 1, 1, 150000.00);

-- Log Aktivitas Staf terhadap Reservasi
INSERT INTO Reservasi_Pegawai (id_reservasi, id_pegawai, keterangan_aktivitas)
VALUES (1, 1, 'Proses administrasi reservasi dan pengecekan ketersediaan unit 101');

-- Eksekusi Transaksi Pembayaran (Deposit)
INSERT INTO Pembayaran (id_reservasi, id_metode, id_status_bayar, id_pegawai_kasir, nominal_bayar)
VALUES (1, 2, 1, 3, 500000.00);