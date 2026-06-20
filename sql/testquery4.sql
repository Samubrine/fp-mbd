SELECT
    pg.nama_pegawai,
    jb.nama_jabatan,
    sh.nama_shift,
    COUNT(DISTINCT rp.id_reservasi) AS total_reservasi_ditangani,
    COALESCE(SUM(p.nominal_bayar), 0.00) AS total_kas_dikelola
FROM Pegawai pg
JOIN Jabatan jb ON pg.id_jabatan = jb.id_jabatan
JOIN Shift sh ON pg.id_shift = sh.id_shift
LEFT JOIN Reservasi_Pegawai rp ON pg.id_pegawai = rp.id_pegawai
LEFT JOIN Pembayaran p ON pg.id_pegawai = p.id_pegawai_kasir
GROUP BY pg.id_pegawai, pg.nama_pegawai, jb.nama_jabatan, sh.nama_shift
ORDER BY total_reservasi_ditangani DESC, total_kas_dikelola DESC;
