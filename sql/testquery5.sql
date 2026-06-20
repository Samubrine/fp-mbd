SELECT
    r.id_reservasi,
    p.nama_lengkap AS nama_tamu,
    p.no_telp,
    sr.nama_status AS status_reservasi,
    r.total_tagihan,
    r.total_terbayar,
    (r.total_tagihan - r.total_terbayar) AS tagihan_tersisa
FROM Reservasi r
JOIN Pelanggan p ON r.id_pelanggan = p.id_pelanggan
JOIN Status_Reservasi sr ON r.id_status_res = sr.id_status_res
WHERE (r.total_tagihan - r.total_terbayar) > 0.00
  AND sr.nama_status NOT IN ('Cancelled', 'Checked Out')
ORDER BY tagihan_tersisa DESC;
