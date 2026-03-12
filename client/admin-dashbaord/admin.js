var BASE = window.location.origin;
var API = BASE + "/api";

// Force redirect to localhost if opened as file://
if (window.location.protocol === "file:") {
  window.location.href = BASE + "/admin-dashbaord/admin.html";
}

var token = localStorage.getItem("token");
var user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || user.role !== "admin") {
  alert("Admin access only! Please login first.");
  window.location.href = BASE + "/index.html";
}

document.getElementById("navUser").textContent = user.name || "Admin";

document.getElementById("logoutBtn").addEventListener("click", function() {
  localStorage.clear();
  window.location.href = BASE + "/index.html";
});

// ==================== TAB SWITCHING ====================
document.addEventListener("DOMContentLoaded", function() {
  var tabs = document.querySelectorAll(".tab");
  var pages = document.querySelectorAll(".tabPage");

  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      var target = tab.getAttribute("data-target");
      tabs.forEach(function(t) { t.classList.remove("active"); });
      tab.classList.add("active");
      pages.forEach(function(page) {
        page.classList.remove("activePage");
        if (page.id === target) page.classList.add("activePage");
      });
    });
  });

  loadAnalytics();
  loadTeams();
  loadUsers();
  loadEvaluations();
});

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };
}

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
    if (data.leaderboard.length > 0) {
      leaderboardBody.innerHTML = data.leaderboard.map(function(u, i) {
        var rankClass = "";
        if (i === 0) rankClass = "gold";
        if (i === 1) rankClass = "silver";
        if (i === 2) rankClass = "bronze";
        return '<tr><td><span class="rank-badge ' + rankClass + '">' + (i + 1) + '</span></td><td><strong>' + u.name + '</strong></td><td>' + u.userId + '</td><td><span class="team-badge">' + u.teamName + '</span></td><td><span class="score-badge">' + u.peerAvg + '</span></td><td><span class="score-badge">' + u.staffAvg + '</span></td><td><strong>' + u.overallAvg + '</strong></td></tr>';
      }).join("");
    } else {
      leaderboardBody.innerHTML = '<tr><td colspan="7" class="loading-text">No evaluations yet</td></tr>';
    }

    var teamPerfBody = document.getElementById("teamPerfBody");
    if (data.teamPerformance.length > 0) {
      teamPerfBody.innerHTML = data.teamPerformance.map(function(t) {
        var pct = Math.min((t.averageScore / 5) * 100, 100);
        return '<tr><td><strong>' + t.teamName + '</strong></td><td>' + t.memberCount + '</td><td><span class="score-badge">' + t.averageScore + '</span></td><td><div class="perf-bar-wrap"><div class="perf-bar" style="width:' + pct + '%">' + t.averageScore + '/5</div></div></td></tr>';
      }).join("");
    } else {
      teamPerfBody.innerHTML = '<tr><td colspan="4" class="loading-text">No team data</td></tr>';
    }
  } catch (error) {
    console.error("Analytics error:", error);
  }
}

// ==================== LOAD TEAMS ====================
async function loadTeams() {
  try {
    var res = await fetch(API + "/admin/teams", { headers: authHeaders() });
    var data = await res.json();

    var tbody = document.getElementById("teamsTableBody");
    if (data.length > 0) {
      tbody.innerHTML = data.map(function(t) {
        var staffName = t.staffId ? t.staffId.name + " (" + t.staffId.userId + ")" : "Not assigned";
        var members = t.members ? t.members.map(function(m) { return m.name; }).join(", ") : "—";
        return '<tr><td><strong>' + t.teamName + '</strong></td><td>' + staffName + '</td><td>' + (members || "No students") + ' <span class="score-badge">' + t.memberCount + '</span></td></tr>';
      }).join("");

      // Populate team dropdowns
      var assignTeamSelect = document.getElementById("assignTeamSelect");
      var assignStaffTeamSelect = document.getElementById("assignStaffTeamSelect");
      assignTeamSelect.innerHTML = '<option value="">— Select Team —</option>';
      assignStaffTeamSelect.innerHTML = '<option value="">— Select Team —</option>';
      data.forEach(function(t) {
        assignTeamSelect.innerHTML += '<option value="' + t._id + '">' + t.teamName + '</option>';
        assignStaffTeamSelect.innerHTML += '<option value="' + t._id + '">' + t.teamName + '</option>';
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="3" class="loading-text">No teams yet</td></tr>';
    }
  } catch (error) {
    console.error("Teams error:", error);
  }
}

// ==================== LOAD USERS ====================
async function loadUsers() {
  try {
    var res = await fetch(API + "/admin/users", { headers: authHeaders() });
    var data = await res.json();

    var tbody = document.getElementById("usersTableBody");
    if (data.length > 0) {
      tbody.innerHTML = data.map(function(u) {
        var teamBadge = u.teamId ? '<span class="team-badge">' + u.teamId.teamName + '</span>' : "—";
        return '<tr><td><strong>' + u.name + '</strong></td><td>' + u.userId + '</td><td><span class="role-badge ' + u.role + '">' + u.role + '</span></td><td>' + teamBadge + '</td></tr>';
      }).join("");

      // Populate student select
      var assignUserSelect = document.getElementById("assignUserSelect");
      assignUserSelect.innerHTML = '<option value="">— Select Student —</option>';
      data.filter(function(u) { return u.role === "student"; }).forEach(function(u) {
        assignUserSelect.innerHTML += '<option value="' + u._id + '">' + u.name + ' (' + u.userId + ')</option>';
      });

      // Populate staff select
      var assignStaffSelect = document.getElementById("assignStaffSelect");
      assignStaffSelect.innerHTML = '<option value="">— Select Staff —</option>';
      data.filter(function(u) { return u.role === "staff"; }).forEach(function(u) {
        assignStaffSelect.innerHTML += '<option value="' + u._id + '">' + u.name + ' (' + u.userId + ')</option>';
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="4" class="loading-text">No users yet</td></tr>';
    }
  } catch (error) {
    console.error("Users error:", error);
  }
}

// ==================== LOAD EVALUATIONS ====================
async function loadEvaluations() {
  try {
    var res = await fetch(API + "/admin/evaluations", { headers: authHeaders() });
    var data = await res.json();

    var tbody = document.getElementById("evaluationsTableBody");
    if (data.length > 0) {
      tbody.innerHTML = data.map(function(e) {
        var avg = ((e.communication + e.teamwork + e.leadership + e.problemSolving) / 4).toFixed(1);
        var type = e.isStaffEvaluation ? '<span class="role-badge staff">Staff</span>' : '<span class="role-badge student">Peer</span>';
        return '<tr><td>' + (e.evaluatorId ? e.evaluatorId.name : "—") + '</td><td>' + (e.evaluatedUserId ? e.evaluatedUserId.name : "—") + '</td><td>' + type + '</td><td>' + (e.teamId ? '<span class="team-badge">' + e.teamId.teamName + '</span>' : "—") + '</td><td><span class="score-badge">' + e.communication + '</span></td><td><span class="score-badge">' + e.teamwork + '</span></td><td><span class="score-badge">' + e.leadership + '</span></td><td><span class="score-badge">' + e.problemSolving + '</span></td><td><strong>' + avg + '</strong></td><td>' + (e.comment || "—") + '</td></tr>';
      }).join("");
    } else {
      tbody.innerHTML = '<tr><td colspan="10" class="loading-text">No evaluations yet</td></tr>';
    }
  } catch (error) {
    console.error("Evaluations error:", error);
  }
}

// ==================== CREATE STUDENT ====================
document.getElementById("createStudentBtn").addEventListener("click", async function() {
  var name = document.getElementById("studentName").value.trim();
  var userId = document.getElementById("studentRegNo").value.trim();
  var password = document.getElementById("studentPassword").value;
  if (!name || !userId || !password) { alert("All fields required"); return; }

  try {
    var res = await fetch(API + "/admin/create-user", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ name: name, userId: userId, password: password, role: "student" })
    });
    var data = await res.json();
    if (!res.ok) { alert(data.message); return; }
    alert(data.message);
    document.getElementById("studentName").value = "";
    document.getElementById("studentRegNo").value = "";
    document.getElementById("studentPassword").value = "";
    loadUsers(); loadAnalytics();
  } catch (error) { alert("Error creating student"); }
});

// ==================== CREATE STAFF ====================
document.getElementById("createStaffBtn").addEventListener("click", async function() {
  var name = document.getElementById("staffName").value.trim();
  var userId = document.getElementById("staffId").value.trim();
  var password = document.getElementById("staffPassword").value;
  if (!name || !userId || !password) { alert("All fields required"); return; }

  try {
    var res = await fetch(API + "/admin/create-user", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ name: name, userId: userId, password: password, role: "staff" })
    });
    var data = await res.json();
    if (!res.ok) { alert(data.message); return; }
    alert(data.message);
    document.getElementById("staffName").value = "";
    document.getElementById("staffId").value = "";
    document.getElementById("staffPassword").value = "";
    loadUsers(); loadAnalytics();
  } catch (error) { alert("Error creating staff"); }
});

// ==================== CREATE TEAM ====================
document.getElementById("createTeamBtn").addEventListener("click", async function() {
  var teamName = document.getElementById("teamName").value.trim();
  if (!teamName) { alert("Enter team name"); return; }

  try {
    var res = await fetch(API + "/admin/teams", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ teamName: teamName })
    });
    var data = await res.json();
    if (!res.ok) { alert(data.message); return; }
    alert("Team created");
    document.getElementById("teamName").value = "";
    loadTeams(); loadAnalytics();
  } catch (error) { alert("Error creating team"); }
});

// ==================== ASSIGN STUDENT TO TEAM ====================
document.getElementById("assignUserBtn").addEventListener("click", async function() {
  var userId = document.getElementById("assignUserSelect").value;
  var teamId = document.getElementById("assignTeamSelect").value;
  if (!userId || !teamId) { alert("Select both student and team"); return; }

  try {
    var res = await fetch(API + "/admin/add-to-team", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ userId: userId, teamId: teamId })
    });
    var data = await res.json();
    if (!res.ok) { alert(data.message); return; }
    alert(data.message);
    loadUsers(); loadTeams(); loadAnalytics();
  } catch (error) { alert("Error assigning"); }
});

// ==================== ASSIGN STAFF TO TEAM ====================
document.getElementById("assignStaffBtn").addEventListener("click", async function() {
  var staffId = document.getElementById("assignStaffSelect").value;
  var teamId = document.getElementById("assignStaffTeamSelect").value;
  if (!staffId || !teamId) { alert("Select both staff and team"); return; }

  try {
    var res = await fetch(API + "/admin/assign-staff", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ staffId: staffId, teamId: teamId })
    });
    var data = await res.json();
    if (!res.ok) { alert(data.message); return; }
    alert(data.message);
    loadUsers(); loadTeams(); loadAnalytics();
  } catch (error) { alert("Error assigning staff"); }
});