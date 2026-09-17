/**
 * Routine Parser for DIU ICE Routine
 * Bulletproof matrix and cell parser with strict custom time preservation,
 * uniform AM/PM standardization, accurate room/teacher extraction, and multi-span support.
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
 * Standardizes any university class time string into uniform, strict:
 * "HH:MM AM/PM - HH:MM AM/PM"
 * Handles typos like 12:30 AM daytime, single-digit hours, missing AM/PM, and multiple parens.
 */
function standardizeClassTime(rawTime) {
  if (!rawTime) return "";
  let t = rawTime.replace(/[()[\]]/g, "").trim();
  
  // Fix daytime 12:XX AM typo to PM (e.g. 12:30 AM during day routine -> 12:30 PM)
  t = t.replace(/12:(\d{2})\s*AM/i, (match, mins) => `12:${mins} PM`);
  
  const parts = t.split(/\s*[-–—]\s*/);
  if (parts.length === 2) {
    const formatTimePart = (p) => {
      const m = p.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!m) return p.trim();
      let h = parseInt(m[1], 10);
      let mins = m[2];
      let ap = m[3] ? m[3].toUpperCase() : "";

      // Infer AM/PM based on university daytime schedule (8:00 AM - 6:00 PM)
      if (!ap) {
        if (h >= 8 && h <= 11) {
          ap = "AM";
        } else if (h === 12 || (h >= 1 && h <= 7)) {
          ap = "PM";
        }
      }
      return `${h < 10 ? '0' + h : '' + h}:${mins} ${ap}`.trim();
    };

    return `${formatTimePart(parts[0])} - ${formatTimePart(parts[1])}`;
  }
  return t.replace(/\s*[-–—]\s*/, " - ");
}

const cleanTimeString = standardizeClassTime;

/**
 * Parse a single cell into one or more class entries.
 * STRICT RULE: If the Excel cell specifies a custom time (e.g. 08:30 AM-12:30 PM, 10:20 AM-12:20 PM),
 * that explicit time is ALWAYS strictly preserved and never overridden.
 */
function parseCellClasses(cellText, defaultTimeSlot, slotSpanTime = null) {
  if (!cellText || !cellText.trim()) return [];
  const text = cellText.trim();
  if (/prayer\s*break/i.test(text)) return [];

  const normDefaultTime = standardizeClassTime(defaultTimeSlot);
  const normSpanTime = slotSpanTime ? standardizeClassTime(slotSpanTime) : null;

  // Special cases for Capstone / Industrial Training
  if (/capstone|thesis|project/i.test(text)) {
    const roomMatch = text.match(/\(([A-Za-z0-9]+)\)/);
    let teacher = "Committee";
    const teachersFound = text.replace(/ICE\s*4\d{3}/i, "").match(/\b[A-Za-z]{2,4}\b/g) || [];
    for (const t of teachersFound) {
      const up = t.toUpperCase();
      if (!["ICE", "EEE", "ENG", "MAT", "PHY", "GED", "HUM", "BBA", "TBA"].includes(up)) {
        teacher = up;
        break;
      }
    }
    const capTime = normSpanTime || normDefaultTime || "01:10 PM - 05:40 PM";
    return [{
      courseCode: "ICE 4999",
      courseName: "Capstone Project / Internship / Thesis",
      room: roomMatch ? roomMatch[1] : "TBA",
      teacher: teacher,
      time: capTime,
      customTimeSpecified: false,
      raw: text
    }];
  }
  if (/industrial\s*training/i.test(text)) {
    const roomMatch = text.match(/\(([A-Za-z0-9]+)\)/);
    let teacher = "Dept";
    const teachersFound = text.replace(/ICE\s*4\d{3}/i, "").match(/\b[A-Za-z]{2,4}\b/g) || [];
    for (const t of teachersFound) {
      const up = t.toUpperCase();
      if (!["ICE", "EEE", "ENG", "MAT", "PHY", "GED", "HUM", "BBA", "TBA"].includes(up)) {
        teacher = up;
        break;
      }
    }
    const itTime = normSpanTime || normDefaultTime || "08:20 AM - 09:50 AM";
    return [{
      courseCode: "ICE 4998",
      courseName: "Industrial Training II",
      room: roomMatch ? roomMatch[1] : "TBA",
      teacher: teacher,
      time: itTime,
      customTimeSpecified: false,
      raw: text
    }];
  }

  // Split on comma only if followed by a new course code
  const chunks = text.split(/,\s*(?=[A-Z]{2,4}\s*\d{3,4})/i);
  const results = [];

  for (const chunk of chunks) {
    const trimmedChunk = chunk.trim();
    if (!trimmedChunk) continue;

    // 1. Course code: e.g. ICE 1144, EEE 2243, MAT 1031, BBA 101, ICE 2143
    const codeMatch = trimmedChunk.match(/([A-Z]{2,4}\s*\d{3,4}[A-Z]?)/i);
    if (!codeMatch) continue;
    const courseCode = codeMatch[1].toUpperCase().replace(/\s+/, " ");

    // 2. Custom time override in parentheses, brackets, or raw string e.g. "(08:30 AM-12:30 AM)" or "((01:20 PM-03:20 PM)"
    let customTime = null;
    const timeMatch = trimmedChunk.match(/[\(\[]*(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*[-–—]\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)[\)\]]*/i);
    if (timeMatch) {
      customTime = standardizeClassTime(timeMatch[1]);
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

    // 4. Teacher initial: uppercase 2-4 letters (excluding course codes, times, AM/PM, rooms)
    let teacher = "";
    let cleanForTeacher = trimmedChunk.replace(codeMatch[0], "");
    if (timeMatch) {
      cleanForTeacher = cleanForTeacher.replace(timeMatch[0], "");
    }
    // Remove all paren blocks
    cleanForTeacher = cleanForTeacher.replace(/\([^)]*\)/g, " ").replace(/[()[\]]/g, " ").trim();

    const tokens = cleanForTeacher.match(/\b[A-Za-z]{2,5}\b/g) || [];
    for (const tok of tokens) {
      const up = tok.toUpperCase();
      if (!["AM", "PM", "LAB", "GED", "HUM", "ENG", "MAT", "PHY", "EEE", "ICE", "BBA", "TBA", "DAY", "TIME", "ROOM"].includes(up)) {
        teacher = up;
        break;
      }
    }

    // STRICT TIME PRIORITY:
    // If custom time was written in the cell, it is 100% authoritative!
    const isLab = /lab/i.test(courseCode) || /\b(1022|1144|1246|1248|1346|1348|2142|2144|2146|2242|2244|2248|2342|2344|2346|3142|3144|3146|3148|3242|3244|3246|3248|3342|4152|4156)\b/.test(courseCode);
    let finalTime = normDefaultTime;

    if (customTime) {
      finalTime = customTime;
    } else if (isLab && normSpanTime) {
      finalTime = normSpanTime;
    } else {
      finalTime = normDefaultTime;
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
        name: standardizeClassTime(val),
        isPrayerBreak: /prayer/i.test(val)
      });
    }
  }

  let semester = "Fall-2026";
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const rowText = rows[i].join(" ");
    const semMatch = rowText.match(/(Fall|Spring|Summer)\s*[-–—]?\s*(\d{4})/i);
    if (semMatch) {
      semester = `${semMatch[1].charAt(0).toUpperCase() + semMatch[1].slice(1).toLowerCase()}-${semMatch[2]}`;
      break;
    }
  }

  const routine = {
    title: "DIU ICE Class Routine",
    semester: semester,
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

      // If it spans multiple empty slots (like Lab 08:20 AM to 12:50 PM)
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
  module.exports = { parseCSV, convertToCSVUrl, standardizeClassTime, cleanTimeString, parseCellClasses, parseRoutineData };
}
