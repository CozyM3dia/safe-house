# Cara kerja di repo ini

Tiga orang, satu codebase, deadline pendek. Aturan di bawah dibuat supaya kerja tidak saling menimpa — bukan untuk memperlambat.

---

## Aturan yang tidak bisa ditawar

**1. Jangan pernah commit file `.env`.**
Isinya API key milikmu sendiri. Sekali ter-push, kunci itu harus dianggap bocor dan wajib di-rotate — walau commit-nya langsung dihapus, karena riwayat git menyimpannya. Yang masuk repo hanya `.env.example`, isinya nama variabel tanpa nilai.

Sebelum commit, biasakan cek:

```bash
git diff --cached --name-only
```

**2. Jangan push langsung ke `main`.**
`main` terkunci. Semua perubahan lewat Pull Request.

**3. Satu orang, satu area, dalam satu waktu.**
Sepakati pembagian di awal hari. Dua orang mengedit `frontend/src/services/engine.js` bersamaan adalah cara tercepat kehilangan pekerjaan.

---

## Alur harian

```bash
git checkout main
git pull
git checkout -b feat/nama-fitur
```

Kerjakan, commit kecil-kecil, lalu:

```bash
git push -u origin feat/nama-fitur
gh pr create
```

Minta satu orang review. Setelah di-approve, merge, lalu hapus branch-nya.

### Penamaan branch

| Awalan | Untuk |
|---|---|
| `feat/` | fitur baru |
| `fix/` | perbaikan bug |
| `docs/` | dokumentasi saja |
| `refactor/` | rapikan kode, perilaku tetap |
| `chore/` | dependency, config, tooling |

Contoh: `feat/liquefaction-card`, `fix/inarisk-timeout`.

### Pesan commit

Satu baris, kalimat perintah, jelaskan **apa** dan kalau perlu **kenapa**.

```
Add liquefaction FS calculation to audit engine
Fix InaRISK request timing out on 200m radius query
```

Hindari `update`, `fix bug`, `asdf`. Enam bulan lagi tidak ada yang tahu artinya.

---

## Sebelum bikin Pull Request

- [ ] `npm run dev` jalan tanpa error di frontend dan backend
- [ ] `npm run lint` di `frontend/` bersih
- [ ] Tidak ada `.env`, kunci API, atau koordinat pribadi yang ikut ter-commit
- [ ] Tidak ada `console.log` sisa debugging
- [ ] Sudah dicoba sendiri di browser, bukan cuma "harusnya jalan"

## Saat review

Cepat, tapi benar-benar dibaca. Yang dicari:

- Apakah benar-benar jalan?
- Ada kunci atau data sensitif yang bocor?
- Apakah merusak bagian lain?
- Perhitungan geoteknik masih sesuai rumus?

Gaya penulisan dan preferensi pribadi jangan jadi penghambat merge. Deadline dekat.

---

## Kalau kena konflik

Jangan panik dan jangan hapus perubahan orang lain.

```bash
git checkout main
git pull
git checkout branch-kamu
git merge main
```

Selesaikan konflik, tes ulang, lalu push. Kalau ragu, tanya di grup dulu sebelum resolve — lebih murah daripada memulihkan kode yang hilang.

---

## Struktur kode

Frontend ikut pola yang sudah ada:

```
src/components/cards/    kartu hasil audit
src/components/map/      layer & kontrol peta
src/components/panels/   panel samping, drawer, top bar
src/components/ui/       primitif shadcn
src/lib/                 helper murni, konstanta, prompt AI
src/services/            engine audit & panggilan API
src/store/               state Zustand
```

Komponen baru masuk ke folder yang paling sesuai. Kalau tidak ada yang cocok, angkat di grup sebelum bikin folder baru.

**Jangan tambah dependency animasi baru.** Framer Motion dan CSS keyframes sudah cukup.

**Semua panggilan API berbayar lewat `backend/`.** Frontend tidak pernah memegang kunci.
