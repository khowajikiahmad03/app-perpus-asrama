// fungsi untuk toggle submenu di sidebar
function toggleSubmenu() {
  const submenu = document.getElementById('submenu');
  submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
  console.log('[NAV] Submenu toggled:', submenu.style.display);
}

function showPage(id) {
  document.querySelectorAll('.main .content').forEach(sec => {
    sec.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (target) target.style.display = 'block';
  console.log('[NAV] Pindah ke halaman:', id);
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
  if (msg) console.warn('[ERROR] ' + elId + ':', msg);
}

// format tanggal dari hari-bulan-tahun
function formatTanggal(tgl) {
  if (!tgl) return '-';
  const d = new Date(tgl);
  if (isNaN(d.getTime())) return tgl; // fallback jika bukan tanggal valid
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// dashboard
async function updateDashboard() {
  console.log('[DASHBOARD] Update kartu statistik...');
  try {
    const res = await fetch('/buku');
    if (!res.ok) throw new Error('Gagal fetch buku');
    const buku = await res.json();
    const novel  = buku.filter(b => b.kategori === 'Novel').length;
    const iptek  = buku.filter(b => b.kategori === 'Ilmu Pengetahuan & Sejarah').length;
    const kitab  = buku.filter(b => b.kategori === 'Kitab').length;
    document.getElementById('countNovel').textContent = novel;
    document.getElementById('countIptek').textContent = iptek;
    document.getElementById('countKitab').textContent = kitab;
    console.log('[DASHBOARD] Novel:', novel, '| Iptek:', iptek, '| Kitab:', kitab);
  } catch (err) {
    console.error('[DASHBOARD] updateDashboard error:', err);
  }
}

// menu buku
let dataBuku    = [];
let filterAktif = '';
let editIdBuku  = null;

async function loadBuku() {
  console.log('[BUKU] loadBuku dipanggil...');
  try {
    const res = await fetch('/buku');
    if (!res.ok) throw new Error('Gagal memuat buku');
    dataBuku = await res.json();
    console.log('[BUKU] Data berhasil dimuat, jumlah:', dataBuku.length);
    renderTabelBuku();
    updateDashboard();
  } catch (err) {
    console.error('[BUKU] loadBuku error:', err);
    alert('Gagal memuat data buku. Pastikan server berjalan.');
  }
}

document.getElementById('formBuku').addEventListener('submit', async function (e) {
  e.preventDefault();
  const judul    = document.getElementById('judulbuku').value.trim();
  const penulis  = document.getElementById('penulis').value.trim();
  const kategori = document.getElementById('kategori').value;
  const stok     = parseInt(document.getElementById('stok').value) || 0;
  console.log('[BUKU] Submit form:', { judul, penulis, kategori, stok, mode: editIdBuku ? 'EDIT' : 'TAMBAH' });

  if (!judul || !kategori) {
    alert('Judul dan Kategori wajib diisi!');
    console.warn('[BUKU] Validasi gagal: judul/kategori kosong');
    return;
  }

  try {
    if (editIdBuku) {
      console.log('[BUKU] Update buku id:', editIdBuku);
      const res = await fetch(`/buku/${editIdBuku}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judul, penulis, kategori, stok, status: 'Tersedia' })
      });
      if (!res.ok) throw new Error('Gagal update buku');
      console.log('[BUKU] Buku berhasil diupdate');
      batalEditBuku();
    } else {
      console.log('[BUKU] Tambah buku baru');
      const res = await fetch('/buku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judul, penulis, kategori, stok, status: 'Tersedia' })
      });
      if (!res.ok) throw new Error('Gagal menambah buku');
      console.log('[BUKU] Buku berhasil ditambah');
    }
    e.target.reset();
    await loadBuku();
  } catch (err) {
    console.error('[BUKU] Submit error:', err);
    alert('Error: ' + err.message);
  }
});

function batalEditBuku() {
  console.log('[BUKU] Batal edit, reset form');
  editIdBuku = null;
  document.getElementById('formBuku').reset();
  document.getElementById('btnSimpan').textContent = '💾 Simpan';
  document.getElementById('btnBatal').style.display = 'none';
}

document.getElementById('searchInput').addEventListener('input', () => {
  console.log('[BUKU] Search input:', document.getElementById('searchInput').value);
  renderTabelBuku();
});

function filterKategori(kategori, el) {
  filterAktif = kategori;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  el.classList.add('active');
  console.log('[BUKU] Filter kategori aktif:', filterAktif || 'Semua');
  renderTabelBuku();
}

function renderTabelBuku() {
  const keyword  = document.getElementById('searchInput').value.toLowerCase();
  const filtered = dataBuku.filter(b => {
    const cocokFilter = filterAktif === '' || b.kategori === filterAktif;
    const cocokCari   = (b.judul || '').toLowerCase().includes(keyword)
                     || (b.penulis || '').toLowerCase().includes(keyword);
    return cocokFilter && cocokCari;
  });
  console.log('[BUKU] Render tabel, hasil filter:', filtered.length, 'buku');

  const tbody    = document.getElementById('tabelBuku');
  const emptyMsg = document.getElementById('emptyMsg');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';
  tbody.innerHTML = filtered.map((b, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${b.judul}</td>
      <td>${b.penulis || '-'}</td>
      <td>${b.kategori}</td>
      <td>${b.stok}</td>
      <td>${b.status || '-'}</td>
      <td>
        <button class="btn-edit" onclick="editBuku(${b.id_buku})">✏️ Edit</button>
        <button class="btn-hapus" onclick="hapusBuku(${b.id_buku})">🗑️ Hapus</button>
      </td>
    </tr>`).join('');
}

function editBuku(id) {
  console.log('[BUKU] Edit buku id:', id);
  const buku = dataBuku.find(b => b.id_buku === id);
  if (!buku) {
    console.warn('[BUKU] Buku tidak ditemukan di dataBuku, id:', id);
    return;
  }
  document.getElementById('judulbuku').value = buku.judul;
  document.getElementById('penulis').value   = buku.penulis || '';
  document.getElementById('kategori').value  = buku.kategori;
  document.getElementById('stok').value      = buku.stok;
  editIdBuku = id;
  document.getElementById('btnSimpan').textContent = '✏️ Update';
  document.getElementById('btnBatal').style.display = 'inline-block';
  document.getElementById('bukuPage').scrollIntoView({ behavior: 'smooth' });
}

async function hapusBuku(id) {
  if (!confirm('Yakin ingin menghapus buku ini?')) return;
  console.log('[BUKU] Hapus buku id:', id);
  try {
    const res = await fetch(`/buku/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus buku');
    console.log('[BUKU] Buku berhasil dihapus, id:', id);
    await loadBuku();
  } catch (err) {
    console.error('[BUKU] hapusBuku error:', err);
    alert('Error: ' + err.message);
  }
}

// menu peminjaman
document.getElementById('loanForm').addEventListener('submit', async e => {
  e.preventDefault();
  showError('loanError', '');

  const nama    = document.getElementById('namaPinjam').value.trim();
  const judul   = document.getElementById('judulpinjam').value.trim();
  const tanggal = document.getElementById('tanggalPinjam').value;
  console.log('[PEMINJAMAN] Submit form:', { nama, judul, tanggal });

  if (!nama || !judul || !tanggal) {
    showError('loanError', 'Semua field wajib diisi!');
    return;
  }

  const buku = dataBuku.find(b => b.judul.toLowerCase() === judul.toLowerCase());
  if (!buku) {
    console.warn('[PEMINJAMAN] Buku tidak ditemukan:', judul);
    showError('loanError', `Buku "${judul}" tidak ditemukan. Pastikan judul sama persis.`);
    return;
  }
  if (buku.stok <= 0) {
    console.warn('[PEMINJAMAN] Stok habis:', judul);
    showError('loanError', `Stok buku "${judul}" habis!`);
    return;
  }

  console.log('[PEMINJAMAN] Buku ditemukan, id_buku:', buku.id_buku, '| stok:', buku.stok);
  try {
    const res = await fetch('/peminjaman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, id_buku: buku.id_buku, tanggal_pinjam: tanggal })
    });
    if (!res.ok) throw new Error('Gagal menyimpan peminjaman');
    const data = await res.json();
    console.log('[PEMINJAMAN] Berhasil disimpan, id_pinjam:', data.id);
    e.target.reset();
    await loadPeminjaman();
    await loadRiwayat();
    await loadBuku();
  } catch (err) {
    console.error('[PEMINJAMAN] Submit error:', err);
    showError('loanError', 'Error: ' + err.message);
  }
});

async function loadPeminjaman() {
  console.log('[PEMINJAMAN] loadPeminjaman dipanggil...');
  try {
    const res = await fetch('/peminjaman');
    if (!res.ok) throw new Error('Gagal memuat peminjaman');
    const rows  = await res.json();
    console.log('[PEMINJAMAN] Data berhasil dimuat, jumlah:', rows.length);
    const tbody = document.querySelector('#loanTable tbody');
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">Tidak ada data peminjaman.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${r.id_pinjam}</strong></td>
        <td>${r.nama}</td>
        <td>${r.judulbuku || '-'}</td>
        <td>${formatTanggal(r.tanggal_pinjam)}</td>
        <td>
          <button class="btn-hapus" onclick="hapusPinjam(${r.id_pinjam})">🗑️ Hapus</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    console.error('[PEMINJAMAN] loadPeminjaman error:', err);
  }
}

async function hapusPinjam(id) {
  if (!confirm('Yakin ingin menghapus data peminjaman?')) return;
  console.log('[PEMINJAMAN] Hapus id_pinjam:', id);
  try {
    const res = await fetch(`/peminjaman/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus peminjaman');
    console.log('[PEMINJAMAN] Berhasil dihapus, id:', id);
    await loadPeminjaman();
    await loadRiwayat();
    await loadBuku();
  } catch (err) {
    console.error('[PEMINJAMAN] hapusPinjam error:', err);
    alert('Error: ' + err.message);
  }
}

// menu pengembalian
document.getElementById('returnForm').addEventListener('submit', async e => {
  e.preventDefault();
  showError('returnError', '');

  const id_pinjam      = document.getElementById('idPinjamKembali').value.trim();
  const tanggalKembali = document.getElementById('tanggalKembali').value;
  console.log('[PENGEMBALIAN] Submit form:', { id_pinjam, tanggalKembali });

  if (!id_pinjam || !tanggalKembali) {
    showError('returnError', 'ID Peminjaman dan Tanggal Kembali wajib diisi!');
    return;
  }

  try {
    const res = await fetch('/pengembalian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_pinjam, tanggal_kembali: tanggalKembali })
    });
    if (!res.ok) {
      const errData = await res.json();
      console.error('[PENGEMBALIAN] Server error:', errData.message);
      throw new Error(errData.message || 'Gagal menyimpan pengembalian');
    }
    const data = await res.json();
    console.log('[PENGEMBALIAN] Berhasil disimpan, id_kembali:', data.id);
    e.target.reset();
    await loadPengembalian();
    await loadRiwayat();
    await loadBuku();
  } catch (err) {
    console.error('[PENGEMBALIAN] Submit error:', err);
    showError('returnError', 'Error: ' + err.message);
  }
});

async function loadPengembalian() {
  console.log('[PENGEMBALIAN] loadPengembalian dipanggil...');
  try {
    const res = await fetch('/pengembalian');
    if (!res.ok) throw new Error('Gagal memuat pengembalian');
    const rows  = await res.json();
    console.log('[PENGEMBALIAN] Data berhasil dimuat, jumlah:', rows.length);
    const tbody = document.querySelector('#returnTable tbody');
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">Tidak ada data pengembalian.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.id_pinjam}</td>
        <td>${r.nama || '-'}</td>
        <td>${r.judul_buku || '-'}</td>
        <td>${formatTanggal(r.tanggal_kembali)}</td>
        <td>
          <button class="btn-hapus" onclick="hapusKembali(${r.id_kembali})">🗑️ Hapus</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    console.error('[PENGEMBALIAN] loadPengembalian error:', err);
  }
}

async function hapusKembali(id) {
  if (!confirm('Yakin ingin menghapus data pengembalian?')) return;
  console.log('[PENGEMBALIAN] Hapus id_kembali:', id);
  try {
    const res = await fetch(`/pengembalian/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus pengembalian');
    console.log('[PENGEMBALIAN] Berhasil dihapus, id:', id);
    await loadPengembalian();
    await loadRiwayat();
    await loadBuku();
  } catch (err) {
    console.error('[PENGEMBALIAN] hapusKembali error:', err);
    alert('Error: ' + err.message);
  }
}

// menu riwayat
async function loadRiwayat() {
  console.log('[RIWAYAT] loadRiwayat dipanggil...');
  try {
    const res = await fetch('/riwayat');
    if (!res.ok) throw new Error('Gagal memuat riwayat');
    const rows    = await res.json();
    console.log('[RIWAYAT] Data berhasil dimuat, jumlah:', rows.length);
    const tbody   = document.querySelector('#historyTable tbody');
    const emptyEl = document.getElementById('emptyRiwayat');
    if (rows.length === 0) {
      tbody.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
    tbody.innerHTML = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.nama || '-'}</td>
        <td>${r.judul_buku || '-'}</td>
        <td>${formatTanggal(r.tanggal_pinjam)}</td>
        <td>${formatTanggal(r.tanggal_kembali)}</td>
        <td>${r.status || '-'}</td>
      </tr>`).join('');
  } catch (err) {
    console.error('[RIWAYAT] loadRiwayat error:', err);
  }
}

// urutan proses halaman dimuat
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[INIT] Halaman dimuat, inisialisasi...');
  showPage('dashboardPage');
  await loadBuku();
  await loadPeminjaman();
  await loadPengembalian();
  await loadRiwayat();
  console.log('[INIT] Semua data selesai dimuat');
});