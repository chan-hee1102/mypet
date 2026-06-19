# 🐾 mypet — AI 반려동물 맞춤 케어

사진과 간단한 정보(이름·종류·품종·태어난 시기·성별 등)를 입력하면, AI(Claude)가
품종·나이에 맞는 **케어 카드**를 만들어 줍니다. 강아지·고양이 모두 지원.

## 케어 카드에 담기는 것
- 📷 사진 기반 품종·체형 추정
- 🧬 품종 특성·주의 질환
- ✂️ 그루밍 주의 (예: 폼피츠 같은 더블코트는 바짝 밀면 털이 안 자랄 수 있음)
- 🦮 운동·산책 가이드
- 🍽️ 음식 — 좋은 음식 / **절대 금지 독성식품(검증 데이터로 고정)**
- 📅 나이별 케어 · 🔁 목욕·산책·빗질 주기 · 🏥 병원 방문 권장 신호

## 안전 설계
독성 음식처럼 **틀리면 위험한 정보는 AI에게 맡기지 않고** `lib/petData.ts` 의 검증
데이터로 고정합니다. AI는 그 위에서 "이 아이 맞춤"만 생성합니다. 모든 결과에는
"수의사 진단을 대체하지 않음" 고지가 붙습니다.

## 실행 방법
```bash
# 1) 패키지 설치
npm install

# 2) API 키 설정 — .env.local.example 을 복사
copy .env.local.example .env.local   # (PowerShell/cmd)
#   그리고 .env.local 의 GEMINI_API_KEY 값을 채우세요.

# 3) 개발 서버 실행
npm run dev
#   → http://localhost:3000
```

`GEMINI_API_KEY` 는 https://aistudio.google.com/apikey 에서 발급합니다.

## 기술 스택
- Next.js 14 (App Router) · TypeScript
- Google Gen AI SDK — Gemini 3.1 Pro (Vision + 구조화 출력)

## 다음 단계 (MVP 이후)
- 로그인·여러 마리 저장 (Supabase)
- 목욕/산책/예방접종 **주기 알림**, 성장 기록
- 크레딧·구독 결제
