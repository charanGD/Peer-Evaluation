var BASE = "https://peer-evaluation-api.onrender.com"; 
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
        return "<tr>" +
          "<td><span class='rank-badge " + badgeClass + "'>" + (i + 1) + "</span></td>" +
          "<td><strong>" + u.name + "</strong></td>" +
          "<td>" + u.userId + "</td>" +
          "<td><span class='team-badge'>" + (u.teamName || "—") + "</span></td>" +
          "<td>" + peerEval + "</td>" +
          "<td>" + mentorMark + "</td>" +
          "<td><strong>" + total + "</strong></td>" +
          "</tr>";
      }).join("");
    } else {
      tbody.innerHTML = '<tr><td colspan="7" class="loading-text">No evaluation data yet</td></tr>';
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
      return "<tr>" +
        "<td><strong>" + u.name + "</strong></td>" +
        "<td>" + u.userId + "</td>" +
        "<td><span class='role-badge " + u.role + "'>" + u.role + "</span></td>" +
        "<td>" + teamBadge + "</td>" +
        "</tr>";
    }).join("");
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="loading-text">Error loading users</td></tr>';
    console.error(err);
  }
}

// ===========================
// LOAD EVALUATIONS TABLE
// ===========================
async function loadEvaluations() {
  var tbody = document.getElementById("evaluationsTableBody");
  tbody.innerHTML = '<tr><td colspan="5" class="loading-text">Loading evaluations...</td></tr>';

  try {
    var url = API + "/admin/evaluations?page=" + currentEvaluationsPage + "&limit=" + limit;
    if (evaluationSearchQuery) url += "&search=" + encodeURIComponent(evaluationSearchQuery);

    var res = await apiFetch(url, { headers: authHeaders() });
    if (!res) return;
    var data = await res.json();

    if (!res.ok || !data.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="loading-text">No evaluations found</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(function(e) {
      var p = e.professionalism || 0;
      var avg = ((e.communication + e.teamwork + e.leadership + e.problemSolving + p) / 5).toFixed(1);
      var typeBadge = e.isStaffEvaluation
        ? "<span class='role-badge staff'>Mentor</span>"
        : "<span class='role-badge student'>Peer</span>";
      return "<tr>" +
        "<td>" + (e.evaluated ? e.evaluated.userId : "—") + "</td>" +
        "<td>" + (e.evaluator ? e.evaluator.name : "—") + "</td>" +
        "<td>" + typeBadge + "</td>" +
        "<td><span class='team-badge'>" + (e.Team ? e.Team.teamName : "—") + "</span></td>" +
        "<td><span class='score-badge'>" + avg + "</span></td>" +
        "</tr>";
    }).join("");
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading-text">Error loading evaluations</td></tr>';
    console.error(err);
  }
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
        tbody.innerHTML = '<tr><td colspan="3" class="loading-text">No teams found</td></tr>';
      } else {
        tbody.innerHTML = teams.map(function(t) {
          var staffName = t.staff ? t.staff.name + " (" + t.staff.userId + ")" : "Not assigned";
          var members = t.members ? t.members.map(function(m) { return m.name; }).join(", ") : "—";
          return "<tr>" +
            "<td><strong>" + t.teamName + "</strong></td>" +
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
  var password = document.getElementById("studentPassword").value.trim();
  if (!name || !userId || !password) return alert("Please fill in all student fields.");

  try {
    var res = await fetch(API + "/admin/create-user", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ name, userId, password, role: "student" })
    });
    var data = await res.json();
    if (!res.ok) return alert("Error: " + data.message);
    alert('Student "' + name + '" created!');
    document.getElementById("studentName").value = "";
    document.getElementById("studentRegNo").value = "";
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
  if (!teamName) return alert("Please enter a team name.");

  try {
    var res = await fetch(API + "/admin/teams", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ teamName })
    });
    var data = await res.json();
    if (!res.ok) return alert("Error: " + data.message);
    alert('Team "' + teamName + '" created!');
    document.getElementById("teamName").value = "";
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
// SEARCH EVALUATIONS
// ===========================
document.getElementById("searchEvaluationBtn").addEventListener("click", function() {
  evaluationSearchQuery = document.getElementById("searchEvaluationInput").value;
  currentEvaluationsPage = 1;
  loadEvaluations();
});

// ===========================
// EVALUATIONS PAGINATION
// ===========================
document.getElementById("evaluationsPrevBtn").addEventListener("click", function() {
  if (currentEvaluationsPage > 1) { currentEvaluationsPage--; loadEvaluations(); }
});
document.getElementById("evaluationsNextBtn").addEventListener("click", function() {
  currentEvaluationsPage++; loadEvaluations();
});

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
// DOWNLOAD EVALUATIONS (id = downloadPeerExcel)
// ===========================
document.getElementById("downloadEvaluationsExcel").addEventListener("click", async function() {
  try {
    var res = await apiFetch(API + "/admin/evaluations", { headers: authHeaders() });
    if (!res) return;
    var data = await res.json();
    var rows = [["Reg No (Evaluated)", "Evaluator", "Type", "Team", "Participation", "Responsibility", "Learning Growth", "Collaboration", "Professionalism", "Overall Avg"]];
    data.forEach(function(e) {
      var p = e.professionalism || 0;
      var avg = ((e.communication + e.teamwork + e.leadership + e.problemSolving + p) / 5).toFixed(1);
      rows.push([
        e.evaluated ? e.evaluated.userId : "—",
        e.evaluator ? e.evaluator.name : "—",
        e.isStaffEvaluation ? "Mentor" : "Peer",
        e.Team ? e.Team.teamName : "—",
        e.communication, e.teamwork, e.leadership, e.problemSolving, p, avg
      ]);
    });
    downloadCSV("evaluations.csv", rows);
  } catch (err) { alert("Error downloading evaluations"); }
});

// ===========================
// DOWNLOAD LEADERBOARD
// ===========================
document.getElementById("downloadLeaderboardExcel").addEventListener("click", async function() {
  try {
    var res = await apiFetch(API + "/admin/analytics", { headers: authHeaders() });
    if (!res) return;
    var data = await res.json();
    var rows = [["Rank", "Name", "Reg No", "Team", "Peer Eval (100)", "Mentor Mark (100)", "Total (200)"]];
    (data.leaderboard || []).forEach(function(u, i) {
      var total = (u.peerAvg && u.staffAvg)
        ? (parseFloat(u.peerAvg) + parseFloat(u.staffAvg)).toFixed(1) : "—";
      rows.push([i + 1, u.name, u.userId, u.teamName || "—", u.peerAvg || "—", u.staffAvg || "—", total]);
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
      var rows = [["Team Name", "Staff/Mentor", "Members", "Count"]];
      data.forEach(function(t) {
        var staffName = t.staff ? t.staff.name + " (" + t.staff.userId + ")" : "Not assigned";
        var members = t.members ? t.members.map(function(m) { return m.name; }).join("; ") : "";
        rows.push([t.teamName, staffName, members, t.memberCount]);
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