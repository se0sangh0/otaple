const RSS2JSON_ENDPOINT = "https://api.rss2json.com/v1/api.json";
const ALLORIGINS_RAW_ENDPOINT = "https://api.allorigins.win/raw?url=";
const MAX_FEED_ITEMS = 26;
const MAX_ARTICLE_AGE_DAYS = 95;
const DEFAULT_CITY_LABEL = "현지";

const CITY_TERMS = {
  tokyo: ["도쿄", "東京", "tokyo"],
  osaka: ["오사카", "大阪", "osaka"],
  seoul: ["서울", "seoul", "ソウル"]
};

const CITY_DISTRICTS = {
  tokyo: ["Akihabara", "Ikebukuro", "Nakano", "Shibuya", "Shinjuku", "Ariake", "Makuhari"],
  osaka: ["Namba", "Nipponbashi", "Umeda", "Tennoji", "Dotonbori"],
  seoul: ["Hongdae", "Hapjeong", "Yongsan", "Gangnam", "Seongsu", "Mapo", "Jamsil"]
};

const DISTRICT_ALIASES = {
  tokyo: [
    { name: "Akihabara", terms: ["akihabara", "秋葉原", "아키하바라"] },
    { name: "Ikebukuro", terms: ["ikebukuro", "池袋", "이케부쿠로"] },
    { name: "Nakano", terms: ["nakano", "中野", "나카노"] },
    { name: "Shibuya", terms: ["shibuya", "渋谷", "시부야"] },
    { name: "Shinjuku", terms: ["shinjuku", "新宿", "신주쿠"] },
    { name: "Ariake", terms: ["ariake", "有明", "아리아케"] },
    { name: "Makuhari", terms: ["makuhari", "幕張", "마쿠하리"] }
  ],
  osaka: [
    { name: "Namba", terms: ["namba", "難波", "난바"] },
    { name: "Nipponbashi", terms: ["nipponbashi", "日本橋", "닛폰바시"] },
    { name: "Umeda", terms: ["umeda", "梅田", "우메다"] },
    { name: "Tennoji", terms: ["tennoji", "天王寺", "텐노지"] },
    { name: "Dotonbori", terms: ["dotonbori", "道頓堀", "도톤보리"] }
  ],
  seoul: [
    { name: "Hongdae", terms: ["hongdae", "홍대"] },
    { name: "Hapjeong", terms: ["hapjeong", "합정"] },
    { name: "Yongsan", terms: ["yongsan", "용산"] },
    { name: "Gangnam", terms: ["gangnam", "강남"] },
    { name: "Seongsu", terms: ["seongsu", "성수"] },
    { name: "Mapo", terms: ["mapo", "마포"] },
    { name: "Jamsil", terms: ["jamsil", "잠실"] }
  ]
};

const CITY_VENUES = {
  tokyo: [
    { name: "애니메이트 카페", terms: ["animate cafe", "애니메이트 카페"] },
    { name: "아트레 아키하바라", terms: ["atre akihabara", "아트레 아키하바라"] },
    { name: "아키하바라", terms: ["akihabara", "秋葉原"] },
    { name: "이케부쿠로", terms: ["ikebukuro", "池袋", "이케부쿠로"] },
    { name: "도쿄 빅사이트", terms: ["tokyo big sight", "東京ビッグサイト"] }
  ],
  osaka: [
    { name: "덴덴타운", terms: ["den den town", "denden", "日本橋"] },
    { name: "닛폰바시", terms: ["nipponbashi", "日本橋"] },
    { name: "난바", terms: ["namba", "難波"] }
  ],
  seoul: [
    { name: "홍대", terms: ["홍대", "hongdae"] },
    { name: "합정", terms: ["합정", "hapjeong"] },
    { name: "용산", terms: ["용산", "yongsan"] },
    { name: "성수", terms: ["성수", "seongsu"] }
  ]
};

const FRANCHISE_PATTERNS = [
  { name: "주술회전", terms: ["주술회전", "呪術廻戦", "jujutsu kaisen"] },
  { name: "홀로라이브", terms: ["홀로라이브", "ホロライブ", "hololive"] },
  { name: "니지산지", terms: ["니지산지", "にじさんじ", "nijisanji"] },
  { name: "블루 아카이브", terms: ["블루 아카이브", "blue archive", "ブルーアーカイブ"] },
  { name: "원신", terms: ["원신", "genshin", "原神"] },
  { name: "붕괴: 스타레일", terms: ["스타레일", "star rail", "崩壊:スターレイル"] },
  { name: "귀멸의 칼날", terms: ["귀멸의 칼날", "鬼滅の刃", "demon slayer"] },
  { name: "원피스", terms: ["원피스", "one piece", "ワンピース"] },
  { name: "하이큐!!", terms: ["하이큐", "haikyu", "ハイキュー"] },
  { name: "명탐정 코난", terms: ["코난", "conan", "名探偵コナン"] },
  { name: "프로젝트 세카이", terms: ["프로세카", "project sekai", "プロセカ"] },
  { name: "러브라이브!", terms: ["러브라이브", "love live", "ラブライブ"] },
  { name: "뱅드림!", terms: ["뱅드림", "bang dream", "バンドリ"] },
  { name: "아이돌마스터", terms: ["아이돌마스터", "idolmaster", "アイドルマスター"] },
  { name: "포켓몬", terms: ["포켓몬", "pokemon", "ポケモン"] }
];

const FRANCHISE_FOCUS_QUERIES = [
  {
    franchise: "주술회전",
    genre: "Anime",
    terms: ["주술회전", "呪術廻戦", "jujutsu kaisen"],
    typeHint: "cafe"
  },
  {
    franchise: "홀로라이브",
    genre: "VTuber",
    terms: ["홀로라이브", "ホロライブ", "hololive"],
    typeHint: "cafe"
  },
  {
    franchise: "니지산지",
    genre: "VTuber",
    terms: ["니지산지", "にじさんじ", "nijisanji"],
    typeHint: "event"
  }
];

function timeoutSignal(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("timeout")), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function normalizeSpace(text) {
  return (text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function withinRecentWindow(date) {
  if (!date) return false;
  const diff = Date.now() - date.getTime();
  return diff <= MAX_ARTICLE_AGE_DAYS * 24 * 60 * 60 * 1000;
}

function hashString(value) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16);
}

function inferType(text, hint = "event") {
  const t = text.toLowerCase();
  const scores = { event: 0, cafe: 0, store: 0 };
  scores[hint] += 1.5;

  const eventKeywords = [
    "event",
    "festival",
    "フェス",
    "イベント",
    "행사",
    "전시",
    "comic",
    "comiket",
    "festa"
  ];
  const cafeKeywords = ["cafe", "コラボカフェ", "카페", "협업카페", "콜라보"];
  const storeKeywords = ["store", "shop", "goods", "매장", "팝업", "popup", "opening"];

  for (const k of eventKeywords) if (t.includes(k.toLowerCase())) scores.event += 1;
  for (const k of cafeKeywords) if (t.includes(k.toLowerCase())) scores.cafe += 1;
  for (const k of storeKeywords) if (t.includes(k.toLowerCase())) scores.store += 1;

  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function inferTags(text) {
  const t = text.toLowerCase();
  const tagMap = [
    ["anime", ["anime", "애니", "アニメ"]],
    ["game", ["game", "게임", "ゲーム"]],
    ["manga", ["manga", "만화", "マンガ"]],
    ["figure", ["figure", "피규어", "フィギュア"]],
    ["goods", ["goods", "굿즈", "グッズ"]],
    ["collab-cafe", ["collab", "콜라보", "コラボ", "cafe", "카페"]],
    ["event", ["event", "행사", "イベント", "festival", "전시"]],
    ["cosplay", ["cosplay", "코스프레", "コスプレ"]],
    ["doujin", ["doujin", "동인", "同人"]]
  ];

  const tags = [];
  for (const [tag, keywords] of tagMap) {
    if (keywords.some((kw) => t.includes(kw.toLowerCase()))) tags.push(tag);
  }
  return tags.length ? [...new Set(tags)] : ["anime", "event"];
}

function inferDistrict(cityKey, text) {
  const districts = DISTRICT_ALIASES[cityKey] || [];
  const lowered = text.toLowerCase();
  for (const district of districts) {
    if (district.terms.some((term) => lowered.includes(term.toLowerCase()))) {
      return district.name;
    }
  }

  for (const city of Object.values(DISTRICT_ALIASES)) {
    for (const district of city) {
      if (district.terms.some((term) => lowered.includes(term.toLowerCase()))) {
        return district.name;
      }
    }
  }

  for (const known of CITY_DISTRICTS[cityKey] || []) {
    if (lowered.includes(known.toLowerCase())) return known;
  }
  return "City Center";
}

function inferGenre(text) {
  const t = text.toLowerCase();
  if (
    t.includes("hololive") ||
    t.includes("ホロライブ") ||
    t.includes("nijisanji") ||
    t.includes("にじさんじ") ||
    t.includes("vtuber") ||
    t.includes("버튜버")
  ) {
    return "VTuber";
  }
  if (
    t.includes("game") ||
    t.includes("ゲーム") ||
    t.includes("게임") ||
    t.includes("rpg") ||
    t.includes("gacha")
  ) {
    return "Game";
  }
  if (
    t.includes("manga") ||
    t.includes("マンガ") ||
    t.includes("만화") ||
    t.includes("comic")
  ) {
    return "Manga";
  }
  if (t.includes("anime") || t.includes("アニメ") || t.includes("애니")) return "Anime";
  return "Subculture";
}

function extractFranchise(text) {
  const lowered = text.toLowerCase();
  for (const item of FRANCHISE_PATTERNS) {
    if (item.terms.some((term) => lowered.includes(term.toLowerCase()))) {
      return item.name;
    }
  }

  const headline = text.split(/\s[-|:]\s/)[0] || text;
  const collabPattern =
    /([A-Za-z0-9가-힣·・:'"“”‘’\-\s]{2,30})\s*(?:콜라보|コラボ|collab|특설전|전시|팝업)/i;
  const match = headline.match(collabPattern);
  if (match?.[1]) {
    const candidate = match[1].trim().replace(/\s+/g, " ");
    const blockedPattern =
      /(일본서|특별|캠페인|개최|진행|오픈|뉴스|행사|전시|팝업|카페|소식|공식)/i;
    if (
      candidate.length >= 2 &&
      candidate.length <= 26 &&
      candidate.split(" ").length <= 3 &&
      !blockedPattern.test(candidate)
    ) {
      return candidate;
    }
  }
  return "종합/기타";
}

function extractVenueFromText(text) {
  const patterns = [
    /(?:at|in|＠|@)\s*([A-Za-z0-9가-힣ぁ-んァ-ヶ一-龯·・:'"“”‘’\-\s]{2,42})/i,
    /([A-Za-z0-9가-힣ぁ-んァ-ヶ一-龯·・:'"“”‘’\-\s]{2,42})\s*(?:에서|개최|会場|점|店)/i
  ];
  const blockers = [
    "event",
    "news",
    "google",
    "anime",
    "eventually",
    "캠페인",
    "특별",
    "개최",
    "진행",
    "오픈"
  ];
  for (const pattern of patterns) {
    const matched = text.match(pattern)?.[1];
    if (!matched) continue;
    const candidate = matched
      .replace(/\s+/g, " ")
      .replace(/[|()[\]{}]/g, " ")
      .trim();
    if (!candidate || candidate.length < 2 || candidate.length > 22) continue;
    if (candidate.split(" ").length > 4) continue;
    if (blockers.some((word) => candidate.toLowerCase().includes(word))) continue;
    return candidate;
  }
  return "";
}

function inferVenueHint(cityKey, text, district, destinationRaw) {
  const lowered = text.toLowerCase();
  const venues = CITY_VENUES[cityKey] || [];
  for (const venue of venues) {
    if (venue.terms.some((term) => lowered.includes(term.toLowerCase()))) {
      return venue.name;
    }
  }
  const extractedVenue = extractVenueFromText(text);
  if (extractedVenue) return extractedVenue;
  if (district && district !== "City Center") return district;
  return `${destinationRaw || cityKey || DEFAULT_CITY_LABEL} 중심권`;
}

function buildGoogleNewsRssUrl(query) {
  const encoded = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encoded}&hl=ko&gl=KR&ceid=KR:ko`;
}

function buildQueryTemplates(cityName) {
  const templates = [
    {
      typeHint: "event",
      q: `${cityName} (애니 OR アニメ OR anime OR game OR VTuber) (이벤트 OR event OR 開催 OR 開催中 OR 행사)`
    },
    {
      typeHint: "cafe",
      q: `${cityName} (콜라보 카페 OR コラボカフェ OR collaboration cafe OR pop-up cafe) (개최 OR 진행 OR 開催中 OR 기간한정)`
    },
    {
      typeHint: "event",
      q: `${cityName} (전시 OR 특설전 OR 展示会 OR pop-up OR 팝업스토어) (애니 OR 게임 OR VTuber)`
    },
    {
      typeHint: "event",
      q: `${cityName} (주술회전 OR 홀로라이브 OR 니지산지 OR 呪術廻戦 OR ホロライブ OR にじさんじ) (콜라보 OR コラボ OR 특설전 OR 팝업 OR 카페)`
    }
  ];

  for (const focus of FRANCHISE_FOCUS_QUERIES) {
    templates.push({
      typeHint: focus.typeHint,
      genreHint: focus.genre,
      franchiseHint: focus.franchise,
      q: `${cityName} (${focus.terms.join(" OR ")}) (콜라보 카페 OR コラボカフェ OR 특설전 OR 전시 OR popup)`
    });
  }
  return templates;
}

async function fetchRssUsingRss2Json(rssUrl) {
  const url = `${RSS2JSON_ENDPOINT}?rss_url=${encodeURIComponent(rssUrl)}`;
  const t = timeoutSignal(9000);
  try {
    const res = await fetch(url, { signal: t.signal });
    if (!res.ok) throw new Error(`rss2json-http-${res.status}`);
    const data = await res.json();
    if (data.status !== "ok" || !Array.isArray(data.items)) {
      throw new Error("rss2json-invalid-response");
    }
    return data.items.slice(0, MAX_FEED_ITEMS).map((item) => ({
      title: item.title || "",
      link: item.link || "",
      pubDate: item.pubDate || "",
      description: item.description || "",
      sourceName: data.feed?.title || "Google News RSS"
    }));
  } finally {
    t.clear();
  }
}

async function fetchRssUsingAllOrigins(rssUrl) {
  if (typeof DOMParser === "undefined") {
    throw new Error("allorigins-domparser-unavailable");
  }
  const url = `${ALLORIGINS_RAW_ENDPOINT}${encodeURIComponent(rssUrl)}`;
  const t = timeoutSignal(9000);
  try {
    const res = await fetch(url, { signal: t.signal });
    if (!res.ok) throw new Error(`allorigins-http-${res.status}`);
    const xmlText = await res.text();
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const items = [...doc.querySelectorAll("item")];
    return items.slice(0, MAX_FEED_ITEMS).map((item) => ({
      title: item.querySelector("title")?.textContent || "",
      link: item.querySelector("link")?.textContent || "",
      pubDate: item.querySelector("pubDate")?.textContent || "",
      description: item.querySelector("description")?.textContent || "",
      sourceName: "Google News RSS"
    }));
  } finally {
    t.clear();
  }
}

function scoreRealtimeItem(item, cityKey, destinationRaw) {
  const text = `${item.name || ""} ${item.scheduleLabel || ""} ${item.venueHint || ""}`.toLowerCase();
  let score = 0;
  if (item.realtime) score += 7;
  if (item.type === "event") score += 15;
  if (item.type === "cafe") score += 12;
  if (item.type === "store") score += 4;
  for (const alias of CITY_TERMS[cityKey] || []) {
    if (text.includes(alias.toLowerCase())) score += 2;
  }
  if (destinationRaw && text.includes(destinationRaw.toLowerCase())) score += 3;
  const tags = item.tags || [];
  score += tags.length * 1.5;
  if (tags.includes("event")) score += 4;
  if (tags.includes("collab-cafe")) score += 5;
  if (item.franchise && item.franchise !== "종합/기타") score += 8;
  if (item.genre === "VTuber") score += 3;
  if (item.venueHint && !item.venueHint.includes("중심권") && item.venueHint !== "City Center") {
    score += 4;
  }
  if (item.publishedAtMs) {
    const ageDays = (Date.now() - item.publishedAtMs) / (24 * 60 * 60 * 1000);
    if (ageDays <= 3) score += 8;
    else if (ageDays <= 7) score += 6;
    else if (ageDays <= 14) score += 4;
    else if (ageDays <= 30) score += 2;
  }
  if (item.officialCheckRequired) score += 1;
  return score;
}

function toRealtimeSpot(raw, { cityKey, destinationRaw, template }) {
  const title = normalizeSpace(raw.title);
  const description = normalizeSpace(raw.description);
  const link = raw.link?.trim();
  const published = toDate(raw.pubDate);

  if (!title || !link) return null;
  if (!withinRecentWindow(published)) return null;

  const type = inferType(`${title} ${description}`, template.typeHint || "event");
  const mixedText = `${title} ${description}`;
  const tags = inferTags(`${title} ${description}`);
  const district = inferDistrict(cityKey, mixedText);
  const extractedFranchise = extractFranchise(mixedText);
  const franchise =
    extractedFranchise === "종합/기타" && template.franchiseHint
      ? template.franchiseHint
      : extractedFranchise;
  const extractedGenre = inferGenre(mixedText);
  const genre =
    extractedGenre === "Subculture" && template.genreHint ? template.genreHint : extractedGenre;
  const venueHint = inferVenueHint(cityKey, mixedText, district, destinationRaw);
  const dateLabel = published
    ? published.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    : "날짜 미상";
  const country = cityKey === "seoul" ? "KR" : cityKey === "tokyo" || cityKey === "osaka" ? "JP" : "UN";

  return {
    id: `rt-${cityKey}-${hashString(link)}`,
    city: cityKey,
    country,
    name: title,
    type,
    district,
    tags,
    genre,
    franchise,
    venueHint,
    schedule: { kind: "rolling", note: `실시간 수집 (${dateLabel} 기사)` },
    officialCheckRequired: true,
    source: link,
    mapsQuery: `${destinationRaw || cityKey || DEFAULT_CITY_LABEL} ${venueHint} ${franchise !== "종합/기타" ? franchise : type === "cafe" ? "collab cafe" : "anime event"}`,
    realtime: true,
    realtimeSource: raw.sourceName || "Google News RSS",
    publishedAtMs: published ? published.getTime() : 0
  };
}

export async function collectRealtimeSpots({
  cityKey,
  destinationRaw,
  maxItems = 12
} = {}) {
  const terms = CITY_TERMS[cityKey] || [destinationRaw || cityKey];
  const cityName = destinationRaw || terms[0] || DEFAULT_CITY_LABEL;
  const templates = buildQueryTemplates(cityName);

  const errors = [];
  const all = [];
  let successFeeds = 0;

  await Promise.all(
    templates.map(async (tpl) => {
      const rssUrl = buildGoogleNewsRssUrl(tpl.q);
      let items = [];

      try {
        items = await fetchRssUsingRss2Json(rssUrl);
      } catch (errRss2Json) {
        try {
          items = await fetchRssUsingAllOrigins(rssUrl);
        } catch (errFallback) {
          errors.push(
            `${tpl.typeHint}: ${errFallback?.message || errRss2Json?.message || "unknown-error"}`
          );
          return;
        }
      }

      successFeeds += 1;
      for (const item of items) {
        const mapped = toRealtimeSpot(item, {
          cityKey,
          destinationRaw: cityName,
          template: tpl
        });
        if (mapped) all.push(mapped);
      }
    })
  );

  const deduped = [];
  const seen = new Set();
  for (const item of all) {
    const key = `${item.source}|${item.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    item.score = scoreRealtimeItem(item, cityKey, cityName);
    deduped.push(item);
  }

  deduped.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.publishedAtMs || 0) - (a.publishedAtMs || 0);
  });

  return {
    spots: deduped.slice(0, Math.max(4, Math.min(maxItems, 30))),
    meta: {
      queriedAt: new Date().toISOString(),
      feedCount: templates.length,
      successFeeds,
      totalCollected: deduped.length,
      errors
    }
  };
}
