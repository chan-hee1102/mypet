// 서버 전용 입력 검증 (nodejs 런타임). Buffer 사용.

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB (디코드 후 기준)
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type ImageInput = { data: string; mediaType: string };

/** 업로드 이미지 검증: MIME 화이트리스트 + 크기 상한 + 매직바이트. */
export function validateImage(
  image: ImageInput | null,
): { ok: true } | { ok: false; error: string } {
  if (!image) return { ok: true }; // 사진은 선택사항
  if (typeof image.data !== 'string' || typeof image.mediaType !== 'string') {
    return { ok: false, error: '이미지 형식이 올바르지 않습니다.' };
  }
  if (!ALLOWED_MIME.includes(image.mediaType as (typeof ALLOWED_MIME)[number])) {
    return { ok: false, error: 'JPG, PNG, WebP 이미지만 업로드할 수 있어요.' };
  }
  let buf: Buffer;
  try {
    buf = Buffer.from(image.data, 'base64');
  } catch {
    return { ok: false, error: '이미지 데이터가 손상됐어요.' };
  }
  if (buf.length === 0) return { ok: false, error: '이미지가 비어 있어요.' };
  if (buf.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: '이미지는 5MB 이하만 업로드할 수 있어요. 더 작은 사진을 사용해 주세요.' };
  }
  if (!magicMatches(buf, image.mediaType)) {
    return { ok: false, error: '이미지 파일이 손상됐거나 형식이 맞지 않아요.' };
  }
  return { ok: true };
}

/** 파일 시그니처(매직바이트)가 선언된 MIME과 일치하는지 확인. */
function magicMatches(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/png')
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  if (mime === 'image/webp')
    return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

/** 문자열 길이 상한 (프롬프트 토큰 부풀리기 방지). */
export function clampText(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  if (!t) return undefined;
  return t.slice(0, max);
}
