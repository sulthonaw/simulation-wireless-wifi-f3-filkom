# AGENTS.md — Aturan dan Panduan Arsitektur Proyek Simulasi Wireless Lantai 3 (F3)

Dokumen ini memuat seluruh aturan kerja agen AI, arsitektur sistem, struktur direktori, dan bagaimana setiap modul saling terhubung pada proyek **Simulasi Wireless F3**.

---

## 1. Aturan & Pedoman Kerja Agen (Rules)

### 1.1 Git Workflow
- **Git Push**: Agen **dilarang keras** menjalankan perintah `git push`. Proses pengiriman kode ke remote repository selalu dilakukan sendiri oleh pengguna (**USER**) secara manual.
- **Git Commit**: Ketika pengguna memberikan perintah untuk melakukan commit, agen wajib membuat pesan commit yang ringkas, padat, tepat dalam **1 (satu) kalimat deskriptif** sesuai perubahan nyata yang dilakukan, lalu langsung mengeksekusikannya.

### 1.2 Standar Pengembangan & Kode
- **TypeScript Strict**: Pastikan seluruh tipe data merujuk pada definisi di `src/types/floorplan.ts`. Jangan gunakan tipe `any` tanpa alasan esensial.
- **Manajemen Memori Three.js**: Ketika membuat atau memperbarui geometri, material, atau tekstur 3D secara dinamis, pastikan objek lama dibersihkan (`dispose()`) guna mencegah kebocoran memori (memory leak).
- **Integritas Skrip & Data**: Berkas di dalam direktori `scratch/` merupakan skrip utilitas verifikasi dan kalkulasi geometri; jangan dihapus tanpa instruksi eksplisit.

---

## 2. Gambaran Umum Proyek

Aplikasi ini adalah simulator propagasi sinyal Wi-Fi interaktif berbasis web 3D untuk denah Lantai 3 Gedung F. Proyek dibangun dengan teknologi:
- **Framework**: React 19 + TypeScript + Vite.
- **Grafika 3D**: Three.js (Scene, Perspective Camera bergaya isometrik *The Sims*, OrbitControls, Mesh kustom).
- **Fisika & Perhitungan Sinyal**: Log-Distance Path Loss Model + 2D Ray-Casting Collision Detection (atenuasi dinding dan pilar beton).
- **Linter**: Oxlint.

---

## 3. Struktur Direktori Proyek

```
simulasi-wireless-f3/
├── public/                     # Aset statis denah, CSV perangkat, dan tekstur
│   ├── Denah_Lantai_3_Gedung_F.png
│   ├── RuckusAPList.csv        # Data riil inventaris AP Ruckus (MAC, IP, Client, Channel)
│   ├── denah-f3.svg            # SVG denah asli lantai 3
│   └── icons.svg
├── scratch/                    # Skrip Node.js (MJS) pembantu ekstraksi & kalkulasi denah
│   ├── check_classroom_walls.mjs
│   ├── check_lift_pillars.mjs
│   ├── fix_classroom_walls_continuous.mjs
│   ├── update_emergency_stairs.mjs
│   └── update_toilet_fixtures.mjs
├── src/
│   ├── types/
│   │   └── floorplan.ts        # Deklarasi antarmuka/tipe TypeScript utama
│   ├── data/
│   │   └── floorplanData.ts    # Data koordinat dinding, pilar, AP, ruangan, fixture, & rumus proyeksi
│   ├── simulation/
│   │   └── wifiPropagation.ts  # Mesin kalkulasi propagasi RF, atenuasi, FSPL, dan palet warna RSSI
│   ├── components/
│   │   ├── ThreeCanvas.tsx     # Komponen React pembungkus canvas WebGL Three.js & render loop
│   │   ├── FloorPlan3D.ts      # Kelas Three.js pembuat mesh 3D denah (lantai, dinding cutaway, pilar, pintu)
│   │   ├── HeatmapMesh.ts      # Kelas Three.js pembuat bidang heatmap berbasis tekstur kanvas 2D
│   │   ├── WaveAnimation.ts    # Kelas Three.js penganimasi gelombang pancar radio AP
│   │   └── UI/                 # Komponen antarmuka overlay React
│   │       ├── TopNav.tsx          # Bar atas (statistik global AP, klien, mode kamera)
│   │       ├── LayerControls.tsx   # Panel kontrol layer (cutaway dinding, toggle heatmap, pilar, dsb.)
│   │       ├── APManager.tsx       # Panel inspeksi & toggle AP perorangan
│   │       ├── SignalLegend.tsx    # Legenda skala desibel RSSI (-30 dBm s/d -90 dBm)
│   │       └── SignalProbe.tsx     # Widget inspeksi sinyal saat titik lantai diklik/di-probe
│   ├── App.tsx                 # Root Component: manajemen state terpusat
│   ├── main.tsx                # Entry point aplikasi React
│   ├── App.css                 # Gaya styling antarmuka UI
│   └── index.css               # Gaya styling dasar global
├── GEMINI.md                   # Aturan agen khusus lingkungan Gemini / Antigravity
├── AGENTS.md                   # Aturan & panduan arsitektur proyek (dokumen ini)
└── package.json
```

---

## 4. Keterhubungan dan Alur Kerja Antar Modul

Hubungan fungsional antarkomponen terbagi menjadi 4 pilar utama:

### 4.1 Alur Data dan State Terpusat (`App.tsx`)
`App.tsx` memegang kendali atas *Single Source of Truth*:
- Memuat konfigurasi default dari `src/data/floorplanData.ts` (`INITIAL_ACCESS_POINTS`, `WALL_SEGMENTS`, `CONCRETE_PILLARS`, `ROOM_ZONES`, dsb.).
- Memegang state `config` (`SimulationConfig`): resolusi grid heatmap, mode kamera, tinggi pemotongan dinding (*The Sims cutaway*), opsi toggle layer.
- Memegang state `inspectedSignal`: data hasil probe sinyal ketika pengguna mengeklik titik mana pun pada lantai 3D.
- Mendistribusikan data ke:
  1. **`ThreeCanvas.tsx`**: untuk visualisasi grafis 3D dan kalkulasi interaksi klik mouse (Raycaster).
  2. **Komponen UI (`TopNav`, `LayerControls`, `APManager`, `SignalProbe`)**: untuk kontrol pengguna dan tampilan analitik.

```
+-----------------------------------------------------------+
|                         App.tsx                           |
|  - accessPoints State      - config State                 |
|  - walls, pillars, rooms   - inspectedSignal State        |
+-----------------------------------------------------------+
        |                                       |
        v                                       v
+-----------------------+              +--------------------+
|    ThreeCanvas.tsx    |              |   UI Components    |
| (WebGL Scene Manager) |              | - TopNav           |
|                       |              | - LayerControls    |
|   + FloorPlan3D       |              | - APManager        |
|   + HeatmapMesh       |              | - SignalLegend     |
|   + WaveAnimation     |              | - SignalProbe      |
+-----------------------+              +--------------------+
```

---

### 4.2 Sistem Koordinat Ganda (SVG 2D $\leftrightarrow$ World 3D Meter)
Data awal denah berbasis koordinat piksel SVG dari denah arsitektur asli. Diatur di `src/data/floorplanData.ts`:
- **Dimensi Kanvas SVG**: $1400 \times 720$ unit, dengan titik tengah $(700, 360)$.
- **Skala Metrik**: $1 \text{ unit SVG} = 0.05 \text{ meter}$.
- **Dimensi Dunia 3D**: Lebar $70 \text{ m}$ ($X: -35 \text{ s/d } +35$), Kedalaman $36 \text{ m}$ ($Z: -18 \text{ s/d } +18$).
- **Fungsi Transformasi**:
  $$\text{worldX} = (\text{svgX} - 700) \times 0.05$$
  $$\text{worldZ} = (\text{svgY} - 360) \times 0.05$$
- Hubungan ini memastikan kalkulasi jarak gelombang RF dalam meter riil di dunia 3D tetap presisi dengan tata letak visual denah asli.

---

### 4.3 Mesin Simulasi Propagasi Wi-Fi (`wifiPropagation.ts`)
Modul ini menghitung kekuatan sinyal penerimaan (RSSI) pada titik target $(X, Z)$:
1. **Free Space Path Loss & Log-Distance Model**:
   - Memperhitungkan jarak 3D antara posisi Access Point (ketinggian plafon $2.6\text{ m}$) dan posisi penerima/klien ($1.0\text{ m}$).
   - Parameter frekuensi ($2.4\text{ GHz}$ atau $5.0\text{ GHz}$) menentukan *Path Loss* awal ($PL_0$).
2. **Ray-Casting Collision Detection**:
   - Menarik garis lurus 2D dari posisi AP ke titik target.
   - Menguji perpotongan garis (*line-segment intersection*) terhadap setiap segmen dinding (`WallSegment`) dan kotak batas pilar beton (`ConcretePillar`).
   - Setiap penghalang mengurangi daya sinyal sesuai nilai atenuasi (`attenuationDB`).
3. **Kombinasi Multi-AP**:
   - Menghitung nilai sinyal dari semua AP aktif dan menentukan AP terbaik (*best AP*), RSSI terkuat, jumlah dinding tertembus, dan estimasi rasio sinyal terhadap derau (SNR).

---

### 4.4 Rendering Heatmap Dinamis (`HeatmapMesh.ts`)
Untuk menyajikan visualisasi sinyal berkinerja tinggi tanpa membebani GPU:
1. `HeatmapMesh` menggunakan **Offscreen HTML5 Canvas** berukuran resolusi grid ($140 \times 72);
2. Nilai RSSI pada setiap sel grid dihitung melalui `wifiPropagation.calculateSignalAt()` dan dipetakan ke warna RGBA via fungsi `rssiToColor()`;
3. Kanvas tersebut di-upscale ke kanvas render kedua ($560 \times 288$) menggunakan *bilinear smoothing* untuk menghasilkan gradien halus tanpa efek patah kotak-kotak;
4. Hasil render diikat ke `THREE.CanvasTexture` pada sebuah `THREE.PlaneGeometry` yang melayang sedikit di atas lantai ($Y = 0.08\text{ m}$) untuk mencegah *z-fighting*.

---

### 4.5 Visualisasi Arsitektur & Interaktivitas 3D (`FloorPlan3D.ts` & `WaveAnimation.ts`)
- **`FloorPlan3D.ts`**:
  - Mengonversi data numerik dinding, pintu, pilar, dan ruangan menjadi geometri 3D (*BoxGeometry*, *ExtrudeGeometry*).
  - Mengimplementasikan fitur **Sims Cutaway**: tinggi dinding dapat diatur secara dinamis ($0\% \text{ s/d } 100\%$) via slider `LayerControls` sehingga tata letak ruangan tetap terlihat jelas tanpa terhalang dinding tinggi.
  - Memuat model 3D representasi Access Point Ruckus lengkap dengan lampu status indikator aktif.
- **`WaveAnimation.ts`**:
  - Menghasilkan efek animasi cincin gelombang radio melingkar yang terpancar keluar secara periodik dari AP yang aktif.

---

## 5. Panduan Modifikasi & Penambahan Fitur

1. **Menambah / Mengubah Access Point**:
   - Tambahkan data pada array `INITIAL_ACCESS_POINTS` di `src/data/floorplanData.ts`.
   - Gunakan format koordinat SVG atau konversi langsung ke `worldX` dan `worldZ`.
   - Data status, IP, dan MAC dapat disesuaikan dengan `public/RuckusAPList.csv`.
2. **Mengubah Atenuasi Penghalang**:
   - Atur nilai `attenuationDB` pada `WALL_SEGMENTS` atau `CONCRETE_PILLARS` di `src/data/floorplanData.ts` untuk merefleksikan material baru (misal: partisi gipsum vs beton tebal).
3. **Menguji dan Menjalankan Proyek**:
   - Jalankan server lokal: `npm run dev`
   - Validasi lint: `npm run lint` atau `npx oxlint`
   - Build proyek: `npm run build`
