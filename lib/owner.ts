/**
 * 이 브라우저가 운영자 기기라는 표시(localStorage). 관리자 화면을 열면 켜진다(app/admin/AdminClient.tsx).
 * VisitTracker가 이 값을 보면 방문 기록을 만들지 않는다 — 운영자가 공개 페이지를 둘러본 것이 고객 통계에 섞이지 않게.
 * 이용자 기기에는 저장되지 않는다(관리자 화면을 연 기기에만 생긴다).
 */
export const OWNER_KEY = 'mypet_owner';
