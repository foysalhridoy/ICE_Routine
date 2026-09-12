/**
 * Routine Parser for DIU ICE Routine
 * Bulletproof matrix and cell parser with full time/room/teacher normalization
 */

function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentToken = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentToken.trim());
      currentToken = "";
      if (row.some(cell => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      currentToken += char;
    }
  }

  if (currentToken.length > 0 || row.length > 0) {
    row.push(currentToken.trim());
    if (row.some(cell => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Converts any Google Spreadsheet URL to direct CSV export URL
 */
function convertToCSVUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();

  if (trimmed.includes("export?format=csv") || trimmed.endsWith(".csv")) {
    return trimmed;
  }

  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return trimmed;

  const sheetId = idMatch[1];
  let gid = "0";

  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  if (gidMatch) {
    gid = gidMatch[1];
  }

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Clean and format time string (removes extra parens, standardizes spacing, fixes 12:30 AM typo to PM)
 */
function cleanTimeString(rawTime) {
  if (!rawTime) return "";
  let t = rawTime.replace(/[()]/g, "").trim();
  
  // Fix 12:30 AM typo in daytime classes
  t = t.replace(/12:(\d{2})\s*AM/i, "12:$1 PM");
  
  // Standardize hyphens and spacing
  t = t.replace(/\s*[-–—]\s*/, " - ");
  return t;
}

/**
 * Parse a single cell into one or more class entries
 */
function parseCellClasses(cellText, defaultTimeSlot, slotSpanTime = null) {
  if (!cellText || !cellText.trim()) return [];
  const text = cellText.trim();
  if (/prayer\s*break/i.test(text)) return [];

  // Special cases for Capstone / Industrial Training
  if (/capstone|thesis|project/i.test(text)) {
    const roomMatch = text.match(/\(([A-Za-z0-9]+)\)/);
    const teacherMatch = text.match(/\b([A-Z]{2,4})\b/);
    return [{
      courseCode: "ICE 4999",
      courseName: "Capstone Project / Internship / Thesis",
      room: roomMatch ? roomMatch[1] : "TBA",
      teacher: teacherMatch ? teacherMatch[1] : "Committee",
      time: slotSpanTime || defaultTimeSlot || "Full Slot",
      raw: text
    }];
  }
  if (/industrial\s*training/i.test(text)) {
    const roomMatch = text.match(/\(([A-Za-z0-9]+)\)/);
    const teacherMatch = text.match(/\b([A-Z]{2,4})\b/);
    return [{
      courseCode: "ICE 4998",
      courseName: "Industrial Training II",
      room: roomMatch ? roomMatch[1] : "TBA",
      teacher: teacherMatch ? teacherMatch[1] : "Dept",
      time: slotSpanTime || defaultTimeSlot || "Full Slot",
      raw: text
    }];
  }

  // Split on comma only if followed by a new course code
  const chunks = text.split(/,\s*(?=[A-Z]{2,4}\s*\d{3,4})/i);
  const results = [];

  for (const chunk of chunks) {
    const trimmedChunk = chunk.trim();
    if (!trimmedChunk) continue;

    // 1. Course code: e.g. ICE 1144, EEE 2243, MAT 1031, BBA 101
    const codeMatch = trimmedChunk.match(/([A-Z]{2,4}\s*\d{3,4}[A-Z]?)/i);
    if (!codeMatch) continue;
    const courseCode = codeMatch[1].toUpperCase().replace(/\s+/, " ");

    // 2. Custom time override in parentheses e.g. "(08:30 AM-12:30 AM)" or "(01:10PM - 03:10 PM)"
    let customTime = null;
    const timeMatch = trimmedChunk.match(/\(?(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*[-–—]\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)\)?/i);
    if (timeMatch) {
      customTime = cleanTimeString(timeMatch[1]);
    }

    // 3. Room: typically (302), (402), (AB1), (205), (304), (407)
    let room = "";
    const allParens = [...trimmedChunk.matchAll(/\(([^)]+)\)/g)];
    for (const p of allParens) {
      const val = p[1].trim();
      if (!val.includes(":") && !val.includes("-") && !/AM|PM/i.test(val)) {
        room = val;
        break;
      }
    }

    // 4. Teacher initial: uppercase 2-4 letters
    let teacher = "";
    let remaining = trimmedChunk
      .replace(codeMatch[0], "")
      .replace(/\([^)]+\)/g, "")
      .trim();
    
    // Check against known faculty initials first
    const tokens = remaining.match(/\b[A-Z]{2,4}\b/g) || [];
    for (const tok of tokens) {
      const up = tok.toUpperCase();
      if (!["AM", "PM", "LAB", "GED", "HUM", "ENG", "MAT", "PHY", "EEE", "ICE", "BBA"].includes(up)) {
        teacher = up;
        break;
      }
    }

    // Time determination:
    // 1. If explicit custom time was written inside cell e.g. "(01:10PM - 03:10 PM)"
    let finalTime = defaultTimeSlot;
    const isLab = /lab/i.test(courseCode) || /\b(1144|1248|1348|2142|2144|2146|2242|2244|2248|2342|2344|2346|3142|3144|3146|3148|3242|3244|3246|3248|3342|4152|4156)\b/.test(courseCode);

    if (customTime) {
      if (isLab && slotSpanTime) {
        finalTime = slotSpanTime; // e.g. 08:20 - 12:50
      } else {
        finalTime = customTime;
      }
    } else if (isLab && slotSpanTime) {
      finalTime = slotSpanTime;
    } else {
      finalTime = defaultTimeSlot;
    }

    results.push({
      courseCode,
      room: room || "402",
      teacher: teacher || "TBA",
      time: finalTime,
      customTimeSpecified: !!customTime,
      raw: trimmedChunk
    });
  }

  return results;
}

/**
 * Parses full routine matrix into structured data
 */
function parseRoutineData(csvText) {
  const rows = parseCSV(csvText);
  if (!rows || rows.length === 0) {
    throw new Error("CSV data is empty");
  }

  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i].map(c => c.toLowerCase());
    if (r.some(c => c.includes("day")) && r.some(c => c.includes("level") || c.includes("term"))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error("Could not find table header with 'Day' and 'Level-Term'");
  }

  const headerRow = rows[headerIndex];
  const timeSlots = [];
  for (let c = 2; c < headerRow.length; c++) {
    const val = headerRow[c].trim();
    if (val) {
      timeSlots.push({
        colIndex: c,
        name: val.replace(/\s*-\s*/, " - "),
        isPrayerBreak: /prayer/i.test(val)
      });
    }
  }

  const routine = {
    title: "DIU ICE Class Routine",
    batches: {},
    allBatchesList: [],
    timeSlots: timeSlots.map(t => t.name),
    days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
  };

  let currentDay = "";

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;

    const dayCol = row[0] ? row[0].trim() : "";
    if (dayCol && routine.days.some(d => d.toLowerCase() === dayCol.toLowerCase())) {
      currentDay = routine.days.find(d => d.toLowerCase() === dayCol.toLowerCase());
    }

    const batchCol = row[1] ? row[1].trim().toUpperCase() : "";
    if (!batchCol || !currentDay) continue;

    // Filter out footer rows like "PREPARED BY: AMIT KUMAR PAUL"
    if (!/^L\d+T\d+/i.test(batchCol) && !/^BATCH/i.test(batchCol)) {
      continue;
    }

    const batchName = batchCol.replace(/\s+/g, "");

    if (!routine.batches[batchName]) {
      routine.batches[batchName] = {};
      for (const d of routine.days) {
        routine.batches[batchName][d] = [];
      }
      routine.allBatchesList.push(batchName);
    }

    // Parse each slot
    for (let sIdx = 0; sIdx < timeSlots.length; sIdx++) {
      const slot = timeSlots[sIdx];
      if (slot.isPrayerBreak) continue;

      const cellText = row[slot.colIndex];
      if (!cellText || !cellText.trim()) continue;

      const defaultTime = slot.name;

      // Check if subsequent slots in this row are empty (indicating a 3-hour or 4-hour Lab)
      let slotSpanTime = null;
      let nextIdx = sIdx + 1;
      while (nextIdx < timeSlots.length && !timeSlots[nextIdx].isPrayerBreak && (!row[timeSlots[nextIdx].colIndex] || !row[timeSlots[nextIdx].colIndex].trim())) {
        nextIdx++;
        if (nextIdx - sIdx >= 3) break;
      }

      // If it spans multiple empty slots (like Lab 8:20 to 12:50)
      if (nextIdx > sIdx + 1) {
        const lastSlot = timeSlots[nextIdx - 1];
        const startStr = defaultTime.split("-")[0]?.trim();
        const endStr = lastSlot.name.split("-")[1]?.trim();
        if (startStr && endStr) {
          slotSpanTime = `${startStr} - ${endStr}`;
        }
      }

      const parsedClasses = parseCellClasses(cellText, defaultTime, slotSpanTime);

      for (const item of parsedClasses) {
        routine.batches[batchName][currentDay].push(item);
      }
    }
  }

  // Sort batches logically: L1T1, L1T2, L1T3, L2T1, L2T2, L2T3, etc.
  routine.allBatchesList.sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  return routine;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { parseCSV, convertToCSVUrl, cleanTimeString, parseCellClasses, parseRoutineData };
}
