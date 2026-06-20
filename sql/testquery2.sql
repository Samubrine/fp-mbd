SELECT
    r.id_reservasi,
    p.nama_lengkap AS nama_tamu,
    p.nomor_identitas,
    sr.nama_status AS status_reservasi,
    k.nomor_kamar,
    dr.check_in,
    dr.check_out,
    (dr.check_out - dr.check_in) AS durasi_menginap_hari,
    dr.subtotal AS total_biaya_kamar,
    COALESCE(SUM(tl.subtotal), 0.00) AS total_biaya_layanan,
    r.total_tagihan AS total_keseluruhan_tagihan,
    r.total_terbayar AS total_uang_diterima,
    (r.total_tagihan - r.total_terbayar) AS sisa_piutang_pelunasan
FROM Reservasi r
JOIN Pelanggan p ON r.id_pelanggan = p.id_pelanggan
JOIN Status_Reservasi sr ON r.id_status_res = sr.id_status_res
JOIN Detail_Reservasi dr ON r.id_reservasi = dr.id_reservasi
JOIN Kamar k ON dr.id_kamar = k.id_kamar
LEFT JOIN Transaksi_Layanan tl ON dr.id_detail_res = tl.id_detail_res
GROUP BY
    r.id_reservasi, p.nama_lengkap, p.nomor_identitas, sr.nama_status,
    k.nomor_kamar, dr.check_in, dr.check_out, dr.subtotal
ORDER BY r.id_reservasi DESC;
