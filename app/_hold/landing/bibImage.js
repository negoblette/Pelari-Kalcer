const WIDTH = 1080;
const HEIGHT = 1350;

function fitText(ctx, text, weight, size, family, maxWidth) {
  let current = size;
  ctx.font = `${weight} ${current}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && current > 24) {
    current -= 4;
    ctx.font = `${weight} ${current}px ${family}`;
  }
}

export async function downloadBibImage({ name, number, tier, distance, pace }) {
  const root = getComputedStyle(document.documentElement);
  const token = (key) => root.getPropertyValue(key).trim();
  const display = token("--font-big");
  const mono = token("--font-dm-mono");
  const [biru, kertas, oranye, aspal] = ["--biru", "--kertas", "--oranye", "--aspal"].map(token);

  await Promise.all([
    document.fonts.load(`900 100px ${display}`),
    document.fonts.load(`500 30px ${mono}`),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = biru;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const cardX = 90;
  const cardY = 110;
  const cardW = 900;
  const cardH = 1130;
  const left = cardX + 80;
  const right = cardX + cardW - 80;

  ctx.translate(WIDTH / 2, HEIGHT / 2);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.translate(-WIDTH / 2, -HEIGHT / 2);

  ctx.fillStyle = kertas;
  ctx.fillRect(cardX, cardY, cardW, cardH);

  ctx.fillStyle = oranye;
  ctx.fillRect(cardX, cardY, cardW, 86);
  ctx.fillStyle = aspal;
  ctx.textBaseline = "middle";
  ctx.font = `500 28px ${mono}`;
  ctx.textAlign = "left";
  ctx.fillText("PELARI KALCER", cardX + 44, cardY + 44);
  ctx.textAlign = "right";
  ctx.fillText("MINGGU PAGI ED.", cardX + cardW - 44, cardY + 44);

  ctx.fillStyle = biru;
  [
    [cardX + 40, cardY + 130],
    [cardX + cardW - 40, cardY + 130],
    [cardX + 40, cardY + cardH - 190],
    [cardX + cardW - 40, cardY + cardH - 190],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = aspal;
  fitText(ctx, number, 900, 440, display, right - left);
  ctx.fillText(number, WIDTH / 2, cardY + 500);

  const label = name.toUpperCase();
  ctx.fillStyle = biru;
  fitText(ctx, label, 800, 112, display, right - left);
  ctx.fillText(label, WIDTH / 2, cardY + 640);

  ctx.fillStyle = aspal;
  ctx.fillRect(left, cardY + 700, right - left, 5);

  const fields = [
    ["KATEGORI", tier, left],
    ["JARAK", distance, left + 420],
    ["PACE", pace, left + 580],
  ];
  ctx.textAlign = "left";
  fields.forEach(([title, value, x]) => {
    ctx.fillStyle = aspal;
    ctx.font = `400 26px ${mono}`;
    ctx.fillText(title, x, cardY + 760);
    ctx.font = `800 60px ${display}`;
    ctx.fillText(value.toUpperCase(), x, cardY + 830);
  });

  ctx.strokeStyle = aspal;
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(cardX, cardY + cardH - 100);
  ctx.lineTo(cardX + cardW, cardY + cardH - 100);
  ctx.stroke();

  ctx.font = `400 28px ${mono}`;
  ctx.fillText("KUPON SOBEK", cardX + 44, cardY + cardH - 42);
  ctx.textAlign = "right";
  ctx.fillText("1 ES KOPI SETELAH 2K", cardX + cardW - 44, cardY + cardH - 42);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bib-pelari-kalcer-${number}.png`;
  link.click();
  URL.revokeObjectURL(url);
}
