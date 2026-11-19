import fs from 'node:fs';
import path from 'node:path';

/**
 * 품종 사진 — 위키미디어 공용의 자유 라이선스 사진(CC0·퍼블릭 도메인·CC BY·CC BY-SA만, NC·ND 금지). 생성 이미지 아님(2026-11-19 사장님).
 * 파일은 public/breeds/*.webp, 목록·작가·라이선스는 lib/data/breed-images.json(품종 한글 이름이 키).
 * ⚠️ CC BY·BY-SA는 사진 곁에 작가·라이선스·원본 링크를 꼭 적는다(상업 사이트) — components/board/BreedStory.tsx BreedPhoto.
 * 품종 페이지는 빌드 때 정적으로 그려서 fs로 읽는다(목록 파일이 없으면 사진 없이 그린다).
 */
export type BreedImage = { src: string; w: number; h: number; file: string; author: string; license: string; licenseUrl?: string; sourceUrl: string };

let cache: Record<string, BreedImage> | null = null;

export function breedImageOf(name: string): BreedImage | null {
  if (!cache) {
    try {
      cache = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/data/breed-images.json'), 'utf8')) as Record<string, BreedImage>;
    } catch {
      cache = {};
    }
  }
  return cache[name] ?? null;
}
