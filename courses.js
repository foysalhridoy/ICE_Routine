/**
 * DIU ICE Department Course Catalog & Official Faculty Directory
 * Synchronized with: https://faculty.daffodilvarsity.edu.bd/teachers/ice.html
 */

const COURSE_CATALOG = {
  // L1T1 / Foundation
  "ENG 1000": { title: "Professional English I", credit: 1, type: "Theory" },
  "MAT 1031": { title: "Mathematics I: Calculus and Ordinary Differential Equations", credit: 3, type: "Theory" },
  "PHY 1021": { title: "Physics: Modern Physics, Waves, Oscillations and Optics, Basic DC theory", credit: 2, type: "Theory" },
  "PHY 1022": { title: "Physics Laboratory", credit: 1, type: "Lab" },
  "ICE 1141": { title: "Computer Fundamentals", credit: 3, type: "Theory" },
  "GED 1011": { title: "History of Emergence of Bangladesh", credit: 3, type: "GED" },
  "ICE 1143": { title: "Structured Programming", credit: 3, type: "Theory" },
  "ICE 1144": { title: "Structured Programming Laboratory", credit: 1, type: "Lab" },
  
  // L1T2 / L1T3
  "ENG 1002": { title: "Professional English II", credit: 1, type: "Theory" },
  "MAT 1033": { title: "Mathematics II: Complex variable, Linear Algebra and Matrices", credit: 3, type: "Theory" },
  "GED 1012": { title: "Art of Living and Engineering Ethics", credit: 3, type: "GED" },
  "HUM 1000": { title: "Functional Bangla for Engineers", credit: 1, type: "Theory" },
  "HUM 1011": { title: "ICT Economics and Accounting", credit: 3, type: "Theory" },
  "ICE 1247": { title: "Object Oriented Programming", credit: 3, type: "Theory" },
  "ICE 1248": { title: "Object Oriented Programming Laboratory", credit: 1, type: "Lab" },
  "ICE 1347": { title: "Object Oriented Programming", credit: 3, type: "Theory" },
  "ICE 1348": { title: "Object Oriented Programming Laboratory", credit: 1, type: "Lab" },
  "EEE 1245": { title: "Electrical Circuits", credit: 3, type: "Theory" },
  "EEE 1246": { title: "Electrical Circuits Laboratory", credit: 1, type: "Lab" },
  "EEE 1345": { title: "Electrical Circuits", credit: 3, type: "Theory" },
  "EEE 1346": { title: "Electrical Circuits Laboratory", credit: 1, type: "Lab" },
  "ENG 2000": { title: "Professional English III", credit: 1, type: "Theory" },
  
  // L2T1 / L2T2 / L2T3
  "ICE 2141": { title: "Signals and Communication Systems", credit: 3, type: "Theory" },
  "ICE 2142": { title: "Signals and Communication Systems Laboratory", credit: 1, type: "Lab" },
  "EEE 2143": { title: "Electronic Devices and Circuit", credit: 3, type: "Theory" },
  "EEE 2144": { title: "Electronic Devices and Circuit Laboratory", credit: 1, type: "Lab" },
  "EEE 2243": { title: "Electronic Devices and Circuit", credit: 3, type: "Theory" },
  "EEE 2244": { title: "Electronic Devices and Circuit Laboratory", credit: 1, type: "Lab" },
  "ICE 2145": { title: "Data Structure and Algorithm", credit: 3, type: "Theory" },
  "ICE 2146": { title: "Data Structure and Algorithm Laboratory", credit: 1, type: "Lab" },
  "MAT 2031": { title: "Statistics", credit: 2, type: "Theory" },
  "MAT 2137": { title: "Engineering Mathematics", credit: 3, type: "Theory" },
  "ICE 2241": { title: "Digital Logic Design", credit: 3, type: "Theory" },
  "ICE 2242": { title: "Digital Logic Design Laboratory", credit: 1, type: "Lab" },
  "ICE 2243": { title: "Telecommunication Networks", credit: 3, type: "Theory" },
  "ICE 2245": { title: "Artificial Intelligence and Neural Networks", credit: 3, type: "Theory" },
  "ICE 2247": { title: "Operating Systems", credit: 3, type: "Theory" },
  "ICE 2248": { title: "Operating Systems Laboratory", credit: 1, type: "Lab" },
  "ICE 2249": { title: "Discrete Mathematics", credit: 3, type: "Theory" },
  "ICE 2341": { title: "Telecommunication Networks", credit: 3, type: "Theory" },
  "ICE 2342": { title: "Digital Logic Design Laboratory", credit: 1, type: "Lab" },
  "ICE 2343": { title: "Discrete Mathematics", credit: 3, type: "Theory" },
  "ICE 2344": { title: "Microprocessor and Interfacing Laboratory", credit: 1, type: "Lab" },
  "ICE 2345": { title: "Artificial Intelligence and Neural Networks", credit: 3, type: "Theory" },
  "ICE 2346": { title: "Operating Systems Laboratory", credit: 1, type: "Lab" },
  
  // L3T1 / L3T2 / L3T3
  "ICE 3140": { title: "Simulation and Modeling", credit: 3, type: "Theory" },
  "ICE 3141": { title: "Digital Communication", credit: 3, type: "Theory" },
  "ICE 3142": { title: "Digital Communication Laboratory", credit: 1, type: "Lab" },
  "ICE 3143": { title: "Numerical Analysis", credit: 3, type: "Theory" },
  "ICE 3144": { title: "Numerical Analysis Laboratory", credit: 1, type: "Lab" },
  "ICE 3145": { title: "Microprocessor and Interfacing", credit: 3, type: "Theory" },
  "ICE 3146": { title: "Microprocessor and Interfacing Laboratory", credit: 1, type: "Lab" },
  "ICE 3147": { title: "Digital Signal Processing", credit: 3, type: "Theory" },
  "ICE 3148": { title: "Digital Signal Processing Laboratory", credit: 1, type: "Lab" },
  "ICE 3241": { title: "Computer Networks", credit: 3, type: "Theory" },
  "ICE 3242": { title: "Computer Networks Laboratory", credit: 1, type: "Lab" },
  "ICE 3243": { title: "Machine Learning and Expert system", credit: 3, type: "Theory" },
  "ICE 3244": { title: "Machine Learning and Expert system Lab", credit: 1, type: "Lab" },
  "ICE 3245": { title: "Embedded System Design", credit: 3, type: "Theory" },
  "ICE 3246": { title: "Embedded System Design Laboratory", credit: 1, type: "Lab" },
  "ICE 3247": { title: "Database Management System", credit: 3, type: "Theory" },
  "ICE 3248": { title: "Database Management System Laboratory", credit: 1, type: "Lab" },
  "ICE 3249": { title: "Information Theory and coding", credit: 3, type: "Theory" },
  "ICE 3341": { title: "Database Management System", credit: 3, type: "Theory" },
  "ICE 3342": { title: "Database Management System Laboratory", credit: 1, type: "Lab" },
  "ICE 3345": { title: "Digital Signal Processing", credit: 3, type: "Theory" },
  "ICE 3347": { title: "Computer Networks", credit: 3, type: "Theory" },
  
  // L4T1 / L4T2 / L4T3
  "ICE 4151": { title: "Information Security & Cryptography", credit: 3, type: "Theory" },
  "ICE 4152": { title: "Information Security & Cryptography Laboratory", credit: 1, type: "Lab" },
  "ICE 4153": { title: "Wireless & Mobile Communications", credit: 3, type: "Theory" },
  "ICE 4155": { title: "Robotics and Mechatronics", credit: 3, type: "Theory" },
  "ICE 4156": { title: "Robotics and Mechatronics Laboratory", credit: 1, type: "Lab" },
  "ICE 4157": { title: "Optical Fiber Communication", credit: 3, type: "Theory" },
  "BBA 1011": { title: "Engineering Project Management", credit: 2, type: "Theory" },
  "BBA 101": { title: "Engineering Project Management", credit: 2, type: "Theory" },
  "ICE 4996": { title: "Industrial Training I", credit: 1, type: "Practical" },
  "GED 4010": { title: "Employability", credit: 3, type: "GED" },
  "ICE 4998": { title: "Industrial Training II", credit: 1, type: "Practical" },
  "ICE 4999": { title: "Capstone Project / Internship / Thesis", credit: 4, type: "Project" },
  
  // Electives
  "ICE 4361": { title: "Mobile Application Development", credit: 3, type: "Elective" },
  "ICE 4363": { title: "Human Computer Interaction", credit: 3, type: "Elective" },
  "ICE 4365": { title: "Cloud Computing", credit: 3, type: "Elective" },
  "ICE 4367": { title: "Advanced Wireless Technologies", credit: 3, type: "Elective" },
  "ICE 4369": { title: "Digital Marketing", credit: 3, type: "Elective" },
  "ICE 4461": { title: "Cyber Threat Management", credit: 3, type: "Elective" },
  "ICE 4463": { title: "Satellite and Broadcast Engineering", credit: 3, type: "Elective" },
  "ICE 4465": { title: "Multimedia Communication", credit: 3, type: "Elective" },
  "ICE 4467": { title: "Image Processing and Pattern Recognition", credit: 3, type: "Elective" },
  "ICE 4469": { title: "Wireless Sensor Network", credit: 3, type: "Elective" },
  "ICE 4561": { title: "Blockchain", credit: 3, type: "Elective" },
  "ICE 4563": { title: "Software Engineering and Information Systems", credit: 3, type: "Elective" },
  "ICE 4565": { title: "Application of Augmented/Virtual Reality", credit: 3, type: "Elective" },
  "ICE 431": { title: "Elective Course I", credit: 3, type: "Elective" },
  "ICE 435": { title: "Elective Course II", credit: 3, type: "Elective" }
};

/**
 * Official Faculty Directory - Department of Information & Communication Engineering
 * Verified from DIU Official Portal: https://faculty.daffodilvarsity.edu.bd/teachers/ice.html
 */
const FACULTY_DIRECTORY = {
  "SAM": {
    initial: "SAM",
    name: "Professor Dr. M. Shamsul Alam",
    designation: "Dean, Faculty of Engineering",
    department: "ICE / Faculty of Engineering",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/msalam.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/d312d9e2fff4ae4fbfefee1227b31288.jpg"
  },
  "MMH": {
    initial: "MMH",
    name: "Dr. Miah M. Hussainuzzaman",
    designation: "Associate Dean & Associate Professor",
    department: "ICE / Faculty of Engineering",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/Hussainuzzaman.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/a599fa52b1bf42ed8368c83c7cc2ca3b.jpg"
  },
  "TA": {
    initial: "TA",
    name: "Dr. Engr. Md. Taslim Arefin",
    designation: "Professor & Head",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/taslim.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/4ba31a40ea2f9e7d6369010a64c7488e.jpg"
  },
  "FH": {
    initial: "FH",
    name: "Professor Dr. Engr. A. K. M. Fazlul Haque",
    designation: "Professor",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/haque.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/0cd229d5b8da67644ebef8536ffd0476.jpg"
  },
  "AKP": {
    initial: "AKP",
    name: "Mr. Amit Kumar Paul",
    designation: "Lecturer, Routine Coordinator",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/amitkumar.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/e58efb570a0f6b616ec65138cadd00dc.jpg"
  },
  "DB": {
    initial: "DB",
    name: "Mr. Dipto Biswas",
    designation: "Lecturer (Senior Scale)",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/dipto.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/3ed168750affc6fd50979464a35629d8.jpg"
  },
  "SMN": {
    initial: "SMN",
    name: "Ms. Sirajum Munira",
    designation: "Lecturer (Senior Scale)",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/sirajum.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/8529b654d0337e0059a3b4a54655c246.JPG"
  },
  "MAH": {
    initial: "MAH",
    name: "Mr. Md. Azizul Hakim",
    designation: "Lecturer",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/azizulhakim.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/52bc76e6ece093771e4b3ccd65f1715a.jpg"
  },
  "IAP": {
    initial: "IAP",
    name: "Mr. Md. Istakiak Adnan Palash",
    designation: "Lecturer",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/istakiak.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/f4c58f41d9eb67cab3d75a88a98b0f59.jpg"
  },
  "MRT": {
    initial: "MRT",
    name: "Ms. Rifah Tasnia",
    designation: "Lecturer",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/rifah.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/6b0f045b7e7dc266f38b934401fa28f8.jpg"
  },
  "NT": {
    initial: "NT",
    name: "Ms. Tasnia Noshin Orin",
    designation: "Lecturer",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/orin.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/0a59e7731f11bab68201857d78010efe.jpg"
  },
  "TNO": {
    initial: "TNO",
    name: "Ms. Tasnia Noshin Orin",
    designation: "Lecturer",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/orin.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/0a59e7731f11bab68201857d78010efe.jpg"
  },
  "SHS": {
    initial: "SHS",
    name: "Md. Sakaid Hosain Shakir",
    designation: "Lecturer",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/sakaid.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/355ec0c4f668a3f5081f62001a6a2a02.jpg"
  },
  "SK": {
    initial: "SK",
    name: "Mr. Sameer Khairul",
    designation: "Lecturer",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/sameer.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/0d8c284ae587043b0d55d6d459747277.jpg"
  },
  "ZI": {
    initial: "ZI",
    name: "Engr. Md. Zahirul Islam",
    designation: "Assistant Professor",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/zahirul.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/616dd7e15bbe9be3d61925fb0a66d3bf.JPG"
  },
  "AIF": {
    initial: "AIF",
    name: "Mr. Al-Imtiaz Foisal",
    designation: "Faculty Member",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/teachers/ice.html",
    photoUrl: ""
  },
  "SHM": {
    initial: "SHM",
    name: "Mr. Sheikh Hasan Mahmud",
    designation: "Faculty Member, Robotics & Mechatronics",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/teachers/ice.html",
    photoUrl: ""
  },
  "MN": {
    initial: "MN",
    name: "Faculty of Mathematics (MN)",
    designation: "Assistant Professor / Lecturer, Mathematics",
    department: "Department of Mathematics, FSIT",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/",
    photoUrl: ""
  },
  "MAK": {
    initial: "MAK",
    name: "Prof. Dr. Md. Adnan Kiber",
    designation: "Adjunct Faculty",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/adnankiber.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/2cf0a1879bbcffd088eaf4fc99f8a27e.jpg"
  },
  "MSK": {
    initial: "MSK",
    name: "Dr. M Shamim Kaiser",
    designation: "Adjunct Faculty",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/shamimkaiser.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/ee334357e725878733a3e4ded62f2b29.jpg"
  },
  "SMU": {
    initial: "SMU",
    name: "Dr. Saeed Mahmud Ullah",
    designation: "Adjunct Faculty",
    department: "Department of ICE",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/profile/ice/saeed.html",
    photoUrl: "https://faculty.daffodilvarsity.edu.bd/images/teacher/efce2b77dfc7973932070eb102d078bd.jpg"
  }
};

/**
 * Normalizes course code e.g. "ICE1141" -> "ICE 1141"
 */
function normalizeCourseCode(raw) {
  if (!raw) return "";
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, " ");
  const match = cleaned.match(/^([A-Z]{2,4})\s*(\d{3,4}[A-Z]?)/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return cleaned;
}

/**
 * Looks up course information from catalog with intelligent fallback
 */
function getCourseInfo(code) {
  const norm = normalizeCourseCode(code);
  if (COURSE_CATALOG[norm]) {
    return { code: norm, ...COURSE_CATALOG[norm] };
  }
  
  // Try partial or prefix matching
  for (const [key, val] of Object.entries(COURSE_CATALOG)) {
    if (key.replace(/\s+/g, "") === norm.replace(/\s+/g, "")) {
      return { code: key, ...val };
    }
  }

  // Fallback for special/thesis/project titles
  if (/capstone|thesis|project/i.test(code)) {
    return { code: norm || "ICE 4999", title: "Capstone Project / Internship / Thesis", credit: 4, type: "Project" };
  }
  if (/industrial\s*training/i.test(code)) {
    return { code: norm || "ICE 4998", title: "Industrial Training II", credit: 1, type: "Practical" };
  }

  return {
    code: norm || code,
    title: "Course Title Not Specified",
    credit: norm.includes("Lab") || norm.endsWith("2") || norm.endsWith("4") || norm.endsWith("6") || norm.endsWith("8") ? 1 : 3,
    type: "Theory"
  };
}

/**
 * Gets verified faculty information from directory
 */
function getFacultyInfo(initial) {
  if (!initial) return null;
  const clean = initial.trim().toUpperCase();
  if (FACULTY_DIRECTORY[clean]) {
    return FACULTY_DIRECTORY[clean];
  }
  return {
    initial: clean,
    name: `Faculty Member (${clean})`,
    designation: "Faculty",
    department: "DIU Faculty of Engineering",
    profileUrl: "https://faculty.daffodilvarsity.edu.bd/teachers/ice.html",
    photoUrl: ""
  };
}

// Export for browser or node
if (typeof module !== "undefined" && module.exports) {
  module.exports = { COURSE_CATALOG, FACULTY_DIRECTORY, normalizeCourseCode, getCourseInfo, getFacultyInfo };
}
