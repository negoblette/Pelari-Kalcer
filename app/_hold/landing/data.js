export const SLOTS = [
  {
    id: "kepala",
    label: "Kepala",
    options: [
      { id: "topi", name: "Topi lari 5-panel", price: 350000, points: 15 },
      { id: "visor", name: "Visor", price: 220000, points: 12 },
      { id: "bandana", name: "Bandana", price: 60000, points: 8 },
      { id: "polos", name: "Polos aja", price: 0, points: 0 },
    ],
  },
  {
    id: "mata",
    label: "Mata",
    options: [
      { id: "shield", name: "Kacamata shield", price: 1800000, points: 25 },
      { id: "oval", name: "Kacamata oval retro", price: 450000, points: 18 },
      { id: "tanpa", name: "Silau juga gapapa", price: 0, points: 0 },
    ],
  },
  {
    id: "atasan",
    label: "Atasan",
    options: [
      { id: "singlet", name: "Singlet run club", price: 300000, points: 20 },
      { id: "boxy", name: "Tee boxy", price: 280000, points: 14 },
      { id: "funrun", name: "Kaos fun run 2019", price: 0, points: 6 },
    ],
  },
  {
    id: "bawahan",
    label: "Bawahan",
    options: [
      { id: "split", name: "Split shorts 3 inci", price: 600000, points: 22 },
      { id: "lima", name: "Shorts 5 inci", price: 350000, points: 12 },
      { id: "futsal", name: "Celana futsal", price: 0, points: 3 },
    ],
  },
  {
    id: "sepatu",
    label: "Sepatu",
    options: [
      { id: "carbon", name: "Carbon plate", price: 3800000, points: 25 },
      { id: "cushion", name: "Max cushion pastel", price: 2800000, points: 20 },
      { id: "lama", name: "Sepatu lama", price: 0, points: 4 },
    ],
  },
  {
    id: "bawaan",
    label: "Bawaan",
    options: [
      { id: "vest", name: "Running vest", price: 1200000, points: 18 },
      { id: "belt", name: "Belt lari", price: 250000, points: 8 },
      { id: "hp", name: "HP digenggam", price: 0, points: 2 },
    ],
  },
];

export const DEFAULT_FIT = {
  kepala: "bandana",
  mata: "oval",
  atasan: "funrun",
  bawahan: "lima",
  sepatu: "cushion",
  bawaan: "hp",
};

export const TIERS = [
  {
    min: 100,
    label: "Suhu Kalcer",
    note: "Fit-nya finish duluan, orangnya menyusul.",
  },
  {
    min: 65,
    label: "Kalcer Mapan",
    note: "Kudos aman. Jangan lupa lari juga.",
  },
  {
    min: 30,
    label: "Kalcer Pemula",
    note: "Bibit bagus. Kurang satu kacamata lagi.",
  },
  {
    min: 0,
    label: "Pelari Jujur",
    note: "Lari beneran. Belum ada yang notice.",
  },
];

export const DISTANCES = [
  { id: "5k", label: "5K", km: 5 },
  { id: "10k", label: "10K", km: 10 },
  { id: "hm", label: "21K", km: 21.1 },
  { id: "fm", label: "42K", km: 42.2 },
];

export const PACE_MIN = 210;
export const PACE_MAX = 600;

const PACE_NOTES = [
  { max: 240, note: "Ini bukan kalcer, ini atlet. Mulai sekarang kami panggil Kak." },
  { max: 300, note: "Cepat. Kudos datang tanpa diminta." },
  { max: 390, note: "Pace sehat. Masih bisa pamer, masih bisa napas." },
  { max: 480, note: "Pace ngobrol. Gosip run club lancar sampai finish." },
  { max: PACE_MAX, note: "Pace konten. Kamera belakang aman, tidak ada yang blur." },
];

export function paceNote(pace) {
  return PACE_NOTES.find((band) => pace <= band.max).note;
}

// Jarak dan garis rute adalah perkiraan untuk ilustrasi, bukan data GPS.
export const ROUTES = [
  {
    id: "gbk",
    name: "Ring Road GBK",
    area: "Senayan, Jakarta",
    km: 2.5,
    unit: "Per putaran",
    time: "05.30",
    vibe: "Tempat semua run club berpapasan dan pura-pura tidak saling lihat fit.",
    path: "M200 40 C300 40 350 100 350 150 C350 210 290 260 200 260 C110 260 50 210 50 150 C50 90 100 40 200 40 Z",
    start: { x: 200, y: 40, label: "Pintu masuk", anchor: "middle", dy: -14 },
    end: null,
  },
  {
    id: "cfd",
    name: "Sudirman–Thamrin",
    area: "Jakarta Pusat, Minggu pagi",
    km: 6.5,
    unit: "Sekali jalan",
    time: "06.00",
    vibe: "Catwalk terpanjang di Jakarta. Satu jalur untuk lari, sisanya untuk dilihat.",
    path: "M70 270 L150 205 C175 185 190 170 205 150 L240 105 C250 90 262 80 280 70 L330 35",
    start: { x: 70, y: 270, label: "Senayan", anchor: "start", dy: 0, dx: 14 },
    end: { x: 330, y: 35, label: "Monas", anchor: "end", dy: 4, dx: -14 },
  },
  {
    id: "bkt",
    name: "Banjir Kanal Timur",
    area: "Jakarta Timur",
    km: 10,
    unit: "Sekali jalan",
    time: "05.45",
    vibe: "Panjang, lurus, jujur. Tidak ada yang lihat, kecuali jam tanganmu.",
    path: "M40 60 C120 90 170 110 210 160 C240 200 300 230 365 245",
    start: { x: 40, y: 60, label: "Utara", anchor: "start", dy: -12, dx: 0 },
    end: { x: 365, y: 245, label: "Selatan", anchor: "end", dy: 26, dx: 0 },
  },
  {
    id: "bsd",
    name: "Green Office Park",
    area: "BSD, Tangerang Selatan",
    km: 3,
    unit: "Per putaran",
    time: "06.00",
    vibe: "Trotoar lebar, pohon rapi, dan kopi yang selalu dekat dari finish.",
    path: "M90 70 H300 Q330 70 330 100 V190 Q330 220 300 220 H190 Q160 220 140 240 L110 260 Q80 270 70 240 V90 Q70 70 90 70 Z",
    start: { x: 90, y: 70, label: "Start", anchor: "start", dy: -14, dx: 0 },
    end: null,
  },
];

export const TICKER_ITEMS = [
  "Pace 7:30 tetap pace",
  "Foto dulu, GPS belakangan",
  "Kopi setelah 2K",
  "Kudos adalah bahan bakar",
  "Run club dulu, teman kemudian",
  "Sepatu 3 juta, jarak 3 kilo",
  "Bangun 05.00 demi golden hour",
];

export function formatRupiah(value) {
  return `Rp ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function formatPace(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatDuration(seconds) {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  if (hours === 0) return `${minutes}:${rest}`;
  return `${hours}:${String(minutes).padStart(2, "0")}:${rest}`;
}

export function formatKm(km) {
  return String(Math.round(km * 10) / 10).replace(".", ",");
}

export function selectedItems(fit) {
  return SLOTS.map((slot) => ({
    slot,
    item: slot.options.find((option) => option.id === fit[slot.id]),
  }));
}

export function summarizeFit(fit) {
  const items = selectedItems(fit);
  const total = items.reduce((sum, { item }) => sum + item.price, 0);
  const score = items.reduce((sum, { item }) => sum + item.points, 0);
  return { total, score, tier: TIERS.find((tier) => score >= tier.min) };
}

export function bibNumber(name) {
  let hash = 7;
  for (const char of name.trim().toUpperCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) % 9000;
  }
  return String(hash + 1000);
}
