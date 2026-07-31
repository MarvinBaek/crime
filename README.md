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

## 게임 콘텐츠 수정하고 싶을 때

`src/App.jsx` 안에서 대부분 상수로 분리되어 있습니다:
- `ARRIVAL_CODES` — 장소별 현장 도착 코드
- `CHARACTERS` — 인물 카드 정보
- `FINAL_QUESTIONS` — 최종 진상규명지 9문제
- 각 자물쇠 코드는 `DialLock target="..."`, `PatternLock target={[...]}`, `WordLock target="..."` 부분에서 확인/수정 가능합니다.
