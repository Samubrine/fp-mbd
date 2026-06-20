CREATE OR REPLACE PROCEDURE sp_sync_reservasi_financials(p_id_reservasi INT)
LANGUAGE plpgsql AS $$
DECLARE
    v_room_total DECIMAL(12,2) := 0.00;
    v_service_total DECIMAL(12,2) := 0.00;
    v_paid_total DECIMAL(12,2) := 0.00;
BEGIN
    -- 1. Menghitung akumulasi biaya sewa unit kamar
    SELECT COALESCE(SUM(subtotal), 0.00) INTO v_room_total
    FROM Detail_Reservasi
    WHERE id_reservasi = p_id_reservasi;

    -- 2. Menghitung akumulasi biaya penggunaan fasilitas layanan tambahan
    SELECT COALESCE(SUM(tl.subtotal), 0.00) INTO v_service_total
    FROM Transaksi_Layanan tl
    JOIN Detail_Reservasi dr ON tl.id_detail_res = dr.id_detail_res
    WHERE dr.id_reservasi = p_id_reservasi;

    -- 3. Menghitung total kas masuk dari validasi pembayaran sah (Bukan Void/Refund)
    SELECT COALESCE(SUM(p.nominal_bayar), 0.00) INTO v_paid_total
    FROM Pembayaran p
    JOIN Status_Pembayaran sp ON p.id_status_bayar = sp.id_status_bayar
    WHERE p.id_reservasi = p_id_reservasi
      AND sp.nama_status NOT IN ('Void', 'Refund');

    -- 4. Melakukan pemutakhiran data persisten pada Header Reservasi
    UPDATE Reservasi
    SET total_tagihan = (v_room_total + v_service_total),
        total_terbayar = v_paid_total
    WHERE id_reservasi = p_id_reservasi;
END;
$$;

CREATE OR REPLACE FUNCTION fn_detail_res_before_insert_or_update()	
RETURNS TRIGGER AS $$
DECLARE
    v_overlap_count INT;
    v_stay_price DECIMAL(12,2);
BEGIN
    -- PROTEKSI OPERASIONAL: Identifikasi Overlapping Periode Inap Kamar Fisik
    IF (TG_OP = 'INSERT') THEN
        SELECT COUNT(*) INTO v_overlap_count
        FROM Detail_Reservasi dr
        JOIN Reservasi r ON dr.id_reservasi = r.id_reservasi
        JOIN Status_Reservasi sr ON r.id_status_res = sr.id_status_res
        WHERE dr.id_kamar = NEW.id_kamar
          AND NEW.check_in < dr.check_out
          AND NEW.check_out > dr.check_in
          AND sr.nama_status NOT IN ('Cancelled');
    ELSIF (TG_OP = 'UPDATE') THEN
        SELECT COUNT(*) INTO v_overlap_count
        FROM Detail_Reservasi dr
        JOIN Reservasi r ON dr.id_reservasi = r.id_reservasi
        JOIN Status_Reservasi sr ON r.id_status_res = sr.id_status_res
        WHERE dr.id_kamar = NEW.id_kamar
          AND dr.id_detail_res <> NEW.id_detail_res
          AND NEW.check_in < dr.check_out
          AND NEW.check_out > dr.check_in
          AND sr.nama_status NOT IN ('Cancelled');
    END IF;

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'OVERBOOKING ERROR: Kamar % telah teralokasi pada periode % s/d %!', 
            (SELECT nomor_kamar FROM Kamar WHERE id_kamar = NEW.id_kamar), NEW.check_in, NEW.check_out;
    END IF;

    -- PROTEKSI FINANSIAL: Validasi Ambang Batas Nilai Diskon Maksimum
    v_stay_price := (NEW.harga_kamar_snapshot * (NEW.check_out - NEW.check_in));
    IF NEW.diskon_kamar > v_stay_price THEN
        RAISE EXCEPTION 'DISCOUNT ERROR: Nominal diskon (Rp %) melampaui nilai total harga sewa (Rp %)!', 
            NEW.diskon_kamar, v_stay_price;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Sinkronisasi Perubahan Biaya Sewa Kamar
CREATE OR REPLACE FUNCTION fn_detail_res_after_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        CALL sp_sync_reservasi_financials(NEW.id_reservasi);
    ELSIF (TG_OP = 'UPDATE') THEN
        CALL sp_sync_reservasi_financials(NEW.id_reservasi);
        IF OLD.id_reservasi <> NEW.id_reservasi THEN
            CALL sp_sync_reservasi_financials(OLD.id_reservasi);
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        CALL sp_sync_reservasi_financials(OLD.id_reservasi);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger Sinkronisasi Transaksi Layanan Komplementer
CREATE OR REPLACE FUNCTION fn_layanan_after_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_id_res INT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        SELECT id_reservasi INTO v_id_res FROM Detail_Reservasi WHERE id_detail_res = NEW.id_detail_res;
        CALL sp_sync_reservasi_financials(v_id_res);
    ELSIF (TG_OP = 'UPDATE') THEN
        SELECT id_reservasi INTO v_id_res FROM Detail_Reservasi WHERE id_detail_res = NEW.id_detail_res;
        CALL sp_sync_reservasi_financials(v_id_res);
        IF OLD.id_detail_res <> NEW.id_detail_res THEN
            SELECT id_reservasi INTO v_id_res FROM Detail_Reservasi WHERE id_detail_res = OLD.id_detail_res;
            CALL sp_sync_reservasi_financials(v_id_res);
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        SELECT id_reservasi INTO v_id_res FROM Detail_Reservasi WHERE id_detail_res = OLD.id_detail_res;
        CALL sp_sync_reservasi_financials(v_id_res);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_reservasi_status_sync()
RETURNS TRIGGER AS $$
DECLARE
    v_status_name VARCHAR(30);
    v_occupied_status_id INT;
    v_cleaning_status_id INT;
BEGIN
    -- Resolusi Identifikator Status Kamar secara Dinamis
    SELECT id_status_kamar INTO v_occupied_status_id FROM Status_Kamar WHERE nama_status = 'Occupied';
    SELECT id_status_kamar INTO v_cleaning_status_id FROM Status_Kamar WHERE nama_status = 'Cleaning';

    -- Identifikasi Nama Status Reservasi Terkini
    SELECT nama_status INTO v_status_name FROM Status_Reservasi WHERE id_status_res = NEW.id_status_res;

    -- Eksekusi Aturan Bisnis FSM
    IF v_status_name = 'Checked In' THEN
        UPDATE Kamar k
        SET id_status_kamar = v_occupied_status_id
        FROM Detail_Reservasi dr 
        WHERE k.id_kamar = dr.id_kamar 
          AND dr.id_reservasi = NEW.id_reservasi;
    ELSIF v_status_name = 'Checked Out' THEN
        UPDATE Kamar k
        SET id_status_kamar = v_cleaning_status_id
        FROM Detail_Reservasi dr 
        WHERE k.id_kamar = dr.id_kamar 
          AND dr.id_reservasi = NEW.id_reservasi;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;