/**
 * Logo resmi S.A.F.E House untuk dokumen PDF.
 *
 * Sampul dan kop PDF dulu menggambar wordmark "S.A.F.E HOUSE" memakai
 * helvetica biasa — tiruan yang tidak sama dengan logo resmi. Modul ini memuat
 * berkas logo asli sekali, memangkasnya dari margin transparan (berkasnya
 * kanvas 500x500 sementara gambarnya lockup melebar), lalu menyediakannya
 * untuk ditanam ke PDF.
 *
 * Logo berwarna krem/putih dengan marka tan, jadi hanya terbaca di atas latar
 * gelap. Di dokumen berlatar putih, pakai `drawLogoOnPlate` yang menaruhnya di
 * atas plat gelap.
 */

const LOGO_SRC = '/safe_house_logo.png';
const ALPHA_THRESHOLD = 8;

let logo = null; // null = belum dimuat, false = gagal, object = siap
let pending = null;

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
}

/** Batas piksel non-transparan, supaya lockup tidak mengambang di kotak kosong. */
function opaqueBounds(ctx, width, height) {
  const { data } = ctx.getImageData(0, 0, width, height);
  let top = height;
  let left = width;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > ALPHA_THRESHOLD) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  return { top, left, right, bottom };
}

/**
 * Muat dan siapkan logo. Aman dipanggil berkali-kali; hasilnya di-cache.
 * Mengembalikan `false` bila logo tak dapat dimuat, sehingga pemanggil bisa
 * jatuh ke wordmark teks alih-alih menggagalkan pembuatan PDF.
 */
export async function ensureLogo() {
  if (logo !== null) return logo;
  if (pending) return pending;

  pending = (async () => {
    try {
      const img = await loadImage(LOGO_SRC);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      const { top, left, right, bottom } = opaqueBounds(ctx, canvas.width, canvas.height);
      if (right < left || bottom < top) throw new Error('logo tidak punya piksel tampak');

      const w = right - left + 1;
      const h = bottom - top + 1;
      const trimmed = document.createElement('canvas');
      trimmed.width = w;
      trimmed.height = h;
      trimmed.getContext('2d').drawImage(canvas, left, top, w, h, 0, 0, w, h);

      logo = { dataUrl: trimmed.toDataURL('image/png'), ratio: h / w };
      return logo;
    } catch {
      // PDF tetap harus terbit walau logo gagal dimuat.
      logo = false;
      return logo;
    } finally {
      pending = null;
    }
  })();

  return pending;
}

/**
 * Gambar logo selebar `width` mm, berpusat di `cx`, sisi atas di `top`.
 * @returns tinggi terpakai (mm), atau null bila logo tak tersedia.
 */
export function drawLogo(pdf, cx, top, width) {
  if (!logo) return null;
  const height = width * logo.ratio;
  try {
    pdf.addImage(logo.dataUrl, 'PNG', cx - width / 2, top, width, height);
    return height;
  } catch {
    return null;
  }
}

/**
 * Versi untuk dokumen berlatar putih: logo ditaruh di atas plat gelap
 * membulat. Tanpa plat, teks logo yang berwarna krem praktis tak terlihat di
 * atas kertas putih.
 * @returns tinggi total plat (mm), atau null bila logo tak tersedia.
 */
export function drawLogoOnPlate(pdf, x, top, width, plateRGB = [28, 37, 51]) {
  if (!logo) return null;
  const padX = width * 0.09;
  const padY = width * 0.07;
  const logoH = width * logo.ratio;
  const plateW = width + padX * 2;
  const plateH = logoH + padY * 2;

  try {
    pdf.setFillColor(...plateRGB);
    pdf.roundedRect(x, top, plateW, plateH, 1.6, 1.6, 'F');
    pdf.addImage(logo.dataUrl, 'PNG', x + padX, top + padY, width, logoH);
    return plateH;
  } catch {
    return null;
  }
}
