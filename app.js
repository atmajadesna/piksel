/* Piksel — editor piksel 32×32
 * Tanpa pustaka. Kanvas kecil, riwayat langkah, galeri localStorage, ekspor PNG.
 */

(() => {
  "use strict";

  const WARNA_AWAL = [
    "#16161a", "#f4f1e8", "#e2582a", "#c8352b",
    "#2b4bb5", "#6f9bd1", "#2f7a52", "#2b7d7a",
    "#e8b93a", "#d98aa0", "#6b4a9e", "#8a5a3b",
  ];

  const KUNCI_GALERI = "piksel.galeri.v1";
  const MAKS_GALERI = 18;
  const MAKS_RIWAYAT = 60;

  const el = {
    kanvas: document.getElementById("kanvas"),
    pratinjau: document.getElementById("pratinjau"),
    bungkus: document.getElementById("bungkus"),
    warna: document.getElementById("warna"),
    warnaKhusus: document.getElementById("warna-khusus"),
    labelWarna: document.getElementById("label-warna"),
    labelAlat: document.getElementById("label-alat"),
    infoUkuran: document.getElementById("info-ukuran"),
    infoAlat: document.getElementById("info-alat"),
    infoPos: document.getElementById("info-pos"),
    galeri: document.getElementById("galeri"),
    labelGaleri: document.getElementById("label-galeri"),
    urungkan: document.getElementById("urungkan"),
    ulangi: document.getElementById("ulangi"),
    bersihkan: document.getElementById("bersihkan"),
    simpan: document.getElementById("simpan"),
    ekspor: document.getElementById("ekspor"),
    skala: document.getElementById("skala"),
    sakelarKisi: document.getElementById("sakelar-kisi"),
    sakelarCermin: document.getElementById("sakelar-cermin"),
    kabar: document.getElementById("kabar"),
  };

  const ctx = el.kanvas.getContext("2d");
  const ctxPratinjau = el.pratinjau.getContext("2d");

  const state = {
    ukuran: 32,
    alat: "pensil",
    warna: WARNA_AWAL[0],
    kisi: true,
    cermin: false,
  };

  let piksel = [];
  let riwayat = [];
  let posisi = -1;
  let menggambar = false;
  let titikAwal = null;

  /* ---------- utilitas ---------- */

  const indeks = (x, y) => y * state.ukuran + x;

  function kabar(teks) {
    el.kabar.textContent = "";
    window.setTimeout(() => { el.kabar.textContent = teks; }, 40);
  }

  function petaBaru() {
    return new Array(state.ukuran * state.ukuran).fill(null);
  }

  function salinPeta(peta) {
    return peta.slice();
  }

  /* ---------- gambar ke kanvas ---------- */

  function gambarUlang() {
    const n = state.ukuran;
    el.kanvas.width = n;
    el.kanvas.height = n;
    el.pratinjau.width = n;
    el.pratinjau.height = n;

    ctx.clearRect(0, 0, n, n);
    for (let i = 0; i < piksel.length; i++) {
      const w = piksel[i];
      if (!w) continue;
      ctx.fillStyle = w;
      ctx.fillRect(i % n, Math.floor(i / n), 1, 1);
    }
    ctxPratinjau.clearRect(0, 0, n, n);
  }

  function segarkanInfo() {
    el.infoUkuran.textContent = `${state.ukuran} × ${state.ukuran}`;
    el.infoAlat.textContent = state.alat;
    el.labelAlat.textContent = state.alat;
    el.bungkus.style.setProperty("--sel", `${100 / state.ukuran}%`);
    el.bungkus.dataset.kisi = state.kisi ? "nyala" : "mati";
    el.sakelarKisi.setAttribute("aria-pressed", String(state.kisi));
    el.sakelarCermin.setAttribute("aria-pressed", String(state.cermin));
  }

  /* ---------- riwayat ---------- */

  function catat() {
    riwayat = riwayat.slice(0, posisi + 1);
    riwayat.push(salinPeta(piksel));
    if (riwayat.length > MAKS_RIWAYAT) riwayat.shift();
    posisi = riwayat.length - 1;
    segarkanRiwayat();
  }

  function segarkanRiwayat() {
    el.urungkan.disabled = posisi <= 0;
    el.ulangi.disabled = posisi >= riwayat.length - 1;
  }

  function urungkan() {
    if (posisi <= 0) return;
    posisi -= 1;
    piksel = salinPeta(riwayat[posisi]);
    gambarUlang();
    segarkanRiwayat();
    kabar("Langkah diurungkan.");
  }

  function ulangi() {
    if (posisi >= riwayat.length - 1) return;
    posisi += 1;
    piksel = salinPeta(riwayat[posisi]);
    gambarUlang();
    segarkanRiwayat();
    kabar("Langkah diulangi.");
  }

  /* ---------- menggambar ---------- */

  function taruh(x, y, warna) {
    if (x < 0 || y < 0 || x >= state.ukuran || y >= state.ukuran) return;
    piksel[indeks(x, y)] = warna;
    ctx.fillStyle = warna || "rgba(0,0,0,0)";
    if (warna) {
      ctx.fillRect(x, y, 1, 1);
    } else {
      ctx.clearRect(x, y, 1, 1);
    }
    if (state.cermin) {
      const kx = state.ukuran - 1 - x;
      if (kx !== x) {
        piksel[indeks(kx, y)] = warna;
        if (warna) {
          ctx.fillStyle = warna;
          ctx.fillRect(kx, y, 1, 1);
        } else {
          ctx.clearRect(kx, y, 1, 1);
        }
      }
    }
  }

  function isiBanjir(x, y, warnaBaru) {
    const n = state.ukuran;
    const sasaran = piksel[indeks(x, y)];
    if (sasaran === warnaBaru) return;
    const tumpukan = [[x, y]];
    while (tumpukan.length) {
      const [cx, cy] = tumpukan.pop();
      if (cx < 0 || cy < 0 || cx >= n || cy >= n) continue;
      const i = indeks(cx, cy);
      if (piksel[i] !== sasaran) continue;
      piksel[i] = warnaBaru;
      tumpukan.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    gambarUlang();
  }

  function garis(x0, y0, x1, y1, warna, kanvas, konteks) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let galat = dx - dy;
    let x = x0;
    let y = y0;

    while (true) {
      if (kanvas === "pratinjau") {
        konteks.fillRect(x, y, 1, 1);
      } else {
        taruh(x, y, warna);
      }
      if (x === x1 && y === y1) break;
      const e2 = 2 * galat;
      if (e2 > -dy) { galat -= dy; x += sx; }
      if (e2 < dx) { galat += dx; y += sy; }
    }
  }

  function koordinat(peristiwa) {
    const r = el.kanvas.getBoundingClientRect();
    const x = Math.floor(((peristiwa.clientX - r.left) / r.width) * state.ukuran);
    const y = Math.floor(((peristiwa.clientY - r.top) / r.height) * state.ukuran);
    return {
      x: Math.min(state.ukuran - 1, Math.max(0, x)),
      y: Math.min(state.ukuran - 1, Math.max(0, y)),
    };
  }

  /* ---------- interaksi kanvas ---------- */

  el.kanvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    el.kanvas.focus({ preventScroll: true });
    el.kanvas.setPointerCapture(e.pointerId);
    const { x, y } = koordinat(e);

    if (state.alat === "pipet") {
      const w = piksel[indeks(x, y)];
      if (w) {
        pakaiWarna(w);
        kabar(`Warna diambil: ${w}.`);
      } else {
        kabar("Piksel ini transparan.");
      }
      return;
    }

    if (state.alat === "isi") {
      isiBanjir(x, y, state.warna);
      catat();
      kabar("Area diisi.");
      return;
    }

    if (state.alat === "garis") {
      titikAwal = { x, y };
      ctxPratinjau.clearRect(0, 0, state.ukuran, state.ukuran);
      ctxPratinjau.fillStyle = state.warna;
      menggambar = true;
      return;
    }

    menggambar = true;
    taruh(x, y, state.alat === "penghapus" ? null : state.warna);
  });

  el.kanvas.addEventListener("pointermove", (e) => {
    const { x, y } = koordinat(e);
    el.infoPos.textContent = `baris ${y + 1} kolom ${x + 1}`;

    if (!menggambar) return;

    if (state.alat === "garis" && titikAwal) {
      ctxPratinjau.clearRect(0, 0, state.ukuran, state.ukuran);
      ctxPratinjau.fillStyle = state.warna;
      garis(titikAwal.x, titikAwal.y, x, y, state.warna, "pratinjau", ctxPratinjau);
      return;
    }

    taruh(x, y, state.alat === "penghapus" ? null : state.warna);
  });

  function selesaiGambar(e) {
    if (!menggambar) return;
    menggambar = false;

    if (state.alat === "garis" && titikAwal) {
      const { x, y } = koordinat(e);
      garis(titikAwal.x, titikAwal.y, x, y, state.warna, "kanvas", ctx);
      ctxPratinjau.clearRect(0, 0, state.ukuran, state.ukuran);
      titikAwal = null;
    }
    catat();
  }

  el.kanvas.addEventListener("pointerup", selesaiGambar);
  el.kanvas.addEventListener("pointercancel", () => {
    menggambar = false;
    titikAwal = null;
    ctxPratinjau.clearRect(0, 0, state.ukuran, state.ukuran);
  });
  el.kanvas.addEventListener("pointerleave", () => {
    el.infoPos.textContent = "baris — kolom —";
  });

  /* ---------- warna ---------- */

  function pakaiWarna(w) {
    state.warna = w;
    el.labelWarna.textContent = w;
    el.warnaKhusus.value = w;
    [...el.warna.children].forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.warna === w));
    });
  }

  WARNA_AWAL.forEach((w) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.dataset.warna = w;
    b.style.background = w;
    b.setAttribute("aria-label", `Warna ${w}`);
    b.setAttribute("aria-pressed", String(w === state.warna));
    b.addEventListener("click", () => pakaiWarna(w));
    el.warna.appendChild(b);
  });

  el.warnaKhusus.addEventListener("input", (e) => pakaiWarna(e.target.value));

  /* ---------- alat ---------- */

  function pakaiAlat(nama) {
    state.alat = nama;
    [...document.querySelectorAll(".tombol-alat")].forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.alat === nama));
    });
    segarkanInfo();
  }

  document.querySelectorAll(".tombol-alat").forEach((b) => {
    b.addEventListener("click", () => pakaiAlat(b.dataset.alat));
  });

  /* ---------- ukuran kanvas ---------- */

  function gantiUkuran(n) {
    const lama = piksel;
    const lamaN = state.ukuran;
    state.ukuran = n;
    piksel = petaBaru();
    // salin bagian yang muat agar karya tidak hilang saat ukuran diperbesar
    const sisi = Math.min(lamaN, n);
    for (let y = 0; y < sisi; y++) {
      for (let x = 0; x < sisi; x++) {
        piksel[indeks(x, y)] = lama[y * lamaN + x];
      }
    }
    riwayat = [];
    posisi = -1;
    catat();
    gambarUlang();
    segarkanInfo();
    document.querySelectorAll("[data-ukuran]").forEach((b) => {
      b.setAttribute("aria-pressed", String(Number(b.dataset.ukuran) === n));
    });
    kabar(`Kanvas ${n} × ${n}.`);
  }

  document.querySelectorAll("[data-ukuran]").forEach((b) => {
    b.addEventListener("click", () => gantiUkuran(Number(b.dataset.ukuran)));
  });

  el.sakelarKisi.addEventListener("click", () => {
    state.kisi = !state.kisi;
    segarkanInfo();
    kabar(state.kisi ? "Kisi ditampilkan." : "Kisi disembunyikan.");
  });

  el.sakelarCermin.addEventListener("click", () => {
    state.cermin = !state.cermin;
    segarkanInfo();
    kabar(state.cermin ? "Cermin kiri–kanan aktif." : "Cermin dimatikan.");
  });

  el.urungkan.addEventListener("click", urungkan);
  el.ulangi.addEventListener("click", ulangi);

  el.bersihkan.addEventListener("click", () => {
    piksel = petaBaru();
    gambarUlang();
    catat();
    kabar("Kanvas dikosongkan. Bisa diurungkan.");
  });

  /* ---------- galeri ---------- */

  function bacaGaleri() {
    try {
      const isi = JSON.parse(localStorage.getItem(KUNCI_GALERI) || "[]");
      return Array.isArray(isi) ? isi : [];
    } catch {
      return [];
    }
  }

  function tulisGaleri(daftar) {
    try {
      localStorage.setItem(KUNCI_GALERI, JSON.stringify(daftar.slice(0, MAKS_GALERI)));
      return true;
    } catch {
      kabar("Penyimpanan peramban penuh. Hapus satu gambar di galeri.");
      return false;
    }
  }

  function gambarMini(kanvasKecil, data, n) {
    kanvasKecil.width = n;
    kanvasKecil.height = n;
    const k = kanvasKecil.getContext("2d");
    for (let i = 0; i < data.length; i++) {
      if (!data[i]) continue;
      k.fillStyle = data[i];
      k.fillRect(i % n, Math.floor(i / n), 1, 1);
    }
  }

  function tampilkanGaleri() {
    const daftar = bacaGaleri();
    el.galeri.textContent = "";
    el.labelGaleri.textContent = String(daftar.length);

    if (!daftar.length) {
      const p = document.createElement("p");
      p.className = "galeri__kosong";
      p.textContent = "Belum ada gambar tersimpan. Tekan Simpan untuk menaruh karya pertama di galeri perangkat ini.";
      el.galeri.appendChild(p);
      return;
    }

    daftar.forEach((item) => {
      const wadah = document.createElement("div");
      wadah.className = "galeri__item";
      wadah.setAttribute("role", "group");
      wadah.setAttribute("aria-label", `Gambar ${item.ukuran} × ${item.ukuran}`);

      const k = document.createElement("canvas");
      gambarMini(k, item.data, item.ukuran);
      k.setAttribute("aria-hidden", "true");
      wadah.appendChild(k);

      const buka = document.createElement("button");
      buka.type = "button";
      buka.style.cssText = "position:absolute;inset:0;border:0;background:transparent;cursor:pointer;";
      buka.setAttribute("aria-label", "Buka gambar ini di kanvas");
      buka.addEventListener("click", () => {
        state.ukuran = item.ukuran;
        piksel = item.data.slice();
        riwayat = [];
        posisi = -1;
        catat();
        gambarUlang();
        segarkanInfo();
        document.querySelectorAll("[data-ukuran]").forEach((b) => {
          b.setAttribute("aria-pressed", String(Number(b.dataset.ukuran) === item.ukuran));
        });
        kabar("Gambar dibuka dari galeri.");
      });
      wadah.appendChild(buka);

      const hapus = document.createElement("button");
      hapus.type = "button";
      hapus.className = "galeri__hapus";
      hapus.textContent = "×";
      hapus.setAttribute("aria-label", "Hapus gambar ini dari galeri");
      hapus.addEventListener("click", () => {
        const sisa = bacaGaleri().filter((x) => x.id !== item.id);
        tulisGaleri(sisa);
        tampilkanGaleri();
        kabar("Gambar dihapus dari galeri.");
      });
      wadah.appendChild(hapus);

      el.galeri.appendChild(wadah);
    });
  }

  el.simpan.addEventListener("click", () => {
    const daftar = bacaGaleri();
    const baru = {
      id: `p${Date.now()}`,
      ukuran: state.ukuran,
      data: piksel.slice(),
      waktu: new Date().toISOString(),
    };
    if (tulisGaleri([baru, ...daftar])) {
      tampilkanGaleri();
      kabar("Gambar disimpan di galeri perangkat ini.");
    }
  });

  /* ---------- ekspor ---------- */

  el.ekspor.addEventListener("click", () => {
    const skala = Number(el.skala.value);
    const n = state.ukuran;
    const luar = document.createElement("canvas");
    luar.width = n * skala;
    luar.height = n * skala;
    const k = luar.getContext("2d");
    k.imageSmoothingEnabled = false;
    k.drawImage(el.kanvas, 0, 0, luar.width, luar.height);

    luar.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `piksel-${n}-${skala}x.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      kabar(`PNG ${luar.width} × ${luar.height} diekspor.`);
    }, "image/png");
  });

  /* ---------- pintasan ---------- */

  const PINTASAN_ALAT = { b: "pensil", e: "penghapus", g: "isi", l: "garis", i: "pipet" };

  document.addEventListener("keydown", (e) => {
    const t = e.target;
    const sedangMengetik = t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA");

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) ulangi(); else urungkan();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      el.simpan.click();
      return;
    }
    if (sedangMengetik || e.ctrlKey || e.metaKey || e.altKey) return;

    const k = e.key.toLowerCase();
    if (PINTASAN_ALAT[k]) { pakaiAlat(PINTASAN_ALAT[k]); return; }
    if (k === "x") { el.sakelarCermin.click(); return; }
    if (k === "k") { el.sakelarKisi.click(); }
  });

  /* ---------- mulai ---------- */

  piksel = petaBaru();
  catat();
  gambarUlang();
  segarkanInfo();
  pakaiWarna(state.warna);
  tampilkanGaleri();

  // contoh kecil supaya kanvas tidak kosong saat pertama dibuka
  if (!bacaGaleri().length) {
    const contoh = [
      [14, 12, "#e2582a"], [15, 12, "#e2582a"], [16, 12, "#e2582a"], [17, 12, "#e2582a"],
      [13, 13, "#e2582a"], [18, 13, "#e2582a"],
      [13, 14, "#f4f1e8"], [18, 14, "#f4f1e8"],
      [14, 14, "#16161a"], [17, 14, "#16161a"],
      [13, 15, "#f4f1e8"], [18, 15, "#f4f1e8"],
      [14, 16, "#f4f1e8"], [15, 16, "#f4f1e8"], [16, 16, "#f4f1e8"], [17, 16, "#f4f1e8"],
      [15, 17, "#2b4bb5"], [16, 17, "#2b4bb5"],
    ];
    contoh.forEach(([x, y, w]) => { if (x < 32 && y < 32) piksel[indeks(x, y)] = w; });
    gambarUlang();
    riwayat = [salinPeta(piksel)];
    posisi = 0;
    segarkanRiwayat();
  }
})();
