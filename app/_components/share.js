const WIDTH = 1080;
const HEIGHT = 1350;

function fitFont(ctx, text, weight, size, family, maxWidth) {
  let current = size;
  ctx.font = `${weight} ${current}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && current > 24) {
    current -= 4;
    ctx.font = `${weight} ${current}px ${family}`;
  }
}

function saveFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

// Phones get the share sheet, so the file can go straight to Instagram. Other devices download it.
async function deliver(blob, fileName) {
  const file = new File([blob], fileName, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  saveFile(blob, fileName);
}

export async function shareCard({ band, big, label, fields, footer, fileName }) {
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
  const cardY = 125;
  const cardW = 900;
  const cardH = 1100;
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
  ctx.fillText(band.toUpperCase(), cardX + cardW - 44, cardY + 44);

  ctx.fillStyle = biru;
  [
    [cardX + 40, cardY + 130],
    [cardX + cardW - 40, cardY + 130],
    [cardX + 40, cardY + cardH - 170],
    [cardX + cardW - 40, cardY + cardH - 170],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = aspal;
  fitFont(ctx, big, 900, 400, display, right - left);
  ctx.fillText(big, WIDTH / 2, cardY + 490);

  ctx.fillStyle = biru;
  fitFont(ctx, label.toUpperCase(), 800, 104, display, right - left);
  ctx.fillText(label.toUpperCase(), WIDTH / 2, cardY + 620);

  ctx.fillStyle = aspal;
  ctx.fillRect(left, cardY + 680, right - left, 5);

  const columnWidth = (right - left) / fields.length;
  ctx.textAlign = "left";
  fields.forEach(([title, value], index) => {
    const x = left + index * columnWidth;
    ctx.fillStyle = aspal;
    ctx.font = `400 26px ${mono}`;
    ctx.fillText(title.toUpperCase(), x, cardY + 745);
    fitFont(ctx, value.toUpperCase(), 800, 72, display, columnWidth - 20);
    ctx.fillText(value.toUpperCase(), x, cardY + 825);
  });

  ctx.strokeStyle = aspal;
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(cardX, cardY + cardH - 100);
  ctx.lineTo(cardX + cardW, cardY + cardH - 100);
  ctx.stroke();

  ctx.font = `400 28px ${mono}`;
  ctx.textAlign = "center";
  ctx.fillText(footer.toUpperCase(), WIDTH / 2, cardY + cardH - 42);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  await deliver(blob, fileName);
}

// A recurring calendar event works on every phone with no server behind it.
export function downloadStreakReminder() {
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pelari Kalcer//Tracker//ID",
    "BEGIN:VEVENT",
    "UID:pengingat-streak@pelari-kalcer",
    "DTSTAMP:20260101T000000Z",
    "DTSTART:20260103T120000Z",
    "DURATION:PT15M",
    "RRULE:FREQ=WEEKLY;BYDAY=SA",
    "SUMMARY:Cek streak lari minggu ini",
    "DESCRIPTION:Belum lari minggu ini? Masih ada waktu sampai Minggu.",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Cek streak lari minggu ini",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  saveFile(new Blob([calendar], { type: "text/calendar" }), "pengingat-streak.ics");
}
