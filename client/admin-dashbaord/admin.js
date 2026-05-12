
var BASE = window.location.origin;
var API = BASE + "/api";

// ==================== PAGINATION + SEARCH VARIABLES ====================
var currentUsersPage = 1;
var currentEvaluationsPage = 1;
var limit = 10;
var userSearchQuery = "";
var evaluationSearchQuery = "";

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

      tabs.forEach(function(t) {
        t.classList.remove("active");
      });

      tab.classList.add("active");

      pages.forEach(function(page) {
        page.classList.remove("activePage");
        if (page.id === target) {
          page.classList.add("activePage");
        }
      });
    });
  });

  loadAnalytics();
  loadTeams();
  loadUsers();
  loadEvaluations();

  setupUserPagination();
  setupEvaluationPagination();
  setupSearch();
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
    var res = await fetch(API + "/admin/analytics", {
      headers: authHeaders()
    });

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

        return `
          <tr>
            <td><span class="rank-badge ${rankClass}">${i + 1}</span></td>
            <td><strong>${u.name}</strong></td>
            <td>${u.userId}</td>
            <td><span class="team-badge">${u.teamName}</span></td>
            <td><span class="score-badge">${u.peerAvg}</span></td>
            <td><span class="score-badge">${u.staffAvg}</span></td>
            <td><strong>${u.overallAvg}</strong></td>
          </tr>
        `;
      }).join("");
    } else {
      leaderboardBody.innerHTML = `
        <tr>
          <td colspan="7" class="loading-text">No evaluations yet</td>
        </tr>
      `;
    }
  } catch (error) {
    console.error("Analytics error:", error);
  }
}

// ==================== LOAD TEAMS ====================
async function loadTeams() {
  try {
    var res = await fetch(API + "/admin/teams", {
      headers: authHeaders()
    });

    var data = await res.json();

    var tbody = document.getElementById("teamsTableBody");

    if (data.length > 0) {
      tbody.innerHTML = data.map(function(t) {
        var staffName = t.staffId
          ? t.staffId.name + " (" + t.staffId.userId + ")"
          : "Not assigned";

        var members = t.members
          ? t.members.map(function(m) {
              return m.name;
            }).join(", ")
          : "—";

        return `
          <tr>
            <td><strong>${t.teamName}</strong></td>
            <td>${staffName}</td>
            <td>
              ${members || "No students"}
              <span class="score-badge">${t.memberCount}</span>
            </td>
          </tr>
        `;
      }).join("");
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="loading-text">No teams yet</td>
        </tr>
      `;
    }
  } catch (error) {
    console.error("Teams error:", error);
  }
}

// ==================== LOAD USERS WITH PAGINATION + SEARCH ====================
async function loadUsers() {
  try {
    var tbody = document.getElementById("usersTableBody");

    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="loading-text">Loading users...</td>
      </tr>
    `;

    var res = await fetch(
      API + "/admin/users?page=" + currentUsersPage +
      "&limit=" + limit +
      "&search=" + userSearchQuery,
      {
        headers: authHeaders()
      }
    );

    var data = await res.json();

    if (data.length > 0) {
      tbody.innerHTML = data.map(function(u) {
        var teamBadge = u.teamId
          ? `<span class="team-badge">${u.teamId.teamName}</span>`
          : "—";

        return `
          <tr>
            <td><strong>${u.name}</strong></td>
            <td>${u.userId}</td>
            <td>
              <span class="role-badge ${u.role}">
                ${u.role}
              </span>
            </td>
            <td>${teamBadge}</td>
          </tr>
        `;
      }).join("");
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="loading-text">No users found</td>
        </tr>
      `;
    }
  } catch (error) {
    console.error("Users error:", error);
  }
}

// ==================== LOAD EVALUATIONS WITH PAGINATION ====================
async function loadEvaluations() {
  try {
    var tbody = document.getElementById("evaluationsTableBody");

    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="loading-text">Loading evaluations...</td>
      </tr>
    `;

    var res = await fetch(
      API + "/admin/evaluations?page=" + currentEvaluationsPage +
      "&limit=" + limit +
      "&search=" + evaluationSearchQuery,
      {
        headers: authHeaders()
      }
    );

    var data = await res.json();

    if (data.length > 0) {
      tbody.innerHTML = data.map(function(e) {
        var avg = (
          (
            e.communication +
            e.teamwork +
            e.leadership +
            e.problemSolving
          ) / 4
        ).toFixed(1);

        var type = e.isStaffEvaluation
          ? '<span class="role-badge staff">Staff</span>'
          : '<span class="role-badge student">Peer</span>';

        return `
          <tr>
            <td>${e.evaluatorId ? e.evaluatorId.name : "—"}</td>
            <td>${e.evaluatedUserId ? e.evaluatedUserId.name : "—"}</td>
            <td>${type}</td>
            <td>
              ${e.teamId
                ? `<span class="team-badge">${e.teamId.teamName}</span>`
                : "—"}
            </td>
            <td><span class="score-badge">${e.communication}</span></td>
            <td><span class="score-badge">${e.teamwork}</span></td>
            <td><span class="score-badge">${e.leadership}</span></td>
            <td><span class="score-badge">${e.problemSolving}</span></td>
            <td><strong>${avg}</strong></td>
            <td>${e.comment || "—"}</td>
          </tr>
        `;
      }).join("");
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="loading-text">No evaluations found</td>
        </tr>
      `;
    }
  } catch (error) {
    console.error("Evaluations error:", error);
  }
}

// ==================== SEARCH ====================
function setupSearch() {
  var userSearchBtn = document.getElementById("searchUserBtn");

  if (userSearchBtn) {
    userSearchBtn.addEventListener("click", function() {
      userSearchQuery = document.getElementById("searchUserInput").value;
      currentUsersPage = 1;
      loadUsers();
    });
  }

  var evaluationSearchBtn = document.getElementById("searchEvaluationBtn");

  if (evaluationSearchBtn) {
    evaluationSearchBtn.addEventListener("click", function() {
      evaluationSearchQuery = document.getElementById("searchEvaluationInput").value;
      currentEvaluationsPage = 1;
      loadEvaluations();
    });
  }
}

// ==================== USER PAGINATION ====================
function setupUserPagination() {
  var prevBtn = document.getElementById("usersPrevBtn");
  var nextBtn = document.getElementById("usersNextBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", function() {
      if (currentUsersPage > 1) {
        currentUsersPage--;
        loadUsers();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function() {
      currentUsersPage++;
      loadUsers();
    });
  }
}

// ==================== EVALUATION PAGINATION ====================
function setupEvaluationPagination() {
  var prevBtn = document.getElementById("evaluationsPrevBtn");
  var nextBtn = document.getElementById("evaluationsNextBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", function() {
      if (currentEvaluationsPage > 1) {
        currentEvaluationsPage--;
        loadEvaluations();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function() {
      currentEvaluationsPage++;
      loadEvaluations();
    });
  }
}
