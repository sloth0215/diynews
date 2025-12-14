# 🚀 DIY News Backend

RSS 피드를 수집하고 AI로 분석하여 Firebase에 저장하는 백엔드 시스템입니다.

## 📋 기능

- ✅ RSS 피드 자동 수집
- ✅ OpenAI를 통한 게시물 요약
- ✅ 이벤트 날짜 자동 추출 (콘서트, 팬미팅 등)
- ✅ 중복 게시물 자동 필터링
- ✅ Firebase Firestore 자동 저장

---

## 🔧 설치 방법

### 1️⃣ Python 패키지 설치

```bash
cd backend
pip install -r requirements.txt
```

또는

```bash
py -3.11 -m pip install -r requirements.txt
```

---

## ⚙️ 설정 방법

### 1️⃣ 환경변수 설정

`.env.example` 파일을 복사하여 `.env` 파일 생성:

```bash
copy .env.example .env
```

`.env` 파일을 열고 다음 내용 수정:

```env
# OpenAI API 키 (필수!)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx

# Firebase 설정 (기본값 사용 가능)
FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
FIREBASE_PROJECT_ID=diynews-4ab48

# 수집 기간 (기본: 7일)
DAYS_TO_FETCH=7
```

### 2️⃣ Firebase 서비스 계정 키 설정

1. [Firebase Console](https://console.firebase.google.com) 접속
2. **diynews-4ab48** 프로젝트 선택
3. ⚙️ **프로젝트 설정** → **서비스 계정** 탭
4. **새 비공개 키 생성** 클릭
5. 다운로드한 JSON 파일을 `backend/serviceAccountKey.json`으로 저장

---

## 🚀 실행 방법

### 기본 실행

```bash
python sync.py
```

또는

```bash
py -3.11 sync.py
```

### 실행 과정

1. ✅ 설정 검증
2. 📋 구독 목록 가져오기
3. 📡 RSS 피드 수집
4. 🔍 중복 게시물 확인
5. 🤖 AI 분석 (요약 + 일정 추출)
6. 💾 Firebase에 저장

---

## 📊 예상 결과

```
============================================================
🚀 DIY News 동기화 시작
⏰ 시작 시간: 2025-12-01 14:30:00
============================================================

[1/5] 설정 검증 중...
✅ 설정 검증 완료!

[2/5] 구독 목록 가져오는 중...
✅ Firebase 초기화 완료!
📋 3개 구독 계정 발견

[3/5] RSS 피드 수집 중...
📅 7일 이내 게시물 수집 (2025-11-24 이후)

📡 [아티스트_공식] 수집 시작...
🔍 피드 수집 중: https://twitter.com/artist/rss
✅ 5개 게시물 수집 완료

📊 총 3개 피드에서 15개 게시물 수집 완료

[4/5] 중복 게시물 확인 중...
🔍 기존 게시물 100개 확인
🆕 새 게시물: 10개 (중복 제외: 5개)

[5/5] AI 분석 중...
✅ OpenAI 클라이언트 초기화 완료!

[1/10] 분석 중...
🤖 AI 분석 중: 콘서트 개최 안내...
✅ 분석 완료: 일정 있음

...

📊 총 10개 게시물 분석 완료
📅 일정 있는 게시물: 3개

[6/6] Firebase에 저장 중...
✅ 저장 완료: 콘서트 개최 안내...
...
📊 총 10개 중 10개 저장 성공

============================================================
✅ 동기화 완료!
📥 수집: 15개
🆕 새 게시물: 10개
💾 저장: 10개
📅 일정 감지: 3개
⏰ 종료 시간: 2025-12-01 14:32:15
============================================================
```

---

## 🔍 문제 해결

### 에러: OPENAI_API_KEY가 설정되지 않았습니다

➡️ `.env` 파일에 OpenAI API 키를 올바르게 입력했는지 확인

### 에러: Firebase 서비스 계정 키 파일을 찾을 수 없습니다

➡️ `serviceAccountKey.json` 파일이 `backend` 폴더에 있는지 확인

### 구독 계정이 없습니다

➡️ 프론트엔드에서 먼저 계정을 추가하세요

### RSS 피드 파싱 에러

➡️ 일부 피드는 형식이 맞지 않을 수 있습니다. 무시하고 진행됩니다.

---

## 📝 파일 구조

```
backend/
├── sync.py              # 메인 실행 파일
├── config.py            # 설정 관리
├── firebase_client.py   # Firebase 연동
├── rss_fetcher.py       # RSS 수집
├── ai_summarizer.py     # AI 분석
├── requirements.txt     # 패키지 목록
├── .env                 # 환경변수
├── .env.example         # 환경변수 템플릿
└── serviceAccountKey.json  # Firebase 키 
```

---

## 🔒 보안 주의사항

**절대 공개하면 안 되는 파일:**
- `.env` - API 키 포함
- `serviceAccountKey.json` - Firebase 관리자 권한

**.gitignore에 추가 필수:**
```
.env
serviceAccountKey.json
__pycache__/
*.pyc
```

---

## 📈 향후 개선 계획

- [ ] 자동 스케줄링 (매시간 실행)
- [ ] Flask API로 전환 (프론트엔드 버튼 연동)
- [ ] 에러 알림 (이메일/슬랙)
- [ ] 통계 대시보드
- [ ] 다중 AI 모델 지원

