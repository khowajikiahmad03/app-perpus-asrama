const express    = require('express');
const bodyParser = require('body-parser');
const path       = require('path');
const db         = require('./koneksi');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========================
//   LOGIN & REGISTER
// ========================
app.post('/register', (req, res) => {
  const { member_id, nama, password, role } = req.body;
  console.log('[REGISTER] Request:', { member_id, nama, role });
  db.query(
    'INSERT INTO users (member_id,nama,password,role) VALUES (?,?,?,?)',
    [member_id || null, nama, password, role || 'member'],
    (err) => {
      if (err) {
        console.error('[REGISTER] Error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }
      console.log('[REGISTER] Berhasil:', member_id);
      res.json({ success: true });
    }
  );
});

app.post('/login', (req, res) => {
  const { login_id, password } = req.body;
  console.log('[LOGIN] Request login_id:', login_id);
  db.query(
    'SELECT * FROM users WHERE (nama=? OR member_id=?) AND password=?',
    [login_id, login_id, password],
    (err, rows) => {
      if (err) {
        console.error('[LOGIN] Error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }
      if (rows.length > 0) {
        console.log('[LOGIN] Berhasil, user:', rows[0].nama);
        res.json({ success: true, user: rows[0] });
      } else {
        console.warn('[LOGIN] Gagal: nama/ID member atau password salah');
        res.json({ success: false, message: 'Nama/ID Member atau password salah' });
      }
    }
  );
});

// ========================
//   BUKU
// ========================
app.get('/buku', (req, res) => {
  console.log('[BUKU] GET semua buku');
  db.query('SELECT * FROM buku', (err, rows) => {
    if (err) {
      console.error('[BUKU] GET Error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    console.log('[BUKU] Jumlah buku:', rows.length);
    res.json(rows);
  });
});

app.post('/buku', (req, res) => {
  const { judul, penulis, kategori, status, stok } = req.body;
  console.log('[BUKU] POST tambah buku:', { judul, penulis, kategori, stok });
  if (!judul || !kategori) {
    console.warn('[BUKU] POST gagal: judul/kategori kosong');
    return res.status(400).json({ success: false, message: 'Judul dan kategori wajib diisi' });
  }
  db.query(
    'INSERT INTO buku (judul,penulis,kategori,status,stok) VALUES (?,?,?,?,?)',
    [judul, penulis, kategori, status || 'Tersedia', stok || 0],
    (err, result) => {
      if (err) {
        console.error('[BUKU] POST Error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }
      console.log('[BUKU] Berhasil ditambah, id:', result.insertId);
      res.json({ success: true, id: result.insertId });
    }
  );
});

app.put('/buku/:id', (req, res) => {
  const { judul, penulis, kategori, status, stok } = req.body;
  console.log('[BUKU] PUT update id:', req.params.id, { judul, penulis, kategori, status, stok });
  db.query(
    'UPDATE buku SET judul=?,penulis=?,kategori=?,status=?,stok=? WHERE id_buku=?',
    [judul, penulis, kategori, status, stok, req.params.id],
    (err) => {
      if (err) {
        console.error('[BUKU] PUT Error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }
      console.log('[BUKU] Berhasil diupdate, id:', req.params.id);
      res.json({ success: true });
    }
  );
});

app.delete('/buku/:id', (req, res) => {
  console.log('[BUKU] DELETE id:', req.params.id);
  db.query('DELETE FROM buku WHERE id_buku=?', [req.params.id], (err) => {
    if (err) {
      console.error('[BUKU] DELETE Error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    console.log('[BUKU] Berhasil dihapus, id:', req.params.id);
    res.json({ success: true });
  });
});

// ========================
//   PEMINJAMAN
// ========================
app.get('/peminjaman', (req, res) => {
  console.log('[PEMINJAMAN] GET semua peminjaman');
  const sql = `
    SELECT p.id_pinjam, p.nama, b.judul AS judulbuku, p.tanggal_pinjam
    FROM peminjaman p
    JOIN buku b ON p.id_buku = b.id_buku
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('[PEMINJAMAN] GET Error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    console.log('[PEMINJAMAN] Jumlah data:', rows.length);
    res.json(rows);
  });
});

app.post('/peminjaman', (req, res) => {
  const { nama, id_buku, tanggal_pinjam } = req.body;
  console.log('[PEMINJAMAN] POST request:', { nama, id_buku, tanggal_pinjam });
  if (!nama || !id_buku || !tanggal_pinjam) {
    console.warn('[PEMINJAMAN] POST gagal: field kosong');
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
  }

  db.query('SELECT stok FROM buku WHERE id_buku=?', [id_buku], (err, rows) => {
    if (err) {
      console.error('[PEMINJAMAN] Cek stok Error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!rows.length) {
      console.warn('[PEMINJAMAN] Buku tidak ditemukan, id_buku:', id_buku);
      return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });
    }
    if (rows[0].stok <= 0) {
      console.warn('[PEMINJAMAN] Stok habis, id_buku:', id_buku);
      return res.status(400).json({ success: false, message: 'Stok buku habis' });
    }

    console.log('[PEMINJAMAN] Stok oke:', rows[0].stok, '-> insert peminjaman');
    db.query(
      'INSERT INTO peminjaman (nama,id_buku,tanggal_pinjam) VALUES (?,?,?)',
      [nama, id_buku, tanggal_pinjam],
      (err, result) => {
        if (err) {
          console.error('[PEMINJAMAN] INSERT Error:', err.message);
          return res.status(500).json({ success: false, message: err.message });
        }
        console.log('[PEMINJAMAN] Berhasil disimpan, id_pinjam:', result.insertId);

        db.query(
          'UPDATE buku SET stok=stok-1, status=IF(stok-1<=0,"Dipinjam","Tersedia") WHERE id_buku=?',
          [id_buku],
          (err) => {
            if (err) console.error('[PEMINJAMAN] Update stok Error:', err.message);
            else console.log('[PEMINJAMAN] Stok buku berkurang, id_buku:', id_buku);
          }
        );

        db.query(`
          INSERT INTO riwayat (nama, judul_buku, tanggal_pinjam, status)
          SELECT p.nama, b.judul, p.tanggal_pinjam, 'Dipinjam'
          FROM peminjaman p
          JOIN buku b ON p.id_buku = b.id_buku
          WHERE p.id_pinjam = ?`,
          [result.insertId],
          (err) => {
            if (err) console.error('[PEMINJAMAN] Insert riwayat Error:', err.message);
            else console.log('[PEMINJAMAN] Riwayat ditambahkan');
          }
        );

        res.json({ success: true, id: result.insertId });
      }
    );
  });
});

app.put('/peminjaman/:id', (req, res) => {
  const { nama, id_buku, tanggal_pinjam } = req.body;
  console.log('[PEMINJAMAN] PUT update id:', req.params.id, { nama, id_buku, tanggal_pinjam });
  db.query(
    'UPDATE peminjaman SET nama=?, id_buku=?, tanggal_pinjam=? WHERE id_pinjam=?',
    [nama, id_buku, tanggal_pinjam, req.params.id],
    (err) => {
      if (err) {
        console.error('[PEMINJAMAN] PUT Error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }
      console.log('[PEMINJAMAN] Berhasil diupdate, id:', req.params.id);
      res.json({ success: true });
    }
  );
});

app.delete('/peminjaman/:id', (req, res) => {
  console.log('[PEMINJAMAN] DELETE id:', req.params.id);
  db.query('DELETE FROM peminjaman WHERE id_pinjam=?', [req.params.id], (err) => {
    if (err) {
      console.error('[PEMINJAMAN] DELETE Error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    console.log('[PEMINJAMAN] Berhasil dihapus, id:', req.params.id);
    res.json({ success: true });
  });
});

// ========================
//   PENGEMBALIAN
// ========================
app.get('/pengembalian', (req, res) => {
  console.log('[PENGEMBALIAN] GET semua pengembalian');
  const sql = `
    SELECT k.id_kembali, k.id_pinjam, k.tanggal_kembali,
           p.nama, b.judul AS judul_buku
    FROM pengembalian k
    JOIN peminjaman p ON k.id_pinjam = p.id_pinjam
    JOIN buku b ON p.id_buku = b.id_buku
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('[PENGEMBALIAN] GET Error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    console.log('[PENGEMBALIAN] Jumlah data:', rows.length);
    res.json(rows);
  });
});

app.post('/pengembalian', (req, res) => {
  const { id_pinjam, tanggal_kembali } = req.body;
  console.log('[PENGEMBALIAN] POST request:', { id_pinjam, tanggal_kembali });
  if (!id_pinjam || !tanggal_kembali) {
    console.warn('[PENGEMBALIAN] POST gagal: field kosong');
    return res.status(400).json({ success: false, message: 'ID pinjam dan tanggal kembali wajib diisi' });
  }

  db.query('SELECT * FROM peminjaman WHERE id_pinjam=?', [id_pinjam], (err, rows) => {
    if (err) {
      console.error('[PENGEMBALIAN] Cek id_pinjam Error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!rows.length) {
      console.warn('[PENGEMBALIAN] id_pinjam tidak ditemukan:', id_pinjam);
      return res.status(404).json({ success: false, message: `ID Peminjaman ${id_pinjam} tidak ditemukan` });
    }

    const id_buku = rows[0].id_buku;
    console.log('[PENGEMBALIAN] id_pinjam valid, id_buku:', id_buku);

    db.query(
      'INSERT INTO pengembalian (id_pinjam, tanggal_kembali) VALUES (?,?)',
      [id_pinjam, tanggal_kembali],
      (err, result) => {
        if (err) {
          console.error('[PENGEMBALIAN] INSERT Error:', err.message);
          return res.status(500).json({ success: false, message: err.message });
        }
        console.log('[PENGEMBALIAN] Berhasil disimpan, id_kembali:', result.insertId);

        db.query(
          'UPDATE buku SET stok=stok+1, status="Tersedia" WHERE id_buku=?',
          [id_buku],
          (err) => {
            if (err) console.error('[PENGEMBALIAN] Update stok Error:', err.message);
            else console.log('[PENGEMBALIAN] Stok buku bertambah, id_buku:', id_buku);
          }
        );

        db.query(
          'UPDATE riwayat SET tanggal_kembali=?, status="Dikembalikan" WHERE nama=(SELECT nama FROM peminjaman WHERE id_pinjam=?) AND status="Dipinjam"',
          [tanggal_kembali, id_pinjam],
          (err) => {
            if (err) console.error('[PENGEMBALIAN] Update riwayat Error:', err.message);
            else console.log('[PENGEMBALIAN] Riwayat diupdate');
          }
        );

        res.json({ success: true, id: result.insertId });
      }
    );
  });
});

app.put('/pengembalian/:id', (req, res) => {
  const { id_pinjam, tanggal_kembali } = req.body;
  console.log('[PENGEMBALIAN] PUT update id:', req.params.id, { id_pinjam, tanggal_kembali });
  db.query(
    'UPDATE pengembalian SET id_pinjam=?, tanggal_kembali=? WHERE id_kembali=?',
    [id_pinjam, tanggal_kembali, req.params.id],
    (err) => {
      if (err) {
        console.error('[PENGEMBALIAN] PUT Error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }
      console.log('[PENGEMBALIAN] Berhasil diupdate, id:', req.params.id);
      res.json({ success: true });
    }
  );
});

app.delete('/pengembalian/:id', (req, res) => {
  console.log('[PENGEMBALIAN] DELETE id:', req.params.id);
  db.query('DELETE FROM pengembalian WHERE id_kembali=?', [req.params.id], (err) => {
    if (err) {
      console.error('[PENGEMBALIAN] DELETE Error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    console.log('[PENGEMBALIAN] Berhasil dihapus, id:', req.params.id);
    res.json({ success: true });
  });
});

// ========================
//   RIWAYAT
// ========================
app.get('/riwayat', (req, res) => {
  console.log('[RIWAYAT] GET semua riwayat');
  db.query('SELECT * FROM riwayat ORDER BY id_riwayat DESC', (err, rows) => {
    if (err) {
      console.error('[RIWAYAT] GET Error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    console.log('[RIWAYAT] Jumlah data:', rows.length);
    res.json(rows);
  });
});

// ========================
//   START SERVER
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));