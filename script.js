const upload = document.getElementById("upload");
const output = document.getElementById("output");
const mode = document.getElementById("mode");
const customText = document.getElementById("customText");

let originalCanvas = document.createElement("canvas");
let ctx = originalCanvas.getContext("2d");

let emojiList = [];
let emojiReady = false;

// ===============================
// 1️⃣ Generate ALL emojis
// ===============================
function getAllEmojis() {
  const emojis = [];

  const ranges = [
    [0x1F600, 0x1F64F],
    [0x1F300, 0x1F5FF],
    [0x1F680, 0x1F6FF],
    [0x2600,  0x26FF],
    [0x2700,  0x27BF],
    [0x1F900, 0x1F9FF],
    [0x1FA00, 0x1FAFF]
  ];

  ranges.forEach(([start, end]) => {
    for (let i = start; i <= end; i++) {
      try {
        emojis.push(String.fromCodePoint(i));
      } catch {}
    }
  });

  return emojis;
}

// ===============================
// 2️⃣ Extract average color
// ===============================
function getEmojiAverageColor(emoji) {
  const size = 32;
  const canvas = document.createElement("canvas");
  const c = canvas.getContext("2d");

  canvas.width = size;
  canvas.height = size;

  c.font = "28px serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(emoji, size / 2, size / 2);

  const data = c.getImageData(0, 0, size, size).data;

  let r = 0, g = 0, b = 0, count = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  if (count === 0) return null;

  return [r / count, g / count, b / count];
}

// ===============================
// 3️⃣ Build emoji database
// ===============================
function buildEmojiDatabase() {
  const emojis = getAllEmojis();

  emojis.forEach(e => {
    const color = getEmojiAverageColor(e);
    if (color) {
      emojiList.push({
        emoji: e,
        rgb: color
      });
    }
  });

  emojiReady = true;
  console.log("Emoji DB Ready:", emojiList.length);
}

buildEmojiDatabase();

// ===============================
// 4️⃣ Better color distance
// ===============================
function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;

  return Math.sqrt(
    0.299 * dr * dr +
    0.587 * dg * dg +
    0.114 * db * db
  );
}

// ===============================
// 5️⃣ Find closest emoji
// ===============================
function closestEmoji(r, g, b) {
  let best = null;
  let bestDist = Infinity;

  for (let i = 0; i < emojiList.length; i++) {
    const e = emojiList[i];
    const dist = colorDistance(
      r, g, b,
      e.rgb[0], e.rgb[1], e.rgb[2]
    );

    if (dist < bestDist) {
      bestDist = dist;
      best = e.emoji;
    }
  }

  return best || "⬜";
}

// ===============================
// 6️⃣ Convert Image
// ===============================
function convertImage() {

  if (!emojiReady) {
    alert("Emoji database still loading...");
    return;
  }

  const file = upload.files[0];
  if (!file) return alert("Upload image first");

  const reader = new FileReader();

  reader.onload = e => {
    const img = new Image();

    img.onload = () => {

      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const blockSize = 8; // change for detail
      let html = "";

      for (let y = 0; y < img.height; y += blockSize) {
        for (let x = 0; x < img.width; x += blockSize) {

          const data = ctx.getImageData(x, y, blockSize, blockSize).data;

          let r = 0, g = 0, b = 0, count = 0;

          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }

          if (count === 0) {
            html += " ";
            continue;
          }

          r /= count;
          g /= count;
          b /= count;

          if (mode.value === "emoji") {
            html += closestEmoji(r, g, b);
          } else {
            const txt = customText.value || "#";
            html += `<span style="color:rgb(${r},${g},${b})">${txt}</span>`;
          }
        }
        html += "\n";
      }

      output.innerHTML = html;
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
}

// ===============================
// 7️⃣ Download
// ===============================
function downloadImage() {
  html2canvas(output).then(canvas => {
    const link = document.createElement("a");
    link.download = "emoji-mosaic.png";
    link.href = canvas.toDataURL();
    link.click();
  });
}
