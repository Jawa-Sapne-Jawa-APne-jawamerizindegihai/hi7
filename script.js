const upload = document.getElementById("upload");
const output = document.getElementById("output");
const mode = document.getElementById("mode");
const customText = document.getElementById("customText");

let originalCanvas = document.createElement("canvas");
let ctx = originalCanvas.getContext("2d");
let emojiList = [];

// load JSON
fetch("emojiColors.json")
  .then(res => res.json())
  .then(data => {
    emojiList = data;
  });

// find closest emoji
function closestEmoji(r,g,b){
  let best = null;
  let bestDist = Infinity;

  emojiList.forEach(e => {
    let dr = r - e.rgb[0];
    let dg = g - e.rgb[1];
    let db = b - e.rgb[2];
    let dist = dr*dr + dg*dg + db*db;
    if (dist < bestDist){
      bestDist = dist;
      best = e.emoji;
    }
  });

  return best || "⬜";
}

function convertImage(){
  const file = upload.files[0];
  if (!file) return alert("Upload image");

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {

      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      ctx.drawImage(img,0,0);

      const blockSize = 8;
      let html = "";

      for(let y=0;y<img.height;y+=blockSize){
        for(let x=0;x<img.width;x+=blockSize){
          const d = ctx.getImageData(x,y,blockSize,blockSize).data;
          let r=0,g=0,b=0,count=0;

          for(let i=0;i<d.length;i+=4){
            if (d[i+3]===0) continue;
            r+=d[i]; g+=d[i+1]; b+=d[i+2]; count++;
          }

          if(count===0){
            html += " ";
            continue;
          }

          r/=count; g/=count; b/=count;

          if(mode.value==="emoji"){
            html += closestEmoji(r,g,b);
          } else {
            let txt = customText.value || "#";
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

function downloadImage() {
  html2canvas(output).then(canvas => {
    const a = document.createElement("a");
    a.download = "emoji-mosaic.png";
    a.href = canvas.toDataURL();
    a.click();
  });
}
