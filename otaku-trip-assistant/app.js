import { BASE_SPOTS, CITY_ALIASES, TAG_LABEL, TYPE_LABEL } from "./data.js";
import { collectRealtimeSpots } from "./realtime.js";

const STORAGE_KEY = "otaku_trip_assistant_v1";

const state = {
  results: [],
  filteredType: "all",
  itinerary: [],
  query: null,
  realtimeMeta: null
};

const els = {
  form: document.querySelector("#planner-form"),
  destination: document.querySelector("#destination"),
  startDate: document.querySelector("#start-date"),
  endDate: document.querySelector("#end-date"),
  pace: document.querySelector("#pace"),
  includeRecurring: document.querySelector("#include-recurring"),
  collabPriority: document.querySelector("#collab-priority"),
  liveFetch: document.querySelector("#live-fetch"),
  liveMax: document.querySelector("#live-max"),
  tagPool: document.querySelector("#tag-pool"),
  resetBtn: document.querySelector("#reset-btn"),
  hint: document.querySelector("#form-hint"),
  resultPanel: document.querySelector("#result-panel"),
  itineraryPanel: document.querySelector("#itinerary-panel"),
  resultSubtitle: document.querySelector("#result-subtitle"),
  liveMeta: document.querySelector("#live-meta"),
  kpiTotal: document.querySelector("#kpi-total"),
  kpiEvent: document.querySelector("#kpi-event"),
  kpiStore: document.querySelector("#kpi-store"),
  kpiCafe: document.querySelector("#kpi-cafe"),
  filterRow: document.querySelector("#filter-row"),
  genreBoard: document.querySelector("#genre-board"),
  cardList: document.querySelector("#card-list"),
  itineraryList: document.querySelector("#itinerary-list"),
  copyMd: document.querySelector("#copy-md")
};

function parseDate(input) {
  const parts = input.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

function formatDate(date) {
  return date.toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  });
}

function formatDateCompact(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeText(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function resolveCityKey(input) {
  const norm = normalizeText(input);
  if (!norm) return null;

  for (const [key, aliases] of Object.entries(CITY_ALIASES)) {
    if (aliases.some((item) => normalizeText(item) === norm)) return key;
    if (aliases.some((item) => norm.includes(normalizeText(item)))) return key;
  }
  return norm;
}

function isDateOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

function getTripMonths(startDate, endDate) {
  const months = new Set();
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    months.add(cursor.getMonth() + 1);
    cursor.setDate(cursor.getDate() + 1);
  }
  return months;
}

function evaluateSchedule(spot, startDate, endDate, includeRecurring) {
  const schedule = spot.schedule || { kind: "always", note: "상설" };

  if (schedule.kind === "always" || schedule.kind === "rolling") {
    return {
      available: true,
      label: schedule.note || "상설",
      officialCheckRequired: Boolean(spot.officialCheckRequired)
    };
  }

  if (schedule.kind === "range") {
    const s = parseDate(schedule.start);
    const e = parseDate(schedule.end);
    if (!s || !e) return { available: false };

    return {
      available: isDateOverlap(startDate, endDate, s, e),
      label: `${schedule.start} ~ ${schedule.end}`,
      officialCheckRequired: Boolean(spot.officialCheckRequired)
    };
  }

  if (schedule.kind === "recurring") {
    if (!includeRecurring) return { available: false };
    const tripMonths = getTripMonths(startDate, endDate);
    const hit = (schedule.months || []).some((month) => tripMonths.has(month));
    return {
      available: hit,
      label: schedule.note || "연례 개최",
      officialCheckRequired: true
    };
  }

  return { available: false };
}

function scoreSpot(spot, selectedTags, collabPriority) {
  let score = 18;
  const typeWeight = { event: 30, cafe: 26, store: 10, complex: 8 };
  score += typeWeight[spot.type] || 0;

  const overlap = spot.tags.filter((tag) => selectedTags.includes(tag)).length;
  score += overlap * 9;
  if (overlap > 0) score += 8;
  if (selectedTags.length > 0 && overlap === 0) score -= 4;

  if (spot.schedule?.kind === "range") score += 10;
  if (spot.schedule?.kind === "rolling") score += 6;
  if (spot.schedule?.kind === "recurring") score += 4;
  if (spot.officialCheckRequired) score += 1;
  if (spot.realtime) score += 15;
  if (spot.realtime && (spot.type === "event" || spot.type === "cafe")) score += 10;
  if (spot.franchise && spot.franchise !== "종합/기타") score += 6;
  if (spot.venueHint && !spot.venueHint.includes("중심권")) score += 2;
  if (spot.schedule?.kind === "always" && !spot.realtime) score -= 4;
  if (collabPriority && spot.type === "cafe") score += 14;

  return Math.max(0, score);
}

function mergeAndDedupeSpots(base, realtime) {
  const seenIds = new Set();
  const seenLinks = new Set();
  const merged = [];

  for (const item of [...base, ...realtime]) {
    const idKey = item.id || "";
    const linkKey = item.source || "";
    if (idKey && seenIds.has(idKey)) continue;
    if (linkKey && seenLinks.has(linkKey)) continue;

    if (idKey) seenIds.add(idKey);
    if (linkKey) seenLinks.add(linkKey);
    merged.push(item);
  }
  return merged;
}

function collectSelectedTags() {
  return Array.from(document.querySelectorAll('input[name="interest-tag"]:checked')).map(
    (el) => el.value
  );
}

function getDateRangeList(startDate, endDate) {
  const days = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function createItinerary(candidates, startDate, endDate, pace) {
  const slotsByPace = {
    relaxed: ["10:30", "14:30", "18:30"],
    balanced: ["10:00", "13:00", "16:00", "19:30"],
    hardcore: ["09:30", "12:00", "14:30", "17:00", "20:00"]
  };

  const slots = slotsByPace[pace] || slotsByPace.balanced;
  const days = getDateRangeList(startDate, endDate);
  const maxItems = days.length * slots.length;
  const picked = candidates.slice(0, maxItems);

  const remaining = [...picked];
  const itinerary = [];
  let prevDistrict = null;

  for (const day of days) {
    if (remaining.length === 0) break;
    const districtCount = new Map();
    for (const item of remaining) {
      districtCount.set(item.district, (districtCount.get(item.district) || 0) + 1);
    }

    const districtOrder = [...districtCount.entries()].sort((a, b) => b[1] - a[1]);
    const preferred =
      districtOrder.find(([district]) => district !== prevDistrict)?.[0] ||
      districtOrder[0]?.[0] ||
      "Mixed";

    const dayItems = [];
    for (const item of [...remaining]) {
      if (dayItems.length >= slots.length) break;
      if (item.district === preferred) {
        dayItems.push(item);
        remaining.splice(remaining.indexOf(item), 1);
      }
    }
    for (const item of [...remaining]) {
      if (dayItems.length >= slots.length) break;
      dayItems.push(item);
      remaining.splice(remaining.indexOf(item), 1);
    }

    itinerary.push({
      date: day,
      district: preferred,
      items: dayItems.map((item, index) => ({ ...item, slot: slots[index] }))
    });
    prevDistrict = preferred;
  }

  return itinerary;
}

function buildMarkdownPlan() {
  const q = state.query;
  if (!q) return "";
  const lines = [];
  lines.push(`# 오타쿠 여행 일정안 - ${q.destinationRaw}`);
  lines.push("");
  lines.push(`- 기간: ${q.start} ~ ${q.end}`);
  lines.push(`- 여행 강도: ${q.paceLabel}`);
  lines.push(`- 관심 태그: ${q.tagLabels.length ? q.tagLabels.join(", ") : "전체"}`);
  lines.push(`- 실시간 수집: ${state.realtimeMeta?.enabled ? `사용 (반영 ${state.realtimeMeta.collected}개)` : "사용 안 함"}`);
  lines.push("");
  lines.push("## 장르/IP 이벤트 브리핑");
  for (const group of buildGenreGroups()) {
    lines.push(`- ${group.genre}`);
    for (const bucket of group.buckets) {
      const place = bucket.items[0]?.venueHint || bucket.items[0]?.district || "-";
      lines.push(`  - ${bucket.franchise}: ${place} (${bucket.items.length}건)`);
    }
  }
  lines.push("");
  lines.push("## 추천 장소");
  for (const item of state.results) {
    const tags = item.tags.map((tag) => TAG_LABEL[tag] || tag).join(", ");
    lines.push(`- **${item.name}** (${TYPE_LABEL[item.type]})`);
    lines.push(`  - 지역: ${item.district}`);
    lines.push(`  - 일정: ${item.scheduleLabel}`);
    if (item.genre) lines.push(`  - 장르: ${item.genre}`);
    if (item.franchise && item.franchise !== "종합/기타") lines.push(`  - IP: ${item.franchise}`);
    if (item.venueHint) lines.push(`  - 장소 힌트: ${item.venueHint}`);
    lines.push(`  - 태그: ${tags}`);
    lines.push(`  - 링크: ${item.source}`);
    if (item.realtimeSource) {
      lines.push(`  - 실시간 출처: ${item.realtimeSource}`);
    }
    if (item.officialCheckRequired) {
      lines.push("  - 주의: 공식 일정 최종 확인 필요");
    }
  }
  lines.push("");
  lines.push("## 일자별 플랜");
  for (const day of state.itinerary) {
    lines.push(`### ${formatDateCompact(day.date)} (${day.district})`);
    for (const item of day.items) {
      lines.push(`- ${item.slot} ${item.name} (${TYPE_LABEL[item.type]})`);
    }
  }
  return lines.join("\n");
}

function setHint(message, isError = false) {
  els.hint.textContent = message;
  els.hint.style.color = isError ? "var(--danger)" : "var(--ink-soft)";
}

function getEventFocusedItems() {
  const realtimeFocused = state.results.filter(
    (item) => item.realtime && (item.type === "event" || item.type === "cafe")
  );
  if (realtimeFocused.length > 0) return realtimeFocused;
  return state.results.filter((item) => item.type === "event" || item.type === "cafe");
}

function buildGenreGroups() {
  const items = getEventFocusedItems().slice(0, 30);
  const byGenre = new Map();
  for (const item of items) {
    const genre = item.genre || "Subculture";
    const franchise = item.franchise || "종합/기타";
    if (!byGenre.has(genre)) byGenre.set(genre, new Map());
    const bucketMap = byGenre.get(genre);
    if (!bucketMap.has(franchise)) bucketMap.set(franchise, []);
    bucketMap.get(franchise).push(item);
  }

  const groups = [];
  for (const [genre, bucketMap] of byGenre.entries()) {
    const buckets = [...bucketMap.entries()]
      .map(([franchise, bucketItems]) => ({
        franchise,
        items: bucketItems.sort((a, b) => b.score - a.score).slice(0, 3)
      }))
      .sort((a, b) => {
        const aTop = a.items[0]?.score || 0;
        const bTop = b.items[0]?.score || 0;
        return bTop - aTop;
      });
    groups.push({ genre, buckets });
  }

  return groups.sort((a, b) => {
    const aTop = a.buckets[0]?.items[0]?.score || 0;
    const bTop = b.buckets[0]?.items[0]?.score || 0;
    return bTop - aTop;
  });
}

function renderGenreBoard() {
  if (!els.genreBoard) return;
  els.genreBoard.innerHTML = "";
  const groups = buildGenreGroups();
  if (groups.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "장르별 이벤트를 표시할 데이터가 아직 없습니다.";
    els.genreBoard.append(empty);
    return;
  }

  const head = document.createElement("p");
  head.className = "genre-headline";
  head.textContent = "지금 진행 중인 이벤트를 장르/IP별로 묶어서 보여줍니다.";
  els.genreBoard.append(head);

  for (const group of groups) {
    const block = document.createElement("article");
    block.className = "genre-group";

    const title = document.createElement("h3");
    title.className = "genre-title";
    title.textContent = group.genre;
    block.append(title);

    for (const bucket of group.buckets) {
      const bucketBox = document.createElement("div");
      bucketBox.className = "franchise-box";

      const bucketTitle = document.createElement("strong");
      bucketTitle.className = "franchise-title";
      bucketTitle.textContent = bucket.franchise;
      bucketBox.append(bucketTitle);

      for (const item of bucket.items) {
        const row = document.createElement("div");
        row.className = "franchise-row";

        const left = document.createElement("div");
        left.className = "franchise-info";

        const name = document.createElement("span");
        name.className = "franchise-item-title";
        name.textContent = item.name;
        left.append(name);

        const meta = document.createElement("span");
        meta.className = "franchise-meta";
        meta.textContent = `장소 ${item.venueHint || item.district || "-"} · ${TYPE_LABEL[item.type] || item.type}`;
        left.append(meta);

        row.append(left);

        const link = document.createElement("a");
        link.href = item.source;
        link.target = "_blank";
        link.rel = "noreferrer noopener";
        link.textContent = "링크";
        row.append(link);

        bucketBox.append(row);
      }
      block.append(bucketBox);
    }
    els.genreBoard.append(block);
  }
}

function renderCards() {
  const filter = state.filteredType;
  const visible =
    filter === "all" ? state.results : state.results.filter((item) => item.type === filter);

  els.cardList.innerHTML = "";
  if (visible.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "조건에 맞는 장소가 없습니다. 태그를 줄이거나 기간을 넓혀보세요.";
    els.cardList.append(empty);
    return;
  }

  for (const item of visible) {
    const card = document.createElement("article");
    card.className = "spot-card";

    const top = document.createElement("div");
    top.className = "spot-top";

    const title = document.createElement("h3");
    title.className = "spot-title";
    title.textContent = item.name;
    top.append(title);

    const badge = document.createElement("span");
    badge.className = `type-badge type-${item.type}`;
    badge.textContent = TYPE_LABEL[item.type] || item.type;
    top.append(badge);
    card.append(top);

    const meta = document.createElement("div");
    meta.className = "meta";

    const district = document.createElement("span");
    district.className = "chip";
    district.textContent = `지역 ${item.district}`;
    meta.append(district);

    const schedule = document.createElement("span");
    schedule.className = "chip";
    schedule.textContent = `일정 ${item.scheduleLabel}`;
    meta.append(schedule);

    if (item.genre) {
      const genre = document.createElement("span");
      genre.className = "chip";
      genre.textContent = `장르 ${item.genre}`;
      meta.append(genre);
    }

    if (item.franchise && item.franchise !== "종합/기타") {
      const franchise = document.createElement("span");
      franchise.className = "chip";
      franchise.textContent = `IP ${item.franchise}`;
      meta.append(franchise);
    }

    if (item.venueHint) {
      const venue = document.createElement("span");
      venue.className = "chip";
      venue.textContent = `장소 ${item.venueHint}`;
      meta.append(venue);
    }

    if (item.officialCheckRequired) {
      const warn = document.createElement("span");
      warn.className = "chip warn-chip";
      warn.textContent = "공식 일정 확인 필요";
      meta.append(warn);
    }
    card.append(meta);

    const note = document.createElement("p");
    note.className = "spot-note";
    const tagText = item.tags.slice(0, 4).map((tag) => TAG_LABEL[tag] || tag).join(" · ");
    note.textContent = `${tagText} · 추천 점수 ${item.score}`;
    card.append(note);

    const links = document.createElement("div");
    links.className = "card-links";

    const sourceLink = document.createElement("a");
    sourceLink.href = item.source;
    sourceLink.target = "_blank";
    sourceLink.rel = "noreferrer noopener";
    sourceLink.textContent = "공식/참고 링크";
    links.append(sourceLink);

    const mapLink = document.createElement("a");
    mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      item.mapsQuery || item.name
    )}`;
    mapLink.target = "_blank";
    mapLink.rel = "noreferrer noopener";
    mapLink.textContent = "지도 열기";
    links.append(mapLink);

    card.append(links);
    els.cardList.append(card);
  }
}

function renderItinerary() {
  els.itineraryList.innerHTML = "";
  if (state.itinerary.length === 0) return;

  for (const day of state.itinerary) {
    const block = document.createElement("article");
    block.className = "day-block";

    const head = document.createElement("header");
    head.className = "day-head";

    const dayTitle = document.createElement("strong");
    dayTitle.textContent = formatDate(day.date);
    head.append(dayTitle);

    const district = document.createElement("span");
    district.className = "day-district";
    district.textContent = `주요 동선: ${day.district}`;
    head.append(district);

    block.append(head);

    const timeline = document.createElement("div");
    timeline.className = "timeline";
    for (const item of day.items) {
      const card = document.createElement("article");
      card.className = "timeline-item";

      const slot = document.createElement("div");
      slot.className = "slot";
      slot.textContent = item.slot;
      card.append(slot);

      const title = document.createElement("div");
      title.className = "title";
      title.textContent = item.name;
      card.append(title);

      const small = document.createElement("div");
      small.className = "small";
      small.textContent = `${TYPE_LABEL[item.type]} · ${item.district}`;
      card.append(small);

      timeline.append(card);
    }
    block.append(timeline);
    els.itineraryList.append(block);
  }
}

function updateKpi() {
  const count = state.results.length;
  const eventCount = state.results.filter((item) => item.type === "event").length;
  const cafeCount = state.results.filter((item) => item.type === "cafe").length;
  const storeCount = state.results.filter((item) => item.type === "store" || item.type === "complex")
    .length;

  els.kpiTotal.textContent = String(count);
  els.kpiEvent.textContent = String(eventCount);
  els.kpiStore.textContent = String(storeCount);
  els.kpiCafe.textContent = String(cafeCount);
}

function renderRealtimeMeta() {
  const meta = state.realtimeMeta;
  if (!meta) {
    els.liveMeta.textContent = "";
    return;
  }
  if (!meta.enabled) {
    els.liveMeta.textContent = "실시간 수집: 사용 안 함";
    return;
  }

  const base = `실시간 수집: ${meta.collected}개 반영 (피드 ${meta.successFeeds}/${meta.feedCount} 성공)`;
  if (meta.errors?.length) {
    els.liveMeta.textContent = `${base} · 일부 피드 실패(${meta.errors.length})`;
  } else {
    els.liveMeta.textContent = base;
  }
}

function renderAll() {
  updateKpi();
  renderRealtimeMeta();
  renderGenreBoard();
  renderCards();
  renderItinerary();
}

function saveFormState() {
  const payload = {
    destination: els.destination.value,
    startDate: els.startDate.value,
    endDate: els.endDate.value,
    pace: els.pace.value,
    includeRecurring: els.includeRecurring.checked,
    collabPriority: els.collabPriority.checked,
    liveFetch: els.liveFetch.checked,
    liveMax: Number.parseInt(els.liveMax.value, 10) || 12,
    selectedTags: collectSelectedTags()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function restoreFormState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    els.destination.value = parsed.destination || "";
    els.startDate.value = parsed.startDate || "";
    els.endDate.value = parsed.endDate || "";
    els.pace.value = parsed.pace || "balanced";
    els.includeRecurring.checked = parsed.includeRecurring ?? true;
    els.collabPriority.checked = parsed.collabPriority ?? false;
    els.liveFetch.checked = parsed.liveFetch ?? true;
    els.liveMax.value = String(parsed.liveMax || 12);

    const selected = new Set(parsed.selectedTags || []);
    for (const input of document.querySelectorAll('input[name="interest-tag"]')) {
      input.checked = selected.has(input.value);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function setDefaultDatesIfEmpty() {
  if (els.startDate.value && els.endDate.value) return;
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() + 14);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  if (!els.startDate.value) els.startDate.value = formatDateCompact(start);
  if (!els.endDate.value) els.endDate.value = formatDateCompact(end);
}

function createTagInputs() {
  const keys = Object.keys(TAG_LABEL);
  for (const key of keys) {
    const label = document.createElement("label");
    label.className = "tag-pill";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "interest-tag";
    input.value = key;

    const span = document.createElement("span");
    span.textContent = TAG_LABEL[key];

    label.append(input, span);
    els.tagPool.append(label);
  }
}

async function onSubmit(event) {
  event.preventDefault();
  const destinationRaw = els.destination.value.trim();
  const cityKey = resolveCityKey(destinationRaw);
  const startDate = parseDate(els.startDate.value);
  const endDate = parseDate(els.endDate.value);

  if (!destinationRaw) {
    setHint("여행지를 입력해 주세요.", true);
    return;
  }
  if (!startDate || !endDate) {
    setHint("출발일/도착일을 모두 입력해 주세요.", true);
    return;
  }
  if (startDate > endDate) {
    setHint("도착일은 출발일 이후여야 합니다.", true);
    return;
  }
  const dayCount = getDateRangeList(startDate, endDate).length;
  if (dayCount > 14) {
    setHint("현재 버전은 최대 14일 일정까지 최적화되어 있습니다.", true);
    return;
  }

  const selectedTags = collectSelectedTags();
  const includeRecurring = els.includeRecurring.checked;
  const collabPriority = els.collabPriority.checked;
  const liveFetchEnabled = els.liveFetch.checked;
  const liveMax = Math.max(4, Math.min(30, Number.parseInt(els.liveMax.value, 10) || 12));

  const citySpots = BASE_SPOTS.filter((spot) => spot.city === cityKey);
  let realtimeSpots = [];
  let realtimeMeta = {
    enabled: liveFetchEnabled,
    feedCount: 0,
    successFeeds: 0,
    collected: 0,
    errors: []
  };

  if (liveFetchEnabled) {
    setHint("실시간 이벤트 수집 중입니다...");
    try {
      const realtime = await collectRealtimeSpots({
        cityKey,
        destinationRaw,
        maxItems: liveMax
      });
      realtimeSpots = realtime.spots;
      realtimeMeta = {
        enabled: true,
        feedCount: realtime.meta.feedCount,
        successFeeds: realtime.meta.successFeeds,
        collected: realtime.spots.length,
        errors: realtime.meta.errors
      };
    } catch (error) {
      realtimeMeta = {
        enabled: true,
        feedCount: 0,
        successFeeds: 0,
        collected: 0,
        errors: [error?.message || "실시간 수집 실패"]
      };
    }
  }

  const candidateSpots = mergeAndDedupeSpots(citySpots, realtimeSpots);
  if (candidateSpots.length === 0) {
    els.resultPanel.classList.add("hidden");
    els.itineraryPanel.classList.add("hidden");
    const msg = liveFetchEnabled
      ? "후보를 찾지 못했습니다. 도시명 또는 날짜/태그를 조정해 주세요."
      : "현재 기본 데이터셋에서 해당 여행지를 찾지 못했습니다. (도쿄/오사카/서울 + 실시간 수집 권장)";
    setHint(msg, true);
    saveFormState();
    return;
  }

  const scored = [];
  for (const spot of candidateSpots) {
    const availability = evaluateSchedule(spot, startDate, endDate, includeRecurring);
    if (!availability.available) continue;

    scored.push({
      ...spot,
      scheduleLabel: availability.label,
      officialCheckRequired: availability.officialCheckRequired || false,
      score: scoreSpot(spot, selectedTags, collabPriority)
    });
  }

  scored.sort((a, b) => b.score - a.score);

  state.results = scored;
  state.filteredType = "all";
  state.itinerary = createItinerary(scored, startDate, endDate, els.pace.value);
  state.realtimeMeta = realtimeMeta;
  state.query = {
    destinationRaw,
    cityKey,
    start: els.startDate.value,
    end: els.endDate.value,
    paceLabel: els.pace.options[els.pace.selectedIndex].textContent,
    tagLabels: selectedTags.map((tag) => TAG_LABEL[tag]).filter(Boolean)
  };

  for (const chip of els.filterRow.querySelectorAll(".filter-chip")) {
    chip.classList.toggle("active", chip.dataset.filter === "all");
  }

  els.resultSubtitle.textContent = `${destinationRaw} · ${els.startDate.value} ~ ${els.endDate.value} · ${dayCount}일`;
  els.resultPanel.classList.remove("hidden");
  els.itineraryPanel.classList.remove("hidden");
  renderAll();
  const realtimeText =
    liveFetchEnabled && realtimeMeta.collected > 0
      ? ` 실시간 ${realtimeMeta.collected}개가 추가되었습니다.`
      : "";
  setHint(`총 ${scored.length}개의 후보를 찾았습니다.${realtimeText} 공식 일정 확인이 필요한 이벤트는 카드에서 확인하세요.`);
  saveFormState();
}

function bindEvents() {
  els.form.addEventListener("submit", onSubmit);

  els.filterRow.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-chip");
    if (!button) return;
    state.filteredType = button.dataset.filter;
    for (const chip of els.filterRow.querySelectorAll(".filter-chip")) {
      chip.classList.toggle("active", chip === button);
    }
    renderCards();
  });

  els.copyMd.addEventListener("click", async () => {
    const text = buildMarkdownPlan();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setHint("마크다운 일정안이 클립보드에 복사되었습니다.");
    } catch {
      setHint("브라우저 보안 설정으로 복사 실패. 개발자도구 콘솔에서 수동 복사해 주세요.", true);
      console.log(text);
    }
  });

  els.resetBtn.addEventListener("click", () => {
    els.form.reset();
    for (const input of document.querySelectorAll('input[name="interest-tag"]')) {
      input.checked = false;
    }
    setDefaultDatesIfEmpty();
    setHint("입력을 초기화했습니다.");
    localStorage.removeItem(STORAGE_KEY);
  });

  els.form.addEventListener("change", saveFormState);
  els.form.addEventListener("input", saveFormState);
}

function init() {
  createTagInputs();
  restoreFormState();
  setDefaultDatesIfEmpty();
  bindEvents();
}

init();
