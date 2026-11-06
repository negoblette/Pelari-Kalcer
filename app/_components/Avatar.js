const PALETTES = [
  { bg: "#1e3bff", face: "#f4f1e8", accent: "#ff5a1f", ink: "#15161a" },
  { bg: "#ff5a1f", face: "#f4f1e8", accent: "#1e3bff", ink: "#15161a" },
  { bg: "#ffd400", face: "#15161a", accent: "#ff5a1f", ink: "#f4f1e8" },
  { bg: "#15161a", face: "#ffd400", accent: "#ff5a1f", ink: "#15161a" },
  { bg: "#f4f1e8", face: "#1e3bff", accent: "#ffd400", ink: "#f4f1e8" },
  { bg: "#1e3bff", face: "#ffd400", accent: "#f4f1e8", ink: "#15161a" },
];

function Eyes({ color, y = 30, gap = 10, r = 3 }) {
  return (
    <>
      <circle cx={32 - gap} cy={y} r={r} fill={color} />
      <circle cx={32 + gap} cy={y} r={r} fill={color} />
    </>
  );
}

const ANIMALS = [
  {
    id: "kucing",
    label: "Kucing",
    draw: ({ face, accent, ink }) => (
      <>
        <path d="M13 28 L13 8 L28 19 Z M51 28 L51 8 L36 19 Z" fill={face} />
        <rect x="12" y="17" width="40" height="36" rx="12" fill={face} />
        <Eyes color={ink} y={32} />
        <path d="M28 39 h8 l-4 5 z" fill={accent} />
        <path d="M6 37 h12 M6 44 h12 M46 37 h12 M46 44 h12" stroke={face} strokeWidth="2.5" />
      </>
    ),
  },
  {
    id: "beruang",
    label: "Beruang",
    draw: ({ face, accent, ink }) => (
      <>
        <circle cx="16" cy="16" r="9" fill={face} />
        <circle cx="48" cy="16" r="9" fill={face} />
        <circle cx="32" cy="34" r="22" fill={face} />
        <Eyes color={ink} y={29} />
        <ellipse cx="32" cy="41" rx="10" ry="8" fill={accent} />
        <circle cx="32" cy="38" r="3" fill={ink} />
      </>
    ),
  },
  {
    id: "rubah",
    label: "Rubah",
    draw: ({ face, accent, ink }) => (
      <>
        <path d="M8 8 L24 22 L40 22 L56 8 L56 30 L32 58 L8 30 Z" fill={face} />
        <path d="M8 30 L32 58 L32 40 Z M56 30 L32 58 L32 40 Z" fill={accent} />
        <Eyes color={ink} y={30} gap={11} />
        <circle cx="32" cy="53" r="3.5" fill={ink} />
      </>
    ),
  },
  {
    id: "kelinci",
    label: "Kelinci",
    draw: ({ face, accent, ink }) => (
      <>
        <rect x="16" y="3" width="11" height="32" rx="5.5" fill={face} />
        <rect x="37" y="3" width="11" height="32" rx="5.5" fill={face} />
        <rect x="19.5" y="9" width="4" height="20" rx="2" fill={accent} />
        <rect x="40.5" y="9" width="4" height="20" rx="2" fill={accent} />
        <circle cx="32" cy="41" r="18" fill={face} />
        <Eyes color={ink} y={38} gap={8} />
        <path d="M28 44 h8 l-4 4 z" fill={accent} />
      </>
    ),
  },
  {
    id: "panda",
    label: "Panda",
    draw: ({ face, accent, ink }) => (
      <>
        <circle cx="15" cy="17" r="8" fill={accent} />
        <circle cx="49" cy="17" r="8" fill={accent} />
        <circle cx="32" cy="34" r="22" fill={face} />
        <ellipse cx="22" cy="31" rx="6" ry="7.5" fill={accent} />
        <ellipse cx="42" cy="31" rx="6" ry="7.5" fill={accent} />
        <Eyes color={face} y={31} r={2} />
        <path d="M28 41 h8 l-4 4 z" fill={ink} />
      </>
    ),
  },
  {
    id: "burung-hantu",
    label: "Burung hantu",
    draw: ({ face, accent, ink, bg }) => (
      <>
        <path d="M10 22 L10 8 L24 15 Q32 12 40 15 L54 8 L54 22 Q58 44 32 58 Q6 44 10 22 Z" fill={face} />
        <circle cx="22" cy="27" r="10" fill={bg} />
        <circle cx="42" cy="27" r="10" fill={bg} />
        <circle cx="22" cy="27" r="4.5" fill={accent} />
        <circle cx="42" cy="27" r="4.5" fill={accent} />
        <path d="M27 37 h10 l-5 8 z" fill={accent} />
        <path d="M20 49 h24" stroke={ink} strokeWidth="2.5" strokeDasharray="3 3" />
      </>
    ),
  },
  {
    id: "katak",
    label: "Katak",
    draw: ({ face, accent, ink }) => (
      <>
        <circle cx="18" cy="17" r="10" fill={face} />
        <circle cx="46" cy="17" r="10" fill={face} />
        <rect x="7" y="20" width="50" height="34" rx="16" fill={face} />
        <circle cx="18" cy="16" r="4" fill={ink} />
        <circle cx="46" cy="16" r="4" fill={ink} />
        <path d="M17 39 Q32 50 47 39" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "anjing",
    label: "Anjing",
    draw: ({ face, accent, ink }) => (
      <>
        <rect x="14" y="11" width="36" height="42" rx="14" fill={face} />
        <path d="M14 15 Q2 16 6 39 Q13 40 16 31 Z M50 15 Q62 16 58 39 Q51 40 48 31 Z" fill={accent} />
        <Eyes color={ink} y={28} gap={9} />
        <ellipse cx="32" cy="41" rx="6" ry="4.5" fill={ink} />
        <path d="M32 45 v4" stroke={ink} strokeWidth="2.5" />
      </>
    ),
  },
  {
    id: "harimau",
    label: "Harimau",
    draw: ({ face, accent, ink }) => (
      <>
        <circle cx="15" cy="15" r="7" fill={face} />
        <circle cx="49" cy="15" r="7" fill={face} />
        <rect x="9" y="11" width="46" height="44" rx="15" fill={face} />
        <path d="M32 11 v11 M24 11 l2 8 M40 11 l-2 8 M9 33 h9 M9 41 h8 M55 33 h-9 M55 41 h-8" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        <Eyes color={ink} y={31} gap={9} />
        <path d="M27 40 h10 l-5 5 z" fill={ink} />
      </>
    ),
  },
  {
    id: "koala",
    label: "Koala",
    draw: ({ face, accent, ink }) => (
      <>
        <circle cx="13" cy="24" r="12" fill={face} />
        <circle cx="51" cy="24" r="12" fill={face} />
        <circle cx="13" cy="24" r="6" fill={accent} />
        <circle cx="51" cy="24" r="6" fill={accent} />
        <circle cx="32" cy="35" r="20" fill={face} />
        <Eyes color={ink} y={30} gap={9} />
        <rect x="27" y="31" width="10" height="15" rx="5" fill={ink} />
      </>
    ),
  },
  {
    id: "penguin",
    label: "Penguin",
    draw: ({ bg, face, accent, ink }) => (
      <>
        <rect
          x="11"
          y="7"
          width="42"
          height="50"
          rx="21"
          fill={bg === "#15161a" || face === "#15161a" ? "#f4f1e8" : "#15161a"}
        />
        <rect x="18" y="17" width="28" height="40" rx="14" fill={face} />
        <Eyes color={ink} y={29} gap={7} />
        <path d="M26 34 h12 l-6 6 z" fill={accent} />
      </>
    ),
  },
  {
    id: "babi",
    label: "Babi",
    draw: ({ face, accent, ink }) => (
      <>
        <path d="M12 26 L9 11 L25 15 Z M52 26 L55 11 L39 15 Z" fill={face} />
        <circle cx="32" cy="34" r="22" fill={face} />
        <Eyes color={ink} y={28} gap={10} />
        <ellipse cx="32" cy="40" rx="11" ry="8" fill={accent} />
        <circle cx="28" cy="40" r="2" fill={ink} />
        <circle cx="36" cy="40" r="2" fill={ink} />
      </>
    ),
  },
];

export const AVATAR_COUNT = ANIMALS.length * PALETTES.length;

export function avatarParts(seed) {
  const value = Math.abs(Number(seed) || 0);
  return {
    animal: ANIMALS[value % ANIMALS.length],
    palette: PALETTES[Math.floor(value / ANIMALS.length) % PALETTES.length],
  };
}

export function randomAvatar(current) {
  let next = current;
  while (next === current) next = Math.floor(Math.random() * 1000000);
  return next;
}

export default function Avatar({ seed, size = 48, className = "" }) {
  const { animal, palette } = avatarParts(seed);

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={`Avatar ${animal.label}`}
      className={`shrink-0 ${className}`}
    >
      <rect width="64" height="64" fill={palette.bg} />
      {animal.draw(palette)}
    </svg>
  );
}
