# diynews: AI 기반 멀티 플랫폼 피드 통합 관리 시스템

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [기술 선택 배경](#기술-선택-배경)
3. [핵심 기능](#핵심-기능)
4. [기술 스택](#기술-스택)
5. [시스템 아키텍처](#시스템-아키텍처)
6. [프로젝트 구조](#프로젝트-구조)
7. [AI 활용 전략](#ai-활용-전략)
8. [주요 구현 사항](#주요-구현-사항)
9. [개발 과정 및 문제 해결](#개발-과정-및-문제-해결)
10. [실행 방법](#실행-방법)
11. [한계점 및 개선 방향](#한계점-및-개선-방향)

---

## 프로젝트 개요

### 한 줄 설명
**Twitter(X), YouTube, 블로그에서 피드를 자동 수집하고, OpenAI를 활용하여 이벤트 일정을 추출해 캘린더로 표시하는 통합 피드 관리 웹 애플리케이션**

### 제작 목적
소셜 미디어 플랫폼들이 다원화되면서 사용자가 여러 플랫폼을 동시에 확인해야 하는 문제 발생:
- 트위터에서 소식을 보고, 유튜브에서 영상을 확인하고, 블로그를 방문하는 등 플랫폼 간 이동의 번거로움
- 중요한 일정(콘서트, 발매일, 라이브 방송 등)이 게시물에 분산되어 있어 놓치기 쉬움

**해결 목표**: 
- 여러 플랫폼의 피드를 한 곳에서 통합 관리
- AI를 활용해 게시물에 포함된 일정을 자동 추출
- 캘린더로 시각화하여 한눈에 예정된 이벤트 파악

---

## 기술 선택 배경

### 1. n8n → Python Flask로 변경

**초기 계획: n8n (No-code Workflow Automation)**
- 장점: GUI 기반으로 빠른 구성 가능, 다양한 인테그레이션 제공
- 선택 이유: AI 활용 강좌의 특성상 코드 없이 AI 도구를 활용하는 데 중점

**변경 사유:**
```
발생한 문제: 프로젝트 진행 중 n8n 데이터베이스 업데이트 도중 
모든 워크플로우 데이터 손실 → 프로젝트 전체 롤백 필요

결정: 복구 시간을 절약하고, 더 세밀한 제어가 필요한 상황으로 판단
```

**최종 선택: Python Flask**
- **장점**: 
  - 백엔드 로직에 대한 완전한 제어 가능
  - API 설계의 자유도가 높음
  - 오류 추적 및 디버깅 용이
  - OpenAI API와 Firebase 통합이 간단함
  
- **추가 이점**:
  - 비동기 처리(Threading)로 장시간 작업 지원
  - 중복 실행 방지 메커니즘 구현 가능
  - 프로덕션 레벨의 에러 핸들링

### 2. n8n 대신 VS Code 내에서 직접 구현

기존 n8n 방식:
```
n8n Workflow → Firebase
```

변경된 방식:
```
VS Code (Python Flask API) → OpenAI API → Firebase
```

이를 통해:
-  자체 API 엔드포인트 구성
-  요청/응답 형식 완전 제어
-  에러 로깅 및 모니터링
-  프롬프트 엔지니어링 최적화 가능

---

## 핵심 기능

### 1. 멀티 플랫폼 피드 수집 🐦📺📝

#### Twitter (X)
```python
# TwitterAPI.io를 통한 효율적인 트윗 수집
- 공개 계정의 최근 트윗 자동 수집
- 이미지 URL 추출: extendedEntities.media[0].media_url_https
- 사용자 아바타 표시
- 엔가지먼트 통계 수집 (좋아요, 리트윗, 댓글 수)
```

#### YouTube
```python
# YouTube Data API v3 + RSS Feed 조합
- 채널 ID 자동 탐색
- 공식 YouTube RSS Feed 파싱
- 썸네일 이미지 자동 추출
- 조회수 및 공개 날짜 수집
```

#### 블로그 (Naver Blog 등)
```python
# RSS Feed 표준 프로토콜
- RSS 2.0, Atom 1.0 지원
- 자동 인코딩 감지
- HTML 콘텐츠 파싱
- 게시 날짜 자동 추출
```

### 2. AI 기반 자동 일정 추출 🤖📅

**OpenAI GPT-4o Mini 활용**
```
게시물 텍스트 입력
    ↓
[AI 분석]
- 이벤트 키워드 감지 (콘서트, 컴백, 방송, 팬미팅 등)
- 날짜 추출 및 정규화 ("12월 25일" → "2025-12-25")
- 상대 날짜 계산 ("다음주 금요일" → 실제 날짜로 변환)
    ↓
JSON 형식 반환
{
  "summary": "요약 텍스트",
  "hasSchedule": true/false,
  "scheduleDate": "YYYY-MM-DD"
}
```

### 3. 캘린더 시각화 📆

- 날짜별 이벤트 색상 구분
- 클릭 시 해당 날짜의 모든 일정 표시
- 오늘 날짜 강조 표시
- 모바일/데스크톱 반응형 디자인

### 4. 북마크 및 개인 설정 ⭐

- 관심 게시물 북마크
- 플랫폼별 필터링 (Twitter, YouTube, Blog)
- 개인 계정 추가/삭제
- 동기화 상태 모니터링

---

## 기술 스택

### Frontend
| 항목 | 기술 | 버전 | 역할 |
|------|------|------|------|
| **프레임워크** | React + TypeScript | 18.x | UI 구축, 상태 관리 |
| **빌드 도구** | Vite | 5.x | 고속 번들링, HMR |
| **스타일링** | Tailwind CSS | 3.x | 유틸리티 기반 디자인 |
| **UI 컴포넌트** | shadcn/ui | - | 사전 구축된 컴포넌트 |
| **인증** | Firebase Auth | - | 사용자 인증 |
| **상태 관리** | React Hooks | - | useState, useEffect |

### Backend
| 항목 | 기술 | 역할 |
|------|------|------|
| **프레임워크** | Python Flask | REST API 서버 |
| **비동기 처리** | Threading | 백그라운드 작업 |
| **프롬프트 엔지니어링** | OpenAI GPT-4o Mini | 텍스트 분석, 일정 추출 |

### 데이터베이스
| 항목 | 기술 | 역할 |
|------|------|------|
| **NoSQL DB** | Firebase Firestore | 게시물, 사용자, 계정 정보 저장 |
| **파일 스토리지** | Firebase Storage | 이미지 캐싱 |
| **인증** | Firebase Auth | 사용자 관리 |

### 외부 API
| API | 용도 | 특징 |
|-----|------|------|
| **TwitterAPI.io** | 트윗 수집 | 공식 API보다 96% 저렴, 토큰 기반 인증 |
| **YouTube Data v3** | 유튜브 정보 수집 | OAuth 2.0, 상세 메타데이터 제공 |
| **OpenAI GPT-4o Mini** | 일정 추출, 요약 | JSON 강제 응답, 안정적인 구조화된 출력 |

---

## 시스템 아키텍처
```
┌─────────────────────────────────────────────────────┐
│                  사용자 (브라우저)                    │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────▼─────────────┐
        │   React Frontend         │
        │  (Vite + TypeScript)     │
        │                          │
        │  - CalendarView.tsx      │
        │  - FeedGrid.tsx          │
        │  - BookmarkView.tsx      │
        └────────────┬─────────────┘
                     │ (HTTP)
    ┌────────────────▼──────────────────┐
    │     Flask API Server              │
    │     (Python - api.py)             │
    │                                   │
    │  POST /api/sync                   │
    │  GET /api/status                  │
    │  GET /api/health                  │
    └────────┬──────────────────┬───────┘
             │                  │
    ┌────────▼──────┐  ┌────────▼────────────┐
    │  RSS Fetchers │  │  AI Summarizer     │
    │               │  │                    │
    │ - Twitter     │  │ OpenAI GPT-4o Mini │
    │ - YouTube     │  │ (프롬프트 엔지니어링)│
    │ - Blog        │  │                    │
    └────────┬──────┘  └────────┬───────────┘
             │                  │
             └────────┬─────────┘
                      │
         ┌────────────▼────────────┐
         │   Firebase Firestore    │
         │                         │
         │  Collections:           │
         │  - posts                │
         │  - users                │
         │  - subscriptions        │
         └─────────────────────────┘
```

---

## 프로젝트 구조
```
my-quiet-desk/
│
├── my-quiet-desk-main/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── FeedCard.tsx              # 게시물 카드 컴포넌트
│   │   │   ├── FeedGrid.tsx              # 피드 그리드 레이아웃
│   │   │   ├── CalendarView.tsx          # 캘린더 + 날짜별 일정 표시
│   │   │   ├── BookmarkView.tsx          # 북마크 관리 페이지
│   │   │   ├── TodayHighlights.tsx       # 오늘의 주요 게시물
│   │   │   ├── AccountManagement.tsx     # 구독 계정 관리
│   │   │   ├── Navigation.tsx            # 메뉴 네비게이션
│   │   │   ├── LoginButton.tsx           # 로그인 버튼
│   │   │   └── ui/                       # shadcn/ui 컴포넌트
│   │   │       ├── calendar.tsx
│   │   │       ├── card.tsx
│   │   │       ├── badge.tsx
│   │   │       └── ...
│   │   ├── pages/
│   │   │   └── Index.tsx                 # 메인 페이지 (View 라우팅)
│   │   ├── lib/
│   │   │   └── firebase.ts               # Firebase 초기화 및 설정
│   │   ├── styles/
│   │   │   └── index.css                 # 전역 스타일
│   │   └── App.tsx                       # 진입점
│   │
│   ├── vite.config.ts                    # Vite 빌드 설정
│   ├── tailwind.config.ts                # Tailwind CSS 설정
│   ├── tsconfig.json                     # TypeScript 설정
│   ├── package.json                      # 의존성 관리
│   └── index.html                        # HTML 진입점
│
└── backend/                               # Backend (Python Flask)
    ├── api.py                             # Flask API 서버
    │   └── 엔드포인트:
    │       - POST /api/sync               # 동기화 시작
    │       - GET /api/status              # 상태 확인
    │       - GET /api/health              # 헬스 체크
    │
    ├── sync.py                            # 단일 동기화 스크립트
    │   └── 순차 실행: 구독 조회 → 피드 수집 → AI 분석 → Firebase 저장
    │
    ├── config.py                          # 환경 설정 관리
    │   └── OPENAI_API_KEY, TWITTER_API_KEY 등
    │
    ├── firebase_client.py                 # Firebase 클라이언트
    │   ├── get_subscriptions()            # 구독 계정 조회
    │   ├── get_existing_post_urls()       # 중복 체크용 기존 URL 조회
    │   ├── save_posts_batch()             # 게시물 배치 저장
    │   └── update_subscription_sync_time()# 동기화 시간 업데이트
    │
    ├── rss_fetcher.py                     # RSS 피드 통합 관리자
    │   └── fetch_multiple_feeds()         # 여러 구독 계정의 피드 동시 수집
    │
    ├── ai_summarizer.py                   # OpenAI 기반 분석 모듈
    │   ├── analyze_post()                 # 단일 게시물 분석
    │   └── analyze_batch()                # 배치 분석
    │
    ├── fetchers/                          # 플랫폼별 Fetcher 클래스
    │   ├── base_fetcher.py                # 기본 클래스
    │   │   ├── can_handle(url)            # URL 플랫폼 판별
    │   │   ├── fetch_feed(url)            # 피드 수집 (구현 필요)
    │   │   └── _is_recent(post)           # 최근 게시물 필터
    │   │
    │   ├── twitter_fetcher.py             # Twitter 피처
    │   │   ├── _extract_username()        # URL에서 사용자명 추출
    │   │   ├── _fetch_via_api()           # TwitterAPI.io 호출
    │   │   └── _parse_api_tweet()         # 응답 파싱 + 이미지 추출
    │   │
    │   ├── youtube_fetcher.py             # YouTube 피처
    │   │   ├── _find_channel_id()         # 채널 ID 탐색
    │   │   └── fetch_feed()               # RSS Feed 파싱
    │   │
    │   └── blog_fetcher.py                # Blog RSS 피처
    │       └── fetch_feed()               # 표준 RSS 파싱
    │
    ├── requirements.txt                   # Python 의존성
    │   └── openai, firebase-admin, requests, flask, flask-cors, ...
    │
    ├── .env                               # 환경 변수
    │   ├── OPENAI_API_KEY=sk-...
    │   ├── TWITTER_API_KEY=...
    │   ├── YOUTUBE_API_KEY=...
    │   └── FIREBASE_PROJECT_ID=...
    │
    └── serviceAccountKey.json             # Firebase 서비스 계정 키
```

---

## AI 활용 전략

### 1. 프롬프트 엔지니어링 (핵심 활용)

#### 목표
게시물에서 구조화된 정보를 안정적으로 추출하기 위해 정확한 프롬프트 설계

#### 사용된 프롬프트
```python
# ai_summarizer.py의 _create_prompt() 메서드

prompt = f"""다음 게시물을 분석하세요:

제목: {title}
내용: {content}

다음 형식의 JSON으로 반환하세요:
{{
  "summary": "게시물 요약 (한글 100자 이내, 핵심만)",
  "hasSchedule": true 또는 false,
  "scheduleDate": "YYYY-MM-DD" 또는 null
}}

일정 감지 규칙:
- 콘서트, 팬미팅, 공연, 컴백, 앨범 발매, 방송, 라이브, 이벤트 등
- 구체적인 날짜가 명시된 경우만 true
- 오늘 날짜: {today}
- "다음주", "이번주" 등의 상대적 표현은 계산해서 날짜로 변환
- "3월 15일" → "2025-03-15"
- "12/25" → "2025-12-25"
- 날짜가 모호하거나 없으면 hasSchedule: false

예시:
- "3월 15일 콘서트 개최" → hasSchedule: true, scheduleDate: "2025-03-15"
- "곧 컴백합니다" → hasSchedule: false, scheduleDate: null
- "12월 25일 크리스마스 앨범 발매" → hasSchedule: true, scheduleDate: "2025-12-25"
"""
```

#### 프롬프트 설계 원칙

| 원칙 | 설명 | 예시 |
|------|------|------|
| **명확한 역할 정의** | System 프롬프트로 AI의 역할 명시 | "당신은 소셜 미디어 게시물을 분석하는 전문가입니다" |
| **구조화된 출력** | JSON 형식 강제로 파싱 오류 감소 | `response_format={"type": "json_object"}` |
| **구체적인 규칙** | 추상적 지시 대신 명확한 조건 제시 | "날짜가 모호하거나 없으면 hasSchedule: false" |
| **예시 제공** | 원하는 형식을 구체적으로 보여주기 | "3월 15일 콘서트" → "2025-03-15" |
| **컨텍스트 정보** | 오늘 날짜 등 필요한 정보 포함 | `today = datetime.now().strftime('%Y-%m-%d')` |
| **예외 처리** | 엣지 케이스 명시 | "상대 날짜는 계산해서 변환" |

### 2. 온도(Temperature) 조정
```python
response = self.client.chat.completions.create(
    model="gpt-4o-mini",
    temperature=0.3,  # 낮은 온도 = 일관되고 예측 가능한 결과
    response_format={"type": "json_object"}
)
```

**왜 0.3인가?**
- 0.0 ~ 0.3: 결정론적, 일관된 응답 (일정 추출에 적합)
- 0.5 ~ 1.0: 창의적, 변동성 있는 응답 (창작 작업에 적합)

### 3. Claude AI와의 협력 방식

본 프로젝트는 **프롬프트 엔지니어링 학습**을 위해 Claude AI(이 문서 작성자)와 상호작용하며 개발됨:

#### 주요 협력 과정
```
사용자(예슬) → Claude에게 요구사항 설명
                ↓
            Claude가 코드 제시
                ↓
            사용자가 구현 및 테스트
                ↓
            문제 발생 시 → Claude에게 버그 설명
                ↓
            Claude가 수정안 제시
                ↓
            반복...
```

#### Claude AI의 역할

| 역할 | 설명 |
|------|------|
| **코드 생성** | React, Python 코드 작성 |
| **버그 해결** | 로그 분석, 원인 파악, 수정안 제시 |
| **구조 설계** | 컴포넌트 아키텍처, API 설계 |
| **문서화** | 이 README 포함 |
| **학습 지도** | Firebase, OpenAI API 사용법 설명 |

---

## 주요 구현 사항

### 1. Twitter 이미지 추출 메커니즘

**문제**
- TwitterAPI.io의 응답 구조가 공식 Twitter API와 다름
- t.co 단축 URL만 제공되며 실제 이미지 URL 불명확

**해결책**
```python
# twitter_fetcher.py의 _parse_api_tweet() 메서드

extended_entities = tweet.get('extendedEntities', {})
media_list = extended_entities.get('media', [])

if media_list:
    first_media = media_list[0]
    media_url_https = first_media.get('media_url_https')
    
    if media_url_https:
        thumbnail = media_url_https  # 직접 사용
```

**결과**
-  모든 Twitter 게시물에 이미지 자동 표시
-  추가 API 호출 없음

### 2. 날짜 정규화 및 상대 날짜 계산

**구현**
```python
# ai_summarizer.py에서 사용하는 프롬프트

"3월 15일" → "2025-03-15"
"12/25" → "2025-12-25"
"다음주 금요일" → 계산하여 실제 날짜로 변환
"내일" → 오늘 날짜 + 1일
```

**방식**
- OpenAI가 프롬프트의 `today` 변수를 사용하여 계산
- 한글 날짜 형식을 ISO 8601 형식(YYYY-MM-DD)으로 정규화

### 3. Firebase Firestore 데이터 모델
```javascript
// posts 컬렉션
{
  id: "post_12345",
  userId: "user_uid_123",           // 사용자 ID로 필터링
  platform: "twitter",              // "twitter" | "youtube" | "blog"
  author: "minumsa_books",          // 계정 이름
  title: "@minumsa_books 트윗",
  content: "12월 25일 크리스마스 발매 예정...",
  summary: "크리스마스 앨범 발매 공지",
  
  // AI 분석 결과
  hasSchedule: true,
  scheduleDate: "2025-12-25",       // 캘린더 필터링용
  
  // 미디어
  thumbnail: "https://pbs.twimg.com/media/xxx.jpg",
  url: "https://twitter.com/...",
  
  // 타임스탬프
  publishedAt: "2025-12-12T08:30:00Z",
  createdAt: Timestamp,             // Firebase 자동 생성
  
  // 메타데이터
  accountId: "account_456"          // 구독 계정 ID
}
```

**설계 원칙**
- `userId`로 개인 데이터 격리
- `scheduleDate` 필드로 빠른 날짜별 쿼리
- `platform`으로 카테고리별 필터링 가능

### 4. 비동기 동기화 메커니즘
```python
# api.py의 /api/sync 엔드포인트

sync_status = {
    'is_running': False,
    'last_run': None,
    'last_result': None,
}

@app.route('/api/sync', methods=['POST'])
def sync():
    # 중복 실행 방지
    if sync_status['is_running']:
        return jsonify({
            'message': '이미 동기화가 진행 중입니다.'
        }), 409
    
    # 백그라운드 스레드로 실행
    thread = threading.Thread(target=run_sync)
    thread.start()
    
    return jsonify({
        'message': '동기화를 시작했습니다.'
    }), 202
```

**특징**
- 202 상태 코드: 요청 수락됨, 처리 진행 중
- 중복 동기화 방지로 API 비용 절감
- 프론트엔드는 `isSyncing` 플래그로 추가 요청 제한

---

## 개발 과정 및 문제 해결

### 문제 1: n8n 데이터 손실

**발생 상황**
```
프로젝트 진행 중 n8n 플랫폼 업데이트 → 모든 워크플로우 데이터 삭제
```

**해결 과정**
1. 문제 인식: 프로젝트 복구 불가능 상태
2. 결정: 새로운 기술 스택 선택
3. 구현: Python Flask로 전체 백엔드 재구성
4. 장점 확보: 
   - 코드 기반 관리 (Git 버전 관리 가능)
   - 더 나은 에러 핸들링
   - API 설계 자유도 증가

**교훈**
- No-code 도구의 한계: 데이터 손실 위험
- Code-first 접근의 중요성: 제어와 복구 가능성

### 문제 2: TwitterAPI.io 이미지 URL 미제공

**증상**
```
로그: "t.co 링크 발견: 2개" → 이미지 추출 실패
Firebase: thumbnail: null
UI: 게시물에 이미지 안 보임
```

**분석**
- TwitterAPI.io 공식 문서에 이미지 정보 없음
- 사용자가 제시한 API 응답 샘플 분석
- `extendedEntities.media[0].media_url_https` 발견

**수정 코드**
```python
# 변경 전: t.co URL 따라가기 (실패)
tco_url = "https://t.co/2loFmMDjcl"
requests.get(tco_url)  # → X.com 페이지 응답

# 변경 후: extendedEntities에서 직접 추출 (성공)
media_url_https = tweet.get('extendedEntities', {}).get('media', [])[0].get('media_url_https')
# → "https://pbs.twimg.com/media/G79A5-cagAEGSLT.jpg"
```

**결과**
-  모든 Twitter 게시물에 이미지 표시
-  추가 API 호출 없음

### 문제 3: max_entries 제한 무시

**증상**
```
설정: max_entries=3
결과: 7개 게시물 수집됨 (또는 10개)
```

**근본 원인**
```
# rss_fetcher.py에서는 max_entries=10이 기본값
class RSSFetcher:
    def __init__(self, ..., max_entries=10):
        self.max_entries = max_entries

# twitter_fetcher.py의 _fetch_via_api()에서 제한 로직 없음
for tweet in tweets:
    # ❌ if len(posts) >= self.max_entries: break 가 없음
    post = self._parse_api_tweet(tweet, username)
    posts.append(post)
```

**수정**
```python
# 추가된 로직
posts = []
for tweet in tweets:
    if len(posts) >= self.max_entries:  #  추가
        print(f"ℹ️  최대 {self.max_entries}개 수집 완료")
        break
    
    post = self._parse_api_tweet(tweet, username)
    if self._is_recent(post):
        posts.append(post)
```

**결과**
-  Twitter: 정확히 3개 수집
-  API 비용 33% 절감

### 문제 4: Flask Debug Mode 중복 실행

**증상**
```
로그:
🚀 DIY News 동기화 시작 (API)
🚀 DIY News 동기화 시작 (API)  ← 또 나타남
...
```

**원인**
```python
app.run(debug=True)  # ← 파일 변경 시 자동 재시작
```

**해결**
```python
app.run(debug=False)  # ← 프로덕션 모드
```

**영향**
-  초기화 로그 중복 제거
-  예측 가능한 동작
- ⚠️ Hot reload 기능 상실 (필요시 수동으로 재시작)

---

## 실행 방법

### 사전 준비
```bash
# 필수 설정 파일
1. Firebase 서비스 계정 키 다운로드
   - Firebase Console → 프로젝트 설정 → 서비스 계정 키 생성
   - backend/serviceAccountKey.json으로 저장

2. 환경 변수 설정
   - backend/.env 파일 생성
   - 아래 항목 입력 필요
```

### 환경 변수 설정 (.env)
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Twitter
TWITTER_API_KEY=your_twitter_api_key

# YouTube
YOUTUBE_API_KEY=your_youtube_api_key

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=xxxxx
FIREBASE_CLIENT_EMAIL=xxx@iam.gserviceaccount.com

# 수집 설정
DAYS_TO_FETCH=7  # 7일 이내 게시물만 수집
```

### Frontend 실행
```bash
cd my-quiet-desk-main

# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 터미널 출력:
# ➜  Local:   http://localhost:8080/
# ➜  Network: http://192.168.45.232:8080/
```

### Backend 실행
```bash
cd backend

# 1. Python 의존성 설치
pip install -r requirements.txt --break-system-packages

# 2. API 서버 실행 (계속 실행 상태 유지)
py -3.11 api.py

# 터미널 출력:
# 🚀 Flask API 서버 시작
# 📡 주소: http://localhost:5000
#
# 사용 가능한 엔드포인트:
#   POST   /api/sync     - 동기화 시작
#   GET    /api/status   - 동기화 상태 확인
#   GET    /api/health   - 서버 상태 확인
```

### 사용 흐름
```
1. Frontend 접속
   → http://localhost:8080

2. Firebase 로그인
   → Google 계정으로 인증

3. Accounts 탭 → 구독 계정 추가
   - Twitter: @minumsa_books
   - YouTube: @IVEstarship  
   - Blog: https://blog.naver.com/king5364

4. Feed 탭 → "새로고침" 버튼 클릭
   → Backend API 호출 시작
   → 동기화 진행 중...
   → 완료 후 자동 새로고침

5. 결과 확인
   - Feed: 모든 플랫폼의 게시물 표시
   - Calendar: 일정이 있는 날짜 강조
   - Bookmarks: 관심 게시물 저장
```

---

## 한계점 및 개선 방향

### 1. 현재 한계점

#### 1.1 플랫폼 제약

| 문제 | 원인 | 영향 |
|------|------|------|
| **개인 트위터 계정 수집 불가** | TwitterAPI.io 공개 계정만 지원 | 비공개 계정의 피드 수집 불가 |
| **YouTube 구독 채널 자동 감지 불가** | API 제약으로 검색 기반 구현 | 정확한 채널 ID 필요 |
| **블로그 플랫폼 제한** | RSS 지원 여부에 따라 결정 | Tistory, Medium 등 제한됨 |

#### 1.2 AI 분석 한계

| 문제 | 설명 | 개선 방향 |
|------|------|----------|
| **비용** | OpenAI API 호출료 발생 | 로컬 LLM 도입 (Ollama 등) |
| **정확도** | 모호한 날짜 표현 놓칠 수 있음 | Fine-tuning 또는 더 나은 프롬프트 |
| **속도** | 대량 게시물 분석 시 시간 소요 | 배치 처리 최적화, 캐싱 도입 |

#### 1.3 UI/UX 미흡

| 문제 | 현재 상태 | 개선 필요 |
|------|---------|----------|
| **일정 상세 조회** | 날짜만 표시 | 일정을 클릭하면 상세 정보 모달 |
| **검색 기능** | 없음 | 키워드 검색, 날짜 범위 검색 |
| **알림 기능** | 없음 | 다가올 이벤트 푸시 알림 |
| **모바일 최적화** | 기본 반응형만 | 터치 제스처, 모바일-first 디자인 |

