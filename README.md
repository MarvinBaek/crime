# 3년 후의 롤링페이퍼 — 진상규명 게임

## GitHub Pages로 배포하는 방법 (가장 쉬운 방법)

1. 이 폴더 전체를 새 GitHub 저장소에 업로드합니다.
   ```
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/내아이디/저장소이름.git
   git push -u origin main
   ```

2. **`vite.config.js` 파일을 여세요** — 아래처럼 `base` 값을 실제 저장소 이름으로 바꿔주세요.
   ```js
   base: "/저장소이름/",
   ```
   (이 값이 실제 저장소 이름과 다르면 화면이 빈 페이지로 나옵니다. 가장 흔한 실수라 꼭 확인하세요.)

3. GitHub 저장소 페이지에서 **Settings → Pages → Build and deployment → Source**를 **"GitHub Actions"**로 설정합니다.

4. `main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드 후 배포합니다.
   Actions 탭에서 진행 상황을 볼 수 있고, 완료되면 아래 주소에서 열립니다:
   ```
   https://내아이디.github.io/저장소이름/
   ```

5. 태블릿에서는 이 주소를 브라우저 홈 화면에 즐겨찾기로 추가해두면 앱처럼 바로 열 수 있습니다.

## 로컬에서 미리 확인하고 싶다면

```
npm install
npm run dev
```
브라우저에서 `http://localhost:5173` 접속.

## 파일 구조

- `src/App.jsx` — 게임 전체 로직 (퍼즐 데이터, 자물쇠, 인물 카드, 진상규명지 모두 여기 있습니다)
- `vite.config.js` — 배포 경로 설정 (저장소 이름 맞춰야 함)
- `.github/workflows/deploy.yml` — push하면 자동 배포되는 설정

## Firebase 설정 (팀별 진행상황 저장 + 스태프 전체 현황)

이 앱은 이제 Firebase Firestore에 팀별 진행상황과 진상규명지 제출 결과를 저장합니다.

### 1. Firebase 프로젝트 만들기
1. https://console.firebase.google.com 접속 → "프로젝트 추가"
2. 프로젝트 이름 아무거나 입력 (예: rollingpaper-game) → 생성

### 2. Firestore 데이터베이스 활성화
1. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**
2. **테스트 모드로 시작** 선택 (하루짜리 행사용이라 이걸로 충분합니다)
3. 리전은 아무거나 (asia-northeast3, 서울 추천)

### 3. 웹 앱 등록 및 설정값 복사
1. 프로젝트 개요 옆 **⚙️ → 프로젝트 설정**
2. 아래로 스크롤 → "내 앱" → **`</>` (웹)** 아이콘 클릭
3. 앱 닉네임 아무거나 입력 → 앱 등록
4. 나오는 `firebaseConfig` 객체를 통째로 복사

### 4. 이 프로젝트에 붙여넣기
`src/firebase.js` 파일을 열어서, 복사한 값으로 아래 부분을 바꿔주세요:
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

### 5. Firestore 보안 규칙 (중요)
Firestore Database → **규칙** 탭에서 아래로 바꿔주세요 (하루짜리 행사이고 로그인 기능이 없어서, teams 컬렉션만 열어두는 정도로 충분합니다):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /teams/{teamId} {
      allow read, write: if true;
    }
  }
}
```
⚠️ 이 규칙은 누구나 데이터를 읽고 쓸 수 있게 열어두는 것입니다. 행사 하루용이라 문제없지만, 계속 운영할 계획이면 나중에 더 제한해야 합니다.

### 6. 확인
설정 후 `npm run dev`로 로컬에서 팀을 선택하고 아무 자물쇠나 풀어보세요. 헤더에 "☁️ 저장됨"이 뜨면 정상 연동된 것입니다. Firebase 콘솔의 Firestore Database에서 `teams` 컬렉션에 문서가 생기는 것도 확인할 수 있습니다.

### 스태프 전체 현황 보기
헤더의 **"전체 현황"** 버튼을 누르면 4개 팀의 조각 수집 현황, 최종증거 확보 여부, 진상규명지 제출/점수를 실시간으로 볼 수 있습니다. 스태프용 태블릿이나 노트북에서 이 버튼을 눌러두면 진행 상황을 계속 지켜볼 수 있어요.

## 게임 콘텐츠 수정하고 싶을 때

`src/App.jsx` 안에서 대부분 상수로 분리되어 있습니다:
- `ARRIVAL_CODES` — 장소별 현장 도착 코드
- `CHARACTERS` — 인물 카드 정보
- `FINAL_QUESTIONS` — 최종 진상규명지 9문제
- 각 자물쇠 코드는 `DialLock target="..."`, `PatternLock target={[...]}`, `WordLock target="..."` 부분에서 확인/수정 가능합니다.
