var BASE = "http://localhost:5000";
var API = BASE + "/api";

var currentUsersPage = 1;
var currentEvaluationsPage = 1;
var limit = 10;
var userSearchQuery = "";
var evaluationSearchQuery = "";

var token = localStorage.getItem("token") || "";
var user = JSON.parse(localStorage.getItem("user") || "{}");

document.getElementById("navUser").textContent = user.name || "Admin";

document.getElementById("logoutBtn").addEventListener("click", function() {
  localStorage.clear();
  window.location.href = BASE + "/index.html";
});

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: "Bearer " + token };
}

// ==================== TAB SWITCHING ====================
document.addEventListener("DOMContentLoaded", function() {
  var tabs = document.querySelectorAll(".tab");
  var pages = document.querySelectorAll(".tabPage");
  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      tabs.forEach(function(t) { t.classList.remove("active"); });
      tab.classList.add("active");
      pages.forEach(function(page) {
        page.classList.remove("activePage");
        if (page.id === tab.getAttribute("data-target")) page.classList.add("activePage");
      });
    });
  });

  loadAnalytics();
  loadTeams();
  loadUsers();
  loadEvaluations();
  loadDropdowns();
  setupUserPagination();
  setupEvaluationPagination();
  setupSearch();

  // CREATE STUDENT
  document.getElementById("createStudentBtn").addEventListener("click", async function() {
    var name = document.getElementById("studentName").value.trim();
    var userId = document.getElementById("studentRegNo").value.trim();
    var password = document.getElementById("studentPassword").value.trim();
    if (!name || !userId || !password) return alert("Please fill in all student fields.");
    try {
      var res = await fetch(API + "/admin/create-user", { method: "POST", headers: authHeaders(), body: JSON.stringify({ userId, name, password, role: "student" }) });
      var data = await res.json();
      if (!res.ok) return alert("Error: " + data.message);
      alert('Student "' + name + '" created successfully!');
      document.getElementById("studentName").value = "";
      document.getElementById("studentRegNo").value = "";
      document.getElementById("studentPassword").value = "";
      loadUsers(); loadDropdowns();
    } catch (err) { alert("Network error: " + err.message); }
  });

  // CREATE STAFF
  document.getElementById("createStaffBtn").addEventListener("click", async function() {
    var name = document.getElementById("staffName").value.trim();
    var userId = document.getElementById("staffId").value.trim();
    var password = document.getElementById("staffPassword").value.trim();
    if (!name || !userId || !password) return alert("Please fill in all staff fields.");
    try {
      var res = await fetch(API + "/admin/create-user", { method: "POST", headers: authHeaders(), body: JSON.stringify({ userId, name, password, role: "staff" }) });
      var data = await res.json();
      if (!res.ok) return alert("Error: " + data.message);
      alert('Staff "' + name + '" created successfully!');
      document.getElementById("staffName").value = "";
      document.getElementById("staffId").value = "";
      document.getElementById("staffPassword").value = "";
      loadUsers(); loadDropdowns();
    } catch (err) { alert("Network error: " + err.message); }
  });

  // CREATE TEAM
  document.getElementById("createTeamBtn").addEventListener("click", async function() {
    var teamName = document.getElementById("teamName").value.trim();
    if (!teamName) return alert("Please enter a team name.");
    try {
      var res = await fetch(API + "/admin/teams", { method: "POST", headers: authHeaders(), body: JSON.stringify({ teamName }) });
      var data = await res.json();
      if (!res.ok) return alert("Error: " + data.message);
      alert('Team "' + teamName + '" created!');
      document.getElementById("teamName").value = "";
      loadTeams(); loadDropdowns();
    } catch (err) { alert("Network error: " + err.message); }
  });

  // ASSIGN STUDENT TO TEAM
  document.getElementById("assignUserBtn").addEventListener("click", async function() {
    var userId = document.getElementById("assignUserSelect").value;
    var teamId = document.getElementById("assignTeamSelect").value;
    if (!userId || !teamId) return alert("Please select both a student and a team.");
    try {
      var res = await fetch(API + "/admin/add-to-team", { method: "POST", headers: authHeaders(), body: JSON.stringify({ userId, teamId }) });
      var data = await res.json();
      if (!res.ok) return alert("Error: " + data.message);
      alert(data.message);
      loadTeams(); loadUsers();
    } catch (err) { alert("Network error: " + err.message); }
  });

  // ASSIGN STAFF TO TEAM
  document.getElementById("assignStaffBtn").addEventListener("click", async function() {
    var staffId = document.getElementById("assignStaffSelect").value;
    var teamId = document.getElementById("assignStaffTeamSelect").value;
    if (!staffId || !teamId) return alert("Please select both a staff member and a team.");
    try {
      var res = await fetch(API + "/admin/assign-staff", { method: "POST", headers: authHeaders(), body: JSON.stringify({ staffId, teamId }) });
      var data = await res.json();
      if (!res.ok) return alert("Error: " + data.message);
      alert(data.message);
      loadTeams();
    } catch (err) { alert("Network error: " + err.message); }
  });
});

// ==================== LOAD ANALYTICS ====================
async function loadAnalytics() {
  try {
    var res = await fetch(API + "/admin/analytics", { headers: authHeaders() });
    var data = await res.json();
    document.getElementById("totalStudents").textContent = data.summary.totalStudents;
    document.getElementById("totalStaff").textContent = data.summary.totalStaff;
    document.getElementById("totalTeams").textContent = data.summary.totalTeams;
    document.getElementById("totalEvaluations").textContent = data.summary.totalEvaluations;
    var leaderboardBody = document.getElementById("leaderboardBody");
    if (data.leaderboard && data.leaderboard.length > 0) {
      leaderboardBody.innerHTML = data.leaderboard.map(function(u, i) {
        var rankClass = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
        return `<tr><td><span class="rank-badge ${rankClass}">${i+1}</span></td><td><strong>${u.name}</strong></td><td>${u.userId}</td><td><span class="team-badge">${u.teamName}</span></td><td><span class="score-badge">${u.peerAvg}</span></td><td><span class="score-badge">${u.staffAvg}</span></td><td><strong>${u.overallAvg}</strong></td></tr>`;
      }).join("");
    } else {
      leaderboardBody.innerHTML = '<tr><td colspan="7" class="loading-text">No evaluations yet</td></tr>';
    }
  } catch (error) { console.error("Analytics error:", error); }
}

// ==================== LOAD TEAMS ====================
async function loadTeams() {
  try {
    var res = await fetch(API + "/admin/teams", { headers: authHeaders() });
    var data = await res.json();
    var tbody = document.getElementById("teamsTableBody");
    if (data.length > 0) {
      tbody.innerHTML = data.map(function(t) {
        var staffName = t.staff ? t.staff.name + " (" + t.staff.userId + ")" : "Not assigned";
        var members = t.members ? t.members.map(function(m) { return m.name; }).join(", ") : "—";
        return `<tr><td><strong>${t.teamName}</strong></td><td>${staffName}</td><td>${members || "No students"} <span class="score-badge">${t.memberCount}</span></td></tr>`;
      }).join("");
    } else {
      tbody.innerHTML = '<tr><td colspan="3" class="loading-text">No teams yet</td></tr>';
    }
  } catch (error) { console.error("Teams error:", error); }
}

// ==================== LOAD DROPDOWNS ====================
async function loadDropdowns() {
  try {
    var usersRes = await fetch(API + "/admin/users", { headers: authHeaders() });
    var users = await usersRes.json();
    var teamsRes = await fetch(API + "/admin/teams", { headers: authHeaders() });
    var teams = await teamsRes.json();

    var studentSelect = document.getElementById("assignUserSelect");
    studentSelect.innerHTML = '<option value="">— Select Student —</option>';
    users.filter(u => u.role === "student").forEach(function(u) {
      studentSelect.innerHTML += '<option value="' + u.id + '">' + u.name + ' (' + u.userId + ')</option>';
    });

    var staffSelect = document.getElementById("assignStaffSelect");
    staffSelect.innerHTML = '<option value="">— Select Staff —</option>';
    users.filter(u => u.role === "staff").forEach(function(u) {
      staffSelect.innerHTML += '<option value="' + u.id + '">' + u.name + ' (' + u.userId + ')</option>';
    });

    ["assignTeamSelect", "assignStaffTeamSelect"].forEach(function(selId) {
      var sel = document.getElementById(selId);
      sel.innerHTML = '<option value="">— Select Team —</option>';
      teams.forEach(function(t) {
        sel.innerHTML += '<option value="' + t.id + '">' + t.teamName + '</option>';
      });
    });
  } catch (err) { console.error("Dropdown load error:", err); }
}

// ==================== LOAD USERS ====================
async function loadUsers() {
  try {
    var tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = '<tr><td colspan="4" class="loading-text">Loading users...</td></tr>';
    var res = await fetch(API + "/admin/users?page=" + currentUsersPage + "&limit=" + limit + "&search=" + userSearchQuery, { headers: authHeaders() });
    var data = await res.json();
    if (data.length > 0) {
      tbody.innerHTML = data.map(function(u) {
        var teamBadge = u.Team ? '<span class="team-badge">' + u.Team.teamName + '</span>' : "—";
        return `<tr><td><strong>${u.name}</strong></td><td>${u.userId}</td><td><span class="role-badge ${u.role}">${u.role}</span></td><td>${teamBadge}</td></tr>`;
      }).join("");
    } else {
      tbody.innerHTML = '<tr><td colspan="4" class="loading-text">No users found</td></tr>';
    }
  } catch (error) { console.error("Users error:", error); }
}

// ==================== LOAD EVALUATIONS ====================
async function loadEvaluations() {
  try {
    var tbody = document.getElementById("evaluationsTableBody");
    tbody.innerHTML = '<tr><td colspan="11" class="loading-text">Loading evaluations...</td></tr>';
    var res = await fetch(API + "/admin/evaluations?page=" + currentEvaluationsPage + "&limit=" + limit + "&search=" + evaluationSearchQuery, { headers: authHeaders() });
    var data = await res.json();
    if (data.length > 0) {
      tbody.innerHTML = data.map(function(e) {
        var professionalism = Number(e.professionalism || 0);
        var avg = ((e.communication + e.teamwork + e.leadership + e.problemSolving + professionalism) / 5).toFixed(1);
        var type = e.isStaffEvaluation ? '<span class="role-badge staff">Staff</span>' : '<span class="role-badge student">Peer</span>';
        return `<tr>
          <td>${e.evaluator ? e.evaluator.name : "—"}</td>
          <td>${e.evaluated ? e.evaluated.name : "—"}</td>
          <td>${type}</td>
          <td>${e.Team ? '<span class="team-badge">' + e.Team.teamName + '</span>' : "—"}</td>
          <td><span class="score-badge">${e.communication}</span></td>
          <td><span class="score-badge">${e.teamwork}</span></td>
          <td><span class="score-badge">${e.leadership}</span></td>
          <td><span class="score-badge">${e.problemSolving}</span></td>
          <td><span class="score-badge">${professionalism}</span></td>
          <td><strong>${avg}</strong></td>
          <td>${e.comment || "—"}</td>
        </tr>`;
      }).join("");
    } else {
      tbody.innerHTML = '<tr><td colspan="11" class="loading-text">No evaluations found</td></tr>';
    }
  } catch (error) { console.error("Evaluations error:", error); }
}

// ==================== SEARCH ====================
function setupSearch() {
  var userSearchBtn = document.getElementById("searchUserBtn");
  if (userSearchBtn) {
    userSearchBtn.addEventListener("click", function() {
      userSearchQuery = document.getElementById("searchUserInput").value;
      currentUsersPage = 1; loadUsers();
    });
  }
  var evaluationSearchBtn = document.getElementById("searchEvaluationBtn");
  if (evaluationSearchBtn) {
    evaluationSearchBtn.addEventListener("click", function() {
      evaluationSearchQuery = document.getElementById("searchEvaluationInput").value;
      currentEvaluationsPage = 1; loadEvaluations();
    });
  }
}

// ==================== PAGINATION ====================
function setupUserPagination() {
  var prevBtn = document.getElementById("usersPrevBtn");
  var nextBtn = document.getElementById("usersNextBtn");
  if (prevBtn) prevBtn.addEventListener("click", function() { if (currentUsersPage > 1) { currentUsersPage--; loadUsers(); } });
  if (nextBtn) nextBtn.addEventListener("click", function() { currentUsersPage++; loadUsers(); });
}

function setupEvaluationPagination() {
  var prevBtn = document.getElementById("evaluationsPrevBtn");
  var nextBtn = document.getElementById("evaluationsNextBtn");
  if (prevBtn) prevBtn.addEventListener("click", function() { if (currentEvaluationsPage > 1) { currentEvaluationsPage--; loadEvaluations(); } });
  if (nextBtn) nextBtn.addEventListener("click", function() { currentEvaluationsPage++; loadEvaluations(); });
}

// ==================== CSV HELPER ====================
function downloadCSV(filename, rows) {
  var csv = rows.map(function(row) {
    return row.map(function(cell) {
      var val = (cell === null || cell === undefined) ? "" : String(cell);
      if (val.indexOf(",") !== -1 || val.indexOf("\"") !== -1 || val.indexOf("\n") !== -1) {
        val = "\"" + val.replace(/"/g, "\"\"") + "\"";
      }
      return val;
    }).join(",");
  }).join("\n");
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ==================== DOWNLOAD EVALUATIONS ====================
var dlEvalBtn = document.getElementById("downloadEvaluationsExcel");
if (dlEvalBtn) {
  dlEvalBtn.addEventListener("click", async function() {
    try {
      var res = await fetch(API + "/admin/evaluations", { headers: authHeaders() });
      var data = await res.json();
      var rows = [["Evaluator", "Evaluated", "Type", "Team", "Communication", "Teamwork", "Leadership", "Problem Solving", "Professionalism", "Avg", "Comment"]];
      data.forEach(function(e) {
        var p = Number(e.professionalism || 0);
        var avg = ((e.communication + e.teamwork + e.leadership + e.problemSolving + p) / 5).toFixed(1);
        rows.push([e.evaluator ? e.evaluator.name : "—", e.evaluated ? e.evaluated.name : "—", e.isStaffEvaluation ? "Staff" : "Peer", e.Team ? e.Team.teamName : "—", e.communication, e.teamwork, e.leadership, e.problemSolving, p, avg, e.comment || ""]);
      });
      downloadCSV("evaluations.csv", rows);
    } catch (err) { alert("Error downloading evaluations"); }
  });
}

// ==================== DOWNLOAD LEADERBOARD ====================
var dlLeaderBtn = document.getElementById("downloadLeaderboardExcel");
if (dlLeaderBtn) {
  dlLeaderBtn.addEventListener("click", async function() {
    try {
      var res = await fetch(API + "/admin/analytics", { headers: authHeaders() });
      var data = await res.json();
      var rows = [["Rank", "Name", "Reg No", "Team", "Peer Avg", "Staff Avg", "Overall Avg", "Evaluations"]];
      data.leaderboard.forEach(function(u, i) {
        rows.push([i + 1, u.name, u.userId, u.teamName, u.peerAvg, u.staffAvg, u.overallAvg, u.evaluationCount]);
      });
      downloadCSV("leaderboard.csv", rows);
    } catch (err) { alert("Error downloading leaderboard"); }
  });
}

// ==================== DOWNLOAD TEAMS ====================
var dlTeamsBtn = document.getElementById("downloadTeamsExcel");
if (dlTeamsBtn) {
  dlTeamsBtn.addEventListener("click", async function() {
    try {
      var res = await fetch(API + "/admin/teams", { headers: authHeaders() });
      var data = await res.json();
      var rows = [["Team Name", "Staff/Mentor", "Members", "Member Count"]];
      data.forEach(function(t) {
        var staffName = t.staff ? t.staff.name + " (" + t.staff.userId + ")" : "Not assigned";
        var members = t.members ? t.members.map(function(m) { return m.name; }).join("; ") : "";
        rows.push([t.teamName, staffName, members, t.memberCount]);
      });
      downloadCSV("teams.csv", rows);
    } catch (err) { alert("Error downloading teams"); }
  });
}

// ==================== AVG CALCULATION ====================
function calculateAverage(e) {
  return ((e.communication + e.teamwork + e.leadership + e.problemSolving + (e.professionalism || 0)) / 5).toFixed(1);
}


// ==================== AVG CALCULATION ====================
function calculateAverage(e) {
  return ((e.communication + e.teamwork + e.leadership + e.problemSolving + (e.professionalism || 0)) / 5).toFixed(1);
}
