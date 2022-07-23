export async function renderAndDownload({
  imageURL,
  height,
  width,
  color,
  text,
  fontFamily,
  fontSize,
  extraStrokeWidth,
  top,
  left,
  verticalStretch,
}: {
  imageURL: string;
  height: number;
  width: number;
  color: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  extraStrokeWidth: number;
  top: number;
  left: number;
  verticalStretch: number;
}) {
  const canvas = document.createElement('canvas');
  canvas.height = height;
  canvas.width = width;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('cannot get canvas 2d context');
  }
  let img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = imageURL;
  });
  ctx.drawImage(img, 0, 0, width, height);

  const maskCanvas = document.createElement('canvas');
  maskCanvas.height = height / verticalStretch;
  maskCanvas.width = width;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) {
    throw new Error('cannot get canvas 2d context for mask layer');
  }
  maskCtx.fillStyle = color;
  maskCtx.strokeStyle = color;
  maskCtx.lineWidth = fontSize * extraStrokeWidth * 0.08;
  maskCtx.rect(0, 0, width, height);
  maskCtx.fill();
  maskCtx.globalCompositeOperation = 'destination-out';
  maskCtx.font = `${fontSize}px "${fontFamily}"`;
  maskCtx.textAlign = 'left';
  maskCtx.textBaseline = 'top';
  maskCtx.fillText(text, left, top / verticalStretch);
  maskCtx.strokeText(text, left, top / verticalStretch);

  ctx.drawImage(maskCanvas, 0, 0, width, height);

  document.createElement('a');
  let blob: Blob;
  try {
    blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(blob => {
        if (blob !== null) {
          resolve(blob);
        } else {
          reject(new Error('toBlob returned null'));
        }
      })
    );
  } catch (e) {
    console.error(`error converting canvas to blob: ${e}`);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fuckified.png';
  a.addEventListener('click', () => {
    setTimeout(() => {
      URL.revokeObjectURL(url);
      freeCanvas(canvas);
      freeCanvas(maskCanvas);
    }, 1000);
  });
  a.click();
}

function freeCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 1, 1);
  }
}
