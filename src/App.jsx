import React, { useState, useEffect, useRef } from "react";
import {
    Lock, Unlock, CheckCircle2, ChevronUp, ChevronDown,
    Sparkles, KeyRound, ScrollText, Radio, MapPin, Users, ArrowRight, Smartphone, BookLock, Eye, Trash2
} from "lucide-react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot, collection, serverTimestamp } from "firebase/firestore";

/* ─────────────────────────────────────────
   토큰 (팔레트/타이포) — 오프닝 PPT와 동일 계열
   ───────────────────────────────────────── */
const C = {
    navy: "#241A12",
    panel: "#2E2116",
    card: "#3A2A1C",
    cardAlt: "#44311F",
    gold: "#CBA35A",
    cream: "#F2E8D8",
    muted: "#B4977A",
    good: "#8FBF7A",
    bad: "#D9776A",
    border: "#5A4530",
    borderSoft: "#4A3826",
};

const FONT = "'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
const FONT_CASE = "Georgia, 'Nanum Myeongjo', serif";
const PAPER = { bg: "#E8DDC2", text: "#2E2415", border: "#C4B48A", pin: "#8B3A2A" };

/* ─────────────────────────────────────────
   스토리 데이터 (문서 v6과 동일)
   ───────────────────────────────────────── */
const LOCATIONS = [
    { id: "sanctuary", name: "예배당", tag: "이름표 사건의 현장", icon: MapPin },
    { id: "room306", name: "306호실", tag: "옛 가방이 있는 곳", icon: MapPin },
    { id: "lobby2f", name: "2층 로비", tag: "누군가의 다이어리", icon: MapPin },
    { id: "lobby1f", name: "1층 로비", tag: "전체 개요와 기록들", icon: MapPin },
    { id: "broadcastDesk", name: "방송 책상", tag: "봉투가 발견된 곳", icon: Radio },
];

// 현장 도착 코드 — 스태프가 각 장소에서 팀에게 구두로 전달
const ARRIVAL_CODES = {
    sanctuary: "새이름",
    room306: "옛가방",
    lobby2f: "일기장",
    lobby1f: "문자함",
    broadcastDesk: "라디오",
};

const SANCTUARY_PEOPLE = ["정뭉환", "백지화", "시며수", "윤서궁", "최수잔"];

const BAG_SPOTS = [
    { id: "outer", label: "겉주머니", result: "구겨진 수련회 팜플렛이 나왔다. '2023년 여름 수련회'라고 적혀있다.", real: true },
    { id: "zip", label: "큰 지퍼칸", result: "텅 비어있다.", real: false },
    { id: "side", label: "옆 작은 지퍼칸", result: "먼지 쌓인 손전등. 건전지는 다 됐다.", real: false },
    { id: "pocket", label: "옷 주머니", result: "동전 몇 개랑 사탕 껍질뿐이다.", real: false },
    { id: "tag", label: "이름표 택", result: "'조 번호: 3조' 라고 적힌 낡은 택이다.", real: true },
    { id: "buckle", label: "버클 부분", result: "녹슨 버클뿐이다.", real: false },
    { id: "strap", label: "어깨끈 안쪽", result: "구겨진 종이 조각이 나왔다. \"…리 담당: 시_수\" 라고 적혀있는데 일부가 찢어져 알아보기 힘들다.", real: true },
    { id: "lining", label: "바닥 안감 틈", result: "낡은 편지봉투가 나왔다! 겉면에 '정뭉환'이라고 적혀있다. 봉투를 살짝 열어보니, 여러 사람이 짧은 메시지를 돌아가며 적어준 종이 한 장 — 롤링페이퍼다.", real: true },
];

const DIARY_CARDS = [
    { id: "U", text: "다들 정신없어 보인다. 분위기가 너무 가라앉았다. 웃긴 얘기라도 해서 풀어야겠다." },
    { id: "X", text: "아… 나 방금 무슨 말을 한 거지. 표정 봤어야 했는데. 근데 이제 와서 뭐라고 해." },
    { id: "Y", text: "집에 오는 버스 안. 문자를 썼다 지웠다만 반복한다. 손이 떨린다." },
    { id: "S", text: "청년부 단톡방에 뭉환이가 요즘 안 보인다는 얘기가 나왔다. 다들 대수롭지 않게 넘겼다." },
    { id: "W", text: "요즘도 가끔 뭉환이 생각난다. 그때 그 말이 계속 걸린다." },
    { id: "Z", text: "새 학년이 됐다. 반이 바뀌니 마음이 편해지려나 싶었는데, 아니었다." },
    { id: "V", text: "뭉환이가 온다는 소식을 들었다. 심장이 쿵 내려앉았다." },
    { id: "FAKE", text: "이번 여름엔 캠프 장소가 바뀐다고 한다. 새로운 곳이라 다들 기대된다." },
];

const CHAT_CARDS = [
    { id: "m1", time: "08:50", text: "선궁아… 지화가 내 이름 적힌 봉투 갖고 있는 거 봤어.", fake: false },
    { id: "m2", time: "08:52", text: "뭐? 언제?", fake: false },
    { id: "m3", time: "08:53", text: "아까 아침에, 방송실에서.", fake: false },
    { id: "m4", time: "09:15", text: "내가 좀 알아볼게. 걱정하지 마.", fake: false },
    { id: "m5", time: "09:30", text: "지화한테 아직 아무것도 못 물어봤어. 근데 뭔가 알아낸 거 같기도 하고…", fake: false },
];

const CIPHER_TEXT = "시찬내 견키장카블 촒디마다 래 다앙체 믈처닸처";
const CIPHER_ANSWER = "미안해 편지상자를 옮기다가 내 가방에 들어갔어";
const CONSONANTS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const TIER2_GATES = {
    broadcastDesk: {
        type: "text",
        requires: "WAKE",
        question: "예배당에서 확인한, 새벽 3시의 증언으로 알리바이가 확실했던 두 사람은? (쉼표로 구분)",
        check: (v) => v.replace(/\s/g, "").includes("정뭉환") && v.replace(/\s/g, "").includes("백지화"),
        reveal: "백지화의 목격담: \"어제 밤 야식 가지러 방송실 지나가다가 불 켜진 걸 보고 들어갔어요. 책상 위에 낯선 봉투가 있길래 열어봤죠. 누가 놓은 건지는 전혀 몰랐어요. 그래서 일단 서랍에 넣어뒀는데... 오늘 아침에 다시 한번 꺼내서 살펴보고 있었거든요. 근데 그때 갑자기 정뭉환이 들어오더니, 제 손에 있는 봉투를 보고는 아무 말도 없이 그냥 나가버렸어요. 왜 그러는지 진짜 모르겠어요.\"",
    },
    lobby1f: {
        type: "text",
        requires: "30",
        question: "방금 정리한 문자 기록은 총 몇 개였나?",
        check: (v) => v.replace(/\s/g, "").replace("개", "") === "5",
        reveal: "타임라인을 자세히 보니, 윤서궁이 답을 망설인 그 사이 무언가 더 있었을지도 모른다는 의심이 든다.",
    },
    lobby2f: {
        type: "scrambled",
        requires: "NOTE",
        reversedAnswer: "그 말은 진심이 아니었어",
        reveal: "최수잔 다이어리 뒷부분: \"그날 아침 내가 뭐라고 했더라… '설마 아무도 안 써서 없는 거 아니야??' 웃자고 던진 말이었는데. 그거 3년 동안 마음에 걸렸다. 그날 오후 집에 가는 버스에서 사과 카톡을 한참 썼다. 근데 보내려는 순간 망설이다가... 결국 못 보냈다. 그 초안이 아직도 핸드폰에 남아있다.\"",
    },
    room306: {
        type: "text",
        requires: "GATE_LOBBY2F",
        question: "최수잔이 그날 오후 버스에서 쓴 사과 카톡, 결국 어떻게 됐나? ex)보냈다, 못보냈다",
        check: (v) => v.replace(/\s/g, "").includes("못보냈다"),
        reveal: "시며수의 최근 일기 뒷부분: \"C가 안 왔다. 방송실에 두고 그냥 도망쳤다. 내일 아침 일찍 가서 다시 가져와야지 했는데… 너무 지쳐서 잠들어버렸다.\"",
    },
};

const FINAL_QUESTIONS = [
    { id: "q1", type: "text", q: "새 이름표 상자에서 이름표를 가져간 사람은?", a: "정뭉환" },
    {
        id: "q2", type: "choice", q: "그 이유는?",
        options: ["이름표에 오타가 나서", "아직 새 이름을 받을 준비가 안 됨", "새 이름이 마음에 안들어서", "목사님이 다시 만들어주기로 해서"],
        a: "아직 새 이름을 받을 준비가 안 됨",
    },
    { id: "q3", type: "text", q: "방송실 봉투를 놓은 사람은?", a: "시며수" },
    { id: "q4", type: "text", q: "봉투 안에 들어있던 것은?", a: "3년 전 사라진 정뭉환의 롤링페이퍼" },
    {
        id: "q5", type: "choice", q: "롤링페이퍼가 사라진 진짜 원인은?",
        options: ["최수잔이 훔침", "정뭉환이 스스로 숨김", "시며수가 실수로 자기 짐에 넣음", "백지화가 훔침"],
        a: "시며수가 실수로 자기 짐에 넣음",
    },
    { id: "q6", type: "text", q: "3년 전 결정적 상처를 준 사람은?", a: "최수잔" },
    { id: "q7", type: "text", q: "편지를 최근에 발견한 사람과 시점은?", a: "시며수, 2개월 전" },
    {
        id: "q8", type: "choice", q: "최수잔이 그날 이후 끝내 못 한 것은?",
        options: ["사과 카톡을 쓰다가 못 보냄", "롤링페이퍼를 다시 씀", "정뭉환에게 전화를 걺", "목사님께 상담 요청"],
        a: "사과 카톡을 쓰다가 못 보냄",
    },
    {
        id: "q9", type: "choice", q: "정뭉환이 백지화를 오해하게 된 계기는?",
        options: ["백지화가 편지를 갖고 있었다고 소문이 나서", "백지화가 서랍에서 봉투를 다시 꺼내보는 걸 목격", "백지화가 아무 설명도 없이 사라져서", "백지화가 최수잔과 짜고 숨겼다고 생각해서"],
        a: "백지화가 서랍에서 봉투를 다시 꺼내보는 걸 목격",
    },
    { id: "q10", type: "text", q: "3년 전, 편지 배달(정리) 담당자는 누구였나?", a: "시며수" },
];

const CHARACTERS = {
    C: { name: "정뭉환", role: "사라진 사람", age: 19, mbti: "ISFJ", hobby: "CCM 듣기 (구원열차, 시편139편, 천 번을 불러도, 주님의 사랑), 프라모델 조립하기", trait: "속마음을 잘 안 드러내는 편. 한번 마음먹으면 잘 안 바뀐다.", birthday: "03월 14일", insight: "정뭉환이 기억하기로, 서궁이는 낙서장에 항상 십자가만 그렸다." },
    D: { name: "백지화", role: "청년부 회장", age: 19, mbti: "ESTJ", hobby: "축구", trait: "책임감이 강하고 리더십이 있다. 은근히 정이 많다.", birthday: "07월 22일", insight: "백지화가 최근에 들었다: \"최수잔 생일이 9월 27일이래.\"" },
    E: { name: "시며수", role: "조용한 관찰자", age: 19, mbti: "INTP", hobby: "다이어리·메모 쓰기", trait: "존재감이 옅은 편. 한번 마음에 걸리면 계속 신경 쓴다.", birthday: "11월 05일", insight: "시며수가 지나가듯 말했다: \"나도 시편139편 진짜 좋아해.\"" },
    F: { name: "윤서궁", role: "살림꾼", age: 19, mbti: "ENFJ", hobby: "낙서장에 십자가 그리기", trait: "다정하고 다들 잘 챙긴다. 비밀을 잘 지켜준다.", birthday: "05월 09일", insight: "윤서궁이 말했다: \"요즘 뭔가 수상한 낌새가 있어.\"" },
    G: { name: "최수잔", role: "부회장", age: 19, mbti: "ESFP", hobby: "노래방 가기", trait: "분위기 메이커. 밝아 보이지만 은근히 마음에 담아둔다.", birthday: "09월 27일", insight: "최수잔이 흘리듯 말했다: \"나 사실 이 다이어리 자물쇠 번호, 그냥 생일로 해놨어.\"" },
};

/* 자물쇠 코드 정리 (v-최종)
   예배당 이름표 상자: 성경구절만 제시 (창32:27-28), 규칙은 게임 내에서 설명 안 함 → 3255
   306호실 가방: 정뭉환의 CCM 네 곡 각각에 숨은 숫자를 합산 → 91(구원열차)+139(시편139편)+1000(천 번을 불러도)+4(주님의 사랑)=1234
   2층 로비 다이어리: 최수잔의 생일(MMDD, 백지화 카드에서 확인) → 0927
   1층 로비 폰: 십자가 모양 패턴, 시작점만 제공 → [2,8,5,4,6] (위→아래→가운데→왼쪽→오른쪽)
   방송 책상: 단어 자물쇠 "HANSORY" (우리 고등부 이름), 힌트는 "나는 내가 속한 곳이 좋아" */

/* ─────────────────────────────────────────
   유틸 컴포넌트
   ───────────────────────────────────────── */
function Chip({ children, tone = "gold" }) {
    const bg = tone === "gold" ? "rgba(203,163,90,0.15)" : "rgba(143,191,122,0.15)";
    const fg = tone === "gold" ? C.gold : C.good;
    return (
        <span style={{
            background: bg, color: fg, fontSize: 14, fontWeight: 700,
            padding: "6px 12px", borderRadius: 4, display: "inline-flex",
            alignItems: "center", gap: 5, whiteSpace: "nowrap",
            border: `1px dashed ${fg}`, letterSpacing: 0.3,
        }}>{children}</span>
    );
}

/* 증거 쪽지 — 종이 질감의 실물 단서 카드 */
function Paper({ children, rotate = 0, tag }) {
    return (
        <div style={{
            background: PAPER.bg, color: PAPER.text, borderRadius: 3,
            padding: "14px 16px", position: "relative", boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
            border: `1px solid ${PAPER.border}`, transform: `rotate(${rotate}deg)`,
            fontSize: 16, lineHeight: 1.6,
        }}>
            {tag && (
                <span style={{
                    position: "absolute", top: -9, left: 12, background: PAPER.pin, color: "#F2E8D8",
                    fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 2, letterSpacing: 0.5,
                }}>{tag}</span>
            )}
            {children}
        </div>
    );
}

function PrimaryButton({ children, onClick, disabled, tone = "gold" }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                background: disabled ? "#5A4530" : (tone === "gold" ? C.gold : C.good),
                color: disabled ? C.muted : C.navy,
                fontWeight: 700, fontSize: 16.5, border: "none", borderRadius: 10,
                padding: "12px 22px", cursor: disabled ? "not-allowed" : "pointer",
                transition: "transform 0.1s ease",
            }}
            onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >{children}</button>
    );
}

function Feedback({ status, text }) {
    if (!status) return null;
    const ok = status === "ok";
    return (
        <div style={{
            marginTop: 10, padding: "12px 14px", borderRadius: 8, fontSize: 16,
            background: ok ? "rgba(127,191,138,0.12)" : "rgba(224,115,106,0.12)",
            color: ok ? C.good : C.bad, fontWeight: 600,
        }}>{text}</div>
    );
}

/* ─────────────────────────────────────────
   현장 도착 확인 — 스태프가 구두로 알려주는 코드
   ───────────────────────────────────────── */
function ArrivalGate({ locId, onSuccess }) {
    const [val, setVal] = useState("");
    const [fb, setFb] = useState(null);
    const submit = () => {
        if (val.trim() === ARRIVAL_CODES[locId]) { setFb("ok"); onSuccess(); }
        else setFb("no");
    };
    return (
        <div>
            <p style={{ color: C.cream, fontSize: 14.5, marginBottom: 6, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={16} color={C.gold} /> 현장 도착 확인
            </p>
            <p style={{ color: C.muted, fontSize: 12.5, marginBottom: 14 }}>
                이 장소에 실제로 도착했다면, 스태프에게 확인 코드를 물어보세요.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
                <input value={val} onChange={(e) => setVal(e.target.value)}
                       placeholder="스태프에게 받은 코드 입력"
                       style={{
                           flex: 1, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${C.muted}`,
                           background: C.panel, color: C.cream, fontSize: 14,
                       }} />
                <PrimaryButton onClick={submit}>확인</PrimaryButton>
            </div>
            <Feedback status={fb} text={fb === "ok" ? "확인되었습니다. 조사를 시작하세요." : fb === "no" ? "코드가 맞지 않습니다. 스태프에게 다시 확인해보세요." : null} />
        </div>
    );
}

/* ─────────────────────────────────────────
   퍼즐 1: 예배당 — 로직 그리드
   ───────────────────────────────────────── */
const SANCTUARY_TESTIMONY = {
    "정뭉환": { room: "201호", text: "정뭉환과 같은 방을 썼던 친구: \"뭉환이는 진짜 일찍 잤어요. 제가 그때까지 안 자고 있었으니까 확실해요.\"" },
    "백지화": { room: "201호", text: "백지화: \"3시요? 저도 가물가물한데… 어차피 옆방 애가 우리 조용했다고 했다면서요.\"" },
    "시며수": { room: "203호 (혼자)", text: "시며수 본인의 새벽 3시 행적에 대해서는, 아무도 증언하지 않았다." },
    "윤서궁": { room: "305호", text: "윤서궁: \"최수잔이 자는 건 봤어요. 근데 저는 배탈 때문에 그 시각에 방을 왔다갔다 했어요, 계속 방에 있진 않았어요.\"" },
    "최수잔": { room: "305호", text: "최수잔: \"저는 그날 진짜 피곤해서 눕자마자 뻗었어요.\"" },
};
const SANCTUARY_CROSS_WITNESS = "203호(시며수)의 증언: \"옆방(201호)은 새벽 3시에 완전히 조용했어요. 다들 자고 있었나봐요.\"";
const SANCTUARY_TODAY_NOTE = "오늘 새벽 예배당을 청소하던 사찰 집사님의 목격담: \"어젯밤 늦게 누가 몰래 들어와서 이름표 상자를 열어보더라고요. 자세히는 못 봤는데, 자기 것만 챙기고는 봉투는 다시 봉해놓고 조용히 나갔어요. 뒷모습이 정뭉환이었던 것 같은데... 표정이 많이 안 좋아 보였어요.\"";
const SANCTUARY_NAMETAG_TRACE = "상자 옆 바닥에 작은 플라스틱 조각이 떨어져 있다. 프라모델 조립용 부품처럼 보인다.";
const SANCTUARY_NAMETAG_SEAL = "상자는 다시 봉해져 있었지만, 스티커 한쪽 귀퉁이가 살짝 들뜬 자국이 있다. 급하게 다시 붙인 것 같다.";

function SanctuaryPuzzle({ done, onClear }) {
    const [opened, setOpened] = useState([]);

    const open = (name) => {
        if (!opened.includes(name)) setOpened((prev) => [...prev, name]);
    };
    const allOpened = opened.length === SANCTUARY_PEOPLE.length;

    return (
        <div>
            <p style={{ color: C.gold, fontSize: 13, fontWeight: 800, marginBottom: 8, fontFamily: FONT_CASE }}>
                ① 오늘 — 이름표 실종 사건
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                <Paper tag="목격담" rotate={0.6}>{SANCTUARY_TODAY_NOTE}</Paper>
                <Paper tag="현장 흔적 ①" rotate={-0.5}>{SANCTUARY_NAMETAG_TRACE}</Paper>
                <Paper tag="현장 흔적 ②" rotate={0.4}>{SANCTUARY_NAMETAG_SEAL}</Paper>
            </div>
            <p style={{ color: C.muted, fontSize: 11.5, marginBottom: 18 }}>
                💡 이 조각들이 누구를 가리키는지는, 각 인물 카드의 취미·특징과 맞춰봐야 알 수 있다.
            </p>

            <p style={{ color: C.gold, fontSize: 13, fontWeight: 800, marginBottom: 8, fontFamily: FONT_CASE }}>
                ② 3년 전 — 그날 밤, 누가 그 자리에 있었을까
            </p>
            <p style={{ color: C.muted, fontSize: 12.5, marginBottom: 12 }}>
                방 배정표: 201호 = 정뭉환·백지화 / 203호 = 시며수(혼자) / 305호 = 최수잔·윤서궁. 각 이름을 눌러 그 사람의 진술을 확인하세요.
            </p>
            <Paper tag="증언 기록">{SANCTUARY_CROSS_WITNESS}</Paper>
            <div style={{ height: 12 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 12 }}>
                {SANCTUARY_PEOPLE.map((name) => (
                    <button key={name} onClick={() => open(name)}
                            style={{
                                padding: "10px 8px", borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: "center",
                                border: `1.5px solid ${opened.includes(name) ? C.gold : "#5A4530"}`,
                                background: opened.includes(name) ? "rgba(203,163,90,0.12)" : C.card,
                                color: opened.includes(name) ? C.gold : C.cream, cursor: "pointer",
                            }}>{name}<div style={{ fontSize: 10.5, color: C.muted, fontWeight: 400, marginTop: 2 }}>{SANCTUARY_TESTIMONY[name].room}</div></button>
                ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {opened.map((name, i) => (
                    <Paper key={name} tag={name} rotate={i % 2 === 0 ? -0.4 : 0.4}>
                        {SANCTUARY_TESTIMONY[name].text}
                    </Paper>
                ))}
            </div>
            {!done ? (
                <PrimaryButton onClick={onClear} disabled={!allOpened}>
                    {allOpened ? "조사 완료 — 다음으로" : `모든 진술 확인하기 (${opened.length}/${SANCTUARY_PEOPLE.length})`}
                </PrimaryButton>
            ) : (
                <Chip tone="good"><CheckCircle2 size={13} /> 조사 완료 · 조각코드 WAKE 획득</Chip>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────
   퍼즐 2: 306호실 — 히든오브젝트
   ───────────────────────────────────────── */
function BagPuzzle({ done, onClear }) {
    const [opened, setOpened] = useState([]);

    const click = (spot) => {
        if (!opened.includes(spot.id)) setOpened((prev) => [...prev, spot.id]);
    };
    const allOpened = opened.length === BAG_SPOTS.length;

    return (
        <div>
            <p style={{ color: C.cream, fontSize: 14.5, marginBottom: 6, fontWeight: 600 }}>
                오래된 캠프 가방 — 어디를 뒤져볼까?
            </p>
            <p style={{ color: C.muted, fontSize: 12.5, marginBottom: 12 }}>
                가방 구석구석을 다 뒤져보세요. 진짜 단서와 그냥 잡동사니가 섞여있습니다.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                {BAG_SPOTS.map((s) => {
                    const isOpen = opened.includes(s.id);
                    return (
                        <button key={s.id} onClick={() => click(s)}
                                style={{
                                    aspectRatio: "1 / 1", borderRadius: 10, cursor: "pointer", padding: 6,
                                    display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                                    background: isOpen ? "#5A4530" : "linear-gradient(160deg,#3b3320,#2a2517)",
                                    border: `1.5px solid ${isOpen ? "#6b5238" : "#4a4128"}`,
                                    color: C.cream, fontSize: 11.5, fontWeight: 600, lineHeight: 1.3,
                                }}>{s.label}</button>
                    );
                })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {BAG_SPOTS.filter((s) => opened.includes(s.id)).map((s, i) => (
                    <Paper key={s.id} tag={s.label} rotate={(i % 3 - 1) * 0.5}>
                        {s.result}
                    </Paper>
                ))}
            </div>
            {!done ? (
                <PrimaryButton onClick={onClear} disabled={!allOpened}>
                    {allOpened ? "탐색 완료 — 다음으로" : `가방 다 뒤져보기 (${opened.length}/${BAG_SPOTS.length})`}
                </PrimaryButton>
            ) : (
                <Chip tone="good"><CheckCircle2 size={13} /> 탐색 완료 · 조각코드 BAG 획득</Chip>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────
   퍼즐 3: 2층 로비 — 순서 정렬
   ───────────────────────────────────────── */
function OrderList({ items, setItems, disabled }) {
    const move = (idx, dir) => {
        const next = [...items];
        const target = idx + dir;
        if (target < 0 || target >= next.length) return;
        [next[idx], next[target]] = [next[target], next[idx]];
        setItems(next);
    };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((it, idx) => (
                <div key={it.id} style={{
                    display: "flex", alignItems: "center", gap: 8, background: C.cardAlt,
                    borderRadius: 8, padding: "9px 10px",
                }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <button disabled={disabled} onClick={() => move(idx, -1)}
                                style={{ background: "none", border: "none", color: disabled ? "#6b5847" : C.gold, cursor: disabled ? "default" : "pointer" }}>
                            <ChevronUp size={16} />
                        </button>
                        <button disabled={disabled} onClick={() => move(idx, 1)}
                                style={{ background: "none", border: "none", color: disabled ? "#6b5847" : C.gold, cursor: disabled ? "default" : "pointer" }}>
                            <ChevronDown size={16} />
                        </button>
                    </div>
                    <span style={{ color: C.cream, fontSize: 13, lineHeight: 1.5 }}>{it.text}</span>
                </div>
            ))}
        </div>
    );
}

function DiaryPuzzle({ done, onClear }) {
    const [order] = useState(() => [...DIARY_CARDS].sort(() => Math.random() - 0.5));
    const [picked, setPicked] = useState(null);

    return (
        <div>
            <p style={{ color: C.cream, fontSize: 14.5, marginBottom: 4, fontWeight: 600 }}>
                최수잔의 다이어리 — 날짜 없이 뒤섞인 페이지들, 이 사건과 무관한 페이지도 섞여 있다
            </p>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>
                어느 페이지가 이 사건과 무관한지 짚어보세요. (카드를 눌러보세요)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {order.map((c, i) => {
                    const isPicked = picked === c.id;
                    const isFake = c.id === "FAKE";
                    return (
                        <div key={c.id} onClick={() => setPicked(c.id)} style={{ cursor: "pointer" }}>
                            <Paper rotate={(i % 3 - 1) * 0.5}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                                    <span>{c.text}</span>
                                    {isPicked && (
                                        <span style={{
                                            flexShrink: 0, fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 4,
                                            background: isFake ? "rgba(139,58,42,0.15)" : "rgba(46,36,21,0.1)",
                                            color: isFake ? PAPER.pin : PAPER.text,
                                        }}>{isFake ? "무관해 보임" : "이 사건과 관련"}</span>
                                    )}
                                </div>
                            </Paper>
                        </div>
                    );
                })}
            </div>
            {!done ? (
                <PrimaryButton onClick={onClear}>제출</PrimaryButton>
            ) : (
                <Chip tone="good"><CheckCircle2 size={13} /> 조각코드 DIARY 획득</Chip>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────
   퍼즐 4: 1층 로비 — 순서 정렬
   ───────────────────────────────────────── */
function ChatPuzzle({ done, onClear }) {
    const [items, setItems] = useState(() => [...CHAT_CARDS].sort(() => Math.random() - 0.5));

    return (
        <div>
            <p style={{ color: C.cream, fontSize: 14.5, marginBottom: 6, fontWeight: 600 }}>
                정뭉환·윤서궁의 문자 기록
            </p>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>
                문자 기록이 뒤죽박죽 섞여있다. 시간순으로 직접 정렬해보세요.
            </p>
            <OrderList items={items.map(c => ({ id: c.id, text: `${c.time}  ${c.text}` }))}
                       setItems={(next) => setItems(next.map(n => items.find(c => c.id === n.id)))} disabled={done} />
            {!done ? (
                <div style={{ marginTop: 12 }}><PrimaryButton onClick={onClear}>제출</PrimaryButton></div>
            ) : (
                <div style={{ marginTop: 12 }}><Chip tone="good"><CheckCircle2 size={13} /> 조각코드 30 획득</Chip></div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────
   퍼즐 5: 방송 책상 — 암호 해독
   ───────────────────────────────────────── */
function CipherPuzzle({ done, onClear }) {
    const [val, setVal] = useState("");
    const [fb, setFb] = useState(null);
    const shifted = CONSONANTS.map((_, i) => CONSONANTS[(i + 2) % CONSONANTS.length]);

    const submit = () => {
        const norm = (s) => s.replace(/\s/g, "");
        if (norm(val) === norm(CIPHER_ANSWER)) { setFb("ok"); onClear(); } else setFb("no");
    };

    return (
        <div>
            <p style={{ color: C.cream, fontSize: 14.5, marginBottom: 4, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                🔍 단서: 봉투 속 익명 메모
            </p>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
                누군가 초성을 밀어서 암호로 써놓았다.
            </p>

            {/* 낡은 쪽지 프롭 */}
            <Paper tag="익명 메모" rotate={-1}>
                <div style={{
                    fontSize: 21, fontWeight: 700, letterSpacing: 3, color: PAPER.text, textAlign: "center",
                    fontFamily: FONT_CASE,
                }}>{CIPHER_TEXT}</div>
            </Paper>
            <div style={{ height: 14 }} />

            {/* 해독표 — 항상 보이는 참고자료 */}
            <div style={{ background: C.cardAlt, borderRadius: 10, padding: 12, marginBottom: 14 }}>
                <p style={{ color: C.gold, fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                    📋 해독표 — 암호 자음을 아래 줄에서 찾아, 같은 칸 위쪽의 원문 자음으로 바꾸세요
                </p>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {CONSONANTS.map((c, i) => (
                        <div key={i} style={{ flex: 1, textAlign: "center", color: C.cream, fontSize: 13, fontWeight: 700, background: "#2E2116", padding: "4px 0", borderRadius: 4 }}>{c}</div>
                    ))}
                </div>
                <div style={{ textAlign: "center", color: C.muted, fontSize: 10 }}>▲ 원문 　　　 ▼ 암호</div>
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    {shifted.map((c, i) => (
                        <div key={i} style={{ flex: 1, textAlign: "center", color: C.gold, fontSize: 13, fontWeight: 700, background: "rgba(216,178,92,0.12)", padding: "4px 0", borderRadius: 4 }}>{c}</div>
                    ))}
                </div>
            </div>

            <input value={val} onChange={(e) => setVal(e.target.value)} disabled={done}
                   placeholder="해독한 문장을 입력하세요"
                   style={{
                       width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
                       border: `1.5px solid ${C.muted}`, background: C.panel, color: C.cream, fontSize: 14, marginBottom: 10,
                   }} />
            {!done && <PrimaryButton onClick={submit}>제출</PrimaryButton>}
            {done && <Chip tone="good"><CheckCircle2 size={13} /> 조각코드 NOTE / 숫자 03 획득</Chip>}
            <Feedback status={fb === "ok" ? "ok" : fb === "no" ? "no" : null}
                      text={fb === "ok" ? `해독 성공: "${CIPHER_ANSWER}" — 서명은 없다. 봉투엔 03:00 이라는 시각도 찍혀 있다.` : fb === "no" ? "해독표를 다시 확인해보세요." : null} />
        </div>
    );
}

/* ─────────────────────────────────────────
   Tier2 게이트 (공통)
   ───────────────────────────────────────── */
function Tier2Gate({ gateKey, fragments, cleared, onClear }) {
    const gate = TIER2_GATES[gateKey];
    const [val, setVal] = useState("");
    const [fb, setFb] = useState(null);
    const unlocked = fragments.includes(gate.requires);

    if (!unlocked) return (
        <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, color: C.muted, fontSize: 12.5, display: "flex", gap: 6, alignItems: "center" }}>
            <Lock size={13} /> 다른 장소를 먼저 풀어야 이 질문이 열립니다.
        </div>
    );

    if (gate.type === "scrambled") {
        const scrambleStr = (str) => {
            const chars = str.replace(/\s/g, "").split("");
            let seed = 137;
            for (let i = chars.length - 1; i > 0; i--) {
                seed = (seed * 9301 + 49297) % 233280;
                const j = Math.floor((seed / 233280) * (i + 1));
                [chars[i], chars[j]] = [chars[j], chars[i]];
            }
            return chars.join(" ");
        };
        const shown = scrambleStr(gate.reversedAnswer);
        const submitScrambled = () => {
            if (val.replace(/\s/g, "") === gate.reversedAnswer.replace(/\s/g, "")) { setFb("ok"); onClear(); } else setFb("no");
        };
        return (
            <div style={{ marginTop: 16, borderTop: "1px solid #4A3826", paddingTop: 14 }}>
                <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🗒️ 뒤죽박죽 메모</p>
                <p style={{ color: C.muted, fontSize: 12.5, marginBottom: 8 }}>글자들이 뒤섞여 있다. 올바른 문장으로 맞춰보세요.</p>
                <div style={{ background: C.cardAlt, borderRadius: 8, padding: "12px 14px", marginBottom: 10, fontSize: 17, fontWeight: 700, color: C.gold, textAlign: "center", letterSpacing: 1 }}>
                    {shown}
                </div>
                {!cleared ? (
                    <div style={{ display: "flex", gap: 8 }}>
                        <input value={val} onChange={(e) => setVal(e.target.value)}
                               placeholder="올바른 문장을 입력"
                               style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.muted}`, background: C.panel, color: C.cream, fontSize: 13.5 }} />
                        <PrimaryButton onClick={submitScrambled}>확인</PrimaryButton>
                    </div>
                ) : (
                    <Paper tag="다이어리 뒷장">{gate.reveal}</Paper>
                )}
                <Feedback status={fb === "ok" ? "ok" : fb === "no" ? "no" : null}
                          text={fb === "ok" ? "확인되었습니다." : fb === "no" ? "글자를 다시 잘 살펴보세요." : null} />
            </div>
        );
    }

    const submit = () => {
        if (gate.check(val)) { setFb("ok"); onClear(); } else setFb("no");
    };

    return (
        <div style={{ marginTop: 16, borderTop: "1px solid #4A3826", paddingTop: 14 }}>
            <p style={{ color: C.gold, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🔓 추가 확인</p>
            <p style={{ color: C.cream, fontSize: 13.5, marginBottom: 8 }}>{gate.question}</p>
            {!cleared ? (
                <div style={{ display: "flex", gap: 8 }}>
                    <input value={val} onChange={(e) => setVal(e.target.value)}
                           style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.muted}`, background: C.panel, color: C.cream, fontSize: 13.5 }} />
                    <PrimaryButton onClick={submit}>확인</PrimaryButton>
                </div>
            ) : (
                <Paper tag="추가 증언">{gate.reveal}</Paper>
            )}
            <Feedback status={fb === "ok" ? "ok" : fb === "no" ? "no" : null}
                      text={fb === "ok" ? "확인되었습니다." : fb === "no" ? "다시 확인해보세요." : null} />
        </div>
    );
}

/* ─────────────────────────────────────────
   다이얼 자물쇠 (신규 UI)
   ───────────────────────────────────────── */
function DialLock({ length = 4, target, onSuccess, disabled, opened }) {
    const [digits, setDigits] = useState(() => Array(length).fill(0));
    const change = (i, d) => {
        if (disabled) return;
        setDigits((prev) => prev.map((v, idx) => (idx === i ? (v + d + 10) % 10 : v)));
    };
    const pull = () => {
        if (digits.join("") === target) onSuccess();
    };
    return (
        <div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 14 }}>
                {digits.map((d, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <button disabled={disabled || opened} onClick={() => change(i, 1)}
                                style={{ background: "none", border: "none", color: opened ? "#6b5847" : C.gold, cursor: opened ? "default" : "pointer" }}>
                            <ChevronUp size={20} />
                        </button>
                        <div style={{
                            width: 42, height: 52, borderRadius: 8, background: opened ? "rgba(216,178,92,0.2)" : C.cardAlt,
                            border: `2px solid ${opened ? C.gold : "#5A4530"}`, display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 24, fontWeight: 800, color: C.cream, fontFamily: "monospace",
                        }}>{d}</div>
                        <button disabled={disabled || opened} onClick={() => change(i, -1)}
                                style={{ background: "none", border: "none", color: opened ? "#6b5847" : C.gold, cursor: opened ? "default" : "pointer" }}>
                            <ChevronDown size={20} />
                        </button>
                    </div>
                ))}
            </div>
            {!opened && <div style={{ textAlign: "center" }}><PrimaryButton onClick={pull} disabled={disabled}>🔒 당겨서 열기</PrimaryButton></div>}
        </div>
    );
}

/* ─────────────────────────────────────────
   패턴 잠금 (신규 UI) — 폰 패턴 풀기
   ───────────────────────────────────────── */
const DOT_POS = {
    1: [30, 30], 2: [90, 30], 3: [150, 30],
    4: [30, 90], 5: [90, 90], 6: [150, 90],
    7: [30, 150], 8: [90, 150], 9: [150, 150],
};

function PatternLock({ target, smudged, onSuccess }) {
    const [path, setPath] = useState([]);
    const [shake, setShake] = useState(false);

    const clickDot = (n) => {
        if (shake || path.includes(n)) return;
        const next = [...path, n];
        setPath(next);
        if (next.length === target.length) {
            if (JSON.stringify(next) === JSON.stringify(target)) {
                onSuccess();
            } else {
                setShake(true);
                setTimeout(() => { setPath([]); setShake(false); }, 550);
            }
        }
    };

    const points = path.map((n) => DOT_POS[n].join(",")).join(" ");

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", width: 180, height: 180 }}>
                <svg width="180" height="180" style={{ position: "absolute", left: 0, top: 0 }}>
                    {points && <polyline points={points} fill="none" stroke={shake ? C.bad : C.gold} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
                {Object.keys(DOT_POS).map((k) => {
                    const n = Number(k);
                    const [x, y] = DOT_POS[n];
                    const isSmudged = smudged.includes(n);
                    const active = path.includes(n);
                    return (
                        <button key={n} onClick={() => clickDot(n)}
                                style={{
                                    position: "absolute", left: x - 16, top: y - 16, width: 32, height: 32, borderRadius: "50%",
                                    background: active ? C.gold : (isSmudged ? "rgba(216,178,92,0.18)" : C.cardAlt),
                                    border: `2px solid ${isSmudged ? C.gold : "#5A4530"}`,
                                    cursor: "pointer",
                                }} />
                    );
                })}
            </div>
            {shake && <div style={{ color: C.bad, fontSize: 12.5, fontWeight: 600 }}>패턴이 틀렸다. 다시 시도해보세요.</div>}
        </div>
    );
}


/* ─────────────────────────────────────────
   단어 자물쇠 (신규 UI)
   ───────────────────────────────────────── */
function WordLock({ target, onSuccess }) {
    const [val, setVal] = useState("");
    const [fb, setFb] = useState(null);
    const submit = () => {
        if (val.trim().toUpperCase() === target.toUpperCase()) { setFb("ok"); onSuccess(); }
        else { setFb("no"); }
    };
    return (
        <div>
            <div style={{ display: "flex", gap: 8 }}>
                <input value={val} onChange={(e) => setVal(e.target.value)}
                       placeholder="단어 입력"
                       style={{
                           flex: 1, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${C.muted}`,
                           background: C.panel, color: C.cream, fontSize: 15, letterSpacing: 2, textTransform: "uppercase",
                       }} />
                <PrimaryButton onClick={submit}>🔓 열기</PrimaryButton>
            </div>
            <Feedback status={fb} text={fb === "ok" ? "찰칵 — 자물쇠가 열렸다." : fb === "no" ? "아니다. 다시 생각해보세요." : null} />
        </div>
    );
}

/* ─────────────────────────────────────────
   Tier3 최종 퍼즐 (306호실) — 다이얼 자물쇠
   ───────────────────────────────────────── */
function FinalPuzzle({ fragments, cleared, onClear }) {
    const [fb, setFb] = useState(null);
    const ready = fragments.includes("03") && fragments.includes("30") && fragments.includes("GATE_ROOM306");

    if (!ready) return (
        <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, color: C.muted, fontSize: 12.5, display: "flex", gap: 6, alignItems: "center" }}>
            <Lock size={13} /> 방송 책상과 1층 로비의 조각, 그리고 이 장소의 추가 확인까지 끝나야 열립니다.
        </div>
    );

    const handleSuccess = () => { setFb("ok"); onClear(); };

    return (
        <div style={{ marginTop: 16, borderTop: `1px solid ${C.gold}`, paddingTop: 14 }}>
            <p style={{ color: C.gold, fontSize: 14, fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={15} /> 최종 자물쇠
            </p>
            <p style={{ color: C.cream, fontSize: 13.5, marginBottom: 10 }}>
                방송 책상에서 얻은 시각 조각과, 1층 로비에서 얻은 시각 조각을 조합해 편지가 사라진 그 순간의 시각을 다이얼에 맞추시오.
            </p>
            <DialLock target="0330" onSuccess={handleSuccess} disabled={cleared} opened={cleared} />
            {cleared && (
                <div style={{ marginTop: 12 }}>
                    <Paper tag="최종 증거">
                        🏆 <b style={{ color: PAPER.pin }}>편지 정리 담당표</b> 공개 — "정리 담당: 시며수". 3년 전 그날 밤, 편지 상자를 옮긴 사람의 이름이 선명하게 적혀 있다.
                    </Paper>
                </div>
            )}
            <Feedback status={fb === "ok" ? "ok" : null} text={fb === "ok" ? "찰칵 — 0330. 진짜 결정적 증거가 공개되었습니다." : null} />
        </div>
    );
}

/* ─────────────────────────────────────────
   메인 앱
   ───────────────────────────────────────── */
const TEAMS = ["1조", "2조", "3조", "4조"];
const TEAM_PASSWORDS = { "1조": "팥죽", "2조": "사랑", "3조": "이스라엘", "4조": "은혜" };
const ADMIN_PASSWORD = "baek";

function emptyProgress() {
    return {
        fragments: [],
        arrival: { sanctuary: false, room306: false, lobby2f: false, lobby1f: false, broadcastDesk: false },
        gates: { phone: false, diary: false, channel: false, nametag: false, bag: false },
        cards: { C: false, D: false, E: false, F: false, G: false },
        tier1: { sanctuary: false, room306: false, lobby2f: false, lobby1f: false, broadcastDesk: false },
        tier2: { broadcastDesk: false, lobby2f: false, room306: false, lobby1f: false },
        tier3: { room306: false },
        quiz: {},
        quizSubmitted: false,
    };
}

/* ─────────────────────────────────────────
   로그인 화면
   ───────────────────────────────────────── */
function LoginScreen({ onLogin }) {
    const [val, setVal] = useState("");
    const [error, setError] = useState(false);

    const submit = () => {
        const v = val.trim();
        if (v === ADMIN_PASSWORD) {
            onLogin({ role: "admin" });
            return;
        }
        const matchedTeam = Object.keys(TEAM_PASSWORDS).find((t) => TEAM_PASSWORDS[t] === v);
        if (matchedTeam) {
            onLogin({ role: "team", team: matchedTeam });
            return;
        }
        setError(true);
    };

    return (
        <div style={{
            fontFamily: FONT, background: C.navy, minHeight: "100vh", color: C.cream,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            backgroundImage: "radial-gradient(ellipse at top, rgba(203,163,90,0.08), transparent 60%)",
        }}>
            <div style={{ width: "100%", maxWidth: 440 }}>
                <div style={{
                    border: `2px solid ${PAPER.pin}`, color: PAPER.pin, borderRadius: 4, padding: "6px 12px",
                    fontSize: 13, fontWeight: 800, letterSpacing: 1, transform: "rotate(-4deg)", fontFamily: FONT_CASE,
                    display: "inline-block", marginBottom: 18,
                }}>사건 기록<br />CASE №0801</div>

                <div style={{
                    width: "100%", aspectRatio: "16 / 10", borderRadius: 12, marginBottom: 22,
                    background: `${C.card} center/cover no-repeat url("${import.meta.env.BASE_URL}cover.jpg")`,
                    border: `1px solid #5A4530`, display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                }}>
                    <img src={`${import.meta.env.BASE_URL}cover.jpg`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                         onError={(e) => { e.currentTarget.style.display = "none"; }} />
                </div>

                <div style={{ fontSize: 15, color: C.muted, letterSpacing: 1.5, marginBottom: 6 }}>크라임씬</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: C.cream, fontFamily: FONT_CASE, marginBottom: 26, lineHeight: 1.25 }}>
                    3년 후의<br />롤링페이퍼
                </div>

                <p style={{ fontSize: 15, color: C.muted, marginBottom: 10 }}>스태프에게 받은 비밀번호를 입력하세요</p>
                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        type="text"
                        autoCapitalize="off"
                        autoCorrect="off"
                        autoComplete="off"
                        value={val}
                        onChange={(e) => { setVal(e.target.value); setError(false); }}
                        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                        placeholder="비밀번호"
                        style={{
                            flex: 1, padding: "14px 16px", borderRadius: 10, fontSize: 18,
                            border: `1.5px solid ${error ? C.bad : "#5A4530"}`, background: C.card, color: C.cream,
                        }}
                    />
                    <PrimaryButton onClick={submit}>입장</PrimaryButton>
                </div>
                {error && <Feedback status="no" text="비밀번호가 맞지 않습니다. 스태프에게 다시 확인해보세요." />}
            </div>
        </div>
    );
}

function TeamGame({ team, onLogout }) {
    const [progress, setProgressRaw] = useState(emptyProgress());
    const [loaded, setLoaded] = useState(false);
    const [active, setActive] = useState("sanctuary");
    const [showQuiz, setShowQuiz] = useState(false);
    const [showCards, setShowCards] = useState(false);
    const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | ok | error
    const [toast, setToast] = useState(null);
    const loadedOnceRef = useRef(false);
    const toastTimerRef = useRef(null);

    const showToast = (msg) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast(msg);
        toastTimerRef.current = setTimeout(() => setToast(null), 4500);
    };

    const setProgress = (updater) => setProgressRaw((prev) => updater(prev));

    // 처음 로그인할 때, Firestore에 저장된 진행상황을 불러온다
    useEffect(() => {
        if (loadedOnceRef.current) return;
        loadedOnceRef.current = true;
        (async () => {
            try {
                const snap = await getDoc(doc(db, "teams", team));
                if (snap.exists() && snap.data().progress) {
                    setProgressRaw({ ...emptyProgress(), ...snap.data().progress });
                }
            } catch (e) {
                console.error("Firestore 불러오기 실패:", e);
            }
            setLoaded(true);
        })();
    }, [team]);

    // progress가 바뀔 때마다 Firestore에 저장한다
    useEffect(() => {
        if (!loaded) return;
        setSyncStatus("syncing");
        const t = setTimeout(async () => {
            try {
                await setDoc(doc(db, "teams", team), { progress, updatedAt: serverTimestamp() }, { merge: true });
                setSyncStatus("ok");
            } catch (e) {
                console.error("Firestore 저장 실패:", e);
                setSyncStatus("error");
            }
        }, 600);
        return () => clearTimeout(t);
    }, [progress, team, loaded]);

    const addFragment = (frag) => {
        setProgress((p) => p.fragments.includes(frag) ? p : { ...p, fragments: [...p.fragments, frag] });
    };

    const clearTier1 = (id, frags) => {
        setProgress((p) => ({ ...p, tier1: { ...p.tier1, [id]: true } }));
        frags.forEach(addFragment);
        const newGates = Object.entries(TIER2_GATES).filter(([gKey, gate]) =>
            frags.includes(gate.requires) && !progress.fragments.includes(gate.requires) && !progress.tier2[gKey]
        );
        if (newGates.length > 0) {
            const names = newGates.map(([gKey]) => LOCATIONS.find(l => l.id === gKey)?.name || gKey).join(", ");
            showToast(`🔓 새 질문이 열렸습니다 — ${names}`);
        }
    };
    const clearTier2 = (id, frag) => {
        setProgress((p) => ({ ...p, tier2: { ...p.tier2, [id]: true } }));
        if (frag) addFragment(frag);
    };
    const clearTier3 = () => {
        setProgress((p) => ({ ...p, tier3: { ...p.tier3, room306: true } }));
    };
    const setGate = (key) => {
        setProgress((p) => ({ ...p, gates: { ...p.gates, [key]: true } }));
    };
    const setArrival = (locId) => {
        setProgress((p) => ({ ...p, arrival: { ...p.arrival, [locId]: true } }));
    };
    const revealCard = (id, silent = false) => {
        setProgress((p) => {
            if (p.cards[id]) return p;
            return { ...p, cards: { ...p.cards, [id]: true } };
        });
        if (!silent) {
            const ch = CHARACTERS[id];
            if (ch) showToast(`📋 인물 카드 공개 — ${ch.name}`);
        }
    };

    const totalFragmentGoal = 6; // WAKE, BAG, DIARY, 30, NOTE, 03
    const fragCount = progress.fragments.filter(f => ["WAKE","BAG","DIARY","30","NOTE","03"].includes(f)).length;

    const allTier1Done = Object.values(progress.tier1).every(Boolean);
    const finalReady = progress.tier3.room306;

    return (
        <div style={{ fontFamily: FONT, background: C.navy, minHeight: 600, borderRadius: 14, padding: "0 0 24px", color: C.cream, backgroundImage: "radial-gradient(ellipse at top, rgba(203,163,90,0.05), transparent 60%)" }}>
            {/* 헤더 */}
            <div style={{ padding: "18px 20px 14px", borderBottom: `2px solid ${C.borderSoft}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            border: `2px solid ${PAPER.pin}`, color: PAPER.pin, borderRadius: 4, padding: "5px 10px",
                            fontSize: 12.5, fontWeight: 800, letterSpacing: 1, transform: "rotate(-4deg)", fontFamily: FONT_CASE,
                        }}>사건 기록<br />CASE №0801</div>
                        <div>
                            <div style={{ fontSize: 13, color: C.muted, letterSpacing: 1.5 }}>3년 후의 롤링페이퍼</div>
                            <div style={{ fontSize: 23, fontWeight: 800, color: C.cream, fontFamily: FONT_CASE }}>진상규명 사건 파일</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid #5A4530`,
                            borderRadius: 8, padding: "9px 14px", color: C.gold, fontSize: 16, fontWeight: 700,
                        }}>
                            <Users size={17} /> {team}
                        </div>
                        <button onClick={onLogout} title="로그아웃"
                                style={{
                                    background: "transparent", border: `1px solid #5A4530`, borderRadius: 8, padding: "9px 12px",
                                    color: C.muted, cursor: "pointer", fontSize: 14,
                                }}>
                            로그아웃
                        </button>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    <Chip><KeyRound size={12} /> 조각 {fragCount}/{totalFragmentGoal}</Chip>
                    {finalReady && <Chip tone="good"><Sparkles size={12} /> 최종 증거 확보</Chip>}
                    <span style={{ fontSize: 13, color: C.muted, alignSelf: "center", marginLeft: 4 }}>
            {syncStatus === "syncing" && "☁️ 저장 중..."}
                        {syncStatus === "ok" && "☁️ 저장됨"}
                        {syncStatus === "error" && "⚠️ 저장 실패 (인터넷 확인)"}
          </span>
                </div>
            </div>

            {/* 장소 탭 — 폴더 탭 스타일 */}
            <div style={{ display: "flex", gap: 4, padding: "16px 20px 0", flexWrap: "wrap", alignItems: "flex-end" }}>
                {LOCATIONS.map((loc) => {
                    const cleared = progress.tier1[loc.id];
                    const isActive = active === loc.id && !showCards && !showQuiz;
                    const Icon = loc.icon;
                    return (
                        <button key={loc.id} onClick={() => { setActive(loc.id); setShowQuiz(false); setShowCards(false); }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 6, padding: "11px 16px",
                                    borderRadius: "8px 8px 0 0",
                                    background: isActive ? C.panel : C.card,
                                    border: `1.5px solid ${isActive ? C.gold : C.borderSoft}`,
                                    borderBottom: isActive ? `1.5px solid ${C.panel}` : `1.5px solid ${C.borderSoft}`,
                                    marginBottom: -1, position: "relative", zIndex: isActive ? 2 : 1,
                                    color: isActive ? C.gold : C.muted, cursor: "pointer", fontSize: 15.5, fontWeight: 700,
                                }}>
                            <Icon size={15} />
                            {loc.name}
                            {cleared ? <CheckCircle2 size={14} color={C.good} /> : <Lock size={13} color={C.muted} />}
                        </button>
                    );
                })}
                <button onClick={() => { setShowCards(true); setShowQuiz(false); }}
                        style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "11px 16px", borderRadius: "8px 8px 0 0",
                            background: showCards ? C.panel : C.card, color: showCards ? C.gold : C.muted,
                            border: `1.5px solid ${showCards ? C.gold : C.borderSoft}`,
                            borderBottom: showCards ? `1.5px solid ${C.panel}` : `1.5px solid ${C.borderSoft}`,
                            marginBottom: -1, position: "relative", zIndex: showCards ? 2 : 1,
                            cursor: "pointer", fontSize: 15.5, fontWeight: 700,
                        }}>
                    <Users size={15} /> 인물 카드
                </button>
                {allTier1Done && (
                    <button onClick={() => { setShowQuiz(true); setShowCards(false); }}
                            style={{
                                display: "flex", alignItems: "center", gap: 6, padding: "11px 16px", borderRadius: 10,
                                background: showQuiz ? C.gold : "transparent", color: showQuiz ? C.navy : C.gold,
                                border: `1.5px solid ${C.gold}`, cursor: "pointer", fontSize: 15.5, fontWeight: 700,
                            }}>
                        <ScrollText size={15} /> 진상규명지 <ArrowRight size={14} />
                    </button>
                )}
            </div>

            {/* 본문 */}
            <div style={{ padding: "18px 20px 0" }}>
                {showCards ? (
                    <CharacterCardPanel cards={progress.cards} />
                ) : !showQuiz ? (
                    <div style={{ background: C.panel, borderRadius: 14, padding: 18, border: "1px solid #3D2C1E" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ color: C.gold, fontSize: 13, fontWeight: 700 }}>
                {LOCATIONS.find((l) => l.id === active).name}
              </span>
                            <span style={{ color: C.muted, fontSize: 12 }}>· {LOCATIONS.find((l) => l.id === active).tag}</span>
                        </div>

                        {!progress.arrival[active] ? (
                            <ArrivalGate locId={active} onSuccess={() => setArrival(active)} />
                        ) : (
                            <>
                                {active === "sanctuary" && (
                                    <>
                                        {!progress.gates.nametag ? (
                                            <div>
                                                <p style={{ color: C.cream, fontSize: 14.5, marginBottom: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Lock size={16} color={C.gold} /> 이름표 상자가 자물쇠로 잠겨있다
                                                </p>
                                                <p style={{ color: C.muted, fontSize: 12.5, marginBottom: 14 }}>
                                                    강단 위 현수막엔 이번 수련회 주제 구절만 적혀있다: <b style={{ color: C.gold }}>창세기 32장 27~28절</b>
                                                </p>
                                                <DialLock length={4} target="3255" onSuccess={() => { setGate("nametag"); revealCard("C"); }} />
                                            </div>
                                        ) : (
                                            <SanctuaryPuzzle done={progress.tier1.sanctuary} onClear={() => clearTier1("sanctuary", ["WAKE"])} />
                                        )}
                                    </>
                                )}
                                {active === "room306" && (
                                    <>
                                        {!progress.gates.bag ? (
                                            <div>
                                                <p style={{ color: C.cream, fontSize: 14.5, marginBottom: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Lock size={16} color={C.gold} /> 가방 지퍼에 작은 다이얼 자물쇠가 달려있다
                                                </p>
                                                <p style={{ color: C.muted, fontSize: 12.5, marginBottom: 14 }}>
                                                    자물쇠에 작은 낙서: <i>"이 편지 주인이 좋아하는 찬양은 나도 좋아해!"</i>
                                                </p>
                                                <DialLock length={4} target="1234" onSuccess={() => { setGate("bag"); revealCard("E"); }} />
                                            </div>
                                        ) : (
                                            <>
                                                <BagPuzzle done={progress.tier1.room306} onClear={() => clearTier1("room306", ["BAG"])} />
                                                {progress.tier1.room306 && (
                                                    <Tier2Gate gateKey="room306" fragments={progress.fragments} cleared={progress.tier2.room306}
                                                               onClear={() => clearTier2("room306", "GATE_ROOM306")} />
                                                )}
                                                {progress.tier2.room306 && (
                                                    <FinalPuzzle fragments={progress.fragments} cleared={progress.tier3.room306} onClear={clearTier3} />
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                                {active === "lobby2f" && (
                                    <>
                                        {!progress.gates.diary ? (
                                            <div>
                                                <p style={{ color: C.cream, fontSize: 14.5, marginBottom: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                                                    <BookLock size={16} color={C.gold} /> 다이어리가 4자리 자물쇠로 잠겨있다</p>
                                                <p style={{ color: C.muted, fontSize: 12.5, marginBottom: 14 }}>
                                                    표지에 이름이 적혀있다: <i>"최수잔의 다이어리"</i>
                                                </p>
                                                <DialLock length={4} target="0927" onSuccess={() => { setGate("diary"); revealCard("G"); }} />
                                            </div>
                                        ) : (
                                            <>
                                                <DiaryPuzzle done={progress.tier1.lobby2f} onClear={() => { clearTier1("lobby2f", ["DIARY"]); if (!progress.cards.F) revealCard("F"); }} />
                                                {progress.tier1.lobby2f && (
                                                    <Tier2Gate gateKey="lobby2f" fragments={progress.fragments} cleared={progress.tier2.lobby2f}
                                                               onClear={() => clearTier2("lobby2f", "GATE_LOBBY2F")} />
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                                {active === "lobby1f" && (
                                    <>
                                        {!progress.gates.phone ? (
                                            <div>
                                                <p style={{ color: C.cream, fontSize: 14.5, marginBottom: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Smartphone size={16} color={C.gold} /> 윤서궁의 휴대폰이 패턴으로 잠겨있다</p>
                                                <p style={{ color: C.muted, fontSize: 12.5, marginBottom: 14 }}>
                                                    화면에 지문 얼룩이 남아있다. 시작 지점만 흐릿하게 보인다: <b style={{ color: C.gold }}>맨 위 가운데 점</b>이다.
                                                </p>
                                                <PatternLock target={[2, 8, 5, 4, 6]} smudged={[2]} onSuccess={() => { setGate("phone"); revealCard("F"); }} />
                                            </div>
                                        ) : (
                                            <>
                                                <ChatPuzzle done={progress.tier1.lobby1f} onClear={() => clearTier1("lobby1f", ["30"])} />
                                                {progress.tier1.lobby1f && (
                                                    <Tier2Gate gateKey="lobby1f" fragments={progress.fragments} cleared={progress.tier2.lobby1f}
                                                               onClear={() => clearTier2("lobby1f", null)} />
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                                {active === "broadcastDesk" && (
                                    <>
                                        {!progress.gates.channel ? (
                                            <div>
                                                <p style={{ color: C.cream, fontSize: 14.5, marginBottom: 6, fontWeight: 600 }}>낡은 라디오 옆에 작은 자물쇠 달린 상자가 있다</p>
                                                <p style={{ color: C.muted, fontSize: 12.5, marginBottom: 14 }}>
                                                    상자에 붙은 스티커: <i>"나는 내가 속한 곳이 좋아."</i><br />
                                                    영문 단어로 입력하세요.
                                                </p>
                                                <WordLock target="HANSORY" onSuccess={() => { setGate("channel"); revealCard("D"); }} />
                                            </div>
                                        ) : (
                                            <>
                                                <CipherPuzzle done={progress.tier1.broadcastDesk} onClear={() => clearTier1("broadcastDesk", ["NOTE", "03"])} />
                                                {progress.tier1.broadcastDesk && (
                                                    <Tier2Gate gateKey="broadcastDesk" fragments={progress.fragments} cleared={progress.tier2.broadcastDesk}
                                                               onClear={() => clearTier2("broadcastDesk", null)} />
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <QuizPanel progress={progress} setProgress={setProgress} />
                )}
            </div>
            {toast && (
                <div style={{
                    position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
                    background: C.gold, color: C.navy, padding: "11px 22px", borderRadius: 24,
                    fontSize: 13.5, fontWeight: 800, zIndex: 9999,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.45)", whiteSpace: "nowrap",
                    animation: "fadein 0.3s ease",
                }}>
                    {toast}
                </div>
            )}
        </div>
    );
}

function CharacterCardPanel({ cards }) {
    return (
        <div style={{ background: C.panel, borderRadius: 14, padding: 18, border: "1px solid #3D2C1E" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Users size={16} color={C.gold} />
                <span style={{ color: C.gold, fontWeight: 800, fontSize: 15, fontFamily: FONT_CASE }}>용의자 인물 카드</span>
            </div>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>각 장소의 자물쇠를 풀면 그 인물의 카드가 채워집니다.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {Object.entries(CHARACTERS).map(([id, ch]) => {
                    const revealed = cards[id];
                    return (
                        <div key={id} style={{
                            background: C.cardAlt, borderRadius: 10, padding: 14,
                            border: `1px solid ${revealed ? C.gold : "#4A3826"}`,
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <span style={{ color: C.cream, fontWeight: 800, fontSize: 15 }}>{ch.name}</span>
                                {revealed ? <CheckCircle2 size={14} color={C.good} /> : <Lock size={13} color={C.muted} />}
                            </div>
                            {revealed ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, color: C.muted }}>
                                    <span>역할: <b style={{ color: C.cream }}>{ch.role}</b></span>
                                    <span>나이: <b style={{ color: C.cream }}>{ch.age}세</b></span>
                                    <span>MBTI: <b style={{ color: C.cream }}>{ch.mbti}</b></span>
                                    <span>취미: <b style={{ color: C.cream }}>{ch.hobby}</b></span>
                                    <span>생일: <b style={{ color: C.cream }}>{ch.birthday}</b></span>
                                    <span style={{ marginTop: 4, lineHeight: 1.5 }}>특징: {ch.trait}</span>
                                    <span style={{ marginTop: 6, padding: "6px 8px", background: "rgba(216,178,92,0.1)", borderRadius: 6, color: C.gold, lineHeight: 1.5 }}>
                    💭 {ch.insight}
                  </span>
                                </div>
                            ) : (
                                <p style={{ color: C.muted, fontSize: 12.5 }}>조사 필요 — 관련 장소의 자물쇠를 풀어보세요.</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AdminPanel({ onLogout }) {
    const [teams, setTeams] = useState({});
    const [status, setStatus] = useState("loading");
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, "teams"),
            (snap) => {
                const next = {};
                snap.forEach((d) => { next[d.id] = d.data().progress || {}; });
                setTeams(next);
                setStatus("ok");
            },
            (err) => { console.error("Firestore 실시간 조회 실패:", err); setStatus("error"); }
        );
        return () => unsub();
    }, []);

    const scoreOf = (p) => {
        if (!p || !p.quiz) return 0;
        return FINAL_QUESTIONS.reduce((acc, q) => {
            const v = p.quiz[q.id];
            if (!v) return acc;
            if (q.type === "choice") return acc + (v === q.a ? 1 : 0);
            const norm = (s) => s.replace(/\s/g, "");
            return acc + (norm(v).includes(norm(q.a).slice(0, 3)) || norm(q.a).includes(norm(v)) ? 1 : 0);
        }, 0);
    };

    const resetTeam = async (t) => {
        if (!window.confirm(`${t}의 모든 진행상황을 삭제할까요? 되돌릴 수 없습니다.`)) return;
        setDeleting(t);
        try {
            await setDoc(doc(db, "teams", t), { progress: emptyProgress(), updatedAt: serverTimestamp() });
        } catch (e) {
            console.error("삭제 실패:", e);
            alert("삭제에 실패했습니다. 인터넷 연결을 확인해주세요.");
        }
        setDeleting(null);
    };

    return (
        <div style={{ fontFamily: FONT, background: C.navy, minHeight: "100vh", color: C.cream, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Eye size={20} color={C.gold} />
                    <span style={{ color: C.gold, fontWeight: 800, fontSize: 22, fontFamily: FONT_CASE }}>스태프 전체 현황</span>
                </div>
                <button onClick={onLogout} style={{
                    background: "transparent", border: `1px solid #5A4530`, borderRadius: 8, padding: "9px 14px",
                    color: C.muted, cursor: "pointer", fontSize: 14,
                }}>로그아웃</button>
            </div>
            <div style={{ background: C.panel, borderRadius: 14, padding: 20, border: `1px solid ${C.gold}` }}>
                <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>
                    {status === "loading" && "불러오는 중..."}
                    {status === "error" && "⚠️ 실시간 조회 실패 — Firebase 설정을 확인하세요."}
                    {status === "ok" && "실시간으로 업데이트됩니다."}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {TEAMS.map((t) => {
                        const p = teams[t];
                        const fragCount = p?.fragments?.filter((f) => ["WAKE", "BAG", "DIARY", "30", "NOTE", "03"].includes(f)).length || 0;
                        const finalDone = p?.tier3?.room306;
                        const submitted = p?.quizSubmitted;
                        const score = scoreOf(p);
                        return (
                            <div key={t} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                                background: C.card, borderRadius: 10, padding: "16px 18px", border: `1px solid #5A4530`,
                            }}>
                                <span style={{ color: C.cream, fontWeight: 700, fontSize: 19 }}>{t}</span>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                    <Chip>조각 {fragCount}/6</Chip>
                                    {finalDone && <Chip tone="good">최종증거 확보</Chip>}
                                    {submitted ? <Chip tone="good">제출완료 {score}/9</Chip> : <Chip>미제출</Chip>}
                                    <button onClick={() => resetTeam(t)} disabled={deleting === t}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 4, background: "rgba(217,119,106,0.12)",
                                                border: `1px solid ${C.bad}`, color: C.bad, borderRadius: 8, padding: "7px 12px",
                                                fontSize: 13.5, fontWeight: 700, cursor: deleting === t ? "default" : "pointer",
                                            }}>
                                        <Trash2 size={14} /> {deleting === t ? "삭제 중..." : "삭제"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function QuizPanel({ progress, setProgress }) {
    const [local, setLocal] = useState(progress.quiz);
    const [submitted, setSubmitted] = useState(progress.quizSubmitted);

    const submit = () => {
        setSubmitted(true);
        setProgress((p) => ({ ...p, quiz: local, quizSubmitted: true }));
    };

    const isCorrect = (q) => {
        const v = local[q.id];
        if (!v) return false;
        if (q.type === "choice") return v === q.a;
        const norm = (s) => s.replace(/\s/g, "");
        return norm(v).includes(norm(q.a).slice(0, 3)) || norm(q.a).includes(norm(v));
    };
    const score = FINAL_QUESTIONS.reduce((acc, q) => acc + (isCorrect(q) ? 1 : 0), 0);

    return (
        <div style={{ background: C.panel, borderRadius: 14, padding: 18, border: `1px solid ${C.gold}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <ScrollText size={16} color={C.gold} />
                <span style={{ color: C.gold, fontWeight: 800, fontSize: 15, fontFamily: FONT_CASE }}>진상규명 최종 보고서</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {FINAL_QUESTIONS.map((q, i) => (
                    <div key={q.id}>
                        <p style={{ color: C.cream, fontSize: 13.5, marginBottom: 6 }}>{i + 1}. {q.q}</p>
                        {q.type === "choice" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {q.options.map((opt) => {
                                    const selected = local[q.id] === opt;
                                    const showResult = submitted;
                                    const isRight = opt === q.a;
                                    let border = "#5A4530", bg = "transparent", color = C.cream;
                                    if (showResult && isRight) { border = C.good; bg = "rgba(143,191,122,0.12)"; color = C.good; }
                                    else if (showResult && selected && !isRight) { border = C.bad; bg = "rgba(217,119,106,0.12)"; color = C.bad; }
                                    else if (!showResult && selected) { border = C.gold; bg = "rgba(203,163,90,0.12)"; color = C.gold; }
                                    return (
                                        <button key={opt} disabled={submitted}
                                                onClick={() => setLocal((p) => ({ ...p, [q.id]: opt }))}
                                                style={{
                                                    textAlign: "left", padding: "8px 12px", borderRadius: 8, fontSize: 13,
                                                    border: `1.5px solid ${border}`, background: bg, color, cursor: submitted ? "default" : "pointer",
                                                }}>{opt}</button>
                                    );
                                })}
                            </div>
                        ) : (
                            <input
                                value={local[q.id] || ""}
                                onChange={(e) => setLocal((p) => ({ ...p, [q.id]: e.target.value }))}
                                disabled={submitted}
                                style={{
                                    width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8,
                                    border: `1.5px solid ${submitted ? (isCorrect(q) ? C.good : C.bad) : "#5A4530"}`,
                                    background: C.card, color: C.cream, fontSize: 13.5,
                                }} />
                        )}
                    </div>
                ))}
            </div>
            {!submitted ? (
                <div style={{ marginTop: 16 }}><PrimaryButton onClick={submit}>제출하기</PrimaryButton></div>
            ) : (
                <div style={{ marginTop: 16, background: "rgba(203,163,90,0.12)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: 14 }}>
                    <p style={{ color: C.gold, fontWeight: 800, fontSize: 15 }}>제출 완료 — 채점: {score} / {FINAL_QUESTIONS.length}</p>
                    <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                        객관식은 정확히 채점되고, 이름·내용 등 서술형은 근접 매칭으로 채점됩니다.
                    </p>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────
   최상위 App — 로그인 세션 관리
   ───────────────────────────────────────── */
const SESSION_KEY = "rp_session_v1";

export default function App() {
    const [session, setSession] = useState(() => {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    const handleLogin = (s) => {
        try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
        setSession(s);
    };
    const handleLogout = () => {
        try { localStorage.removeItem(SESSION_KEY); } catch {}
        setSession(null);
    };

    if (!session) return <LoginScreen onLogin={handleLogin} />;
    if (session.role === "admin") return <AdminPanel onLogout={handleLogout} />;
    return <TeamGame team={session.team} onLogout={handleLogout} />;
}