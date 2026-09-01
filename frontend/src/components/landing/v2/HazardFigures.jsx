/**
 * Diagram teknis ringan untuk lembar kerja lima bahaya (pengganti scene
 * three.js). Satu SVG per lapisan, gaya gambar kerja: garis tipis, hatch,
 * dimensi, anotasi mono. Warna semua dari CSS var (--hue per lapisan,
 * --lp-* untuk tinta) sehingga ikut tema. Animasi = CSS murni
 * (landing-v2.css, prefix .lp-ws-), dimatikan oleh prefers-reduced-motion.
 *
 * `labels` datang dari COPY dict (bilingual) agar angka & istilah
 * mengikuti bahasa UI; urutan indeks didokumentasikan per diagram.
 */

const VB = '0 0 560 210';

function House({ x, y, className = '' }) {
  /* Simbol tapak: kotak + atap, titik (x, y) = tengah garis tanah */
  return (
    <g className={className} fill="none" stroke="var(--lp-umber)" strokeWidth="1.4" strokeLinejoin="round">
      <rect x={x - 14} y={y - 24} width="28" height="24" rx="1" />
      <path d={`M${x - 18} ${y - 22} L${x} ${y - 36} L${x + 18} ${y - 22}`} />
      <path d={`M${x - 4} ${y} V${y - 10} H${x + 4} V${y}`} strokeWidth="1" />
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, stroke = 'var(--hue)' }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h = 6;
  const ax = x2 - h * Math.cos(ang - Math.PI / 7);
  const ay = y2 - h * Math.sin(ang - Math.PI / 7);
  const bx = x2 - h * Math.cos(ang + Math.PI / 7);
  const by = y2 - h * Math.sin(ang + Math.PI / 7);
  return (
    <g stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M${ax} ${ay} L${x2} ${y2} L${bx} ${by}`} />
    </g>
  );
}

/* labels: [sesar, PGA, Fa→permukaan, kelas situs·Vs30, tapak] */
function SeismicFig({ labels }) {
  const ground = 128;
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid meet">
      {/* strata bawah tanah */}
      {[150, 172, 194].map((y) => (
        <line key={y} x1="24" y1={y} x2="536" y2={y} stroke="var(--lp-taupe)" strokeOpacity="0.22" strokeWidth="1" />
      ))}
      <line x1="24" y1={ground} x2="536" y2={ground} stroke="var(--lp-taupe)" strokeOpacity="0.7" strokeWidth="1.2" />

      {/* sesar + hiposenter + gelombang */}
      <line x1="112" y1="208" x2="204" y2={ground} stroke="var(--hue)" strokeWidth="1.4" strokeDasharray="5 4" />
      <g fill="none" stroke="var(--hue)">
        <circle className="lp-ws-ring" cx="146" cy="176" r="12" strokeWidth="1.2" />
        <circle className="lp-ws-ring" cx="146" cy="176" r="26" strokeWidth="1" style={{ animationDelay: '0.9s' }} />
        <circle className="lp-ws-ring" cx="146" cy="176" r="42" strokeWidth="0.8" style={{ animationDelay: '1.8s' }} />
      </g>
      <circle cx="146" cy="176" r="3" fill="var(--hue)" />
      <text className="lp-ws-t" x="24" y="200">{labels[0]}</text>

      {/* seismogram */}
      <line x1="24" y1="44" x2="536" y2="44" stroke="var(--hue)" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 4" />
      <path
        className="lp-ws-draw"
        pathLength="1"
        d="M24 44 H150 L158 38 L166 52 L174 30 L182 60 L190 22 L198 68 L206 26 L214 62 L222 34 L230 56 L238 38 L246 52 L254 40 L262 48 L270 42 L278 46 L286 43 L300 44 H536"
        fill="none"
        stroke="var(--hue)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text className="lp-ws-t lp-ws-t--hue lp-ws-t--big" x="536" y="30" textAnchor="end">{labels[1]}</text>

      {/* tapak + amplifikasi situs */}
      <House x={396} y={ground} />
      <text className="lp-ws-t" x="396" y="80" textAnchor="middle">{labels[4]}</text>
      <Arrow x1={440} y1={ground} x2={440} y2={94} />
      <text className="lp-ws-t lp-ws-t--hue" x="448" y="104">{labels[2]}</text>
      <text className="lp-ws-t" x="396" y="162" textAnchor="middle">{labels[3]}</text>
    </svg>
  );
}

/* labels: [sungai/pantai, muka banjir wilayah, elevasi, hujan, tapak] */
function FloodFig({ labels }) {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid meet">
      {/* profil tanah */}
      <path
        d="M24 150 L70 152 L96 172 L120 180 L160 180 L184 170 L230 150 L300 122 L370 100 L400 96 L536 96 V210 H24 Z"
        fill="var(--lp-taupe)"
        fillOpacity="0.12"
      />
      <path
        className="lp-ws-draw"
        pathLength="1"
        d="M24 150 L70 152 L96 172 L120 180 L160 180 L184 170 L230 150 L300 122 L370 100 L400 96 L536 96"
        fill="none"
        stroke="var(--lp-taupe)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* air sungai */}
      <g className="lp-ws-water">
        <path
          d="M79 160 Q100 155 120 160 T160 160 T207 160 L184 170 L160 180 L120 180 L96 172 Z"
          fill="var(--hue)"
          fillOpacity="0.28"
        />
        <path d="M79 160 Q100 155 120 160 T160 160 T207 160" fill="none" stroke="var(--hue)" strokeWidth="1.4" />
      </g>
      <text className="lp-ws-t" x="143" y="200" textAnchor="middle">{labels[0]}</text>

      {/* hujan */}
      <g className="lp-ws-rain" stroke="var(--hue)" strokeOpacity="0.7" strokeWidth="1" strokeLinecap="round">
        {[96, 112, 128, 144, 160, 176].map((x, i) => (
          <line key={x} x1={x} y1={34 + (i % 2) * 6} x2={x - 4} y2={46 + (i % 2) * 6} />
        ))}
      </g>
      <text className="lp-ws-t" x="200" y="46">{labels[3]}</text>

      {/* muka banjir wilayah */}
      <line x1="24" y1="136" x2="536" y2="136" stroke="var(--hue)" strokeWidth="1" strokeDasharray="6 5" />
      <text className="lp-ws-t lp-ws-t--hue" x="24" y="130">{labels[1]}</text>

      {/* tapak + elevasi */}
      <House x={450} y={96} />
      <text className="lp-ws-t" x="450" y="48" textAnchor="middle">{labels[4]}</text>
      <line x1="394" y1="96" x2="410" y2="96" stroke="var(--hue)" strokeWidth="1.4" />
      <line x1="402" y1="90" x2="402" y2="102" stroke="var(--hue)" strokeWidth="1.4" />
      <text className="lp-ws-t lp-ws-t--hue lp-ws-t--big" x="502" y="122" textAnchor="end">{labels[2]}</text>
      <Arrow x1={512} y1={136} x2={512} y2={100} />
    </svg>
  );
}

/* labels: [kolom tanah, Vs30, rawan, waspada, FS, rumus] */
function LiquefactionFig({ labels }) {
  const x0 = 300;
  const px = (fs) => x0 + (fs / 3) * 236; // skala FS 0..3 → 300..536
  const gy = 110;
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid meet">
      {/* kolom tanah berlapis */}
      <rect x="40" y="22" width="110" height="168" fill="var(--hue)" fillOpacity="0.07" stroke="var(--hue)" strokeOpacity="0.5" strokeWidth="1" />
      <path d="M40 62 Q68 57 95 62 T150 62 V104 Q122 108 95 104 T40 104 Z" fill="var(--hue)" fillOpacity="0.18" />
      <path d="M40 140 Q68 144 95 140 T150 140 V190 H40 Z" fill="var(--hue)" fillOpacity="0.24" />
      <g fill="none" stroke="var(--hue)" strokeOpacity="0.55" strokeWidth="1">
        <path d="M40 62 Q68 57 95 62 T150 62" />
        <path d="M40 104 Q68 108 95 104 T150 104" />
        <path d="M40 140 Q68 144 95 140 T150 140" />
      </g>
      {/* simbol muka air tanah */}
      <path d="M26 98 L38 98 L32 106 Z" fill="var(--hue)" />
      <line x1="24" y1="108" x2="40" y2="108" stroke="var(--hue)" strokeWidth="1" />
      <text className="lp-ws-t" x="40" y="204">{labels[0]}</text>

      {/* garis ukur Vs30 */}
      <line x1="176" y1="22" x2="176" y2="190" stroke="var(--hue)" strokeOpacity="0.5" strokeWidth="1" />
      {[22, 64, 106, 148, 190].map((y) => (
        <line key={y} x1="172" y1={y} x2="180" y2={y} stroke="var(--hue)" strokeOpacity="0.6" strokeWidth="1" />
      ))}
      <g className="lp-ws-marker">
        <circle cx="176" cy="22" r="3.2" fill="var(--hue)" />
      </g>
      <text className="lp-ws-t lp-ws-t--hue" x="186" y="110">{labels[1]}</text>

      {/* gauge FS */}
      <text className="lp-ws-t" x={x0} y="60">{labels[5]}</text>
      <rect x={px(0)} y={gy - 4} width={px(1) - px(0)} height="8" rx="4" fill="var(--lp-error)" fillOpacity="0.32" />
      <rect x={px(1)} y={gy - 4} width={px(1.2) - px(1)} height="8" fill="var(--lp-band-moderate)" fillOpacity="0.4" />
      <rect x={px(1.2)} y={gy - 4} width={px(3) - px(1.2)} height="8" rx="4" fill="var(--hue)" fillOpacity="0.3" />
      {[0, 1, 2, 3].map((v) => (
        <line key={v} x1={px(v)} y1={gy + 8} x2={px(v)} y2={gy + 14} stroke="var(--lp-taupe)" strokeWidth="1" />
      ))}
      <text className="lp-ws-t" x={px(0.5)} y={gy + 26} textAnchor="middle">{labels[2]}</text>
      <line x1={px(1.1)} y1={gy + 6} x2={px(1.1)} y2={gy + 34} stroke="var(--lp-taupe)" strokeWidth="1" />
      <text className="lp-ws-t" x={px(1.1)} y={gy + 44} textAnchor="middle">{labels[3]}</text>

      <g className="lp-ws-pulse">
        <line className="lp-ws-draw" pathLength="1" x1={px(2)} y1={gy - 22} x2={px(2)} y2={gy + 12} stroke="var(--hue)" strokeWidth="1.6" />
        <path d={`M${px(2) - 5} ${gy - 28} L${px(2) + 5} ${gy - 28} L${px(2)} ${gy - 20} Z`} fill="var(--hue)" />
      </g>
      <text className="lp-ws-t lp-ws-t--hue lp-ws-t--big" x={px(2)} y={gy - 36} textAnchor="middle">{labels[4]}</text>
    </svg>
  );
}

/* labels: [KRB III, KRB II, KRB I, jarak, tapak] */
function VolcanicFig({ labels }) {
  const cx = 130;
  const cy = 108;
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid meet">
      <g stroke="var(--hue)" fill="var(--hue)">
        <ellipse className="lp-ws-ring" cx={cx} cy={cy} rx="112" ry="76" fillOpacity="0.07" strokeWidth="1" strokeDasharray="4 4" />
        <ellipse className="lp-ws-ring" cx={cx} cy={cy} rx="72" ry="48" fillOpacity="0.14" strokeWidth="1" style={{ animationDelay: '0.7s' }} />
        <ellipse className="lp-ws-ring" cx={cx} cy={cy} rx="34" ry="22" fillOpacity="0.26" strokeWidth="1.2" style={{ animationDelay: '1.4s' }} />
      </g>
      <path d={`M${cx - 9} ${cy + 6} L${cx} ${cy - 10} L${cx + 9} ${cy + 6} Z`} fill="var(--hue)" />
      <text className="lp-ws-t" x={cx + 6} y={cy - 26}>{labels[0]}</text>
      <text className="lp-ws-t" x={cx + 6} y={cy - 52}>{labels[1]}</text>
      <text className="lp-ws-t" x={cx + 6} y={cy - 80}>{labels[2]}</text>

      {/* garis jarak */}
      <line x1={cx + 112} y1={cy - 6} x2={cx + 112} y2={cy + 6} stroke="var(--hue)" strokeWidth="1.2" />
      <line x1="450" y1={cy - 6} x2="450" y2={cy + 6} stroke="var(--hue)" strokeWidth="1.2" />
      <line
        className="lp-ws-draw"
        pathLength="1"
        x1={cx + 112}
        y1={cy}
        x2="450"
        y2={cy}
        stroke="var(--hue)"
        strokeWidth="1.2"
        strokeDasharray="6 5"
      />
      <text className="lp-ws-t lp-ws-t--hue lp-ws-t--big" x={(cx + 112 + 450) / 2} y={cy - 10} textAnchor="middle">
        {labels[3]}
      </text>

      <House x={470} y={cy + 20} />
      <text className="lp-ws-t" x="470" y={cy - 26} textAnchor="middle">{labels[4]}</text>
    </svg>
  );
}

/* labels: [sudut, SRTM, kontur, tapak, datum] */
function TerrainFig({ labels }) {
  const x1 = 40;
  const y1 = 168;
  const x2 = 520;
  const y2 = 132;
  const ang = Math.atan2(y1 - y2, x2 - x1);
  const r = 96;
  const ax = x1 + r * Math.cos(ang);
  const ay = y1 - r * Math.sin(ang);
  const hx = 360;
  const hy = y1 - (y1 - y2) * ((hx - x1) / (x2 - x1));
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid meet">
      <g className="lp-ws-contour" fill="none" stroke="var(--hue)" strokeLinecap="round">
        <path d="M-20 60 C80 30 160 78 260 50 S440 20 580 44" strokeWidth="1" strokeOpacity="0.22" />
        <path d="M-20 84 C80 54 160 100 260 72 S440 44 580 66" strokeWidth="1" strokeOpacity="0.3" />
        <path d="M-20 108 C80 80 160 122 260 96 S440 68 580 90" strokeWidth="1" strokeOpacity="0.18" />
      </g>
      <text className="lp-ws-t" x="520" y="30" textAnchor="end">{labels[2]}</text>

      {/* profil lereng */}
      <path d={`M${x1} ${y1} L${x2} ${y2} V210 H${x1} Z`} fill="var(--lp-taupe)" fillOpacity="0.12" />
      <line
        className="lp-ws-draw"
        pathLength="1"
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--lp-taupe)"
        strokeWidth="1.4"
      />
      <line x1={x1} y1={y1} x2={x2} y2={y1} stroke="var(--hue)" strokeWidth="1" strokeDasharray="6 5" strokeOpacity="0.7" />
      <text className="lp-ws-t" x={x2} y={y1 + 14} textAnchor="end">{labels[4]}</text>

      {/* busur sudut */}
      <path d={`M${x1 + r} ${y1} A${r} ${r} 0 0 0 ${ax} ${ay}`} fill="none" stroke="var(--hue)" strokeWidth="1.2" />
      <text className="lp-ws-t lp-ws-t--hue lp-ws-t--big" x={x1 + r + 8} y={y1 - 6}>{labels[0]}</text>
      <text className="lp-ws-t" x={x1} y="200">{labels[1]}</text>

      <House x={hx} y={hy} />
      <text className="lp-ws-t" x={hx} y={hy - 46} textAnchor="middle">{labels[3]}</text>
    </svg>
  );
}

const FIGS = {
  seismic: SeismicFig,
  flood: FloodFig,
  liquefaction: LiquefactionFig,
  volcanic: VolcanicFig,
  terrain: TerrainFig,
};

export default function HazardFigure({ variant, labels }) {
  const Fig = FIGS[variant] || SeismicFig;
  return <Fig labels={Array.isArray(labels) ? labels : []} />;
}
