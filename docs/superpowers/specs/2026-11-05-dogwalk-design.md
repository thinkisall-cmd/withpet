# 동네 강아지 산책 실시간 위치 공유 앱 설계

## 의도 및 배경

동네에서 강아지를 산책시키는 사람들이 지도 위에서 서로를 실시간으로 발견하는 앱.
친구 추가 없이 반경 내 산책 중인 사람 누구나 보임. 강아지 성격 정보를 미리 확인해서
예기치 않은 조우를 대비하는 것이 핵심 가치.

## 목표

- 구글 계정으로 로그인 (Supabase Auth + Google OAuth)
- 강아지 여러 마리 등록 가능, 산책 시작 시 오늘 나온 강아지 선택
- 산책 시작 시 지도에 내 마커 표시, 반경 1km 내 다른 산책러 마커 표시 (닉네임 라벨)
- 마커 탭 → 하단 시트: 강아지 사진, 견종, 성격 뱃지, 산책 N분째
- 내 걷는 동선이 폴리라인으로 그려짐
- 화면 꺼도 위치 추적 유지 (Capacitor 백그라운드 위치)
- 산책 종료 시 지도에서 사라지고, 동선 기록 저장
- 산책 기록은 기본 비공개, 내가 원하면 공유 링크 생성 가능

## 비목표

- 채팅, 같이 걷기 요청 등 소셜 기능 없음
- 산책 통계/분석 없음 (이번 버전)
- 반려동물 커뮤니티/게시판 없음

## 안티목표 (이러면 실패)

- 집 주소 노출: 산책 종료 후 live_locations 행 즉시 삭제
- 다른 사람이 내 과거 산책 기록을 무단으로 볼 수 있는 구조
- 웹만으로 배포 (백그라운드 위치 불가 → 동선 끊김)

## 제약

- 서버: 로컬 PC. 외부 접근은 Cloudflare Tunnel (`cloudflared tunnel`)
- 지도: 네이버 지도 API v3
- 인증: Supabase Auth (Google OAuth)
- 실시간: Supabase Realtime
- 이미지: Supabase Storage
- 앱: Next.js + Capacitor + @capacitor-community/background-geolocation (Android 우선)

## 화면 구성

### 1. 온보딩 (최초 1회)
- 구글 로그인
- 닉네임 입력
- 강아지 프로필 등록: 이름, 견종(자유 텍스트), 사진 업로드, 성격 선택
- 강아지 추가 버튼으로 여러 마리 등록 가능

### 2. 메인 지도 화면
- 네이버 지도 전체화면
- 하단: "산책 시작" 버튼
- 반경 1km 내 산책 중인 마커들 (닉네임 라벨, 강아지 발바닥 아이콘)
- 마커 탭 → 하단 시트: 강아지 사진, 견종, 성격 뱃지, 산책 N분째

### 3. 산책 시작 모달
- 오늘 나온 강아지 선택 (등록된 강아지 목록, 복수 선택 가능)
- 확인 → 산책 시작

### 4. 산책 중 화면
- 내 위치 마커 + 걷는 동선 폴리라인
- 하단: "산책 종료" 버튼 + 경과 시간
- 다른 사람 마커 실시간 업데이트

### 5. 내 산책 기록 화면
- 과거 산책 목록 (날짜, 시간, 함께한 강아지)
- 기록 탭 → 지도 위 폴리라인 + 세부 정보
- "공유 링크 생성" 버튼 → `share_token` 기반 URL 생성
- 공유 링크는 로그인 없이 읽기 전용으로 볼 수 있음

## 데이터 모델 (Supabase Postgres)

```sql
users
  id uuid PK  -- Supabase Auth uid
  nickname text NOT NULL
  created_at timestamptz DEFAULT now()

dogs
  id uuid PK DEFAULT gen_random_uuid()
  user_id uuid FK → users.id
  name text NOT NULL
  breed text
  temperament text CHECK (temperament IN ('gentle','normal','caution'))
  photo_url text
  created_at timestamptz DEFAULT now()

walk_sessions
  id uuid PK DEFAULT gen_random_uuid()
  user_id uuid FK → users.id
  started_at timestamptz NOT NULL
  ended_at timestamptz        -- null = 현재 산책 중
  route jsonb DEFAULT '[]'   -- [{lat, lng, time}, ...]
  share_token uuid UNIQUE    -- null = 비공개, 값 있으면 공유 링크 활성

walk_session_dogs           -- 산책에 참여한 강아지 (N:M)
  walk_session_id uuid FK → walk_sessions.id
  dog_id uuid FK → dogs.id
  PRIMARY KEY (walk_session_id, dog_id)

live_locations              -- 산책 중에만 존재, 종료 시 삭제
  user_id uuid PK FK → users.id
  lat float8 NOT NULL
  lng float8 NOT NULL
  updated_at timestamptz NOT NULL
  walk_session_id uuid FK → walk_sessions.id
```

## Row Level Security

| 테이블 | read | write |
|---|---|---|
| users | 모두 | 본인만 |
| dogs | 모두 | 본인만 |
| walk_sessions | 본인만 (공유 링크는 share_token으로 별도 API) | 본인만 |
| walk_session_dogs | 본인 세션 | 본인만 |
| live_locations | 모두 | 본인만 |

## 위치 업데이트 흐름

```
Capacitor Background Geolocation
  → 10m 이상 이동 or 10초마다 (5m 미만이면 클라이언트에서 스킵)
  → POST /api/location  { lat, lng, session_id }
  → live_locations upsert  (Supabase Realtime 트리거)
  → walk_sessions.route jsonb append
  → 다른 클라이언트: Realtime 수신 → 마커 이동
```

반경 필터링: 클라이언트에서 1km 초과 마커 숨김 (초기 소규모 운영 기준, 이후 PostGIS로 업그레이드).

## 공유 링크

- `share_token`이 null이면 비공개
- "공유 링크 생성" 클릭 시 `share_token = gen_random_uuid()` 업데이트
- 공유 URL: `https://[도메인]/walk/share/[share_token]`
- 해당 경로는 인증 없이 walk_session + route + 강아지 정보 읽기 가능
- "링크 삭제" 시 `share_token = null`로 되돌림

## 로컬 PC 서버 운영

```bash
# 터널 시작 (1회 설정 후 재사용)
cloudflared tunnel run dogwalk

# Next.js 서버
npm run start

# .env.local
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...       # 서버 API route 전용
```

## 보안 / 법적 사항

- 산책 종료 즉시 `live_locations` 행 삭제 (집 근처 좌표 노출 방지)
- 위치정보법: 서비스 가입 시 위치정보 수집·이용 동의 화면 필수
- 강아지 사진: Storage UUID 경로, public bucket

## 빌더 판단으로 처리한 사항

- Supabase Auth (Google OAuth) 사용 — Firebase 대신 단일 스택으로 통일
- 반경 필터: 클라이언트 1km (PostGIS는 추후)
- 위치 중복 제거: 5m 미만 이동 스킵 (클라이언트)
- 동선 저장: jsonb 배열 (PostGIS geometry는 추후)
- 성격 뱃지: 온순=초록, 보통=노랑, 주의필요=빨강
- Android 우선, iOS 추후
