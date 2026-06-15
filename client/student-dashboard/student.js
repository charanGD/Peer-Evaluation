var BASE = "";
var API = BASE + "/api";

var token = localStorage.getItem("token") || "";
var user = JSON.parse(localStorage.getItem("user") || "{}");

var allMembers = [];
var submittedIds = [];

// ==================== AUTH GUARD ====================
if (!token || !user._id) {
  window.location.href = "/index.html";
}

// ==================== USER INFO ====================
var extraInfo = user.academicYear && user.semester ? " - " + user.academicYear + " (" + user.semester + " Sem)" : "";
document.getElementById("studentName").textContent = (user.name || "Student") + extraInfo;
document.getElementById("navUser").textContent = user.userId || "";

// ==================== LOGOUT ====================
document.getElementById("logoutBtn").addEventListener("click", function() {
  localStorage.clear();
  window.location.href = BASE + "/index.html";
});

// ==================== AUTH HEADERS + 401 HANDLER ====================
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

// ==================== TAB SWITCHING ====================
var tabBtns = document.querySelectorAll(".tab-btn");
var tabContents = document.querySelectorAll(".tab-content");

tabBtns.forEach(function(btn) {
  btn.addEventListener("click", function() {
    tabBtns.forEach(function(b) { b.classList.remove("active"); });
    tabContents.forEach(function(t) { t.classList.remove("active-tab"); });
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active-tab");
  });
});

// ==================== LOAD TEAM MEMBERS ====================
async function loadTeamMembers() {
  var memberList = document.getElementById("memberList");
  var evaluateSelect = document.getElementById("evaluateSelect");

  memberList.innerHTML = '<li class="loading-text">Loading team members...</li>';

  try {
    // Get team members
    var res = await apiFetch(API + "/users/team-members", { headers: authHeaders() });
    if (!res) return;
    var members = await res.json();

    if (!res.ok) {
      memberList.innerHTML = '<li class="loading-text">' + (members.message || "No team assigned") + '</li>';
      return;
    }

    allMembers = members || [];

    // Get submitted evaluations to know which members already evaluated
    var subRes = await apiFetch(API + "/evaluations/submitted", { headers: authHeaders() });
    if (!subRes) return;
    var subData = await subRes.json();
    var submitted = Array.isArray(subData) ? subData : [];
    submittedIds = submitted.map(function(e) { return String(e.evaluatedUserId); });

    // Show team info
    var teamObj = (allMembers[0] && allMembers[0].Team) ? allMembers[0].Team : null;
    var teamName = teamObj ? teamObj.teamName : "Your Team";
    var category = teamObj ? (teamObj.experientialCategory || null) : null;
    var catColors = { VIP: ["#dbeafe","#1e40af"], P2BL: ["#d1fae5","#065f46"], EPICS: ["#fce7f3","#9d174d"] };
    var catBadge = category && catColors[category]
      ? " <span style=\"background:" + catColors[category][0] + ";color:" + catColors[category][1] + ";padding:2px 9px;border-radius:10px;font-size:0.78rem;font-weight:700;vertical-align:middle;\">" + category + "</span>"
      : "";
    document.getElementById("teamInfo").innerHTML =
      "<strong>Team:</strong> " + teamName + catBadge + " &nbsp;•&nbsp; " + allMembers.length + " member(s)";

    renderMembers(allMembers);

    // Fill evaluate dropdown (exclude self)
    evaluateSelect.innerHTML = '<option value="">— Choose a teammate —</option>';
    allMembers.forEach(function(member) {
      if (String(member.id) === String(user.id)) return; // skip self
      var alreadyDone = submittedIds.indexOf(String(member.id)) !== -1;
      evaluateSelect.innerHTML +=
        '<option value="' + member.id + '"' + (alreadyDone ? " disabled" : "") + ">" +
        member.name + " (" + member.userId + ")" +
        (alreadyDone ? " — ✓ Done" : "") + "</option>";
    });

  } catch (err) {
    memberList.innerHTML = '<li class="loading-text">Error loading team</li>';
    console.error(err);
  }
}

function renderMembers(members) {
  var memberList = document.getElementById("memberList");
  memberList.innerHTML = "";

  if (members.length === 0) {
    memberList.innerHTML = '<li class="loading-text">No teammates found</li>';
    return;
  }

  members.forEach(function(member) {
    var initials = member.name.split(" ").map(function(n) { return n[0]; }).join("").toUpperCase().slice(0, 2);
    var alreadyDone = submittedIds.indexOf(String(member.id)) !== -1;
    var badge = alreadyDone
      ? '<span class="evaluated-badge">✓ Evaluated</span>'
      : '<span class="pending-badge">Pending</span>';

    memberList.innerHTML +=
      "<li>" +
      '<div class="member-avatar">' + initials + "</div>" +
      '<span class="member-name">' + member.name +
      ' <small style="color:#999">(' + member.userId + ")</small></span>" +
      badge + "</li>";
  });
}

// ==================== SEARCH ====================
document.getElementById("memberSearchBtn").addEventListener("click", function() {
  var search = document.getElementById("memberSearchInput").value.toLowerCase();
  var filtered = allMembers.filter(function(m) {
    return m.name.toLowerCase().includes(search) || m.userId.toLowerCase().includes(search);
  });
  renderMembers(filtered);
});

// ==================== SUBMIT EVALUATION ====================
document.getElementById("submitEvaluation").addEventListener("click", async function() {
  var evaluatedUserId = document.getElementById("evaluateSelect").value;
  var communication = parseInt(document.getElementById("communication").value);
  var teamwork = parseInt(document.getElementById("teamwork").value);
  var leadership = parseInt(document.getElementById("leadership").value);
  var problemSolving = parseInt(document.getElementById("problemSolving").value);
  var professionalism = parseInt(document.getElementById("professionalism").value);
  var comment = document.getElementById("comment").value;

  if (!evaluatedUserId) return alert("Please select a teammate");

  if (isNaN(communication) || isNaN(teamwork) || isNaN(leadership) || isNaN(problemSolving) || isNaN(professionalism)) {
    return alert("Please enter all marks");
  }

  if (communication > 20 || teamwork > 20 || leadership > 25 || problemSolving > 10 || professionalism > 25) {
    return alert("Entered marks exceed maximum limit");
  }

  try {
    var res = await apiFetch(API + "/evaluations/submit", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ evaluatedUserId, communication, teamwork, leadership, problemSolving, professionalism, comment })
    });
    var data = await res.json();
    if (!res.ok) return alert(data.message || "Submission failed");

    alert("Evaluation submitted!");

    document.getElementById("evaluateSelect").value = "";
    document.getElementById("comment").value = "";
    ["communication","teamwork","leadership","problemSolving","professionalism"].forEach(function(id) {
      document.getElementById(id).value = "";
    });

    loadTeamMembers();
    loadMyScores();
    loadSubmitted();

  } catch (err) {
    alert("Network error: " + err.message);
  }
});

// ==================== LOAD MY SCORES ====================
async function loadMyScores() {
  var avgGrid = document.getElementById("avgScores");

  avgGrid.innerHTML = '<p class="loading-text">Loading...</p>';

  try {
    var res = await apiFetch(API + "/evaluations/my-evaluations", { headers: authHeaders() });
    if (!res) return;
    var data = await res.json();

    if (!res.ok) {
      avgGrid.innerHTML = '<p class="loading-text">' + (data.message || "Error") + '</p>';
      return;
    }

    var evals = data.peerEvaluations || [];

    if (evals.length === 0) {
      avgGrid.innerHTML = '<p class="loading-text">No evaluations received yet</p>';
      return;
    }

    var pa = data.peerAverages || {};

    avgGrid.innerHTML =
      '<div class="avg-card"><div class="avg-label">Participation in Team Meetings / Class</div><div class="avg-value">' + (pa.communication || 0) + "</div></div>" +
      '<div class="avg-card"><div class="avg-label">Responsiveness & Initiative</div><div class="avg-value">' + (pa.teamwork || 0) + "</div></div>" +
      '<div class="avg-card"><div class="avg-label">Independent Learning & Technical Growth</div><div class="avg-value">' + (pa.leadership || 0) + "</div></div>" +
      '<div class="avg-card"><div class="avg-label">Team Management & Collaboration Ability</div><div class="avg-value">' + (pa.problemSolving || 0) + "</div></div>" +
      '<div class="avg-card overall"><div class="avg-label">Peer Overall</div><div class="avg-value">' + (pa.overall || 0) + "</div></div>";

    // Mentor mark
    var staffEval = data.staffEvaluation;
    var mentorMark = staffEval ? staffEval.overall : null;

  } catch (err) {
    avgGrid.innerHTML = '<p class="loading-text">Error loading scores</p>';
    console.error(err);
  }
}

// ==================== LOAD SUBMITTED ====================
async function loadSubmitted() {
  var tbody = document.getElementById("submittedBody");
  tbody.innerHTML = '<tr><td colspan="8" class="loading-text">Loading...</td></tr>';

  try {
    var res = await apiFetch(API + "/evaluations/submitted", { headers: authHeaders() });
    if (!res) return;
    var data = await res.json();

    var evals = Array.isArray(data) ? data : (data.evaluations || []);

    if (evals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-text">No submissions yet</td></tr>';
      return;
    }

    tbody.innerHTML = evals.map(function(e) {
      return "<tr>" +
        "<td>" + (e.evaluated ? e.evaluated.userId : "—") + "</td>" +
        "<td>" + (e.evaluated ? e.evaluated.name : "—") + "</td>" +
        "<td><span class='score-badge'>" + e.communication + "</span></td>" +
        "<td><span class='score-badge'>" + e.teamwork + "</span></td>" +
        "<td><span class='score-badge'>" + e.leadership + "</span></td>" +
        "<td><span class='score-badge'>" + e.problemSolving + "</span></td>" +
        "<td><span class='score-badge'>" + (e.professionalism || 0) + "</span></td>" +
        "<td>" + (e.comment || "—") + "</td>" +
        "</tr>";
    }).join("");

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" class="loading-text">Error loading</td></tr>';
    console.error(err);
  }
}

// ==================== INIT ====================
loadTeamMembers();
loadMyScores();
loadSubmitted();