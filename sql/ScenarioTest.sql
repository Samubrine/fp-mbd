--- FIRST SCENARIO

-- 1. Inisiasi Transaksi Reservasi (Pelanggan: Siti Aminah)
INSERT INTO Reservasi (id_pelanggan, id_status_res) VALUES (2, 1);

-- 2. Alokasi Unit Inap (Superior Room - Unit 201, Durasi: 2 Malam)
INSERT INTO Detail_Reservasi (id_reservasi, id_kamar, check_in, check_out, harga_kamar_snapshot, diskon_kamar)
VALUES (2, 3, '2026-06-19', '2026-06-21', 500000.00, 0.00);

-- 3. Audit Saldo Tagihan pada Header Reservasi
SELECT total_tagihan, total_terbayar FROM Reservasi WHERE id_reservasi = 2;


---

--- SECOND SCENARIO
-- Upaya Reservasi untuk Pelanggan Berikutnya
INSERT INTO Reservasi (id_pelanggan, id_status_res) VALUES (3, 1);

-- Eksperimen Alokasi Unit 201 pada Periode Konflik (20 s/d 23 Juni)
INSERT INTO Detail_Reservasi (id_reservasi, id_kamar, check_in, check_out, harga_kamar_snapshot, diskon_kamar)
VALUES (3, 3, '2026-06-20', '2026-06-23', 500000.00, 0.00);

---

--- THIRD SCENARIO
-- Status Awal Unit 201: id_status_kamar = 1 (Available)

-- Eksekusi Prosedur Check-In Tamu
UPDATE Reservasi SET id_status_res = 3 WHERE id_reservasi = 2;

-- Audit Perubahan Status Fisik Kamar 201
SELECT k.nomor_kamar, sk.nama_status
FROM Kamar k
JOIN Status_Kamar sk ON k.id_status_kamar = sk.id_status_kamar
WHERE k.nomor_kamar = '201';

---

--- FOURTH SCENARIO
-- 1. Integrasi Biaya Layanan Tambahan (Room Service)
INSERT INTO Transaksi_Layanan (id_detail_res, id_layanan, id_pegawai_pencatat, jumlah, harga_layanan_snapshot)
VALUES (2, 3, 1, 2, 75000.00);

-- 2. Validasi Pembayaran Pelunasan Tunai
INSERT INTO Pembayaran (id_reservasi, id_metode, id_status_bayar, id_pegawai_kasir, nominal_bayar)
VALUES (2, 1, 2, 3, 1150000.00);

-- 3. Finalisasi Status: Checked Out
UPDATE Reservasi SET id_status_res = 4 WHERE id_reservasi = 2;

-- 4. Tunjukkan Hasil
SELECT
	nomor_kamar AS "Nomor Kamar",
	id_kamar AS "ID Kamar",
	nama_status AS "Nama Status",
	status_kamar.id_status_kamar AS "ID Status Kamar"

FROM status_kamar JOIN kamar ON status_kamar.id_status_kamar = kamar.id_status_kamar
ORDER BY id_kamar ASC;
