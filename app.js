/**
 * DIU ICE Routine Generator - Application Controller
 * Premium UX with Lexend Typography, Verified Faculty Integration & Responsive Layouts
 */

// Application State
const state = {
  routine: null,
  routineUpdates: [],
  selectedBatch: "L1T1",
  activeView: "batch", // "batch" | "master" | "teacher" | "room"
  dayFilter: "all", // "all" | "today"
  searchQuery: "",
  displayMode: localStorage.getItem("ice_display_mode") || "table", // "table" | "cards"
  theme: "light",
  defaultSheetUrl: "https://docs.google.com/spreadsheets/d/12o-rgXoLFpLKPMNdpqNJwF8y2r1CzgEx45TsUJafVTY/edit?pli=1&gid=1763419013#gid=1763419013",
  selectedTeacher: null,
  selectedRoom: null,
  currentModalInitial: null
};

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
  btnPrint: document.getElementById("btnPrint"),
  btnDownloadImage: document.getElementById("btnDownloadImage"),
  btnDownloadRoutine: document.getElementById("btnDownloadRoutine"),
  downloadDropdownWrapper: document.getElementById("downloadDropdownWrapper"),
  btnCopyText: document.getElementById("btnCopyText"),
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
  tickerBadge: document.getElementById("tickerBadge"),
  tickerBadgeTitle: document.getElementById("tickerBadgeTitle"),
  tickerTrack: document.getElementById("tickerTrack"),
  tickerStatusTag: document.getElementById("tickerStatusTag"),
  tickerLiveDot: document.getElementById("tickerLiveDot")
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
  toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
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
  const isConfigured = window.firebaseSync && window.firebaseSync.isConfigured();
  if (elements.headerCloudBadge) {
    if (isConfigured) {
      elements.headerCloudBadge.innerHTML = `<span class="cloud-dot-active"></span> <span>Cloud Live</span>`;
      elements.headerCloudBadge.title = "Real-time Cloud Sync Active (Firestore)";
      elements.headerCloudBadge.style.display = "inline-flex";
    } else {
      elements.headerCloudBadge.innerHTML = `<span class="status-indicator-dot dot-inactive"></span> <span>Offline</span>`;
      elements.headerCloudBadge.title = "Using local routine copy";
    }
  }
}

/* ==========================================================================
   ROUTINE NEWS TICKER & EXCEL CHANGE DETECTION ENGINE
   ========================================================================== */

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
 * Process routine update against saved baseline snapshot
 */
function processRoutineDataUpdate(newRoutine, isInitial = false, cloudUpdates = null) {
  if (!newRoutine || !newRoutine.batches) return;

  // If cloud delivered explicit updates
  if (Array.isArray(cloudUpdates) && cloudUpdates.length > 0) {
    state.routineUpdates = cloudUpdates;
    try {
      localStorage.setItem("diu_ice_routine_updates", JSON.stringify(cloudUpdates));
      localStorage.setItem("diu_ice_routine_snapshot", JSON.stringify(newRoutine.batches));
    } catch (e) {}
    renderNewsTicker(cloudUpdates);
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

    if (Array.isArray(storedUpdates) && storedUpdates.length > 0) {
      state.routineUpdates = storedUpdates;
      renderNewsTicker(storedUpdates);
    } else {
      state.routineUpdates = [];
      renderNewsTicker([]);
    }
    return;
  }

  try {
    const oldBatches = JSON.parse(cachedSnapshotStr);
    const changes = detectRoutineChanges(oldBatches, newRoutine.batches);

    if (changes.length > 0) {
      state.routineUpdates = changes;
      localStorage.setItem("diu_ice_routine_updates", JSON.stringify(changes));
      localStorage.setItem("diu_ice_routine_snapshot", JSON.stringify(newRoutine.batches));
      renderNewsTicker(changes);

      if (!isInitial) {
        showToast(`⚡ ${changes.length} routine update${changes.length > 1 ? "s" : ""} detected in Excel!`, "success");
      }
    } else {
      // No changes detected in this load/upload
      if (!isInitial) {
        state.routineUpdates = [];
        localStorage.removeItem("diu_ice_routine_updates");
        renderNewsTicker([]);
        showToast("Excel verified: Routine is unchanged and fully up to date.", "info");
      } else {
        let storedUpdates = [];
        try {
          const raw = localStorage.getItem("diu_ice_routine_updates");
          if (raw) storedUpdates = JSON.parse(raw);
        } catch (e) {}

        if (Array.isArray(storedUpdates) && storedUpdates.length > 0) {
          state.routineUpdates = storedUpdates;
          renderNewsTicker(storedUpdates);
        } else {
          state.routineUpdates = [];
          renderNewsTicker([]);
        }
      }
    }
  } catch (err) {
    console.warn("Routine update processing error:", err);
    try {
      localStorage.setItem("diu_ice_routine_snapshot", JSON.stringify(newRoutine.batches));
    } catch (e) {}
    renderNewsTicker([]);
  }
}

/**
 * Render news ticker or the requested fallback message if no updates exist.
 */
function renderNewsTicker(updates = []) {
  if (!elements.routineNewsTicker || !elements.tickerTrack) return;

  const ticker = elements.routineNewsTicker;
  const track = elements.tickerTrack;
  const badgeTitle = elements.tickerBadgeTitle;
  const statusTag = elements.tickerStatusTag;

  track.innerHTML = "";

  if (Array.isArray(updates) && updates.length > 0) {
    ticker.classList.add("has-updates");
    if (badgeTitle) badgeTitle.textContent = "UPDATES";
    if (statusTag) {
      statusTag.innerHTML = `<span class="ticker-status-dot"></span><span>${updates.length} New Update${updates.length > 1 ? "s" : ""}</span>`;
    }

    const buildItemsHtml = () => {
      return updates.map((item) => `
        <div class="ticker-item" data-batch="${item.batch}" data-day="${item.day}" role="button" tabindex="0" title="Click to view ${item.batch} ${item.day} schedule">
          <span class="ticker-bolt-icon" aria-hidden="true">⚡</span>
          <span class="ticker-batch-tag">${item.batch}</span>
          <span class="ticker-item-text"><strong>${item.batch}</strong> updated on <strong>${item.day}</strong> schedule</span>
          <span class="ticker-item-arrow" aria-hidden="true">→</span>
        </div>
      `).join("");
    };

    let html = buildItemsHtml();
    // Seamless marquee looping: repeat items for non-choppy infinite loop
    if (updates.length < 4) {
      html += buildItemsHtml() + buildItemsHtml() + buildItemsHtml();
    } else {
      html += buildItemsHtml() + buildItemsHtml();
    }
    track.innerHTML = html;

    const speedSeconds = Math.max(18, updates.length * 6);
    track.style.animationDuration = `${speedSeconds}s`;
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
    // Exact fallback required by user:
    // "ar jodi excel update na hoy tahole bolba j kono update ashe nai routine e ashle janay deya hobe"
    ticker.classList.remove("has-updates");

    if (badgeTitle) badgeTitle.textContent = "NOTICE";
    if (statusTag) {
      statusTag.innerHTML = `<span class="ticker-status-dot"></span><span>Live Feed</span>`;
    }

    const singleNotice = `
      <div class="ticker-empty-item">
        <span class="ticker-broadcast-pill">NOTICE</span>
        <span class="ticker-empty-text">রুটিনে কোনো নতুন আপডেট আসেনি, নতুন আপডেট আসলে জানিয়ে দেওয়া হবে</span>
        <span class="ticker-diamond-sep" aria-hidden="true">✦</span>
      </div>
    `;

    // Seamless right-to-left continuous marquee
    track.innerHTML = singleNotice + singleNotice + singleNotice + singleNotice;
    track.style.animationDuration = "28s";
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

  showToast(`📌 Showing ${batch} (${day} schedule updated)`, "info");
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
    showToast("🔥 Routine updated globally from Cloud!", "success");
  });
}

async function publishCurrentRoutineToCloud(sourceUrl, sourceType = "google_sheet") {
  if (!window.firebaseSync || !window.firebaseSync.isConfigured()) return;
  if (!state.routine || !state.routine.batches) return;

  try {
    await window.firebaseSync.publishGlobalRoutine({
      sheetUrl: sourceUrl || "",
      semester: state.routine.semester || "Fall-2026",
      batches: state.routine.allBatchesList || Object.keys(state.routine.batches),
      rawSchedule: state.routine.batches,
      updatedBy: "DIU Student/CR",
      sourceType: sourceType,
      recentUpdates: state.routineUpdates || []
    });
    showToast("🚀 Published Globally! All students will now see this routine.", "success");
  } catch (err) {
    console.warn("Failed to publish to Firebase:", err);
    showToast("Cloud sync failed: " + err.message, "error");
  }
}

/**
 * Load Initial Data (Cloud Firestore, Fall-2026 local copy or live sync)
 */
async function loadInitialData() {
  updateCloudSyncUI();
  updateLiveDateBadge();
  setLoading(true, "Loading Routine...");

  // 1. Try loading from Firebase Cloud Firestore first
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
        processRoutineDataUpdate(state.routine, true, cloudData.recentUpdates);
        onDataLoaded("Cloud Synced");
        subscribeToCloudUpdates();
        return;
      }
    } catch (err) {
      console.warn("Could not load from Firebase, falling back to local...", err);
    }
  }

  // 2. Fallback to local default CSV
  try {
    const resp = await fetch("data/default_routine.csv");
    if (resp.ok) {
      const csvText = await resp.text();
      state.routine = parseRoutineData(csvText);
      processRoutineDataUpdate(state.routine, true);
      onDataLoaded("Ready");
      subscribeToCloudUpdates();
      return;
    }
  } catch (e) {
    console.warn("Could not load local default CSV, attempting live sheet...", e);
  }

  // 3. Fallback to live Google Sheet
  await fetchSheetData(state.defaultSheetUrl);
  subscribeToCloudUpdates();
}

/**
 * Fetch and parse data from Google Sheet URL
 */
async function fetchSheetData(url) {
  if (!url) {
    showToast("Please provide a valid Google Sheet URL", "error");
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
      showToast("Live routine successfully synced on this device!", "success");
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

    showToast("Failed to fetch sheet: " + err.message, "error");
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
        showToast("Routine imported successfully on this device!", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Error parsing uploaded file: " + err.message, "error");
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

  state.routine.allBatchesList.forEach(batch => {
    const chip = document.createElement("button");
    chip.className = `batch-chip ${batch === state.selectedBatch ? "active" : ""}`;
    chip.textContent = batch;
    chip.onclick = () => {
      state.selectedBatch = batch;
      document.querySelectorAll(".batch-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      renderStats();
      renderCurrentView();
    };
    elements.batchChipsContainer.appendChild(chip);
  });
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
      <div class="stat-icon blue">📚</div>
      <div>
        <div class="stat-value">${courseList.length}</div>
        <div class="stat-label">Total Courses</div>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-icon green">🎓</div>
      <div>
        <div class="stat-value">${totalCredits} Cr</div>
        <div class="stat-label">Credit Hours</div>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-icon amber">⏱️</div>
      <div>
        <div class="stat-value">${totalClasses}</div>
        <div class="stat-label">Weekly Classes</div>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-icon purple">🏖️</div>
      <div>
        <div class="stat-value">${offdayCount} Days</div>
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
 * Render based on current view
 */
function renderCurrentView() {
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

  // Toggle Bar (Table vs Cards + All Days vs Today)
  const isCardsMode = state.displayMode === "cards";
  const viewToggleBarHtml = `
    <div class="routine-view-toggle-bar no-print">
      <div class="view-toggle-pill-group">
        <button class="view-toggle-btn ${!isCardsMode ? 'active' : ''}" onclick="toggleDisplayMode('table')" title="Table View">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2.5"/>
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
          </svg>
          <span>Table</span>
        </button>
        <button class="view-toggle-btn ${isCardsMode ? 'active' : ''}" onclick="toggleDisplayMode('cards')" title="Cards View">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="20" x="5" y="2" rx="3"/>
            <path d="M12 18h.01"/>
          </svg>
          <span>Cards</span>
        </button>
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
        cardsHtml += `
          <div class="mobile-day-card offday-card ${isToday ? 'is-today-card' : ''}">
            <div class="mobile-day-header day-${daySlug}">
              <span class="day-name">${day} ${isToday ? '<span class="today-tag-card-modern"><span class="today-spark-dot"></span><span>TODAY</span></span>' : ''}</span>
              <span class="offday-badge">Offday</span>
            </div>
            <div class="mobile-offday-body">
              <span>🌴 No Classes Scheduled (Offday)</span>
            </div>
          </div>
        `;
      } else {
        cardsHtml += `
          <div class="mobile-day-card ${isToday ? 'is-today-card' : ''}">
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
                    <div class="class-card-bottom">
                      <div class="class-card-room">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>${cls.room}</span>
                      </div>
                      <span class="teacher-initial-tag">${cls.teacher}</span>
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
    // Exact Image 1 Table View
    let tableRowsHtml = "";
    let alternateCounter = 0;

    activeDays.forEach(day => {
      const classes = dayClasses[day];
      const daySlug = day.toLowerCase();
      const isToday = day.toLowerCase() === currentDayName.toLowerCase();

      classes.forEach((cls, idx) => {
        alternateCounter++;
        const fac = getFacultyInfo(cls.teacher, cls.courseCode);
        const facName = fac ? fac.name : cls.teacher;
        const course = getCourseInfo(cls.courseCode);
        const timeStatus = getClassTimeState(cls.time, day);
        let rowClass = (alternateCounter % 2 === 0) ? "row-fill-purple" : "row-fill-green";
        if (isToday && timeStatus && timeStatus.state === 'now') {
          rowClass = "row-running-class";
        }

        tableRowsHtml += `
          <tr class="${rowClass}">
            ${idx === 0 ? `
              <td class="day-head-cell day-${daySlug} ${isToday ? 'is-today-day-cell' : ''}" rowspan="${classes.length}">
                <div class="day-cell-inner">
                  <span class="day-cell-name">${day}</span>
                  ${isToday ? '<span class="today-tag-modern"><span class="today-spark-dot"></span><span>TODAY</span></span>' : ''}
                </div>
              </td>` : ""}
            <td class="course-cell-code">
              <div class="course-code-main"><strong>${cls.courseCode}</strong></div>
            </td>
            <td class="time-cell-text">
              <div>${cls.time}</div>
              ${timeStatus ? `<div style="margin-top: 0.3rem;">${timeStatus.badge}</div>` : ''}
            </td>
            <td class="room-cell-text">${cls.room}</td>
            <td>
              <span class="teacher-initial-tag">${cls.teacher}</span>
            </td>
          </tr>
        `;
      });
    });

    // Render Off Days (Stacked on left, merged "Offday" block on right, exactly matching Image 1!)
    if (offDays.length > 0) {
      offDays.forEach((day, idx) => {
        const daySlug = day.toLowerCase();
        const isToday = day.toLowerCase() === currentDayName.toLowerCase();
        tableRowsHtml += `
          <tr>
            <td class="day-head-cell day-${daySlug} ${isToday ? 'is-today-day-cell' : ''}">
              <div class="day-cell-inner">
                <span class="day-cell-name">${day}</span>
                  ${isToday ? '<span class="today-tag-modern"><span class="today-spark-dot"></span><span>TODAY</span></span>' : ''}
              </div>
            </td>
            ${idx === 0 ? `<td class="offday-merged-block" colspan="4" rowspan="${offDays.length}">Offday</td>` : ""}
          </tr>
        `;
      });
    }

    scheduleBodyHtml = `
      <div class="table-scroll-container" id="tableScrollContainer">
        <table class="routine-grid-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Course</th>
              <th>Time</th>
              <th>Room no.</th>
              <th>Teacher Initial</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="routine-presentation-card" id="routineCardToExport">
      <div class="routine-head">
        <div class="routine-head-info">
          <h2>Department of Information and Communication Engineering</h2>
          <p>Daffodil International University &bull; Class Routine (Fall-2026)</p>
        </div>
        <div class="routine-badge-box">
          <div class="badge-batch">${batch}</div>
          <div class="badge-term">${isTodayOnly ? "Today's Schedule" : "Weekly Schedule"}</div>
        </div>
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
  const container = document.getElementById("tableScrollContainer") || document.querySelector(".table-scroll-container");
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
    if (container) container.classList.remove("dragging");
  });

  container.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;
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
            <button class="btn btn-secondary btn-sm" onclick="state.selectedBatch='${b}'; state.activeView='batch'; updateViewTabs(); renderStats(); renderCurrentView();">
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

  const fac = getFacultyInfo(selectedTeacher);

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
    tableContentHtml = displayedTeacherClasses.map(c => `
      <tr>
        <td><strong>${c.day}</strong></td>
        <td>${c.time}</td>
        <td><span class="batch-chip" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">${c.batch}</span></td>
        <td class="course-cell-code">
          <div class="course-code-main"><strong>${c.courseCode}</strong></div>
        </td>
        <td class="room-cell-text">${c.room}</td>
      </tr>
    `).join("");
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
    tableContentHtml = displayedRoomClasses.map(c => `
      <tr>
        <td><strong>${c.day}</strong></td>
        <td>${c.time}</td>
        <td><span class="batch-chip" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">${c.batch}</span></td>
        <td class="course-cell-code">
          <div class="course-code-main"><strong>${c.courseCode}</strong></div>
        </td>
        <td>
          <span class="teacher-initial-tag">${c.teacher}</span>
        </td>
      </tr>
    `).join("");
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
 * EXPORT: High-Res PNG Image
 * Uses a completely flat table (NO rowspan/colspan) with 100% inline styles
 * so html2canvas renders it perfectly on all devices.
 */
async function downloadAsImage() {
  if (!state.routine) {
    showToast("No routine loaded yet", "error");
    return;
  }

  showToast("Rendering high-res routine image...", "info");

  try {
    if (typeof html2canvas === "undefined") {
      throw new Error("html2canvas library is loading or blocked.");
    }

    const batch = state.selectedBatch;
    const schedule = state.routine.batches[batch];
    if (!schedule) {
      showToast("No schedule for selected batch", "error");
      return;
    }

    const days = state.routine.days;
    const semester = state.routine.semester || "Fall-2026";

    // --- Day color palette (matching the app's day colors) ---
    const dayColors = {
      Saturday:  { bg: "#c3b9d6", text: "#26193d" },
      Sunday:    { bg: "#c7dcb8", text: "#1d3610" },
      Monday:    { bg: "#f7d2b5", text: "#5c2a00" },
      Tuesday:   { bg: "#b5cfdc", text: "#0a2a3d" },
      Wednesday: { bg: "#dcc5b5", text: "#3d1f00" },
      Thursday:  { bg: "#b5dcc5", text: "#0a3d1f" },
    };

    // --- Collect unique courses ---
    const courseCodeSet = new Set();
    days.forEach(day => {
      (schedule[day] || []).forEach(item => {
        if (item.courseCode) courseCodeSet.add(item.courseCode);
      });
    });
    const courseList = Array.from(courseCodeSet).map(code => getCourseInfo(code));
    courseList.sort((a, b) => a.code.localeCompare(b.code));
    const totalCredits = courseList.reduce((sum, c) => sum + (c.credit || 0), 0);

    // --- Base styles (all inline) ---
    const S = {
      card:     "font-family:'Lexend',Arial,sans-serif;background:#fff;padding:28px 32px;border-radius:12px;color:#0f172a;",
      header:   "display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #e2e8f0;",
      h2:       "font-size:18px;font-weight:800;color:#0f172a;margin:0 0 4px 0;",
      subhead:  "font-size:12px;color:#64748b;margin:0;",
      badgeBox: "text-align:right;",
      batchB:   "display:inline-block;font-size:22px;font-weight:900;color:#0284c7;border:2px solid #0284c7;border-radius:8px;padding:6px 18px;letter-spacing:1px;",
      termB:    "display:block;font-size:10px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-top:4px;",

      courseWrap: "margin-bottom:18px;",
      courseHead: "display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;color:#0f172a;margin-bottom:8px;",
      coursePill: "background:#e0f2fe;color:#0284c7;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;",
      ol:         "margin:0;padding-left:20px;",
      li:         "font-size:12px;color:#334155;margin-bottom:4px;display:flex;justify-content:space-between;",
      crBadge:    "color:#0284c7;font-weight:700;font-size:11px;",

      table:   "width:100%;border-collapse:collapse;border:1.5px solid #94a3b8;",
      th:      "background:#1e40af;color:#fff;font-size:12px;font-weight:700;padding:10px 12px;text-align:left;border:1px solid #1d4ed8;letter-spacing:0.5px;",
      tdBase:  "font-size:12px;padding:9px 12px;border:1px solid #e2e8f0;vertical-align:middle;",
      dayTd:   "font-size:12px;font-weight:700;padding:9px 12px;border:1px solid rgba(0,0,0,0.08);vertical-align:middle;text-align:center;",
      codeTd:  "font-size:12px;font-weight:700;color:#0284c7;padding:9px 12px;border:1px solid #e2e8f0;vertical-align:middle;",
      offTd:   "font-size:12px;color:#94a3b8;padding:9px 12px;border:1px solid #e2e8f0;vertical-align:middle;text-align:center;font-style:italic;",
      footer:  "display:flex;justify-content:space-between;margin-top:14px;font-size:10.5px;color:#64748b;padding-top:10px;border-top:1px solid #e2e8f0;",
    };

    // --- Row bg alternation ---
    const rowBgs = ["#f0f7ff", "#f5f3ff"];
    let rowIdx = 0;

    // --- Build course list HTML ---
    const courseHtml = `
      <div style="${S.courseWrap}">
        <div style="${S.courseHead}">
          <span>Course details:</span>
          <span style="${S.coursePill}">${courseList.length} Courses &bull; ${totalCredits} Credit Hours</span>
        </div>
        <ol style="${S.ol}">
          ${courseList.map(c => `
            <li style="${S.li}">
              <span><strong style="color:#0284c7">${c.code}</strong> &ndash; ${c.title}</span>
              <span style="${S.crBadge}">${c.credit} Cr</span>
            </li>
          `).join("")}
        </ol>
      </div>`;

    // --- Build flat table rows (NO rowspan, NO colspan) ---
    let rowsHtml = "";

    days.forEach(day => {
      const classes = schedule[day] || [];
      const dc = dayColors[day] || { bg: "#e2e8f0", text: "#0f172a" };

      if (classes.length === 0) {
        // Offday row
        rowsHtml += `
          <tr>
            <td style="${S.dayTd}background:${dc.bg};color:${dc.text};">${day}</td>
            <td colspan="4" style="${S.offTd}">Offday</td>
          </tr>`;
      } else {
        classes.forEach((cls, idx) => {
          const bg = rowBgs[rowIdx % 2];
          rowIdx++;
          const fac = getFacultyInfo(cls.teacher);
          const facName = fac && fac.name ? fac.name : cls.teacher;
          rowsHtml += `
            <tr>
              <td style="${S.dayTd}background:${dc.bg};color:${dc.text};">${day}</td>
              <td style="${S.codeTd}background:${bg};">${cls.courseCode}</td>
              <td style="${S.tdBase}background:${bg};">${cls.time}</td>
              <td style="${S.tdBase}background:${bg};">${cls.room}</td>
              <td style="${S.tdBase}background:${bg};font-weight:600;">${cls.teacher}</td>
            </tr>`;
        });
      }
    });

    // --- Full HTML ---
    const fullHtml = `
      <div style="${S.card}">
        <div style="${S.header}">
          <div>
            <h2 style="${S.h2}">Department of Information and Communication Engineering</h2>
            <p style="${S.subhead}">Daffodil International University &bull; Class Routine (${semester})</p>
          </div>
          <div style="${S.badgeBox}">
            <span style="${S.batchB}">${batch}</span>
            <span style="${S.termB}">Weekly Schedule</span>
          </div>
        </div>
        ${courseHtml}
        <table style="${S.table}">
          <thead>
            <tr>
              <th style="${S.th}">Day</th>
              <th style="${S.th}">Course</th>
              <th style="${S.th}">Time</th>
              <th style="${S.th}">Room No.</th>
              <th style="${S.th}">Teacher</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div style="${S.footer}">
          <span>Routine for <strong>${batch}</strong> &bull; DIU Smart Routine Engine</span>
          <span>Standard Theory: 1h 30m | Laboratory: 3h&ndash;4h Session</span>
        </div>
      </div>`;

    // --- Off-screen container ---
    const offscreen = document.createElement("div");
    offscreen.style.cssText = "position:fixed;top:-99999px;left:-99999px;width:860px;z-index:-9999;";
    offscreen.innerHTML = fullHtml;
    document.body.appendChild(offscreen);

    // Let layout settle
    await new Promise(r => setTimeout(r, 400));

    const canvas = await html2canvas(offscreen, {
      scale: 2.5,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 860,
      height: offscreen.scrollHeight,
      windowWidth: 860,
      windowHeight: offscreen.scrollHeight
    });

    document.body.removeChild(offscreen);

    const link = document.createElement("a");
    link.download = `DIU_ICE_${batch}_Routine.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("✅ Routine image downloaded!", "success");
  } catch (err) {
    console.error(err);
    showToast("Failed to generate image: " + err.message, "error");
  }
}



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
    showToast("📋 Routine copied for WhatsApp/Messenger!", "success");
  }).catch(() => {
    showToast("Could not copy text to clipboard", "error");
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
  showToast("Calendar (.ics) file exported!", "success");
}

function updateViewTabs() {
  elements.viewTabs.forEach(tab => {
    if (tab.dataset.view === state.activeView) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
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

  elements.btnPrint?.addEventListener("click", () => window.print());
  elements.btnDownloadImage?.addEventListener("click", downloadAsImage);
  elements.btnCopyText?.addEventListener("click", copyRoutineAsText);

  // Glowing Download Routine Dropdown Controller
  const downloadWrapper = elements.downloadDropdownWrapper;
  const downloadBtn = elements.btnDownloadRoutine;

  downloadBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = downloadWrapper?.classList.toggle("is-open");
    downloadBtn.setAttribute("aria-expanded", String(Boolean(isOpen)));
  });

  document.addEventListener("click", (e) => {
    if (downloadWrapper && !downloadWrapper.contains(e.target)) {
      downloadWrapper.classList.remove("is-open");
      downloadBtn?.setAttribute("aria-expanded", "false");
    }
  });

  document.querySelectorAll(".download-menu-item").forEach(item => {
    item.addEventListener("click", () => {
      downloadWrapper?.classList.remove("is-open");
      downloadBtn?.setAttribute("aria-expanded", "false");
    });
  });

  elements.searchInput?.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    if (elements.searchClearBtn) {
      elements.searchClearBtn.classList.toggle("visible", Boolean(e.target.value.trim()));
    }
    renderCurrentView();
  });

  elements.searchClearBtn?.addEventListener("click", clearSearchFilter);

  // Batch chips horizontal scroll wheel
  elements.batchChipsContainer?.addEventListener("wheel", (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      elements.batchChipsContainer.scrollLeft += e.deltaY;
    }
  }, { passive: false });

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

  // Global Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeFacultyModal();
      if (state.searchQuery) clearSearchFilter();
    } else if (e.key === "/" && document.activeElement !== elements.searchInput && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      e.preventDefault();
      elements.searchInput?.focus();
    }
  });

  // Periodically refresh live date and class status
  setInterval(() => {
    updateLiveDateBadge();
    if (state.activeView === "batch") {
      renderBatchRoutine();
    }
  }, 60000);
}

// Boot on Load
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(state.theme);
  initSheetInput();
  setupEventListeners();
  loadInitialData();
});
