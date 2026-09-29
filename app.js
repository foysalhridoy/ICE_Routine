/**
 * DIU ICE Routine Generator - Application Controller
 * Premium UX with Google Sans & Bengali Typography, Verified Faculty Integration & Responsive Layouts
 */

// Application State
const state = {
  routine: null,
  routineUpdates: [],
  selectedBatch: "L1T1",
  activeView: "batch", // "batch" | "master" | "teacher" | "room" | "courses"
  courseLevelFilter: "all",
  courseSearchQuery: "",
  dayFilter: "all", // "all" | "today"
  searchQuery: "",
  displayMode: localStorage.getItem("ice_display_mode") || "table", // "table" | "cards"
  theme: "light",
  defaultSheetUrl: "https://docs.google.com/spreadsheets/d/12o-rgXoLFpLKPMNdpqNJwF8y2r1CzgEx45TsUJafVTY/edit?pli=1&gid=1763419013#gid=1763419013",
  selectedTeacher: null,
  selectedRoom: null,
  currentModalInitial: null
};

if (typeof window !== "undefined") {
  window.state = state;
}

/**
 * Switch batch and view safely
 */
function switchBatch(batch) {
  state.selectedBatch = batch;
  state.activeView = "batch";
  updateViewTabs();
  document.querySelectorAll(".batch-chip").forEach(c => {
    c.classList.toggle("active", c.textContent.trim() === batch);
  });
  renderStats();
  renderCurrentView();
}
if (typeof window !== "undefined") {
  window.switchBatch = switchBatch;
}

// DOM Element References
const elements = {
  sheetUrlInput: document.getElementById("sheetUrlInput"),
  btnFetchSheet: document.getElementById("btnFetchSheet"),
  btnUploadFile: document.getElementById("btnUploadFile"),
  fileInput: document.getElementById("fileInput"),
  sheetStatus: document.getElementById("sheetStatus"),
  batchChipsContainer: document.getElementById("batchChipsContainer"),
  statsBanner: document.getElementById("statsBanner"),
  routineDisplayArea: document.getElementById("routineDisplayArea"),
  viewTabs: document.querySelectorAll(".nav-tab-btn"),

  searchInput: document.getElementById("searchInput"),
  searchClearBtn: document.getElementById("searchClearBtn"),
  headerCloudBadge: document.getElementById("headerCloudBadge"),
  facultyModalOverlay: document.getElementById("facultyModalOverlay"),
  modalCloseBtn: document.getElementById("modalCloseBtn"),
  facultyModalPhoto: document.getElementById("facultyModalPhoto"),
  facultyModalName: document.getElementById("facultyModalName"),
  facultyModalDesignation: document.getElementById("facultyModalDesignation"),
  facultyModalDept: document.getElementById("facultyModalDept"),
  facultyModalInitial: document.getElementById("facultyModalInitial"),
  facultyModalLink: document.getElementById("facultyModalLink"),
  facultyModalClassesCount: document.getElementById("facultyModalClassesCount"),
  btnFacultyViewAllClasses: document.getElementById("btnFacultyViewAllClasses"),
  routineNewsTicker: document.getElementById("routineNewsTicker"),
  tickerTrack: document.getElementById("tickerTrack")
};

/**
 * Real-time class status for today:
 * Strictly indicates currently active/running class only.
 * No upcoming, next up, or completed badges to keep all timetable cells clean, fully visible, and normal.
 */
function getClassTimeState(timeStr, dayName) {
  if (!timeStr) return null;
  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  if (dayName.toLowerCase() !== currentDayName.toLowerCase()) return null;

  const parts = timeStr.split(/[-–—]/);
  if (parts.length < 2) return null;

  function parseTimeToMinutes(tStr) {
    if (!tStr) return null;
    const match = tStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    let period = (match[3] || "").toUpperCase();

    if (!period) {
      if (h >= 1 && h <= 7) {
        period = "PM";
      } else if (h === 12) {
        period = "PM";
      } else {
        period = "AM";
      }
    }

    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    return h * 60 + m;
  }

  const startM = parseTimeToMinutes(parts[0]);
  const endM = parseTimeToMinutes(parts[1]);
  if (startM === null || endM === null) return null;

  const now = new Date();
  const currentM = now.getHours() * 60 + now.getMinutes();

  if (currentM >= startM && currentM < endM) {
    const remaining = endM - currentM;
    return {
      state: 'now',
      badgeText: `Live Now`,
      remainingText: `${remaining}m left`,
      badge: `<span class="live-class-badge badge-now"><span class="badge-beacon"><span class="beacon-wave"></span><span class="beacon-core"></span></span><span class="badge-label">LIVE NOW</span></span>`
    };
  }

  // All other times return null so cards/cells remain completely normal with no disappearing/fading
  return null;
}

/**
 * Clear search filter action
 */
function clearSearchFilter() {
  state.searchQuery = "";
  if (elements.searchInput) elements.searchInput.value = "";
  if (elements.searchClearBtn) elements.searchClearBtn.classList.remove("visible");
  renderCurrentView();
}
window.clearSearchFilter = clearSearchFilter;

/**
 * Switch Day Filter (All Days vs Today Only)
 */
function setDayFilter(filter) {
  state.dayFilter = filter;
  renderCurrentView();
}
window.setDayFilter = setDayFilter;

/**
 * Show a modern toast notification
 */
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-dot ${type}"></span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(4px) scale(0.95)';
    setTimeout(() => {
      toast.remove ? toast.remove() : toast.parentNode?.removeChild(toast);
    }, 150);
  }, 1400);
}

/**
 * Ensure Clean White Theme
 */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", "light");
}

/**
 * Toggle Sheet Configuration Drawer on Mobile
 */
function toggleSheetDrawer() {
  const content = document.getElementById("sheetBarContent");
  const arrow = document.getElementById("drawerArrow");
  const btn = document.getElementById("mobileSheetToggleBar");
  if (!content) return;

  const isExpanded = content.classList.contains("expanded");
  if (isExpanded) {
    content.classList.remove("expanded");
    if (arrow) arrow.textContent = "▾";
    if (btn) btn.setAttribute("aria-expanded", "false");
  } else {
    content.classList.add("expanded");
    if (arrow) arrow.textContent = "▴";
    if (btn) btn.setAttribute("aria-expanded", "true");
  }
}
window.toggleSheetDrawer = toggleSheetDrawer;

/**
 * Initialize default sheet URL
 */
function initSheetInput() {
  if (elements.sheetUrlInput) {
    elements.sheetUrlInput.value = state.defaultSheetUrl;
  }
}

/**
 * Firebase Cloud Sync Management
 */
function updateCloudSyncUI() {
  // Real-time Cloud sync runs silently in background
}

/* ==========================================================================
   ROUTINE NEWS TICKER & EXCEL CHANGE DETECTION ENGINE (3-DAY PERSISTENCE)
   ========================================================================== */

const ROUTINE_UPDATE_RETENTION_MS = 3 * 24 * 60 * 60 * 1000; // 3 Consecutive Days (72 Hours)

/**
 * Format timestamp into human-readable relative time (e.g. "Just now", "25m ago", "2h ago", "Yesterday", "2d ago")
 */
function formatTimeAgo(isoString) {
  if (!isoString) return "";
  try {
    const time = new Date(isoString).getTime();
    if (!time || isNaN(time)) return "";
    const diffMs = Date.now() - time;
    if (diffMs < 0 || isNaN(diffMs)) return "Just now";
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  } catch (e) {
    return "";
  }
}

/**
 * Filter updates list to only keep items recorded within the last 3 days.
 * If 3 consecutive days pass without any update, returns empty array.
 */
function getActiveRoutineUpdates(updatesList) {
  if (!Array.isArray(updatesList)) return [];
  const now = Date.now();

  return updatesList.filter(item => {
    if (!item || !item.batch || !item.day) return false;
    const itemTimestamp = item.timestamp ? new Date(item.timestamp).getTime() : 0;
    if (!itemTimestamp || isNaN(itemTimestamp)) return true;
    return (now - itemTimestamp) <= ROUTINE_UPDATE_RETENTION_MS;
  });
}

/**
 * Merge existing active updates with new incoming changes, avoiding duplicates
 * for the same batch & day while giving priority to the newest timestamp.
 */
function mergeRoutineUpdates(existingUpdates, newChanges) {
  const list = Array.isArray(newChanges) ? [...newChanges] : [];
  const handledKeys = new Set(list.map(c => `${c.batch}_${c.day}`));

  if (Array.isArray(existingUpdates)) {
    for (const oldItem of existingUpdates) {
      if (!oldItem || !oldItem.batch || !oldItem.day) continue;
      const key = `${oldItem.batch}_${oldItem.day}`;
      if (!handledKeys.has(key)) {
        list.push(oldItem);
        handledKeys.add(key);
      }
    }
  }

  return getActiveRoutineUpdates(list);
}

/**
 * Detect schedule differences between two routine datasets.
 * Compares batch-by-batch and day-by-day.
 * Generates exact notifications like:
 * "L1T1 updated on Saturday schedule"
 */
function detectRoutineChanges(oldBatches, newBatches) {
  if (!oldBatches || typeof oldBatches !== "object") return [];
  if (!newBatches || typeof newBatches !== "object") return [];

  const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const changes = [];

  const allBatches = Array.from(new Set([
    ...Object.keys(oldBatches),
    ...Object.keys(newBatches)
  ])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  for (const batch of allBatches) {
    const oldSched = oldBatches[batch] || {};
    const newSched = newBatches[batch] || {};

    for (const day of days) {
      const oldClasses = Array.isArray(oldSched[day]) ? oldSched[day] : [];
      const newClasses = Array.isArray(newSched[day]) ? newSched[day] : [];

      const serializeClasses = (list) => {
        return list
          .map(c => `${c.courseCode || ""}|${c.room || ""}|${c.teacher || ""}|${c.time || ""}`)
          .sort()
          .join(";;");
      };

      const oldSig = serializeClasses(oldClasses);
      const newSig = serializeClasses(newClasses);

      if (oldSig !== newSig) {
        changes.push({
          batch: batch,
          day: day,
          message: `${batch} updated on ${day} schedule`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  return changes;
}

/**
 * Process routine update against saved baseline snapshot.
 * Persists updates for 3 full days. Only shows "No updates" fallback
 * if no update has arrived in 3 consecutive days.
 */
function processRoutineDataUpdate(newRoutine, isInitial = false, cloudUpdates = null) {
  if (!newRoutine || !newRoutine.batches) return;

  try {
    localStorage.setItem("diu_ice_cached_routine", JSON.stringify(newRoutine));
  } catch (e) {}

  // 1. If cloud delivered explicit updates
  if (Array.isArray(cloudUpdates)) {
    const activeCloud = getActiveRoutineUpdates(cloudUpdates);

    let storedUpdates = [];
    try {
      const raw = localStorage.getItem("diu_ice_routine_updates");
      if (raw) storedUpdates = JSON.parse(raw);
    } catch (e) {}
    const activeStored = getActiveRoutineUpdates(storedUpdates);

    const merged = mergeRoutineUpdates(activeStored, activeCloud);

    if (merged.length > 0) {
      state.routineUpdates = merged;
      try {
        localStorage.setItem("diu_ice_routine_updates", JSON.stringify(merged));
        localStorage.setItem("diu_ice_routine_snapshot", JSON.stringify(newRoutine.batches));
      } catch (e) {}
      renderNewsTicker(merged);
    } else {
      state.routineUpdates = [];
      try {
        localStorage.removeItem("diu_ice_routine_updates");
        localStorage.setItem("diu_ice_routine_snapshot", JSON.stringify(newRoutine.batches));
      } catch (e) {}
      renderNewsTicker([]);
    }
    return;
  }

  const cachedSnapshotStr = localStorage.getItem("diu_ice_routine_snapshot");

  if (!cachedSnapshotStr) {
    // First time baseline initialization
    try {
      localStorage.setItem("diu_ice_routine_snapshot", JSON.stringify(newRoutine.batches));
    } catch (e) {}

    let storedUpdates = [];
    try {
      const raw = localStorage.getItem("diu_ice_routine_updates");
      if (raw) storedUpdates = JSON.parse(raw);
    } catch (e) {}

    const active = getActiveRoutineUpdates(storedUpdates);
    if (active.length > 0) {
      state.routineUpdates = active;
      renderNewsTicker(active);
    } else {
      state.routineUpdates = [];
      renderNewsTicker([]);
    }
    return;
  }

  try {
    const oldBatches = JSON.parse(cachedSnapshotStr);
    const newChanges = detectRoutineChanges(oldBatches, newRoutine.batches);

    if (newChanges.length > 0) {
      // New routine differences detected!
      let storedUpdates = [];
      try {
        const raw = localStorage.getItem("diu_ice_routine_updates");
        if (raw) storedUpdates = JSON.parse(raw);
      } catch (e) {}
      const activeStored = getActiveRoutineUpdates(storedUpdates);

      const merged = mergeRoutineUpdates(activeStored, newChanges);
      state.routineUpdates = merged;

      localStorage.setItem("diu_ice_routine_updates", JSON.stringify(merged));
      localStorage.setItem("diu_ice_routine_snapshot", JSON.stringify(newRoutine.batches));
      localStorage.setItem("diu_ice_routine_last_update_time", new Date().toISOString());

      renderNewsTicker(merged);

      if (!isInitial) {
        showToast(`${newChanges.length} updates`, "success");
      }
    } else {
      // No changes detected in this load/sync against the baseline snapshot.
      // Retain active updates for 3 full days! DO NOT CLEAR THEM!
      let storedUpdates = [];
      try {
        const raw = localStorage.getItem("diu_ice_routine_updates");
        if (raw) storedUpdates = JSON.parse(raw);
      } catch (e) {}
      if (!storedUpdates.length && Array.isArray(state.routineUpdates)) {
        storedUpdates = state.routineUpdates;
      }

      const active = getActiveRoutineUpdates(storedUpdates);

      if (active.length > 0) {
        // Still within 3-day active window
        state.routineUpdates = active;
        localStorage.setItem("diu_ice_routine_updates", JSON.stringify(active));
        renderNewsTicker(active);
      } else {
        // 3 consecutive days have passed with no updates!
        state.routineUpdates = [];
        localStorage.removeItem("diu_ice_routine_updates");
        renderNewsTicker([]);
      }
    }
  } catch (err) {
    console.warn("Routine update processing error:", err);
    try {
      localStorage.setItem("diu_ice_routine_snapshot", JSON.stringify(newRoutine.batches));
    } catch (e) {}
    let storedUpdates = [];
    try {
      const raw = localStorage.getItem("diu_ice_routine_updates");
      if (raw) storedUpdates = JSON.parse(raw);
    } catch (e) {}
    const active = getActiveRoutineUpdates(storedUpdates);
    state.routineUpdates = active;
    renderNewsTicker(active);
  }
}

/**
 * Periodically prune routine updates older than 3 days and refresh ticker
 */
function checkAndPruneRoutineUpdates() {
  if (!state.routineUpdates || state.routineUpdates.length === 0) return;
  const active = getActiveRoutineUpdates(state.routineUpdates);
  if (active.length !== state.routineUpdates.length) {
    state.routineUpdates = active;
    if (active.length > 0) {
      try {
        localStorage.setItem("diu_ice_routine_updates", JSON.stringify(active));
      } catch (e) {}
    } else {
      try {
        localStorage.removeItem("diu_ice_routine_updates");
      } catch (e) {}
    }
    renderNewsTicker(active);
  }
}

/**
 * Render news ticker with ultra-stylish visuals.
 * No tick sign (✓) is used anywhere.
 * If updates exist within 3 days: shows lively scrolling micro-cards with batch, day, and time ago.
 * If 3 consecutive days pass without updates: shows the requested fallback notice.
 */
function renderNewsTicker(updates = []) {
  if (!elements.routineNewsTicker || !elements.tickerTrack) return;

  const ticker = elements.routineNewsTicker;
  const track = elements.tickerTrack;

  track.innerHTML = "";

  const activeUpdates = getActiveRoutineUpdates(updates);

  if (activeUpdates.length > 0) {
    ticker.classList.add("has-updates");

    const singleGroupItems = () => {
      return activeUpdates.map((item) => {
        const timeAgo = formatTimeAgo(item.timestamp);
        const timePill = timeAgo ? `<span class="ticker-time-pill">${timeAgo}</span>` : "";
        return `
          <div class="ticker-item" data-batch="${item.batch}" data-day="${item.day}" role="button" tabindex="0" title="Click to view ${item.batch} ${item.day} schedule">
            <span class="ticker-bolt-icon" aria-hidden="true">⚡</span>
            <span class="ticker-batch-tag">${item.batch}</span>
            <span class="ticker-day-tag">${item.day}</span>
            <span class="ticker-item-text"><strong>${item.batch}</strong> schedule updated on <strong>${item.day}</strong></span>
            ${timePill}
          </div>
        `;
      }).join("");
    };

    let groupHtml = singleGroupItems();
    if (activeUpdates.length === 1) {
      groupHtml = singleGroupItems() + singleGroupItems() + singleGroupItems();
    } else if (activeUpdates.length === 2) {
      groupHtml = singleGroupItems() + singleGroupItems();
    }

    // Mathematical zero-stutter infinite loop: 2 identical groups with identical item gaps
    track.innerHTML = `
      <div class="ticker-group">${groupHtml}</div>
      <div class="ticker-group" aria-hidden="true">${groupHtml}</div>
    `;

    const effectiveItems = activeUpdates.length === 1 ? 3 : (activeUpdates.length === 2 ? 4 : activeUpdates.length);
    const speedSeconds = Math.max(22, effectiveItems * 7.5);
    track.style.setProperty("--ticker-duration", `${speedSeconds}s`);
    track.classList.add("is-animated");

    // Click to navigate to updated batch & day
    track.querySelectorAll(".ticker-item").forEach(itemEl => {
      const clickHandler = () => {
        const targetBatch = itemEl.getAttribute("data-batch");
        const targetDay = itemEl.getAttribute("data-day");
        handleTickerItemClick(targetBatch, targetDay);
      };
      itemEl.addEventListener("click", clickHandler);
      itemEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          clickHandler();
        }
      });
    });
  } else {
    // 3 consecutive days passed without any update: show notice
    ticker.classList.remove("has-updates");

    const singleNotice = `
      <div class="ticker-empty-item">
        <span class="ticker-spark-icon" aria-hidden="true">📢</span>
        <span class="ticker-empty-text">রুটিনে কোনো নতুন আপডেট আসেনি, নতুন আপডেট আসলে জানিয়ে দেওয়া হবে</span>
        <span class="ticker-diamond-sep" aria-hidden="true">✦</span>
      </div>
    `;

    const groupHtml = singleNotice + singleNotice;

    // Dual-group loop eliminates jump/jerk at loop boundary
    track.innerHTML = `
      <div class="ticker-group">${groupHtml}</div>
      <div class="ticker-group" aria-hidden="true">${groupHtml}</div>
    `;
    track.style.setProperty("--ticker-duration", "32s");
    track.classList.add("is-animated");
  }
}

/**
 * Handle clicking on a ticker update item
 */
function handleTickerItemClick(batch, day) {
  if (!batch || !state.routine || !state.routine.batches[batch]) return;

  state.selectedBatch = batch;
  state.activeView = "batch";
  updateViewTabs();
  renderBatchChips();
  renderStats();
  renderCurrentView();

  setTimeout(() => {
    const routineArea = document.getElementById("routineDisplayArea");
    if (routineArea) {
      routineArea.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 100);
}

function subscribeToCloudUpdates() {
  if (!window.firebaseSync || !window.firebaseSync.isConfigured()) return;

  window.firebaseSync.subscribeToGlobalRoutine((cloudData) => {
    if (!cloudData || !cloudData.rawSchedule || !Object.keys(cloudData.rawSchedule).length) return;

    state.routine = {
      semester: cloudData.semester || "Fall-2026",
      days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      allBatchesList: Array.isArray(cloudData.batches) ? cloudData.batches : Object.keys(cloudData.rawSchedule),
      batches: cloudData.rawSchedule,
      allRows: []
    };

    if (cloudData.sheetUrl && elements.sheetUrlInput && cloudData.sourceType !== "file_upload") {
      elements.sheetUrlInput.value = cloudData.sheetUrl;
    }

    processRoutineDataUpdate(state.routine, false, cloudData.recentUpdates);
    onDataLoaded("Live Synced from Cloud");
    showToast("Synced!", "success");
  });
}

async function publishCurrentRoutineToCloud(sourceUrl, sourceType = "google_sheet") {
  if (!window.firebaseSync || !window.firebaseSync.isConfigured()) return;
  if (!state.routine || !state.routine.batches) return;

  try {
    const activeUpdates = getActiveRoutineUpdates(state.routineUpdates || []);
    await window.firebaseSync.publishGlobalRoutine({
      sheetUrl: sourceUrl || "",
      semester: state.routine.semester || "Fall-2026",
      batches: state.routine.allBatchesList || Object.keys(state.routine.batches),
      rawSchedule: state.routine.batches,
      updatedBy: "DIU Student/CR",
      sourceType: sourceType,
      recentUpdates: activeUpdates
    });
    showToast("Published!", "success");
  } catch (err) {
    console.warn("Failed to publish to Firebase:", err);
    showToast("Failed", "error");
  }
}

/**
 * Load Initial Data (Instant Cache-First + Silent Background Cloud Sync)
 */
async function loadInitialData() {
  updateCloudSyncUI();
  updateLiveDateBadge();

  let hasRendered = false;

  // 1. Instant Cache Render: If cached routine exists in localStorage, render in 0ms!
  try {
    const cached = localStorage.getItem("diu_ice_cached_routine");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.batches && Object.keys(parsed.batches).length > 0) {
        state.routine = parsed;
        processRoutineDataUpdate(state.routine, true);
        onDataLoaded("Ready");
        hasRendered = true;
      }
    }
  } catch (e) {
    console.warn("Could not load cached routine:", e);
  }

  // 2. Immediate Local File Load if no cache (first visit): loads default CSV in ~15ms
  if (!hasRendered) {
    setLoading(true, "Loading Routine...");
    try {
      const resp = await fetch("data/default_routine.csv");
      if (resp.ok) {
        const csvText = await resp.text();
        state.routine = parseRoutineData(csvText);
        processRoutineDataUpdate(state.routine, true);
        onDataLoaded("Ready");
        hasRendered = true;
      }
    } catch (e) {
      console.warn("Could not load local default CSV:", e);
    }
  }

  // 3. Silent Background Cloud Sync: Check Firebase without freezing the screen
  syncWithCloudInBackground(!hasRendered);
}

/**
 * Background Cloud Synchronization (Non-Blocking)
 */
async function syncWithCloudInBackground(shouldShowLoader = false) {
  if (shouldShowLoader) {
    setLoading(true, "Connecting to Cloud...");
  }

  if (window.firebaseSync && window.firebaseSync.isConfigured()) {
    try {
      const cloudData = await window.firebaseSync.fetchActiveRoutine();
      if (cloudData && cloudData.rawSchedule && Object.keys(cloudData.rawSchedule).length > 0) {
        state.routine = {
          semester: cloudData.semester || "Fall-2026",
          days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
          allBatchesList: Array.isArray(cloudData.batches) ? cloudData.batches : Object.keys(cloudData.rawSchedule),
          batches: cloudData.rawSchedule,
          allRows: []
        };
        if (cloudData.sheetUrl && elements.sheetUrlInput && cloudData.sourceType !== "file_upload") {
          elements.sheetUrlInput.value = cloudData.sheetUrl;
        }
        processRoutineDataUpdate(state.routine, false, cloudData.recentUpdates);
        onDataLoaded("Cloud Synced");
        subscribeToCloudUpdates();
        return;
      }
    } catch (err) {
      console.warn("Cloud background sync check:", err);
    }
  }

  if (!state.routine) {
    await fetchSheetData(state.defaultSheetUrl);
  } else {
    subscribeToCloudUpdates();
  }
}

/**
 * Fetch and parse data from Google Sheet URL
 */
async function fetchSheetData(url) {
  if (!url) {
    showToast("Invalid URL", "error");
    return;
  }

  setLoading(true, "Connecting to Google Sheets...");
  const csvUrl = convertToCSVUrl(url);

  try {
    let csvText = "";
    try {
      const res = await fetch(csvUrl);
      if (res.ok) {
        csvText = await res.text();
      }
    } catch (corsErr) {
      console.warn("Direct fetch blocked by CORS, trying proxy...", corsErr);
    }

    if (!csvText) {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Could not fetch through proxy");
      csvText = await res.text();
    }

    state.routine = parseRoutineData(csvText);
    processRoutineDataUpdate(state.routine, false);
    onDataLoaded("Synced with Google Sheet");

    if (window.firebaseSync && window.firebaseSync.isConfigured()) {
      await publishCurrentRoutineToCloud(url, "google_sheet");
    } else {
      showToast("Synced!", "success");
    }
  } catch (err) {
    console.error("Fetch error:", err);
    try {
      const localRes = await fetch("data/default_routine.csv");
      if (localRes.ok) {
        const text = await localRes.text();
        state.routine = parseRoutineData(text);
        processRoutineDataUpdate(state.routine, true);
        onDataLoaded("Ready");
        return;
      }
    } catch (le) {}

    showToast("Fetch failed", "error");
    setLoading(false, "Sync Failed");
  }
}

/**
 * Handle File Upload (.xlsx or .csv)
 */
function handleFileUpload(file) {
  if (!file) return;
  setLoading(true, "Reading file: " + file.name);

  const reader = new FileReader();
  const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

  reader.onload = async function (e) {
    try {
      let csvContent = "";
      if (isXlsx) {
        if (typeof XLSX === "undefined") {
          throw new Error("XLSX parser library not loaded. Please connect to internet.");
        }
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        csvContent = XLSX.utils.sheet_to_csv(worksheet);
      } else {
        csvContent = e.target.result;
      }

      state.routine = parseRoutineData(csvContent);
      processRoutineDataUpdate(state.routine, false);
      onDataLoaded("Loaded from " + file.name);

      if (window.firebaseSync && window.firebaseSync.isConfigured()) {
        await publishCurrentRoutineToCloud("Local Upload: " + file.name, "file_upload");
      } else {
        showToast("Imported!", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Import failed", "error");
      setLoading(false, "Upload Error");
    }
  };

  if (isXlsx) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
}

function onDataLoaded(statusMsg) {
  setLoading(false, statusMsg);
  renderBatchChips();
  if (!state.routine.batches[state.selectedBatch]) {
    state.selectedBatch = state.routine.allBatchesList[0] || "L1T1";
  }
  renderStats();
  renderCurrentView();
}

function setLoading(isLoading, text) {
  if (elements.sheetStatus) {
    elements.sheetStatus.textContent = text;
    elements.sheetStatus.style.background = isLoading ? "var(--primary-light)" : "var(--accent-emerald-light)";
    elements.sheetStatus.style.color = isLoading ? "var(--primary)" : "#065f46";
  }
  if (elements.btnFetchSheet) {
    elements.btnFetchSheet.disabled = isLoading;
    elements.btnFetchSheet.innerHTML = isLoading 
      ? `<span class="spinner"></span> Syncing...`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.36L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.36L3 16M3 21v-5h5"/></svg> Fetch & Sync`;
  }
}

/**
 * Render Batch Selector Chips
 */
function renderBatchChips() {
  if (!elements.batchChipsContainer || !state.routine) return;
  elements.batchChipsContainer.innerHTML = "";

  // Inner track div — this is what we translateX for smooth ticker
  const track = document.createElement("div");
  track.className = "batch-chips-track";
  track.id = "batchChipsTrack";

  state.routine.allBatchesList.forEach(batch => {
    const chip = document.createElement("button");
    chip.className = `batch-chip ${batch === state.selectedBatch ? "active" : ""}`;
    chip.textContent = batch;
    chip.onclick = () => { switchBatch(batch); };
    track.appendChild(chip);
  });

  elements.batchChipsContainer.appendChild(track);
  // Store track reference for ticker
  elements.batchChipsTrack = track;
}


/**
 * Render Quick Stats Banner
 */
function renderStats() {
  if (!elements.statsBanner || !state.routine) return;

  const batch = state.selectedBatch;
  const sched = state.routine.batches[batch];
  if (!sched) {
    elements.statsBanner.innerHTML = "";
    return;
  }

  const courses = new Set();
  let totalClasses = 0;
  let labCount = 0;
  let offdayCount = 0;

  state.routine.days.forEach(day => {
    const dayList = sched[day] || [];
    if (dayList.length === 0) {
      offdayCount++;
    } else {
      dayList.forEach(c => {
        courses.add(c.courseCode);
        totalClasses++;
        const info = getCourseInfo(c.courseCode);
        if (info.type === "Lab") labCount++;
      });
    }
  });

  const courseList = Array.from(courses).map(c => getCourseInfo(c));
  const totalCredits = courseList.reduce((acc, c) => acc + (c.credit || 0), 0);

  elements.statsBanner.innerHTML = `
    <div class="stat-box">
      <div class="stat-icon blue">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>
      <div class="stat-data">
        <div class="stat-value">${courseList.length}</div>
        <div class="stat-label">Total Courses</div>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-icon green">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      </div>
      <div class="stat-data">
        <div class="stat-value">${totalCredits} <span class="stat-unit">Cr</span></div>
        <div class="stat-label">Credit Hours</div>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-icon amber">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <div class="stat-data">
        <div class="stat-value">${totalClasses}</div>
        <div class="stat-label">Weekly Classes</div>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-icon purple">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01"/>
        </svg>
      </div>
      <div class="stat-data">
        <div class="stat-value">${offdayCount} <span class="stat-unit">Days</span></div>
        <div class="stat-label">Weekly Offdays</div>
      </div>
    </div>
  `;
}

function updateLiveDateBadge() {
  const el = document.getElementById("headerDateText");
  if (!el) return;
  try {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(now);
    el.textContent = formatted;
  } catch (e) {
    el.textContent = "Today's Routine";
  }
}

/**
 * Real-time Digital Clock for Navbar
 */
function updateDigitalClock() {
  const timeEl = document.getElementById("digitalClockTime");
  if (!timeEl) return;
  try {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    timeEl.innerHTML = `${formattedHours}:${minutes}:${seconds} <span class="clock-ampm">${ampm}</span>`;
  } catch (e) {
    timeEl.textContent = new Date().toLocaleTimeString();
  }
}

/**
 * Open Faculty Modal
 */
function openFacultyModal(initial, courseCode = "") {
  const fac = getFacultyInfo(initial, courseCode);
  if (!fac) return;

  state.currentModalInitial = initial;

  elements.facultyModalInitial.textContent = fac.initial || initial;
  elements.facultyModalName.textContent = fac.name;
  elements.facultyModalDesignation.textContent = fac.designation;
  elements.facultyModalDept.textContent = fac.department || "Department of ICE";
  
  if (fac.photoUrl) {
    elements.facultyModalPhoto.src = fac.photoUrl;
    elements.facultyModalPhoto.style.display = "block";
  } else {
    elements.facultyModalPhoto.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fac.name)}&background=0284c7&color=fff&bold=true`;
  }

  if (fac.profileUrl) {
    elements.facultyModalLink.href = fac.profileUrl;
    elements.facultyModalLink.style.display = "inline";
  } else {
    elements.facultyModalLink.style.display = "none";
  }

  let count = 0;
  if (state.routine && state.routine.batches[state.selectedBatch]) {
    const sched = state.routine.batches[state.selectedBatch];
    state.routine.days.forEach(d => {
      (sched[d] || []).forEach(c => {
        if (c.teacher === initial) count++;
      });
    });
  }
  elements.facultyModalClassesCount.textContent = `${count} class${count === 1 ? '' : 'es'} in ${state.selectedBatch}`;

  elements.facultyModalOverlay.classList.add("active");
}

function closeFacultyModal() {
  elements.facultyModalOverlay.classList.remove("active");
}

/**
 * Real-time greeting based on user's current local hour
 */
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) {
    return { text: "Good morning", icon: "☀️", period: "morning" };
  } else if (hour >= 12 && hour < 16) {
    return { text: "Good afternoon", icon: "🌤️", period: "noon" };
  } else if (hour >= 16 && hour < 20) {
    return { text: "Good evening", icon: "🌆", period: "evening" };
  } else {
    return { text: "Good night", icon: "🌙", period: "night" };
  }
}
window.getTimeGreeting = getTimeGreeting;

/**
 * Step 1: Automated Welcome & Batch Selection Pop-up
 * Triggered on website open with time-aware greeting and prompt to choose batch
 */
function openWelcomeBatchModal() {
  const overlay = document.getElementById("todayModalOverlay");
  const container = document.getElementById("todayClassesContainer");
  const batchChipsWrap = document.querySelector(".today-batch-selector-wrap");
  const dateBadgeEl = document.getElementById("todayModalDateBadge");
  const greetingEl = document.getElementById("todayModalGreeting");
  const subtitleEl = document.querySelector(".today-modal-subtitle");
  const footerActionBtn = document.getElementById("btnTodayCloseAction");
  const viewFullBtn = document.getElementById("btnTodayViewFullRoutine");

  if (!overlay || !container) return;

  overlay.classList.add("is-welcome-mode");

  const greeting = getTimeGreeting();
  const now = new Date();
  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(now);
  const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(now).toUpperCase();

  if (dateBadgeEl) {
    dateBadgeEl.textContent = `${currentDayName.toUpperCase()} · ${formattedDate}`;
  }

  if (greetingEl) {
    greetingEl.innerHTML = `${greeting.text} ${greeting.icon}, <span class="today-title-highlight">ICEian!</span>`;
  }

  if (subtitleEl) {
    subtitleEl.textContent = "Select your batch to view class routine:";
  }

  if (batchChipsWrap) {
    batchChipsWrap.style.display = "none";
  }

  const batches = (state.routine && state.routine.allBatchesList && state.routine.allBatchesList.length > 0)
    ? state.routine.allBatchesList
    : ["L1T1", "L1T2", "L2T1", "L2T2", "L3T1", "L3T2", "L4T1", "L4T2"];

  const termShortMap = {
    "L1T1": "Y1 · T1",
    "L1T2": "Y1 · T2",
    "L2T1": "Y2 · T1",
    "L2T2": "Y2 · T2",
    "L3T1": "Y3 · T1",
    "L3T2": "Y3 · T2",
    "L4T1": "Y4 · T1",
    "L4T2": "Y4 · T2",
  };

  container.innerHTML = `
    <div class="welcome-batch-step">
      <div class="welcome-batch-grid">
        ${batches.map(b => `
          <button class="welcome-batch-btn ${b === state.selectedBatch ? 'active' : ''}" onclick="selectBatchAndShowToday('${b}')" title="Select Batch ${b}" aria-label="Select Batch ${b}">
            <span class="batch-code">${b}</span>
            <span class="batch-term-hint">${termShortMap[b] || "DIU"}</span>
          </button>
        `).join("")}
      </div>
      <div class="welcome-quick-dismiss">
        <button type="button" class="welcome-skip-btn" onclick="closeTodayClassesModal()" title="Skip to routine">
          <span>Continue to routine &rarr;</span>
        </button>
      </div>
    </div>
  `;

  if (viewFullBtn) {
    viewFullBtn.innerHTML = `<span>View Routine &rarr;</span>`;
    viewFullBtn.onclick = () => closeTodayClassesModal();
  }

  if (footerActionBtn) {
    footerActionBtn.textContent = "Close";
    footerActionBtn.onclick = () => closeTodayClassesModal();
  }

  overlay.classList.add("active");
}
window.openWelcomeBatchModal = openWelcomeBatchModal;

/**
 * Selects batch and directly closes popup to reveal main routine (no second popup)
 */
function selectBatchAndShowToday(batch) {
  switchBatch(batch);
  closeTodayClassesModal();
  elements.routineDisplayArea?.scrollIntoView({ behavior: "smooth" });
}
window.selectBatchAndShowToday = selectBatchAndShowToday;

/**
 * Interactive Today's Classes Pop-Up Modal (Editorial Zen Style)
 */
function openTodayClassesModal(targetBatch = state.selectedBatch) {
  const overlay = document.getElementById("todayModalOverlay");
  const container = document.getElementById("todayClassesContainer");
  const batchChipsWrap = document.querySelector(".today-batch-selector-wrap");
  const batchChipsEl = document.getElementById("todayBatchChips");
  const dateBadgeEl = document.getElementById("todayModalDateBadge");
  const greetingEl = document.getElementById("todayModalGreeting");
  const subtitleEl = document.querySelector(".today-modal-subtitle");
  const footerActionBtn = document.getElementById("btnTodayCloseAction");
  const viewFullBtn = document.getElementById("btnTodayViewFullRoutine");

  if (!overlay || !container) return;

  overlay.classList.remove("is-welcome-mode");

  const greeting = getTimeGreeting();
  const now = new Date();
  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(now).toUpperCase();

  if (dateBadgeEl) {
    dateBadgeEl.textContent = `${currentDayName.toUpperCase()} · ${formattedDate}`;
  }

  if (greetingEl) {
    greetingEl.innerHTML = `${greeting.text} ${greeting.icon}, <span class="today-title-highlight">${targetBatch}.</span>`;
  }

  if (subtitleEl) {
    subtitleEl.textContent = `Here is today's schedule for ${targetBatch} (${currentDayName}):`;
  }

  // Restore horizontal batch selector in today's classes view
  if (batchChipsWrap) {
    batchChipsWrap.style.display = "flex";
  }

  // Populate batch switcher chips inside popup
  const batches = (state.routine && state.routine.allBatchesList && state.routine.allBatchesList.length > 0)
    ? state.routine.allBatchesList
    : ["L1T1", "L1T2", "L2T1", "L2T2", "L3T1", "L3T2", "L4T1", "L4T2"];

  if (batchChipsEl) {
    batchChipsEl.innerHTML = batches.map(b => `
      <button class="today-batch-pill ${b === targetBatch ? 'active' : ''}" onclick="selectBatchAndShowToday('${b}')">
        ${b}
      </button>
    `).join("");
  }

  if (!state.routine || !state.routine.batches || !state.routine.batches[targetBatch]) {
    container.innerHTML = `
      <div class="today-empty-card">
        <div class="today-empty-icon">📂</div>
        <h4>No routine data available for ${targetBatch}</h4>
        <p>Please wait for routine data to sync or select another batch.</p>
      </div>
    `;
    overlay.classList.add("active");
    return;
  }

  const schedule = state.routine.batches[targetBatch];
  const classesToday = schedule[currentDayName] || [];

  if (currentDayName === "Friday" || classesToday.length === 0) {
    container.innerHTML = `
      <div class="today-zen-offday-card">
        <div class="zen-offday-top">
          <span class="zen-icon">${currentDayName === "Friday" ? "🏖️" : "🌱"}</span>
          <span class="zen-tag">DAILY RITUAL · REST</span>
        </div>
        <h3 class="zen-title">${currentDayName === "Friday" ? "Happy Friday Weekend!" : "No Classes for " + targetBatch + " Today"}</h3>
        <p class="zen-desc">
          ${currentDayName === "Friday" ? "It is the university weekend. Take three deep breaths, review your weekly progress, and recharge." : "You have an official offday today (" + currentDayName + "). Take this time for self-study, relax, or preview the weekly routine."}
        </p>
        <div class="zen-action-row">
          <button class="btn btn-primary btn-sm" onclick="closeTodayClassesModal(); switchBatch('${targetBatch}');">
            View Full Timetable &rarr;
          </button>
        </div>
      </div>
    `;
  } else {
    // Classes exist today
    let liveNowCount = 0;
    const cardsHtml = classesToday.map((cls) => {
      const course = getCourseInfo(cls.courseCode);
      const timeStatus = getClassTimeState(cls.time, currentDayName);
      const isRunning = timeStatus && timeStatus.state === 'now';
      if (isRunning) liveNowCount++;

      return `
        <div class="today-class-item ${isRunning ? 'is-live-now' : ''}">
          <div class="today-item-header">
            <div class="today-item-left">
              <span class="today-course-code">${cls.courseCode}</span>
              ${isRunning ? `
                <span class="today-live-pill">
                  <span class="badge-beacon"><span class="beacon-wave"></span><span class="beacon-core"></span></span>
                  <span>LIVE NOW</span>
                </span>
              ` : ''}
            </div>
            <div class="today-item-time">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>${cls.time}</span>
            </div>
          </div>

          ${course.title && course.title !== "Course Title Not Specified" ? `
            <div class="today-course-title">${course.title}</div>
          ` : ''}

          <div class="today-item-footer">
            <div class="today-room-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Room ${cls.room}</span>
            </div>
            <span class="today-teacher-static-badge" title="Teacher Initial: ${cls.teacher}">${cls.teacher}</span>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="today-summary-bar">
        <span class="today-count-text"><strong>${classesToday.length}</strong> class${classesToday.length > 1 ? 'es' : ''} scheduled for <strong>${targetBatch}</strong></span>
        ${liveNowCount > 0 ? `<span class="today-running-tag">● ${liveNowCount} Live Now</span>` : `<span class="today-day-tag">${currentDayName}</span>`}
      </div>
      <div class="today-items-list">
        ${cardsHtml}
      </div>
    `;
  }

  if (viewFullBtn) {
    viewFullBtn.innerHTML = `<span>View Full Week Table &rarr;</span>`;
    viewFullBtn.onclick = () => {
      closeTodayClassesModal();
      switchBatch(targetBatch);
      elements.routineDisplayArea?.scrollIntoView({ behavior: "smooth" });
    };
  }

  if (footerActionBtn) {
    footerActionBtn.textContent = "Done";
    footerActionBtn.onclick = () => closeTodayClassesModal();
  }

  overlay.classList.add("active");
}

function closeTodayClassesModal() {
  const overlay = document.getElementById("todayModalOverlay");
  if (overlay) {
    overlay.classList.remove("active");
    overlay.classList.remove("is-welcome-mode");
  }
}

if (typeof window !== "undefined") {
  window.openFacultyModal = openFacultyModal;
  window.closeFacultyModal = closeFacultyModal;
  window.openTodayClassesModal = openTodayClassesModal;
  window.closeTodayClassesModal = closeTodayClassesModal;
}

/**
 * Render based on current view
 */
function renderCurrentView() {
  if (state.activeView === "courses") {
    renderCoursesView();
    return;
  }
  if (!state.routine) return;
  if (state.activeView === "batch") {
    renderBatchRoutine();
  } else if (state.activeView === "master") {
    renderMasterView();
  } else if (state.activeView === "teacher") {
    renderTeacherView();
  } else if (state.activeView === "room") {
    renderRoomView();
  }
}

/**
 * Switch Display Mode between Table View and Mobile Cards View
 */
function toggleDisplayMode(mode) {
  state.displayMode = mode;
  try {
    localStorage.setItem("ice_display_mode", mode);
  } catch (e) {}
  renderBatchRoutine();
}
window.toggleDisplayMode = toggleDisplayMode;

/**
 * RENDER BATCH ROUTINE (Pixel-Perfect Reference from Image 1 & Responsive Cards)
 */
function renderBatchRoutine() {
  const container = elements.routineDisplayArea;
  if (!container || !state.routine) return;

  const batch = state.selectedBatch;
  const schedule = state.routine.batches[batch];

  if (!schedule) {
    container.innerHTML = `<div class="control-card"><p>No schedule found for batch <strong>${batch}</strong>.</p></div>`;
    return;
  }

  // Collect unique courses
  const courseCodeSet = new Set();
  const days = state.routine.days;

  days.forEach(day => {
    (schedule[day] || []).forEach(item => {
      if (item.courseCode) {
        courseCodeSet.add(item.courseCode);
      }
    });
  });

  const courseList = Array.from(courseCodeSet).map(code => getCourseInfo(code));
  courseList.sort((a, b) => a.code.localeCompare(b.code));

  const totalCredits = courseList.reduce((sum, c) => sum + (c.credit || 0), 0);
  const search = (state.searchQuery || "").trim().toLowerCase();


  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const isTodayOnly = state.dayFilter === "today";
  const targetDays = isTodayOnly ? (days.includes(currentDayName) ? [currentDayName] : []) : days;

  // Filter day classes
  const dayClasses = {};
  const activeDays = [];
  const offDays = [];

  targetDays.forEach(d => {
    let classes = schedule[d] || [];
    if (search) {
      classes = classes.filter(c => 
        c.courseCode.toLowerCase().includes(search) ||
        (c.courseName && c.courseName.toLowerCase().includes(search)) ||
        c.room.toLowerCase().includes(search) ||
        c.teacher.toLowerCase().includes(search)
      );
    }
    dayClasses[d] = classes;
    if (classes.length > 0) {
      activeDays.push(d);
    } else {
      offDays.push(d);
    }
  });

  // View Mode: Mobile strictly Card View, PC/Large Screens strictly Table View
  const isMobileScreen = typeof window !== "undefined" && window.innerWidth <= 768;
  const isCardsMode = isMobileScreen;
  const viewToggleBarHtml = `
    <div class="routine-view-toggle-bar no-print">
      <div class="routine-view-indicator-pill">
        ${isMobileScreen ? `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="20" x="5" y="2" rx="3"/>
            <path d="M12 18h.01"/>
          </svg>
          <span>Cards View</span>
        ` : `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2.5"/>
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
          </svg>
          <span>Table View</span>
        `}
      </div>

      <div class="day-filter-pill-group">
        <button class="view-toggle-btn ${!isTodayOnly ? 'active' : ''}" onclick="setDayFilter('all')" title="Show all week classes">
          <span>📅 All Days</span>
        </button>
        <button class="view-toggle-btn ${isTodayOnly ? 'active' : ''}" onclick="setDayFilter('today')" title="Show only today's classes">
          <span>⚡ Today</span>
        </button>
      </div>
    </div>
  `;

  let scheduleBodyHtml = "";

  // Handle Search Empty State
  if (search && activeDays.length === 0) {
    scheduleBodyHtml = `
      <div class="empty-search-state">
        <div class="empty-icon">🔍</div>
        <h3>No classes match "${state.searchQuery}"</h3>
        <p>No matching courses, rooms, or faculty found for batch <strong>${batch}</strong>.</p>
        <button class="btn btn-secondary btn-sm" onclick="clearSearchFilter()">
          Clear Search Filter
        </button>
      </div>
    `;
  } else if (isTodayOnly && activeDays.length === 0) {
    // Handle Today Only Offday / Weekend State
    scheduleBodyHtml = `
      <div class="empty-search-state" style="background: #f8fafc; border: 1px solid var(--card-border);">
        <div class="empty-icon">${currentDayName === "Friday" ? "🏖️" : "🌴"}</div>
        <h3>${currentDayName === "Friday" ? "Happy Weekend! It's Friday" : "No Classes for " + batch + " Today (" + currentDayName + ")"}</h3>
        <p>You have no scheduled classes today. Enjoy your day, review course materials, or view the full week timetable.</p>
        <button class="btn btn-primary btn-sm" onclick="setDayFilter('all')">
          View Full Week Timetable &rarr;
        </button>
      </div>
    `;
  } else if (isCardsMode) {
    // Mobile-friendly Vertical Cards View
    let cardsHtml = "";
    targetDays.forEach(day => {
      const classes = dayClasses[day] || [];
      const daySlug = day.toLowerCase();
      const isToday = day.toLowerCase() === currentDayName.toLowerCase();

      if (classes.length === 0) {
        const chillMessages = [
          { emoji: "🏖️", title: "Chill Day, No Classes!", sub: "Take it easy — you deserve a break 😎" },
          { emoji: "🎮", title: "Free Day — No Lectures!", sub: "Game on, stress off! 🕹️" },
          { emoji: "☕", title: "Offday Vibes Only!", sub: "Grab a coffee & relax, no porasuna today ✌️" },
          { emoji: "🎵", title: "No Class, Just Vibes!", sub: "Put on your playlist & chill out 🎧" },
          { emoji: "😴", title: "Rest Day Activated!", sub: "Sleep in, you earned it today 💤" },
        ];
        const chill = chillMessages[Math.floor(Math.random() * chillMessages.length)];
        cardsHtml += `
          <div class="mobile-day-card card-day-${daySlug} offday-card ${isToday ? 'is-today-card' : ''}">
            <div class="mobile-day-header day-${daySlug}">
              <span class="day-name">${day} ${isToday ? '<span class="today-tag-card-modern"><span class="today-spark-dot"></span><span>TODAY</span></span>' : ''}</span>
              <span class="offday-badge">🌴 Offday</span>
            </div>
            <div class="mobile-offday-body">
              <span class="offday-chill-emoji">${chill.emoji}</span>
              <span class="offday-chill-title">${chill.title}</span>
              <span class="offday-chill-sub">${chill.sub}</span>
            </div>
          </div>
        `;
      } else {
        cardsHtml += `
          <div class="mobile-day-card card-day-${daySlug} ${isToday ? 'is-today-card' : ''}">
            <div class="mobile-day-header day-${daySlug}">
              <span class="day-name">${day} ${isToday ? '<span class="today-tag-card-modern"><span class="today-spark-dot"></span><span>TODAY</span></span>' : ''}</span>
              <span class="day-count-badge">${classes.length} Class${classes.length > 1 ? 'es' : ''}</span>
            </div>
            <div class="mobile-day-classes-list">
              ${classes.map(cls => {
                const fac = getFacultyInfo(cls.teacher, cls.courseCode);
                const facName = fac ? fac.name : cls.teacher;
                const course = getCourseInfo(cls.courseCode);
                const timeStatus = getClassTimeState(cls.time, day);
                const isRunning = timeStatus && timeStatus.state === 'now';
                let cardStateClass = isRunning ? "is-active-now" : "";

                return `
                  <div class="mobile-class-card ${cardStateClass}">
                    <div class="class-card-top">
                      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span class="class-card-code">${cls.courseCode}</span>
                        ${timeStatus ? timeStatus.badge : ''}
                      </div>
                      <div class="class-card-time">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>${cls.time}</span>
                      </div>
                    </div>
                    ${course.title && course.title !== "Course Title Not Specified" ? `
                      <div class="class-card-name">${course.title}</div>
                    ` : ''}
                    <div class="class-card-bottom">
                      <div class="class-card-room">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>${cls.room}</span>
                      </div>
                      <span class="teacher-initial-tag" onclick="openFacultyModal('${cls.teacher}', '${cls.courseCode}')" title="Click to view faculty details for ${cls.teacher}" role="button" tabindex="0">${cls.teacher}</span>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }
    });

    scheduleBodyHtml = `<div class="mobile-cards-container">${cardsHtml}</div>`;
  } else {
    // Modular Themed Table View (Each Day in its own bordered card matching Card View)
    let dayCardsHtml = "";

    targetDays.forEach(day => {
      const classes = dayClasses[day] || [];
      const daySlug = day.toLowerCase();
      const isToday = day.toLowerCase() === currentDayName.toLowerCase();

      if (classes.length === 0) {
        const chillMessages = [
          { emoji: "🏖️", title: "Chill Day, No Classes!", sub: "Take it easy — you deserve a break 😎" },
          { emoji: "🎮", title: "Free Day — No Lectures!", sub: "Game on, stress off! 🕹️" },
          { emoji: "☕", title: "Offday Vibes Only!", sub: "Grab a coffee & relax, no porasuna today ✌️" },
          { emoji: "🎵", title: "No Class, Just Vibes!", sub: "Put on your playlist & chill out 🎧" },
          { emoji: "😴", title: "Rest Day Activated!", sub: "Sleep in, you earned it today 💤" },
        ];
        const chill = chillMessages[Math.floor(Math.random() * chillMessages.length)];
        dayCardsHtml += `
          <div class="day-table-card card-day-${daySlug} offday-card ${isToday ? 'is-today-card' : ''}">
            <div class="mobile-day-header day-${daySlug}">
              <span class="day-name">${day} ${isToday ? '<span class="today-tag-card-modern"><span class="today-spark-dot"></span><span>TODAY</span></span>' : ''}</span>
              <span class="offday-badge">🌴 Offday</span>
            </div>
            <div class="mobile-offday-body">
              <span class="offday-chill-emoji">${chill.emoji}</span>
              <span class="offday-chill-title">${chill.title}</span>
              <span class="offday-chill-sub">${chill.sub}</span>
            </div>
          </div>
        `;
      } else {
        let dayRowsHtml = "";
        let alternateCounter = 0;

        classes.forEach((cls) => {
          alternateCounter++;
          const fac = getFacultyInfo(cls.teacher, cls.courseCode);
          const facName = fac ? fac.name : cls.teacher;
          const course = getCourseInfo(cls.courseCode);
          const timeStatus = getClassTimeState(cls.time, day);
          let rowClass = (alternateCounter % 2 === 0) ? "row-fill-purple" : "row-fill-green";
          if (isToday && timeStatus && timeStatus.state === 'now') {
            rowClass = "row-running-class";
          }

          dayRowsHtml += `
            <tr class="${rowClass}">
              <td class="course-cell-code">
                <div class="course-cell-wrapper">
                  <span class="course-code-main"><strong>${cls.courseCode}</strong></span>
                  ${course.title && course.title !== "Course Title Not Specified" ? `
                    <span class="course-title-sub" title="${course.title}">${course.title}</span>
                  ` : ""}
                </div>
              </td>
              <td class="time-cell-text cell-center">
                <div>${cls.time}</div>
                ${timeStatus ? `<div style="margin-top: 0.3rem;">${timeStatus.badge}</div>` : ''}
              </td>
              <td class="cell-center">
                <span class="room-cell-text">${cls.room}</span>
              </td>
              <td class="cell-center">
                <span class="teacher-initial-tag" onclick="openFacultyModal('${cls.teacher}', '${cls.courseCode}')" title="Click to view faculty details for ${cls.teacher}" role="button" tabindex="0">${cls.teacher}</span>
              </td>
            </tr>
          `;
        });

        dayCardsHtml += `
          <div class="day-table-card card-day-${daySlug} ${isToday ? 'is-today-card' : ''}">
            <div class="mobile-day-header day-${daySlug}">
              <span class="day-name">${day} ${isToday ? '<span class="today-tag-card-modern"><span class="today-spark-dot"></span><span>TODAY</span></span>' : ''}</span>
              <span class="day-count-badge">${classes.length} Class${classes.length > 1 ? 'es' : ''}</span>
            </div>
            <div class="table-scroll-container">
              <table class="routine-grid-table">
                <thead>
                  <tr>
                    <th style="width: 32%; text-align: left;">Course</th>
                    <th style="width: 28%; text-align: center;">Time</th>
                    <th style="width: 20%; text-align: center;">Room No.</th>
                    <th style="width: 20%; text-align: center;">Teacher Initial</th>
                  </tr>
                </thead>
                <tbody>
                  ${dayRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    });

    scheduleBodyHtml = `
      <div class="day-tables-container" id="tableScrollContainer">
        ${dayCardsHtml}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="routine-presentation-card" id="routineCardToExport">
      <div class="print-only-routine-header">
        <h2>Department of Information and Communication Engineering</h2>
        <p>Daffodil International University &bull; Class Routine (${state.routine?.semester || "Fall-2026"}) &bull; Batch: <strong>${batch}</strong> (${isTodayOnly ? "Today's Schedule" : "Weekly Schedule"})</p>
      </div>

      ${viewToggleBarHtml}
      ${scheduleBodyHtml}



      <div class="routine-footer-meta">
        <div>Routine for <strong>${batch}</strong> &bull; DIU Smart Routine Engine</div>
        <div>Standard Theory: 1h 30m | Laboratory: 3h–4h Session</div>
      </div>
    </div>
  `;

  // Attach smooth touch/mouse drag to table
  setupTableDrag();
}

/**
 * Interactive Touch & Button Slide Support for Routine Table
 */
function slideRoutineTable(direction) {
  const container = document.getElementById("tableScrollContainer") || document.querySelector(".table-scroll-container");
  if (!container) return;
  const amount = Math.max(container.clientWidth * 0.65, 200);
  container.scrollBy({
    left: direction === "left" ? -amount : amount,
    behavior: "smooth"
  });
}
window.slideRoutineTable = slideRoutineTable;

function setupTableDrag() {
  const containers = document.querySelectorAll(".table-scroll-container");
  containers.forEach(container => {
    if (!container || !container.dataset || container.dataset.dragAttached) return;
    container.dataset.dragAttached = "true";

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    container.addEventListener("mousedown", (e) => {
      isDown = true;
      container.classList.add("dragging");
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });

    window.addEventListener("mouseup", () => {
      isDown = false;
      container.classList.remove("dragging");
    });

    container.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    });
  });
}

/**
 * Render Master View (All Batches)
 */
function renderMasterView() {
  const container = elements.routineDisplayArea;
  if (!container || !state.routine) return;

  const batches = state.routine.allBatchesList || Object.keys(state.routine.batches || []);
  const days = state.routine.days;
  const search = (state.searchQuery || "").trim().toLowerCase();

  let totalMatched = 0;
  let batchBlocksHtml = "";

  batches.forEach(b => {
    const sched = state.routine.batches[b];
    if (!sched) return;
    let batchHasMatches = false;
    let daysHtml = "";

    days.forEach(d => {
      let cls = sched[d] || [];
      if (search) {
        cls = cls.filter(c => 
          c.courseCode.toLowerCase().includes(search) ||
          (c.courseName && c.courseName.toLowerCase().includes(search)) ||
          c.room.toLowerCase().includes(search) ||
          c.teacher.toLowerCase().includes(search) ||
          b.toLowerCase().includes(search) ||
          d.toLowerCase().includes(search)
        );
      }

      if (cls.length > 0) {
        batchHasMatches = true;
        totalMatched += cls.length;
      }

      daysHtml += `
        <div style="background: var(--bg-main); border: 1px solid var(--card-border); border-radius: 8px; padding: 0.75rem;">
          <strong style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;">${d}</strong>
          ${cls.length === 0 ? `<div style="font-size: 0.825rem; color: #94a3b8; margin-top: 0.35rem;">${search ? "No matches" : "Offday"}</div>` : `
            <div style="margin-top: 0.35rem; display: flex; flex-direction: column; gap: 0.35rem;">
              ${cls.map(c => `
                <div style="font-size: 0.8rem; background: var(--card-bg); padding: 0.3rem 0.5rem; border-radius: 4px; border: 1px solid var(--card-border);">
                  <strong style="color: var(--primary);">${c.courseCode}</strong> (${c.room}) - ${c.teacher}
                </div>
              `).join("")}
            </div>
          `}
        </div>
      `;
    });

    if (!search || batchHasMatches) {
      batchBlocksHtml += `
        <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--card-border); padding-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
            <h4 style="font-size: 1.25rem; color: var(--primary); font-weight: 800;">${b}</h4>
            <button class="btn btn-secondary btn-sm" onclick="switchBatch('${b}')">
              View Routine Format &rarr;
            </button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
            ${daysHtml}
          </div>
        </div>
      `;
    }
  });

  if (search && totalMatched === 0) {
    container.innerHTML = `
      <div class="control-card">
        <div class="empty-search-state">
          <div class="empty-icon">🔍</div>
          <h3>No classes match "${state.searchQuery}"</h3>
          <p>No courses, rooms, or faculty found across any batch in the Master Matrix.</p>
          <button class="btn btn-secondary btn-sm" onclick="clearSearchFilter()">Clear Search Filter</button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="control-card">
      <h3 style="margin-bottom: 0.5rem; font-size: 1.3rem; font-weight: 800;">All Batches Master Overview</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.75rem;">
        Complete department-wide schedule across all Level-Terms for Fall-2026.
      </p>
      ${batchBlocksHtml}
    </div>
  `;
}

/**
 * Render Teacher View (Faculty Schedule)
 */
function renderTeacherView() {
  const container = elements.routineDisplayArea;
  if (!container || !state.routine) return;

  const teacherSet = new Set();
  state.routine.allBatchesList.forEach(b => {
    state.routine.days.forEach(d => {
      (state.routine.batches[b]?.[d] || []).forEach(c => {
        if (c.teacher && c.teacher !== "TBA" && c.teacher !== "Dept") {
          teacherSet.add(c.teacher);
        }
      });
    });
  });

  const teachers = Array.from(teacherSet).sort();
  const selectedTeacher = state.selectedTeacher || teachers[0] || "AKP";
  state.selectedTeacher = selectedTeacher;

  const fac = getFacultyInfo(selectedTeacher) || {
    initial: selectedTeacher,
    name: `Faculty Member (${selectedTeacher})`,
    designation: "Faculty Member",
    department: "Department of ICE",
    photoUrl: "",
    profileUrl: ""
  };

  const teacherClasses = [];
  state.routine.allBatchesList.forEach(b => {
    state.routine.days.forEach(d => {
      (state.routine.batches[b]?.[d] || []).forEach(c => {
        if (c.teacher === selectedTeacher) {
          teacherClasses.push({ batch: b, day: d, ...c });
        }
      });
    });
  });

  const search = (state.searchQuery || "").trim().toLowerCase();
  let displayedTeacherClasses = teacherClasses;
  if (search) {
    displayedTeacherClasses = teacherClasses.filter(c => 
      c.courseCode.toLowerCase().includes(search) ||
      (c.courseName && c.courseName.toLowerCase().includes(search)) ||
      c.room.toLowerCase().includes(search) ||
      c.batch.toLowerCase().includes(search) ||
      c.day.toLowerCase().includes(search)
    );
  }

  let tableContentHtml = "";
  if (teacherClasses.length === 0) {
    tableContentHtml = `<tr><td colspan="5" style="padding: 2.5rem; text-align: center;">No classes allocated for ${selectedTeacher}</td></tr>`;
  } else if (displayedTeacherClasses.length === 0) {
    tableContentHtml = `
      <tr>
        <td colspan="5" style="padding: 2rem;">
          <div class="empty-search-state" style="margin: 0; padding: 1.5rem;">
            <div class="empty-icon">🔍</div>
            <h3>No classes match "${state.searchQuery}" for ${selectedTeacher}</h3>
            <button class="btn btn-secondary btn-sm" onclick="clearSearchFilter()">Clear Search</button>
          </div>
        </td>
      </tr>
    `;
  } else {
    tableContentHtml = displayedTeacherClasses.map(c => {
      const cInfo = getCourseInfo(c.courseCode);
      return `
        <tr>
          <td><strong>${c.day}</strong></td>
          <td>${c.time}</td>
          <td><span class="batch-chip" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">${c.batch}</span></td>
          <td class="course-cell-code">
            <div class="course-cell-wrapper">
              <span class="course-code-main"><strong>${c.courseCode}</strong></span>
              ${cInfo.title && cInfo.title !== "Course Title Not Specified" ? `
                <span class="course-title-sub" title="${cInfo.title}">${cInfo.title}</span>
              ` : ""}
            </div>
          </td>
          <td class="room-cell-text">${c.room}</td>
        </tr>
      `;
    }).join("");
  }

  let html = `
    <div class="control-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <label style="font-weight: 700; font-size: 0.95rem; margin-right: 0.75rem;">Select Faculty Member:</label>
          <select class="text-input" id="teacherSelectDropdown" style="display: inline-block; width: auto; min-width: 260px;">
            ${teachers.map(t => `<option value="${t}" ${t === selectedTeacher ? "selected" : ""}>${t} - ${getFacultyInfo(t)?.name || t}</option>`).join("")}
          </select>
        </div>
        <a href="https://faculty.daffodilvarsity.edu.bd/teachers/ice.html" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
          Official DIU Faculty Portal ↗
        </a>
      </div>

      <div style="background: var(--primary-light); padding: 1.25rem; border-radius: var(--radius-sm); margin-bottom: 1.5rem; border-left: 4px solid var(--primary); display: flex; align-items: center; gap: 1.25rem;">
        ${fac.photoUrl ? `<img src="${fac.photoUrl}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">` : ''}
        <div>
          <h3 style="color: var(--primary-hover); font-size: 1.25rem; font-weight: 800;">${fac.name} (${selectedTeacher})</h3>
          <p style="color: #0f172a; font-size: 0.9rem; font-weight: 600;">${fac.designation} &bull; ${fac.department}</p>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Total Classes: <strong>${teacherClasses.length} sessions/week</strong></p>
        </div>
      </div>

      <div class="table-scroll-container">
        <table class="routine-grid-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Batch</th>
              <th>Course</th>
              <th>Room</th>
            </tr>
          </thead>
          <tbody>
            ${tableContentHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById("teacherSelectDropdown")?.addEventListener("change", (e) => {
    state.selectedTeacher = e.target.value;
    renderTeacherView();
  });
}

/**
 * Render Room View
 */
function renderRoomView() {
  const container = elements.routineDisplayArea;
  if (!container || !state.routine) return;

  const roomSet = new Set();
  state.routine.allBatchesList.forEach(b => {
    state.routine.days.forEach(d => {
      (state.routine.batches[b]?.[d] || []).forEach(c => {
        if (c.room && c.room !== "TBA") roomSet.add(c.room);
      });
    });
  });

  const rooms = Array.from(roomSet).sort();
  const selectedRoom = state.selectedRoom || rooms[0] || "302";
  state.selectedRoom = selectedRoom;

  const roomClasses = [];
  state.routine.allBatchesList.forEach(b => {
    state.routine.days.forEach(d => {
      (state.routine.batches[b]?.[d] || []).forEach(c => {
        if (c.room === selectedRoom) {
          roomClasses.push({ batch: b, day: d, ...c });
        }
      });
    });
  });

  const search = (state.searchQuery || "").trim().toLowerCase();
  let displayedRoomClasses = roomClasses;
  if (search) {
    displayedRoomClasses = roomClasses.filter(c => 
      c.courseCode.toLowerCase().includes(search) ||
      (c.courseName && c.courseName.toLowerCase().includes(search)) ||
      c.teacher.toLowerCase().includes(search) ||
      c.batch.toLowerCase().includes(search) ||
      c.day.toLowerCase().includes(search)
    );
  }

  let tableContentHtml = "";
  if (roomClasses.length === 0) {
    tableContentHtml = `<tr><td colspan="5" style="padding: 2.5rem; text-align: center;">Room ${selectedRoom} is currently free.</td></tr>`;
  } else if (displayedRoomClasses.length === 0) {
    tableContentHtml = `
      <tr>
        <td colspan="5" style="padding: 2rem;">
          <div class="empty-search-state" style="margin: 0; padding: 1.5rem;">
            <div class="empty-icon">🔍</div>
            <h3>No classes match "${state.searchQuery}" in Room ${selectedRoom}</h3>
            <button class="btn btn-secondary btn-sm" onclick="clearSearchFilter()">Clear Search</button>
          </div>
        </td>
      </tr>
    `;
  } else {
    tableContentHtml = displayedRoomClasses.map(c => {
      const cInfo = getCourseInfo(c.courseCode);
      return `
        <tr>
          <td><strong>${c.day}</strong></td>
          <td>${c.time}</td>
          <td><span class="batch-chip" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">${c.batch}</span></td>
          <td class="course-cell-code">
            <div class="course-cell-wrapper">
              <span class="course-code-main"><strong>${c.courseCode}</strong></span>
              ${cInfo.title && cInfo.title !== "Course Title Not Specified" ? `
                <span class="course-title-sub" title="${cInfo.title}">${cInfo.title}</span>
              ` : ""}
            </div>
          </td>
          <td>
            <span class="teacher-initial-tag" onclick="openFacultyModal('${c.teacher}', '${c.courseCode}')" title="Click to view faculty details for ${c.teacher}" role="button" tabindex="0">${c.teacher}</span>
          </td>
        </tr>
      `;
    }).join("");
  }

  let html = `
    <div class="control-card">
      <div style="margin-bottom: 1.5rem;">
        <label style="font-weight: 700; font-size: 0.95rem; margin-right: 0.75rem;">Select Room / Lab:</label>
        <select class="text-input" id="roomSelectDropdown" style="display: inline-block; width: auto; min-width: 220px;">
          ${rooms.map(r => `<option value="${r}" ${r === selectedRoom ? "selected" : ""}>Room / Lab ${r}</option>`).join("")}
        </select>
      </div>

      <div style="background: var(--primary-light); padding: 1.25rem; border-radius: var(--radius-sm); margin-bottom: 1.5rem; border-left: 4px solid var(--primary);">
        <h3 style="color: var(--primary-hover); font-size: 1.25rem; font-weight: 800;">Room / Lab ${selectedRoom}</h3>
        <p style="color: #0f172a; font-size: 0.9rem; font-weight: 600;">Weekly Occupied Slots: ${roomClasses.length} sessions</p>
      </div>

      <div class="table-scroll-container">
        <table class="routine-grid-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Batch</th>
              <th>Course</th>
              <th>Teacher</th>
            </tr>
          </thead>
          <tbody>
            ${tableContentHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById("roomSelectDropdown")?.addEventListener("change", (e) => {
    state.selectedRoom = e.target.value;
    renderRoomView();
  });
}

/**
/**
 * EXPORT ENGINE: Pixel-Perfect 1-Page Canvas Generator
 * Standardized on A4 Landscape proportions (1200px width),
 * structured with complete course catalog & faculty directory,
 * guaranteeing an exact, gorgeous 1-Page fit for both Image (PNG) and PDF.
 */
async function generateRoutineCanvas() {
  if (!state.routine) return null;

  if (typeof html2canvas === "undefined") {
    throw new Error("html2canvas library is not loaded.");
  }

  const batch = state.selectedBatch || "L1T1";
  const schedule = state.routine.batches[batch];
  if (!schedule) return null;

  const days = state.routine.days || ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const semester = state.routine.semester || "Academic Year 2026";

  const termMap = {
    "L1T1": "1st Year · 1st Term",
    "L1T2": "1st Year · 2nd Term",
    "L2T1": "2nd Year · 1st Term",
    "L2T2": "2nd Year · 2nd Term",
    "L3T1": "3rd Year · 1st Term",
    "L3T2": "3rd Year · 2nd Term",
    "L4T1": "4th Year · 1st Term",
    "L4T2": "4th Year · 2nd Term",
  };

  const dayColors = {
    Saturday:  { bg: "#ede9fe", text: "#4338ca" },
    Sunday:    { bg: "#ecfdf5", text: "#065f46" },
    Monday:    { bg: "#fff1f2", text: "#9f1239" },
    Tuesday:   { bg: "#fdf4ff", text: "#86198f" },
    Wednesday: { bg: "#fefce8", text: "#854d0e" },
    Thursday:  { bg: "#f0fdfa", text: "#115e59" },
  };

  // Collect unique courses
  const courseCodeSet = new Set();
  days.forEach(day => {
    (schedule[day] || []).forEach(item => {
      if (item.courseCode) courseCodeSet.add(item.courseCode);
    });
  });
  const courseList = Array.from(courseCodeSet).map(code => getCourseInfo(code));
  courseList.sort((a, b) => a.code.localeCompare(b.code));
  const totalCredits = courseList.reduce((sum, c) => sum + (c.credit || 0), 0);

  // Group courseList into chunks of 3 for safe, non-overlapping HTML table rows in html2canvas
  const courseChunks = [];
  for (let i = 0; i < courseList.length; i += 3) {
    courseChunks.push(courseList.slice(i, i + 3));
  }

  const courseRowsHtml = courseChunks.map(chunk => `
    <tr>
      ${chunk.map(c => `
        <td style="width: 33.333%; padding: 2.5px 5px; vertical-align: top;">
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 9px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 2px rgba(0,0,0,0.02); min-height: 28px; box-sizing: border-box;">
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 270px; font-size: 10.5px; line-height: 1.35;">
              <span style="color: #0f172a; font-weight: 800;">${c.code}</span>
              <span style="color: #475569; font-weight: 500; margin-left: 4px;">&ndash; ${c.title}</span>
            </div>
            <span style="background: #f1f5f9; color: #1e293b; font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 4px; white-space: nowrap; margin-left: 8px; border: 1px solid #e2e8f0; flex-shrink: 0;">
              ${c.credit} Cr
            </span>
          </div>
        </td>
      `).join("")}
      ${chunk.length < 3 ? Array(3 - chunk.length).fill('<td style="width: 33.333%; padding: 2.5px 5px;"></td>').join("") : ""}
    </tr>
  `).join("");

  // Collect faculty
  const facultyMap = {};
  days.forEach(day => {
    (schedule[day] || []).forEach(item => {
      if (item.teacher && !facultyMap[item.teacher]) {
        const info = getFacultyInfo(item.teacher, item.courseCode);
        facultyMap[item.teacher] = info && info.name ? info.name : item.teacher;
      }
    });
  });

  // Table rows
  let rowsHtml = "";
  days.forEach(day => {
    const classes = schedule[day] || [];
    const dc = dayColors[day] || { bg: "#f1f5f9", text: "#334155" };

    if (classes.length === 0) {
      rowsHtml += `
        <tr style="border-bottom: 2px solid #cbd5e1; background: #fafaf9;">
          <td style="padding: 6.5px 12px; font-weight: 800; font-size: 11px; text-transform: uppercase; background: ${dc.bg}; color: ${dc.text}; text-align: center; border-right: 1.5px solid #cbd5e1; letter-spacing: 0.04em; vertical-align: middle;">
            ${day}
          </td>
          <td colspan="4" style="padding: 6.5px 14px; font-size: 11px; color: #94a3b8; font-style: italic; text-align: center; vertical-align: middle;">
            No Scheduled Classes &bull; Offday
          </td>
        </tr>
      `;
    } else {
      classes.forEach((cls, idx) => {
        const cInfo = getCourseInfo(cls.courseCode);
        const facName = facultyMap[cls.teacher] || cls.teacher;
        const rowBg = idx % 2 === 0 ? "#ffffff" : "#fcfcfb";
        const isLastInDay = idx === classes.length - 1;
        const borderBottom = isLastInDay ? "2px solid #cbd5e1" : "1px solid #f1f5f9";

        rowsHtml += `
          <tr style="border-bottom: ${borderBottom}; background: ${rowBg};">
            <td style="padding: 6.5px 12px; font-weight: 800; font-size: 11px; text-transform: uppercase; background: ${dc.bg}; color: ${dc.text}; text-align: center; border-right: 1.5px solid #cbd5e1; letter-spacing: 0.04em; vertical-align: middle;">
              ${day}
            </td>
            <td style="padding: 6.5px 14px; font-size: 11.5px; font-weight: 700; color: #1e293b; border-right: 1px solid #eef2f6; white-space: nowrap; vertical-align: middle;">
              ${cls.time}
            </td>
            <td style="padding: 6.5px 14px; border-right: 1px solid #eef2f6; vertical-align: middle;">
              <div style="font-size: 12px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                <span>${cls.courseCode}</span>
                ${cls.type ? `<span style="font-size: 9.5px; font-weight: 700; padding: 1.5px 6px; border-radius: 4px; background: ${cls.type === 'Lab' ? '#fee2e2; color:#991b1b; border: 1px solid #fca5a5;' : '#e0f2fe; color:#0369a1; border: 1px solid #bae6fd;'}">${cls.type}</span>` : ''}
              </div>
              ${cInfo.title && cInfo.title !== "Course Title Not Specified" ? `
                <div style="font-size: 10.5px; font-weight: 500; color: #475569; margin-top: 2px; line-height: 1.3;">${cInfo.title}</div>
              ` : ''}
            </td>
            <td style="padding: 6.5px 14px; border-right: 1px solid #eef2f6; white-space: nowrap; vertical-align: middle;">
              <span style="display: inline-block; background: #f1f5f9; color: #1e293b; font-weight: 700; font-size: 10.5px; padding: 2.5px 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                Room ${cls.room}
              </span>
            </td>
            <td style="padding: 6.5px 14px; white-space: nowrap; vertical-align: middle;">
              <div style="display: flex; align-items: center; gap: 7px;">
                <span style="display: inline-block; background: #191c19; color: #d6f83b; font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.03em;">
                  ${cls.teacher}
                </span>
                <span style="font-size: 11px; font-weight: 600; color: #334155;">
                  ${facName}
                </span>
              </div>
            </td>
          </tr>
        `;
      });
    }
  });

  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(now);

  const cardHtml = `
    <div id="exportRoutineCard" style="width: 1200px; box-sizing: border-box; background: #ffffff; padding: 22px 28px 18px; font-family: 'Google Sans', 'Google Sans Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; border: 1.5px solid #cbd5e1; border-radius: 14px; position: relative;">
      
      <!-- Top Accent Bar -->
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, #191c19 0%, #d6f83b 50%, #191c19 100%); border-top-left-radius: 12px; border-top-right-radius: 12px;"></div>

      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #f1f5f9; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 10px; background: #191c19; display: flex; align-items: center; justify-content: center; color: #d6f83b; font-weight: 900; font-size: 18px; letter-spacing: 0.05em; box-shadow: 0 4px 10px rgba(0,0,0,0.12);">
            ICE
          </div>
          <div>
            <div style="font-size: 17px; font-weight: 900; color: #0f172a; letter-spacing: -0.01em;">Daffodil International University</div>
            <div style="font-size: 12.5px; font-weight: 700; color: #0284c7; margin-top: 1px;">Department of Information &amp; Communication Engineering</div>
            <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 2px;">Class Routine &bull; ${semester}</div>
          </div>
        </div>

        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em;">Target Batch</span>
            <span style="display: inline-block; background: #d6f83b; color: #141712; font-size: 19px; font-weight: 900; padding: 4px 16px; border-radius: 8px; border: 1.5px solid rgba(20,23,18,0.18); letter-spacing: 0.04em; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
              ${batch}
            </span>
          </div>
          <div style="font-size: 10.5px; font-weight: 700; color: #475569; letter-spacing: 0.04em;">
            ${termMap[batch] || "DIU ICE"} &bull; Weekly Timetable
          </div>
        </div>
      </div>

      <!-- Weekly Schedule Master Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 12px; table-layout: fixed;">
        <thead>
          <tr style="background: #191c19; color: #ffffff;">
            <th style="width: 110px; padding: 8px 12px; font-size: 11px; font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: 0.06em;">Day</th>
            <th style="width: 170px; padding: 8px 14px; font-size: 11px; font-weight: 800; text-align: left; text-transform: uppercase; letter-spacing: 0.06em;">Time Slot</th>
            <th style="width: 440px; padding: 8px 14px; font-size: 11px; font-weight: 800; text-align: left; text-transform: uppercase; letter-spacing: 0.06em;">Course Code &amp; Title</th>
            <th style="width: 130px; padding: 8px 14px; font-size: 11px; font-weight: 800; text-align: left; text-transform: uppercase; letter-spacing: 0.06em;">Room</th>
            <th style="width: 290px; padding: 8px 14px; font-size: 11px; font-weight: 800; text-align: left; text-transform: uppercase; letter-spacing: 0.06em;">Faculty</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Enrolled Courses & Directory Summary Card (100% html2canvas Compatible Table) -->
      <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
          <span style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em;">
            Enrolled Course Summary &bull; Batch ${batch}
          </span>
          <span style="font-size: 10px; font-weight: 700; color: #0f172a; background: #ffffff; padding: 1.5px 8px; border-radius: 10px; border: 1px solid #cbd5e1;">
            ${courseList.length} Courses &bull; ${totalCredits} Total Credits
          </span>
        </div>
        <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0;">
          <tbody>
            ${courseRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Professional Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #64748b; padding-top: 6px; border-top: 1px solid #eef2f6;">
        <div>
          <span>&bull; Official Routine &bull; <strong>Department of ICE</strong> &bull; DIU Smart Routine Engine</span>
        </div>
        <div style="text-align: center;">
          <span>Theory: 1h 30m | Laboratory: 3h&ndash;4h Session</span>
        </div>
        <div style="text-align: right;">
          <span>Generated: <strong>${dateStr}</strong> &bull; <strong>Page 1 of 1</strong></span>
        </div>
      </div>

    </div>
  `;

  const offscreen = document.createElement("div");
  offscreen.style.cssText = "position: fixed; left: -99999px; top: 0; width: 1200px; z-index: -9999; pointer-events: none;";
  offscreen.innerHTML = cardHtml;
  document.body.appendChild(offscreen);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch (e) {}

  await new Promise(r => setTimeout(r, 350));

  const targetEl = document.getElementById("exportRoutineCard") || offscreen;

  const canvas = await html2canvas(targetEl, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: 1200,
    height: targetEl.scrollHeight,
    windowWidth: 1200,
    windowHeight: targetEl.scrollHeight,
  });

  document.body.removeChild(offscreen);
  return canvas;
}

/**
 * EXPORT: High-Res 1-Page PNG Image
 */
async function downloadAsImage() {
  if (!state.routine) {
    showToast("No routine loaded to export", "error");
    return;
  }

  showToast("Generating 1-Page Image...", "info");

  try {
    const canvas = await generateRoutineCanvas();
    if (!canvas) throw new Error("Failed to generate routine canvas");

    const batch = state.selectedBatch || "Routine";
    const link = document.createElement("a");
    link.download = `DIU_ICE_${batch}_Routine.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Image downloaded successfully (1 Page)!", "success");
  } catch (err) {
    console.error("Image Export error:", err);
    showToast("Failed to download image", "error");
  }
}

/**
 * EXPORT: Clean 1-Page A4 Landscape PDF
 */
async function downloadAsPDF() {
  if (!state.routine) {
    showToast("No routine loaded to export", "error");
    return;
  }

  showToast("Preparing 1-Page PDF...", "info");

  try {
    const canvas = await generateRoutineCanvas();
    if (!canvas) throw new Error("Failed to generate routine canvas");

    const batch = state.selectedBatch || "Routine";

    // Check jsPDF library
    const JsPDFClass = (typeof window.jspdf !== "undefined" && window.jspdf.jsPDF) ? window.jspdf.jsPDF : null;

    if (!JsPDFClass) {
      window.print();
      return;
    }

    const pdf = new JsPDFClass({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 8;
    const printWidth = pageWidth - (margin * 2); // 281mm
    const printHeight = pageHeight - (margin * 2); // 194mm

    // Scale canvas to fit exactly on 1 page without distortion
    const canvasRatio = canvas.width / canvas.height;
    let finalW = printWidth;
    let finalH = finalW / canvasRatio;

    if (finalH > printHeight) {
      finalH = printHeight;
      finalW = finalH * canvasRatio;
    }

    const posX = margin + (printWidth - finalW) / 2;
    const posY = margin + (printHeight - finalH) / 2;

    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", posX, posY, finalW, finalH, undefined, "FAST");
    pdf.save(`DIU_ICE_${batch}_Routine.pdf`);

    showToast("PDF downloaded successfully (1 Page)!", "success");
  } catch (err) {
    console.error("PDF Export error:", err);
    window.print();
  }
}
window.downloadAsImage = downloadAsImage;
window.downloadAsPDF = downloadAsPDF;



function copyRoutineAsText() {
  if (!state.routine) return;
  const batch = state.selectedBatch;
  const sched = state.routine.batches[batch];
  if (!sched) return;

  const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  let text = `🎓 DIU ICE Department - Class Routine\n`;
  text += `Batch: ${batch} | Semester: ${state.routine.semester || "Fall-2026"}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  state.routine.days.forEach(day => {
    const classes = sched[day] || [];
    const isToday = day.toLowerCase() === currentDay.toLowerCase();
    text += `🗓️ ${day.toUpperCase()}${isToday ? ' (TODAY)' : ''}:\n`;

    if (classes.length === 0) {
      text += `   🌴 Offday (No Classes)\n\n`;
    } else {
      classes.forEach(c => {
        const course = getCourseInfo(c.courseCode);
        const titleStr = course && course.title ? ` (${course.title})` : '';
        text += `   • ${c.time} | ${c.courseCode}${titleStr}\n`;
        text += `     Room: ${c.room} | Teacher: ${c.teacher}\n`;
      });
      text += `\n`;
    }
  });

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Developed by Hridoy (https://github.com/foysalhridoy)`;

  navigator.clipboard.writeText(text).then(() => {
    showToast("Copied!", "success");
  }).catch(() => {
    showToast("Failed", "error");
  });
}

/**
 * EXPORT: iCalendar (.ics)
 */
function exportToCalendar() {
  if (!state.routine) return;
  const batch = state.selectedBatch;
  const sched = state.routine.batches[batch];
  if (!sched) return;

  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DIU ICE//Routine Generator//EN\n";

  const dayMap = {
    "Saturday": "SA",
    "Sunday": "SU",
    "Monday": "MO",
    "Tuesday": "TU",
    "Wednesday": "WE",
    "Thursday": "TH"
  };

  state.routine.days.forEach(day => {
    const classes = sched[day] || [];
    const byDay = dayMap[day];

    classes.forEach(c => {
      const course = getCourseInfo(c.courseCode);
      ics += "BEGIN:VEVENT\n";
      ics += `SUMMARY:${c.courseCode} - ${course.title}\n`;
      ics += `LOCATION:Room ${c.room}, DIU\n`;
      ics += `DESCRIPTION:Teacher: ${c.teacher}, Batch: ${batch}\n`;
      ics += `RRULE:FREQ=WEEKLY;BYDAY=${byDay}\n`;
      ics += `DTSTART;TZID=Asia/Dhaka:20260901T090000\n`;
      ics += `DTEND;TZID=Asia/Dhaka:20260901T103000\n`;
      ics += "END:VEVENT\n";
    });
  });

  ics += "END:VCALENDAR";

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DIU_ICE_${batch}_Routine.ics`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Exported!", "success");
}

/**
 * RENDER OFFICIAL COURSE SYLLABUS / CURRICULUM VIEW
 * Synchronized with Image 1 and Image 2 from Department Syllabus
 */
function renderCoursesView() {
  const container = elements.routineDisplayArea;
  if (!container) return;

  const allCourses = (typeof OFFICIAL_CURRICULUM !== "undefined" && OFFICIAL_CURRICULUM.length > 0)
    ? OFFICIAL_CURRICULUM
    : Object.entries(COURSE_CATALOG).map(([code, val]) => ({ code, ...val }));

  const currentFilter = state.courseLevelFilter || "all";
  const search = (state.courseSearchQuery || "").trim().toLowerCase();

  const filtered = allCourses.filter(c => {
    // Level filter
    if (currentFilter !== "all") {
      if (currentFilter === "Elective") {
        if (c.level !== "Elective" && c.type !== "Elective") return false;
      } else if (c.level !== currentFilter) {
        return false;
      }
    }
    // Search filter
    if (search) {
      const matchCode = c.code.toLowerCase().includes(search);
      const matchTitle = c.title.toLowerCase().includes(search);
      const matchType = (c.type || "").toLowerCase().includes(search);
      if (!matchCode && !matchTitle && !matchType) return false;
    }
    return true;
  });

  const totalCredits = allCourses.reduce((sum, c) => sum + (c.credit || 0), 0);
  const theoryCount = allCourses.filter(c => c.type === "Theory" || c.type === "GED").length;
  const labCount = allCourses.filter(c => c.type === "Lab").length;

  container.innerHTML = `
    <div class="courses-catalog-container">
      <div class="catalog-header-card">
        <div class="catalog-header-top">
          <div class="catalog-title-group">
            <h2>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                <path d="M6 6h10M6 10h10"/>
              </svg>
              <span>ICE Department Course Syllabus &amp; Curriculum</span>
            </h2>
            <p>Official Department Course Catalog &bull; Level 1 to Level 4 &amp; Electives</p>
          </div>
          <div class="catalog-stats-pills">
            <span class="catalog-stat-pill primary">${allCourses.length} Total Courses</span>
            <span class="catalog-stat-pill">${totalCredits} Total Credits</span>
            <span class="catalog-stat-pill">${theoryCount} Theory &bull; ${labCount} Labs</span>
          </div>
        </div>

        <div class="catalog-controls-row">
          <div class="catalog-search-wrapper">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input 
              type="text" 
              class="catalog-search-input" 
              id="catalogSearchInput" 
              placeholder="Search course code, title, or type..." 
              value="${state.courseSearchQuery || ""}"
            />
          </div>

          <div class="catalog-filter-chips">
            <button class="catalog-filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="setCourseLevelFilter('all')">All Levels (${allCourses.length})</button>
            <button class="catalog-filter-btn ${currentFilter === 'Level 1' ? 'active' : ''}" onclick="setCourseLevelFilter('Level 1')">Level 1</button>
            <button class="catalog-filter-btn ${currentFilter === 'Level 2' ? 'active' : ''}" onclick="setCourseLevelFilter('Level 2')">Level 2</button>
            <button class="catalog-filter-btn ${currentFilter === 'Level 3' ? 'active' : ''}" onclick="setCourseLevelFilter('Level 3')">Level 3</button>
            <button class="catalog-filter-btn ${currentFilter === 'Level 4' ? 'active' : ''}" onclick="setCourseLevelFilter('Level 4')">Level 4</button>
            <button class="catalog-filter-btn ${currentFilter === 'Elective' ? 'active' : ''}" onclick="setCourseLevelFilter('Elective')">Electives</button>
          </div>
        </div>
      </div>

      <div class="catalog-table-card">
        <div class="table-scroll-container">
          <table class="catalog-table">
            <thead>
              <tr>
                <th style="width: 140px;">Code</th>
                <th>Course Title</th>
                <th class="center" style="width: 80px;">Cr. H</th>
                <th class="center" style="width: 100px;">Type</th>
                <th style="width: 110px;">Level</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 2.5rem 1rem; color: #64748b;">
                    No courses found matching "${search}".
                  </td>
                </tr>
              ` : filtered.map(c => `
                <tr>
                  <td class="catalog-code-cell">${c.code}</td>
                  <td class="catalog-title-cell">${c.title}</td>
                  <td class="center catalog-credit-cell">${c.credit}</td>
                  <td class="center">
                    <span class="course-credit-chip chip-${(c.type || 'theory').toLowerCase()}">${c.type}</span>
                  </td>
                  <td>
                    <span style="font-size: 0.8rem; font-weight: 600; color: #475569;">${c.level || "General"}</span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById("catalogSearchInput")?.addEventListener("input", (e) => {
    state.courseSearchQuery = e.target.value;
    renderCoursesView();
    const newIn = document.getElementById("catalogSearchInput");
    if (newIn) {
      newIn.focus();
      newIn.selectionStart = newIn.selectionEnd = newIn.value.length;
    }
  });
}
window.renderCoursesView = renderCoursesView;

function setCourseLevelFilter(level) {
  state.courseLevelFilter = level;
  renderCoursesView();
}
window.setCourseLevelFilter = setCourseLevelFilter;

function updateViewTabs() {
  elements.viewTabs = document.querySelectorAll(".nav-tab-btn");
  elements.viewTabs.forEach(tab => {
    if (tab.dataset.view === state.activeView) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  const batchSection = document.getElementById("batchSelectorSection");
  if (batchSection) {
    batchSection.style.display = (state.activeView === "courses") ? "none" : "";
  }
  if (elements.statsBanner) {
    elements.statsBanner.style.display = (state.activeView === "courses") ? "none" : "";
  }
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  elements.btnFetchSheet?.addEventListener("click", () => {
    const url = elements.sheetUrlInput.value.trim();
    fetchSheetData(url);
  });

  elements.btnUploadFile?.addEventListener("click", () => {
    elements.fileInput.click();
  });

  elements.fileInput?.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  });

  elements.viewTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      state.activeView = tab.dataset.view;
      updateViewTabs();
      renderCurrentView();
    });
  });



  let searchDebounceTimer = null;
  elements.searchInput?.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    if (elements.searchClearBtn) {
      elements.searchClearBtn.classList.toggle("visible", Boolean(e.target.value.trim()));
    }
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      renderCurrentView();
    }, 60);
  });

  elements.searchClearBtn?.addEventListener("click", clearSearchFilter);

  // ── Batch Chips: GPU-smooth Transform Ticker ─────────────────────────────
  const chipsEl = elements.batchChipsContainer;
  if (chipsEl) {
    let tickerRAF    = null;
    let tickerPaused = false;
    let pos          = 0;          // float position in px
    const SPEED      = 0.22;       // px per frame — very slow & silky

    function getTrack() {
      return chipsEl.querySelector(".batch-chips-track");
    }

    function runTicker() {
      const track = getTrack();
      if (track && !tickerPaused) {
        const maxScroll = track.scrollWidth - chipsEl.clientWidth;
        if (maxScroll > 0) {
          pos += SPEED;
          if (pos >= maxScroll) pos = 0;   // seamless loop
          track.style.transform = `translateX(${-pos}px)`;
        }
      }
      tickerRAF = requestAnimationFrame(runTicker);
    }
    tickerRAF = requestAnimationFrame(runTicker);

    // Pause on hover (desktop) — resume on leave
    chipsEl.addEventListener("mouseenter", () => { tickerPaused = true; });
    chipsEl.addEventListener("mouseleave", () => { tickerPaused = false; });

    // Touch: pause on touch, resume after finger up with delay
    chipsEl.addEventListener("touchstart", () => { tickerPaused = true; }, { passive: true });
    chipsEl.addEventListener("touchend", () => {
      setTimeout(() => { tickerPaused = false; }, 1500);
    }, { passive: true });

    // Mouse drag scroll — temporarily shift pos
    let isDragging = false, dragStartX = 0, dragStartPos = 0;
    chipsEl.addEventListener("mousedown", (e) => {
      isDragging = true;
      tickerPaused = true;
      dragStartX   = e.clientX;
      dragStartPos = pos;
      chipsEl.style.cursor = "grabbing";
    });
    window.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      chipsEl.style.cursor = "grab";
      setTimeout(() => { tickerPaused = false; }, 1500);
    });
    chipsEl.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const track = getTrack();
      if (!track) return;
      const delta = dragStartX - e.clientX;
      const maxScroll = track.scrollWidth - chipsEl.clientWidth;
      pos = Math.max(0, Math.min(maxScroll, dragStartPos + delta));
      track.style.transform = `translateX(${-pos}px)`;
    });

    // Mouse wheel horizontal scroll
    chipsEl.addEventListener("wheel", (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      const track = getTrack();
      if (!track) return;
      const maxScroll = track.scrollWidth - chipsEl.clientWidth;
      pos = Math.max(0, Math.min(maxScroll, pos + e.deltaY * 0.5));
      track.style.transform = `translateX(${-pos}px)`;
    }, { passive: false });
  }


  elements.modalCloseBtn?.addEventListener("click", closeFacultyModal);
  elements.facultyModalOverlay?.addEventListener("click", (e) => {
    if (e.target === elements.facultyModalOverlay) closeFacultyModal();
  });
  elements.btnFacultyViewAllClasses?.addEventListener("click", () => {
    closeFacultyModal();
    if (state.currentModalInitial) {
      state.selectedTeacher = state.currentModalInitial;
      state.activeView = "teacher";
      updateViewTabs();
      renderCurrentView();
      elements.routineDisplayArea?.scrollIntoView({ behavior: "smooth" });
    }
  });

  // Header Date Badge Listener (Scrolls to routine and filters today directly without popup)
  document.getElementById("headerDateBadge")?.addEventListener("click", () => {
    setDayFilter("today");
    if (state.activeView !== "batch") {
      state.activeView = "batch";
      updateViewTabs();
      renderCurrentView();
    }
    elements.routineDisplayArea?.scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("todayModalCloseBtn")?.addEventListener("click", closeTodayClassesModal);
  document.getElementById("btnTodayCloseAction")?.addEventListener("click", closeTodayClassesModal);
  document.getElementById("btnTodayViewFullRoutine")?.addEventListener("click", () => {
    closeTodayClassesModal();
    setDayFilter("today");
    if (state.activeView !== "batch") {
      state.activeView = "batch";
      updateViewTabs();
      renderCurrentView();
    }
    elements.routineDisplayArea?.scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("todayModalOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "todayModalOverlay") closeTodayClassesModal();
  });

  // Global Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeFacultyModal();
      closeTodayClassesModal();
      if (state.searchQuery) clearSearchFilter();
    } else if (e.key === "/" && elements.searchInput && document.activeElement !== elements.searchInput && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      e.preventDefault();
      elements.searchInput.focus();
    }
  });

  // Dynamic Screen Resize Listener for Mobile vs PC View Switch
  let resizeDebounceTimer = null;
  let lastWasMobile = typeof window !== "undefined" ? window.innerWidth <= 768 : false;
  window.addEventListener("resize", () => {
    clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
      const currentIsMobile = window.innerWidth <= 768;
      if (currentIsMobile !== lastWasMobile) {
        lastWasMobile = currentIsMobile;
        if (state.activeView === "batch") {
          renderBatchRoutine();
        }
      }
    }, 120);
  });

  // Periodically refresh live date, routine updates (3-day expiry), and class status
  setInterval(() => {
    updateLiveDateBadge();
    checkAndPruneRoutineUpdates();
    if (state.activeView === "batch") {
      renderBatchRoutine();
    }
  }, 60000);
}

/**
 * Real-Time Visitor Counter & Presence Integration
 */
function initRealtimeVisitorTracker() {
  if (window.firebaseSync && typeof window.firebaseSync.initVisitorTracker === "function") {
    window.firebaseSync.initVisitorTracker((stats) => {
      if (stats.online !== undefined) {
        const liveEl = document.getElementById("liveVisitorCount");
        if (liveEl) {
          liveEl.textContent = Number(stats.online).toLocaleString();
        }
      }
      if (stats.total !== undefined) {
        const totalEl = document.getElementById("totalVisitorCount");
        if (totalEl) {
          totalEl.textContent = Number(stats.total).toLocaleString();
        }
      }
    });
  }
}

/**
 * Live Date in Navbar Header
 */
function updateLiveDateBadge() {
  const dateEl = document.getElementById("headerDateText");
  if (!dateEl) return;
  const now = new Date();
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(now);
  const formattedDate = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(now);
  dateEl.textContent = `${dayName}, ${formattedDate}`;
}
window.updateLiveDateBadge = updateLiveDateBadge;

function updateDigitalClock() {
  updateLiveDateBadge();
}
window.updateDigitalClock = updateDigitalClock;

// Boot on Load
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(state.theme);
  initSheetInput();
  setupEventListeners();
  updateLiveDateBadge();
  loadInitialData();
  initRealtimeVisitorTracker();
  updateDigitalClock();
  setInterval(updateDigitalClock, 1000);
});
