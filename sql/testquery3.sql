SELECT
    TO_CHAR(COALESCE(p.waktu_pembayaran, CURRENT_TIMESTAMP), 'YYYY-MM') AS bulan_transaksi,
    SUM(CASE WHEN sb.nama_status IN ('DP', 'Pelunasan') THEN p.nominal_bayar ELSE 0 END) AS total_penerimaan_kas,
    (SELECT COALESCE(SUM(subtotal), 0) FROM Detail_Reservasi) AS total_omset_kamar_kotor,
    (SELECT COALESCE(SUM(subtotal), 0) FROM Transaksi_Layanan) AS total_omset_layanan,
    SUM(CASE WHEN sb.nama_status = 'Refund' THEN p.nominal_bayar ELSE 0 END) AS total_kas_keluar_refund
FROM Pembayaran p
JOIN Status_Pembayaran sb ON p.id_status_bayar = sb.id_status_bayar
GROUP BY TO_CHAR(COALESCE(p.waktu_pembayaran, CURRENT_TIMESTAMP), 'YYYY-MM')
ORDER BY bulan_transaksi DESC;
