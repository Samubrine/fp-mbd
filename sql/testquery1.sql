SELECT
    k.id_kamar,
    k.nomor_kamar,
    jk.nama_jenis AS tipe_kamar,
    jk.kapasitas,
    jk.harga_master AS harga_per_malam,
    sk.nama_status AS status_kondisi
FROM Kamar k
JOIN Jenis_Kamar jk ON k.id_jenis_kamar = jk.id_jenis_kamar
JOIN Status_Kamar sk ON k.id_status_kamar = sk.id_status_kamar
WHERE sk.nama_status = 'Available'
ORDER BY k.nomor_kamar ASC;
