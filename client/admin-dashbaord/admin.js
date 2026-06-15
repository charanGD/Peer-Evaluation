var BASE = "";
var API = BASE + "/api";

var token = localStorage.getItem("token") || "";
var user = JSON.parse(localStorage.getItem("user") || "{}");

var currentUsersPage = 1;
var currentEvaluationsPage = 1;
var limit = 10;
var userSearchQuery = "";
var evaluationSearchQuery = "";

// ===========================
// AUTH GUARD — redirect if not logged in
// ===========================
if (!token || !user._id) {
  window.location.href = "/index.html";
}

// ===========================
// NAV USER
// ===========================
document.getElementById("navUser").textContent = user.name || "Admin";

// ===========================
// LOGOUT
// ===========================
document.getElementById("logoutBtn").addEventListener("click", function() {
  localStorage.clear();
  window.location.href = BASE + "/index.html";
});

// ===========================
// AUTH HEADERS + 401 HANDLER
// ===========================
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: "Bearer " + token };
}

async function apiFetch(url, options) {
  var res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) {
    localStorage.clear();
    window.location.href = "/index.html";
    return null;
  }
  return res;
}

// ===========================
// TAB SWITCHING
// ===========================
var tabs = document.querySelectorAll(".tab");
var pages = document.querySelectorAll(".tabPage");

tabs.forEach(function(tab) {
  tab.addEventListener("click", function() {
    tabs.forEach(function(t) { t.classList.remove("active"); });
    pages.forEach(function(p) { p.classList.remove("activePage"); });
    tab.classList.add("active");
    document.getElementById(tab.getAttribute("data-target")).classList.add("activePage");
  });
});

// ===========================
// LOAD ANALYTICS (OVERVIEW + LEADERBOARD)
// ===========================
async function loadAnalytics() {
  try {
    var res = await apiFetch(API + "/admin/analytics", { headers: authHeaders() });
    if (!res) return;
    var data = await res.json();
    if (!res.ok) return;

    document.getElementById("totalStudents").textContent = data.summary.totalStudents || 0;
    document.getElementById("totalStaff").textContent = data.summary.totalStaff || 0;
    document.getElementById("totalTeams").textContent = data.summary.totalTeams || 0;
    document.getElementById("totalEvaluations").textContent = data.summary.totalEvaluations || 0;

    // Leaderboard table
    var tbody = document.getElementById("leaderboardBody");
    if (data.leaderboard && data.leaderboard.length > 0) {
      tbody.innerHTML = data.leaderboard.map(function(u, i) {
        var badgeClass = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
        var peerEval = u.peerAvg || "—";
        var mentorMark = u.staffAvg || "—";
        var total = (u.peerAvg && u.staffAvg)
          ? (parseFloat(u.peerAvg) + parseFloat(u.staffAvg)).toFixed(1)
          : "—";
        var catColors = { VIP: ["#dbeafe","#1e40af"], P2BL: ["#d1fae5","#065f46"], EPICS: ["#fce7f3","#9d174d"] };
        var cat = u.experientialCategory || null;
        var catBadge = cat && catColors[cat]
          ? "<span style='background:" + catColors[cat][0] + ";color:" + catColors[cat][1] + ";padding:3px 10px;border-radius:10px;font-size:0.78rem;font-weight:700;'>" + cat + "</span>"
          : "<span style='color:#aaa;'>—</span>";
        return "<tr>" +
          "<td><span class='rank-badge " + badgeClass + "'>" + (i + 1) + "</span></td>" +
          "<td><strong>" + u.name + "</strong></td>" +
          "<td>" + u.userId + "</td>" +
          "<td><span class='team-badge'>" + (u.teamName || "—") + "</span></td>" +
          "<td>" + catBadge + "</td>" +
          "<td>" + peerEval + "</td>" +
          "<td>" + mentorMark + "</td>" +
          "<td><strong>" + total + "</strong></td>" +
          "</tr>";
      }).join("");
    } else {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-text">No evaluation data yet</td></tr>';
    }
  } catch (err) {
    console.error("Analytics error:", err);
  }
}

// ===========================
// LOAD USERS TABLE
// ===========================
async function loadUsers() {
  var tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = '<tr><td colspan="4" class="loading-text">Loading users...</td></tr>';

  try {
    var url = API + "/admin/users?page=" + currentUsersPage + "&limit=" + limit;
    if (userSearchQuery) url += "&search=" + encodeURIComponent(userSearchQuery);

    var res = await apiFetch(url, { headers: authHeaders() });
    if (!res) return;
    var data = await res.json();

    if (!res.ok || !data.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="loading-text">No users found</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(function(u) {
      var teamBadge = u.Team ? "<span class='team-badge'>" + u.Team.teamName + "</span>" : "—";
      var yearBadge = u.academicYear ? u.academicYear : "—";
      var semBadge = u.semester ? u.semester : "—";
      return "<tr>" +
        "<td><strong>" + u.name + "</strong></td>" +
        "<td>" + u.userId + "</td>" +
        "<td><span class='role-badge " + u.role + "'>" + u.role + "</span></td>" +
        "<td>" + yearBadge + "</td>" +
        "<td>" + semBadge + "</td>" +
        "<td>" + teamBadge + "</td>" +
        "</tr>";
    }).join("");
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="loading-text">Error loading users</td></tr>';
    console.error(err);
  }
}

// ===========================
// EVALUATIONS — ALL + CLIENT-SIDE FILTER
// ===========================
var allEvaluations = [];
var filteredEvaluations = [];

async function loadEvaluations() {
  var tbody = document.getElementById("evaluationsTableBody");
  tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Loading evaluations...</td></tr>';

  try {
    var res = await apiFetch(API + "/admin/evaluations", { headers: authHeaders() });
    if (!res) return;
    var data = await res.json();

    if (!res.ok || !data.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="loading-text">No evaluations found</td></tr>';
      return;
    }

    allEvaluations = data;

    // Populate team filter dropdown
    var teamSel = document.getElementById("filterEvalTeam");
    var teams = [];
    data.forEach(function(e) {
      if (e.Team && e.Team.teamName && teams.indexOf(e.Team.teamName) === -1) {
        teams.push(e.Team.teamName);
      }
    });
    teamSel.innerHTML = '<option value="">All Teams</option>' +
      teams.sort().map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join("");

    applyEvalFilters();

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Error loading evaluations</td></tr>';
    console.error(err);
  }
}

function applyEvalFilters() {
  var typeVal    = document.getElementById("filterEvalType").value;
  var catVal     = document.getElementById("filterEvalCategory").value;
  var teamVal    = document.getElementById("filterEvalTeam").value;
  var keyword    = document.getElementById("filterEvalKeyword").value.trim().toLowerCase();

  filteredEvaluations = allEvaluations.filter(function(e) {
    // Type filter
    if (typeVal === "peer" && e.isStaffEvaluation) return false;
    if (typeVal === "mentor" && !e.isStaffEvaluation) return false;

    // Category filter — needs team category
    if (catVal) {
      var teamCat = (e.Team && e.Team.experientialCategory) ? e.Team.experientialCategory : null;
      if (teamCat !== catVal) return false;
    }

    // Team filter
    if (teamVal) {
      var tn = (e.Team && e.Team.teamName) ? e.Team.teamName : "";
      if (tn !== teamVal) return false;
    }

    // Keyword filter
    if (keyword) {
      var regNo = e.evaluated ? (e.evaluated.userId || "").toLowerCase() : "";
      var evalName = e.evaluator ? (e.evaluator.name || "").toLowerCase() : "";
      var evalTeeName = e.evaluated ? (e.evaluated.name || "").toLowerCase() : "";
      if (!regNo.includes(keyword) && !evalName.includes(keyword) && !evalTeeName.includes(keyword)) return false;
    }

    return true;
  });

  renderEvaluations(filteredEvaluations, typeVal, catVal, teamVal, keyword);
}

function renderEvaluations(evals, typeVal, catVal, teamVal, keyword) {
  var tbody = document.getElementById("evaluationsTableBody");
  var summary = document.getElementById("evalFilterSummary");

  // Filter summary pills
  var pills = [];
  if (typeVal) pills.push(typeVal === "peer" ? "Peer Evaluation" : "Mentor Evaluation");
  if (catVal) pills.push("Category: " + catVal);
  if (teamVal) pills.push("Team: " + teamVal);
  if (keyword) pills.push('"' + keyword + '"');

  if (pills.length > 0) {
    summary.style.display = "flex";
    summary.innerHTML =
      "<span>Filters:</span>" +
      pills.map(function(p) { return "<span class='filter-pill'>" + p + "</span>"; }).join("") +
      "<span class='filter-count'>" + evals.length + " result(s)</span>";
  } else {
    summary.style.display = "none";
    summary.innerHTML = "";
  }

  if (evals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-text">No evaluations match the selected filters</td></tr>';
    return;
  }

  var catColors = { VIP: ["#dbeafe","#1e40af"], P2BL: ["#d1fae5","#065f46"], EPICS: ["#fce7f3","#9d174d"] };

  tbody.innerHTML = evals.map(function(e) {
    var p = e.professionalism || 0;
    var avg = ((e.communication + e.teamwork + e.leadership + e.problemSolving + p)).toFixed(1);
    var typeBadge = e.isStaffEvaluation
      ? "<span class='role-badge staff'>Mentor</span>"
      : "<span class='role-badge student'>Peer</span>";
    var teamCat = (e.Team && e.Team.experientialCategory) ? e.Team.experientialCategory : null;
    var catStyle = teamCat && catColors[teamCat] ? catColors[teamCat] : ["#f3f4f6","#374151"];
    var catBadge = teamCat
      ? "<span style='background:" + catStyle[0] + ";color:" + catStyle[1] + ";padding:2px 9px;border-radius:10px;font-size:0.78rem;font-weight:700;'>" + teamCat + "</span>"
      : "<span style='color:#aaa;'>—</span>";
    return "<tr>" +
      "<td>" + (e.evaluated ? e.evaluated.userId : "—") + "</td>" +
      "<td>" + (e.evaluator ? e.evaluator.name : "—") + "</td>" +
      "<td>" + typeBadge + "</td>" +
      "<td><span class='team-badge'>" + (e.Team ? e.Team.teamName : "—") + "</span></td>" +
      "<td>" + catBadge + "</td>" +
      "<td><span class='score-badge'>" + avg + "</span></td>" +
      "</tr>";
  }).join("");
}

// ===========================
// LOAD TEAMS & ASSIGN DROPDOWNS
// ===========================
async function loadTeams() {
  var tbody = document.getElementById("teamsTableBody");
  var assignUserSelect = document.getElementById("assignUserSelect");
  var assignStaffSelect = document.getElementById("assignStaffSelect");
  var assignTeamSelect = document.getElementById("assignTeamSelect");
  var assignStaffTeamSelect = document.getElementById("assignStaffTeamSelect");

  if (tbody) tbody.innerHTML = '<tr><td colspan="3" class="loading-text">Loading teams...</td></tr>';

  try {
    var res = await apiFetch(API + "/admin/teams", { headers: authHeaders() });
    if (!res) return;
    var teams = await res.json();

    // Populate team table
    if (tbody) {
      if (!teams.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-text">No teams found</td></tr>';
      } else {
        tbody.innerHTML = teams.map(function(t) {
          var staffName = t.staff ? t.staff.name + " (" + t.staff.userId + ")" : "Not assigned";
          var members = t.members ? t.members.map(function(m) { return m.name; }).join(", ") : "—";
          var catColors = { VIP: "#dbeafe|#1e40af", P2BL: "#d1fae5|#065f46", EPICS: "#fce7f3|#9d174d" };
          var catStyle = t.experientialCategory && catColors[t.experientialCategory]
            ? catColors[t.experientialCategory].split("|")
            : ["#f3f4f6", "#374151"];
          var catBadge = t.experientialCategory
            ? "<span style='background:" + catStyle[0] + ";color:" + catStyle[1] + ";padding:3px 10px;border-radius:10px;font-size:0.8rem;font-weight:700;'>" + t.experientialCategory + "</span>"
            : "<span style='color:#aaa;'>—</span>";
          return "<tr>" +
            "<td><strong>" + t.teamName + "</strong></td>" +
            "<td>" + catBadge + "</td>" +
            "<td>" + staffName + "</td>" +
            "<td>" + (members || "No students") + " <span class='score-badge'>" + t.memberCount + "</span></td>" +
            "</tr>";
        }).join("");
      }
    }

    // Populate team selects
    var teamOpts = '<option value="">— Select Team —</option>' + teams.map(function(t) {
      return '<option value="' + t.id + '">' + t.teamName + '</option>';
    }).join("");
    if (assignTeamSelect) assignTeamSelect.innerHTML = teamOpts;
    if (assignStaffTeamSelect) assignStaffTeamSelect.innerHTML = teamOpts;

    // Fetch users for dropdowns
    var uRes = await apiFetch(API + "/admin/users?limit=1000", { headers: authHeaders() });
    if (!uRes) return;
    var users = await uRes.json();
    
    var studOpts = '<option value="">— Select Student —</option>';
    var staffOpts = '<option value="">— Select Staff —</option>';
    
    users.forEach(function(u) {
      if (u.role === "student") studOpts += '<option value="' + u.id + '">' + u.name + ' (' + u.userId + ')</option>';
      if (u.role === "staff") staffOpts += '<option value="' + u.id + '">' + u.name + ' (' + u.userId + ')</option>';
    });

    if (assignUserSelect) assignUserSelect.innerHTML = studOpts;
    if (assignStaffSelect) assignStaffSelect.innerHTML = staffOpts;

  } catch (err) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="3" class="loading-text">Error loading teams</td></tr>';
    console.error(err);
  }
}


// ===========================
// CREATE STUDENT
// ===========================
document.getElementById("createStudentBtn").addEventListener("click", async function() {
  var name = document.getElementById("studentName").value.trim();
  var userId = document.getElementById("studentRegNo").value.trim();
  var academicYear = document.getElementById("studentAcademicYear").value;
  var semester = document.getElementById("studentSemester").value;
  var password = document.getElementById("studentPassword").value.trim();
  if (!name || !userId || !password || !academicYear || !semester) return alert("Please fill in all student fields.");

  try {
    var res = await fetch(API + "/admin/create-user", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ name, userId, password, role: "student", academicYear, semester })
    });
    var data = await res.json();
    if (!res.ok) return alert("Error: " + data.message);
    alert('Student "' + name + '" created!');
    document.getElementById("studentName").value = "";
    document.getElementById("studentRegNo").value = "";
    document.getElementById("studentAcademicYear").value = "";
    document.getElementById("studentSemester").value = "";
    document.getElementById("studentPassword").value = "";
    loadUsers();
    loadAnalytics();
  } catch (err) { alert("Network error: " + err.message); }
});

// ===========================
// CREATE STAFF
// ===========================
document.getElementById("createStaffBtn").addEventListener("click", async function() {
  var name = document.getElementById("staffName").value.trim();
  var userId = document.getElementById("staffId").value.trim();
  var password = document.getElementById("staffPassword").value.trim();
  if (!name || !userId || !password) return alert("Please fill in all staff fields.");

  try {
    var res = await fetch(API + "/admin/create-user", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ name, userId, password, role: "staff" })
    });
    var data = await res.json();
    if (!res.ok) return alert("Error: " + data.message);
    alert('Staff "' + name + '" created!');
    document.getElementById("staffName").value = "";
    document.getElementById("staffId").value = "";
    document.getElementById("staffPassword").value = "";
    loadUsers();
    loadAnalytics();
  } catch (err) { alert("Network error: " + err.message); }
});

// ===========================
// CREATE TEAM
// ===========================
document.getElementById("createTeamBtn").addEventListener("click", async function() {
  var teamName = document.getElementById("teamName").value.trim();
  var experientialCategory = document.getElementById("teamCategory").value;
  if (!teamName) return alert("Please enter a team name.");
  if (!experientialCategory) return alert("Please select an Experiential Learning Category.");

  try {
    var res = await fetch(API + "/admin/teams", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ teamName, experientialCategory })
    });
    var data = await res.json();
    if (!res.ok) return alert("Error: " + data.message);
    alert('Team "' + teamName + '" created!');
    document.getElementById("teamName").value = "";
    document.getElementById("teamCategory").value = "";
    loadTeams();
    loadAnalytics();
  } catch (err) { alert("Network error: " + err.message); }
});

// ===========================
// ASSIGN STUDENT
// ===========================
var assignUserBtn = document.getElementById("assignUserBtn");
if (assignUserBtn) {
  assignUserBtn.addEventListener("click", async function() {
    var userId = document.getElementById("assignUserSelect").value;
    var teamId = document.getElementById("assignTeamSelect").value;
    if (!userId || !teamId) return alert("Select both a student and a team.");
    try {
      var res = await apiFetch(API + "/admin/add-to-team", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ userId, teamId })
      });
      if (!res) return;
      var data = await res.json();
      if (!res.ok) return alert("Error: " + data.message);
      alert(data.message);
      loadTeams();
      loadUsers();
    } catch (err) { alert("Network error: " + err.message); }
  });
}

// ===========================
// ASSIGN STAFF
// ===========================
var assignStaffBtn = document.getElementById("assignStaffBtn");
if (assignStaffBtn) {
  assignStaffBtn.addEventListener("click", async function() {
    var staffId = document.getElementById("assignStaffSelect").value;
    var teamId = document.getElementById("assignStaffTeamSelect").value;
    if (!staffId || !teamId) return alert("Select both a staff member and a team.");
    try {
      var res = await apiFetch(API + "/admin/assign-staff", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ staffId, teamId })
      });
      if (!res) return;
      var data = await res.json();
      if (!res.ok) return alert("Error: " + data.message);
      alert(data.message);
      loadTeams();
    } catch (err) { alert("Network error: " + err.message); }
  });
}

// ===========================
// SEARCH USERS
// ===========================
document.getElementById("searchUserBtn").addEventListener("click", function() {
  userSearchQuery = document.getElementById("searchUserInput").value;
  currentUsersPage = 1;
  loadUsers();
});

// ===========================
// EVALUATION FILTER HANDLERS
// ===========================
document.getElementById("applyEvalFilter").addEventListener("click", function() {
  applyEvalFilters();
});

document.getElementById("filterEvalKeyword").addEventListener("keydown", function(e) {
  if (e.key === "Enter") applyEvalFilters();
});

document.getElementById("clearEvalFilter").addEventListener("click", function() {
  document.getElementById("filterEvalType").value = "";
  document.getElementById("filterEvalCategory").value = "";
  document.getElementById("filterEvalTeam").value = "";
  document.getElementById("filterEvalKeyword").value = "";
  applyEvalFilters();
});

// ===========================
// EVALUATIONS PAGINATION (removed — all loaded at once now)
// ===========================

// ===========================
// CSV HELPER
// ===========================
function downloadCSV(filename, rows) {
  var csv = rows.map(function(row) {
    return row.map(function(cell) {
      var v = (cell === null || cell === undefined) ? "" : String(cell);
      return (v.includes(",") || v.includes('"') || v.includes("\n")) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(",");
  }).join("\n");
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ===========================
// DOWNLOAD EVALUATIONS — uses filtered data
// ===========================
document.getElementById("downloadEvaluationsExcel").addEventListener("click", function() {
  var data = filteredEvaluations.length > 0 ? filteredEvaluations : allEvaluations;
  if (!data || data.length === 0) {
    return alert("No evaluation data to download.");
  }
  var rows = [["Reg No (Evaluated)", "Evaluatee Name", "Evaluator", "Type", "Team", "Category", "Participation in Team Meetings / Class", "Responsiveness & Initiative", "Independent Learning & Technical Growth", "Team Management & Collaboration Ability", "Professionalism & Documentation Quality", "Overall Avg"]];
  data.forEach(function(e) {
    var p = e.professionalism || 0;
    var avg = ((e.communication + e.teamwork + e.leadership + e.problemSolving + p)).toFixed(1);
    rows.push([
      e.evaluated ? e.evaluated.userId : "—",
      e.evaluated ? e.evaluated.name : "—",
      e.evaluator ? e.evaluator.name : "—",
      e.isStaffEvaluation ? "Mentor" : "Peer",
      e.Team ? e.Team.teamName : "—",
      (e.Team && e.Team.experientialCategory) ? e.Team.experientialCategory : "—",
      e.communication, e.teamwork, e.leadership, e.problemSolving, p, avg
    ]);
  });
  var filterDesc = [];
  var fType = document.getElementById("filterEvalType").value;
  var fCat  = document.getElementById("filterEvalCategory").value;
  var fTeam = document.getElementById("filterEvalTeam").value;
  if (fType) filterDesc.push(fType);
  if (fCat)  filterDesc.push(fCat);
  if (fTeam) filterDesc.push(fTeam.replace(/\s+/g, "_"));
  var filename = "evaluations" + (filterDesc.length ? "_" + filterDesc.join("_") : "") + ".csv";
  downloadCSV(filename, rows);
});

// ===========================
// DOWNLOAD LEADERBOARD
// ===========================
document.getElementById("downloadLeaderboardExcel").addEventListener("click", async function() {
  try {
    var res = await apiFetch(API + "/admin/analytics", { headers: authHeaders() });
    if (!res) return;
    var data = await res.json();
    var rows = [["Rank", "Name", "Reg No", "Team", "Category", "Peer Eval (100)", "Mentor Mark (100)", "Total (200)"]];
    (data.leaderboard || []).forEach(function(u, i) {
      var total = (u.peerAvg && u.staffAvg)
        ? (parseFloat(u.peerAvg) + parseFloat(u.staffAvg)).toFixed(1) : "—";
      rows.push([i + 1, u.name, u.userId, u.teamName || "—", u.experientialCategory || "—", u.peerAvg || "—", u.staffAvg || "—", total]);
    });
    downloadCSV("leaderboard.csv", rows);
  } catch (err) { alert("Error downloading leaderboard"); }
});

// ===========================
// DOWNLOAD TEAMS
// ===========================
var downloadTeamsExcel = document.getElementById("downloadTeamsExcel");
if (downloadTeamsExcel) {
  downloadTeamsExcel.addEventListener("click", async function() {
    try {
      var res = await apiFetch(API + "/admin/teams", { headers: authHeaders() });
      if (!res) return;
      var data = await res.json();
      var rows = [["Team Name", "Category", "Staff/Mentor", "Members", "Count"]];
      data.forEach(function(t) {
        var staffName = t.staff ? t.staff.name + " (" + t.staff.userId + ")" : "Not assigned";
        var members = t.members ? t.members.map(function(m) { return m.name; }).join("; ") : "";
        rows.push([t.teamName, t.experientialCategory || "—", staffName, members, t.memberCount]);
      });
      downloadCSV("teams.csv", rows);
    } catch (err) { alert("Error downloading teams"); }
  });
}

// ===========================
// INITIAL LOAD
// ===========================
loadAnalytics();
loadUsers();
loadEvaluations();
loadTeams();

// ===========================
// OVERVIEW FILTER — Academic Year & Semester
// ===========================
document.getElementById("applyOverviewFilter").addEventListener("click", function () {
  var yearSelect = document.getElementById("filterAcademicYear");
  var semSelect  = document.getElementById("filterSemester");

  var yearVal = yearSelect.value;
  var semVal  = semSelect.value;

  var yearText = yearVal
    ? yearSelect.options[yearSelect.selectedIndex].text
    : "—";
  var semText  = semVal
    ? semSelect.options[semSelect.selectedIndex].text
    : "—";

  document.getElementById("displayAcademicYear").textContent = yearText;
  document.getElementById("displaySemester").textContent     = semText;
});