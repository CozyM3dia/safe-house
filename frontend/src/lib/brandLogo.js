/**
 * Logo resmi S.A.F.E House untuk dokumen PDF.
 *
 * Mendukung logo Light Mode (untuk dokumen latar putih/kertas) dan Dark Mode (untuk sampul gelap).
 * Modul ini memuat berkas logo asli sekali, memangkasnya dari margin transparan,
 * lalu menyediakannya untuk ditanam ke PDF.
 */

const LOGO_SRC_DARK = '/safe_house_logo_dark.png';
const LOGO_SRC_LIGHT = '/safe_house_logo_light.png';
const ALPHA_THRESHOLD = 8;

const cache = { dark: null, light: null };
const pendingMap = { dark: null, light: null };

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

async function loadPreparedLogo(src) {
  const img = await loadImage(src);

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

  return { dataUrl: trimmed.toDataURL('image/png'), ratio: h / w };
}

/**
 * Muat dan siapkan logo. Aman dipanggil berkali-kali; hasilnya di-cache.
 * Mengembalikan `false` bila logo tak dapat dimuat, sehingga pemanggil bisa
 * jatuh ke wordmark teks alih-alih menggagalkan pembuatan PDF.
 */
export async function ensureLogo(variant = 'dark') {
  const key = variant === 'light' ? 'light' : 'dark';
  if (cache[key] !== null) return cache[key];
  if (pendingMap[key]) return pendingMap[key];

  pendingMap[key] = (async () => {
    try {
      const src = key === 'light' ? LOGO_SRC_LIGHT : LOGO_SRC_DARK;
      cache[key] = await loadPreparedLogo(src);
      return cache[key];
    } catch {
      try {
        cache[key] = await loadPreparedLogo('/safe_house_logo.png');
        return cache[key];
      } catch {
        cache[key] = false;
        return cache[key];
      }
    } finally {
      pendingMap[key] = null;
    }
  })();

  return pendingMap[key];
}

/**
 * Gambar logo selebar `width` mm, berpusat di `cx`, sisi atas di `top`.
 * @returns tinggi terpakai (mm), atau null bila logo tak tersedia.
 */
export function drawLogo(pdf, cx, top, width, variant = 'dark') {
  const key = variant === 'light' ? 'light' : 'dark';
  const item = cache[key] || cache.dark;
  if (!item) return null;
  const height = width * item.ratio;
  try {
    pdf.addImage(item.dataUrl, 'PNG', cx - width / 2, top, width, height);
    return height;
  } catch {
    return null;
  }
}

/**
 * Versi untuk dokumen berlatar putih: logo ditaruh di atas plat gelap membulat
 * atau langsung menggunakan aset logo light bila tersedia.
 * @returns tinggi total plat (mm), atau null bila logo tak tersedia.
 */
export function drawLogoOnPlate(pdf, x, top, width, plateRGB = [28, 37, 51]) {
  const item = cache.dark || cache.light;
  if (!item) return null;
  const padX = width * 0.09;
  const padY = width * 0.07;
  const logoH = width * item.ratio;
  const plateW = width + padX * 2;
  const plateH = logoH + padY * 2;

  try {
    pdf.setFillColor(...plateRGB);
    pdf.roundedRect(x, top, plateW, plateH, 1.6, 1.6, 'F');
    pdf.addImage(item.dataUrl, 'PNG', x + padX, top + padY, width, logoH);
    return plateH;
  } catch {
    return null;
  }
}
