# Desain: Mode "Bandingkan Lokasi" (rombak UI + flow)

**Tanggal:** 20 Agustus 2026
**Status:** disetujui, siap direncanakan
**Branch:** `feat/bandingkan-lokasi-ux`
**Menggantikan:** perilaku Battle Mode yang ada di `main` per commit `e868b0e`

---

## 1. Latar belakang

Battle Mode sudah terpasang penuh, bukan stub (`docs/STATE-HANDOFF.md` yang
menyebutnya "di-stub" sudah basi). Yang sudah ada dan berjalan:

- State: `propertyB`, `selectingBattlePin`, `runBattleReport` di `useAppStore.js`
- Backend: `POST /api/battle-report` + `backend/services/battle_report.py`
- Ekspor: `exportBattlePdf` di `frontend/src/lib/pdfExport.js`
- Peta: garis putus-putus penghubung dua pin di `MapMarker.jsx`
- Chatbot: konteks mode `battle` di `ChatbotFab.jsx` dan `backend/routers/ai.py`

Masalahnya bukan fitur yang hilang, melainkan **flow yang buntu dan verdict yang
tidak informatif**. Dokumen ini mendefinisikan perbaikannya.

### Masalah terverifikasi

| # | Masalah | Lokasi |
|---|---|---|
| 1 | Mode buntu total dari cold start (lihat §2.1) | `useAppStore.js:168` |
| 2 | `setMode` menghapus `propertyB` + laporan tiap kali toggle | `useAppStore.js:71` |
| 3 | Verdict hanya dua pil skor + "Site A wins" — tak menjelaskan *kenapa* | `BattleCard.jsx` |
| 4 | Pilih Lokasi B = toggle tersembunyi 2 langkah, tanpa afordans batal | `BattleCard.jsx:34` |
| 5 | Tak ada cara tukar / hapus / ganti satu lokasi saja | store + kartu |
| 6 | Copy Inggris hardcoded ("Site A wins", "Comparison") — melanggar aturan Bahasa Indonesia di `CLAUDE.md` | `BattleCard.jsx:60`, `LeftPanel.jsx:481` |
| 7 | Nada gimmick (Swords, Trophy, "GEOPHYSICS BATTLE MODE") — berlawanan dengan positioning B2B konsultan PBG | `TopBar.jsx`, `pdfExport.js` |
| 8 | Sumbu RadarCard berbahasa Inggris | `RadarCard.jsx:31` |

---

## 2. Perbaikan lapis state (`frontend/src/store/useAppStore.js`)

### 2.1 Bug buntu — prioritas tertinggi

`processLocation` menentukan tujuan hasil audit dengan:

```js
const battleTarget = isBattle || mode === 'battle';
```

Akibatnya, saat mode `battle` aktif dan `propertyA` masih `null`, klik peta
menulis ke `propertyB`. `propertyA` tetap `null`, sehingga `LeftPanel` terus
merender `EmptyState` (`LeftPanel.jsx:62`) dan mode tak pernah bisa dipakai dari
kondisi kosong. Efek kedua: selama mode `battle`, Lokasi A tak pernah bisa
diganti karena semua klik jatuh ke slot B.

Ganti dengan resolusi slot eksplisit. `processLocation` menerima `slot` yang
sudah ditentukan pemanggil, dan store menyediakan resolver tunggal:

| mode | `propertyA` | slot ter-arm | → slot tujuan |
|---|---|---|---|
| `audit` | apa pun | — | `A` |
| `battle` | `null` | apa pun | `A` |
| `battle` | terisi | `B` | `B` |
| `battle` | terisi | `A` | `A` |
| `battle` | terisi | tak ada | `A` |

Baris kedua adalah perbaikan bug buntu; baris terakhir membuat "klik lagi untuk
ganti Lokasi A" jadi perilaku default yang wajar, bukan menimpa B diam-diam.

### 2.2 `setMode` tak lagi merusak pekerjaan

Sekarang (`useAppStore.js:71`) `setMode` menghapus `propertyB`,
`battleReportContent`, dan `battleReportMeta`. Artinya pindah sebentar ke mode
audit untuk melihat Lokasi A sendirian akan menghapus Lokasi B dan laporan yang
sudah jadi.

`setMode` yang baru hanya mereset kontrol transien: `armedSlot` dan
`pendingAudit`. Data audit dan laporan bertahan lintas toggle mode.

### 2.3 Laporan basi otomatis batal

Setiap penulisan ke slot A atau B menghapus `battleReportContent` dan
`battleReportMeta`. Laporan perbandingan yang dihasilkan untuk pasangan lokasi
lama tidak boleh tetap tampil setelah salah satu lokasi diganti.

### 2.4 Aksi baru

- `armSlot(slot)` — `'A' | 'B' | null`. Menggantikan boolean
  `selectingBattlePin`, yang tidak bisa mengekspresikan "sedang mengganti
  Lokasi A". `selectingBattlePin` dipertahankan sebagai selector turunan
  (`armedSlot === 'B'`) supaya `MapArea.jsx` dan `AuditConfirmDialog.jsx` tidak
  perlu dirombak.
- `clearPropertyB()` — hapus Lokasi B + laporan, kembali ke langkah ②.
- `swapSites()` — tukar `propertyA` ⇄ `propertyB`, hapus laporan.

---

## 3. Flow: penyiapan 3 langkah eksplisit

Komponen baru `frontend/src/components/cards/CompareSetup.jsx` menggantikan
toggle tersembunyi di `BattleCard`.

```
① LOKASI A    ✓ Bandar Lampung · 65        [Ganti]
② LOKASI B    ○ [ Pilih di peta ]
③ LAPORAN     · terkunci sampai kedua lokasi siap
```

Aturan tiap langkah:

- **Langkah terisi** menampilkan alamat (1 baris, terpotong), chip skor berwarna
  `riskHex`, tombol `[Ganti]` dan `[Hapus]` (Hapus hanya untuk B — menghapus A
  berarti keluar dari perbandingan).
- **Langkah ter-arm** berubah jadi `Klik peta untuk Lokasi B` dengan tombol
  `[Batal]` eksplisit. Perilaku sekarang hanya menukar label tombol, sehingga
  pengguna tak punya jalan keluar yang jelas dari mode pemilihan.
- **Tombol `[⇄]`** antara langkah ① dan ② menukar kedua lokasi.
- **Langkah ③** nonaktif dengan teks alasan sampai kedua lokasi ada, lalu
  menjadi tombol "Buat Laporan Perbandingan", lalu "Lihat Laporan" setelah
  laporan tersedia.

Langkah aktif ditandai dengan aksen; langkah selesai dengan tanda centang.

---

## 4. `VerdictCard.jsx` — menggantikan `BattleCard.jsx`

Kartu verdict baru menjawab *kenapa* satu lokasi lebih baik. Seluruh angka
dihitung deterministik di frontend langsung dari `AuditResult`. **Tidak ada
lapis AI yang menyentuh angka ini** — sesuai aturan `CLAUDE.md` bahwa AI hanya
menjelaskan, tak pernah menghitung.

Susunan:

1. **Header** — `Rekomendasi` + badge `Lokasi B lebih aman` atau `Setara`.
2. **Baris skor** — skor A vs B, chip delta di sisi unggul (`+13`), warna dari
   `riskHex`.
3. **Tabel delta parameter** — bidang sudah diverifikasi terhadap
   `backend/models.py`:

| Parameter | Bidang `AuditResult` | Arah lebih baik |
|---|---|---|
| Skor SAFE | `safe_score` | tinggi |
| Vs30 / kelas situs | `geotech.vs30`, `geotech.site_class` | tinggi |
| PGA permukaan | `geotech.pga_surface` | rendah |
| FS likuefaksi | `geotech.fs`, `geotech.status` | tinggi |
| Jarak sesar terdekat | `geotech.nearest_fault.distance_km` | tinggi |
| Bahaya banjir | `hazard.flood_label`, `hazard.flood_risk` | rendah |

4. **Catatan kaki** — satu kalimat bahasa awam yang disusun dari dua delta
   terbesar.

### Aturan kejujuran data

Kontrak ini sudah ada di `backend/services/scoring.py` (`flood_known`,
`landslide_known`) dan harus dihormati di UI:

- Jika bidang bernilai `null`, atau `hazard.flood_known === false`, baris
  menampilkan `—`, **dikecualikan dari penentuan pemenang**, dan diberi catatan
  kaki "data tidak tersedia".
- `safe_score` bertipe `Optional[int]` di `backend/models.py`. Jika `safe_score`
  salah satu lokasi bernilai `null`, verdict berbunyi `Data tidak cukup untuk
  membandingkan` dan tabel parameter tetap tampil sebagai rujukan — bukan
  menebak pemenang.
- Selisih di bawah ambang toleransi per parameter ditandai `≈` dan tidak
  dihitung sebagai keunggulan. Ambang: skor 3 poin, Vs30 15 m/s, PGA 0.02 g,
  FS 0.15, jarak sesar 2 km.

Pemenang keseluruhan ditentukan oleh `safe_score` (sumber kebenaran tunggal
yang sudah ada), bukan dengan menghitung menang-kalah per baris. Tabel parameter
menjelaskan skor, tidak menggantikannya.

---

## 5. Copy dan ikon

Nama internal **tidak berubah**: `mode: 'battle'`, `propertyB`,
`POST /api/battle-report`, `exportBattlePdf`, `battleReportContent`. Hanya
string yang dilihat pengguna yang diganti, supaya kontrak API dan tes tetap utuh.

| Kunci | Lama | Baru |
|---|---|---|
| `mode.battle` | Battle | **Bandingkan** |
| `panel.battleMode` | Mode Battle | **Mode Bandingkan** |
| `panel.headToHead` | Head-to-Head | **Lokasi A vs Lokasi B** |
| `battle.setup` | Pengaturan Battle | **Siapkan Perbandingan** |
| `battle.verdict` | Hasil | **Rekomendasi** |
| `battle.selectTarget` | Pilih Target B | **Pilih Lokasi B di peta** |
| — (hardcoded) | Site A wins | **Lokasi A lebih aman** |
| — (hardcoded) | Comparison | **Perbandingan Parameter** |

Ikon: `Swords` → `GitCompareArrows`, `Trophy` → `ShieldCheck`.

Sumbu `RadarCard`: `Flood/Soil/Seismic/Landslide/Subsidence` →
`Banjir/Tanah/Seismik/Longsor/Penurunan`.

Dasar: `docs/STATE-HANDOFF.md` menuntut jargon gimmick dihapus demi kredibilitas
B2B, dan `CLAUDE.md` mewajibkan copy UI berbahasa Indonesia.

---

## 6. Berkas yang disentuh

| Berkas | Tindakan |
|---|---|
| `frontend/src/store/useAppStore.js` | resolusi slot, `setMode`, `armSlot`, `clearPropertyB`, `swapSites` |
| `frontend/src/components/cards/CompareSetup.jsx` | baru |
| `frontend/src/components/cards/VerdictCard.jsx` | baru |
| `frontend/src/components/cards/BattleCard.jsx` | dihapus |
| `frontend/src/components/panels/LeftPanel.jsx` | `BattleState` → `CompareState` |
| `frontend/src/components/panels/TopBar.jsx` | ikon + label |
| `frontend/src/components/cards/RadarCard.jsx` | label sumbu |
| `frontend/src/lib/i18n.js` | kunci copy |

---

## 7. Verifikasi

- `cd frontend && npm run build` harus lolos.
- Alur manual di dev server:
  1. Mode Bandingkan dari kondisi kosong → klik peta → **terisi sebagai Lokasi A**
     (regresi bug §2.1).
  2. Pilih Lokasi B → verdict muncul dengan tabel delta.
  3. Toggle ke Mode Audit lalu kembali → Lokasi B dan laporan **bertahan**.
  4. Ganti Lokasi B → laporan lama hilang, langkah ③ kembali ke "Buat Laporan".
  5. Tukar A⇄B → verdict membalik dengan benar.
  6. Lokasi dengan `flood_known === false` → baris banjir `—`, tidak
     mempengaruhi verdict.
- `PYTHONPATH=backend python -m unittest discover -s backend/tests -v` tetap
  hijau (backend tidak disentuh; ini penjaga regresi).

---

## 8. Di luar cakupan

`frontend/src/lib/aiPrompts.js` adalah **kode mati** — tidak diimpor berkas mana
pun, dan prompt battle-nya membaca bidang camelCase (`propertyA.vs30`,
`propertyA.seismic.pgaSurface`) yang tak lagi cocok dengan kontrak snake_case di
`backend/models.py`. Perlu dibersihkan terpisah, tidak di PR ini.

Pembaruan `docs/STATE-HANDOFF.md` (yang masih menyebut Battle Mode "di-stub")
menyusul setelah PR ini merge.
