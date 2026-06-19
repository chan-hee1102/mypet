// 브라우저 전용. 업로드 전에 사진을 캔버스로 리사이즈 + JPEG 재인코딩해
// 페이로드/토큰/메모리를 줄이고 서버 5MB 상한에 안전하게 맞춘다.

export type ClientImage = { data: string; mediaType: string; preview: string };

export async function fileToImage(file: File, maxDim = 1536, quality = 0.85): Promise<ClientImage> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('파일을 읽을 수 없어요.'));
    r.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('이미지를 불러올 수 없어요.'));
    im.src = dataUrl;
  });

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const longest = Math.max(width, height);
  if (longest > maxDim) {
    const s = maxDim / longest;
    width = Math.round(width * s);
    height = Math.round(height * s);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이미지 처리에 실패했어요.');
  ctx.drawImage(img, 0, 0, width, height);

  const out = canvas.toDataURL('image/jpeg', quality);
  const comma = out.indexOf(',');
  return { data: out.slice(comma + 1), mediaType: 'image/jpeg', preview: out };
}
