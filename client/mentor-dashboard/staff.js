var BASE = "https://peer-evaluation-api.onrender.com"; 
var API = BASE + "/api";

var token = localStorage.getItem("token") || "";
var user = JSON.parse(localStorage.getItem("user") || "{}");

var currentStudentPage = 1;
var currentPeerPage = 1;
var limit = 5;
var studentSearch = "";
var currentStudents = [];

// ===========================
// AUTH GUARD — redirect if not logged in
// ===========================
if (!token || !user._id) {
  window.location.href = "/index.html";
}

// ===========================
// NAV USER
// ===========================
document.getElementById("navUser").textContent = user.name + " (" + (user.userId || "") + ")";

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
// LOAD STUDENTS
// ===========================
async function loadStudents() {
  try {
    document.getElementById("studentsTableBody").innerHTML =
      '<tr><td colspan="5" class="loading-text">Loading students...</td></tr>';

    var res = await apiFetch(
      API + "/staff/my-students?page=" + currentStudentPage + "&limit=" + limit + "&search=" + studentSearch,
      { headers: authHeaders() }
    );
    if (!res) return;
    var data = await res.json();

    if (!res.ok) {
      document.getElementById("teamInfo").textContent = data.message || "No team assigned";
      document.getElementById("studentsTableBody").innerHTML =
        '<tr><td colspan="5" class="loading-text">' + (data.message || "No team") + '</td></tr>';
      return;
    }

    document.getElementById("teamInfo").textContent =
      "Team: " + data.team.teamName + " • " + data.students.length + " student(s)";

    currentStudents = data.students || [];

    // Students Table
    var tbody = document.getElementById("studentsTableBody");
    if (data.students.length > 0) {
      tbody.innerHTML = data.students.map(function(s) {
        var staffMark = s.staffMarks && s.staffMarks.avg ? Number(s.staffMarks.avg).toFixed(1) : "—";
        var status = s.staffEvaluated
          ? '<span class="evaluated-badge">✓ Marked</span>'
          : '<span class="pending-badge">Pending</span>';
        return "<tr>" +
          "<td>" + s.name + "</td>" +
          "<td>" + s.userId + "</td>" +
          "<td><span class='score-badge'>" + s.peerAvg + "</span></td>" +
          "<td><span class='score-badge'>" + staffMark + "</span></td>" +
          "<td>" + status + "</td>" +
          "</tr>";
      }).join("");
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="loading-text">No students found</td></tr>';
    }

    // Evaluate Dropdown
    var evalSelect = document.getElementById("evalStudentSelect");
    evalSelect.innerHTML = '<option value="">— Select Student —</option>';
    data.students.forEach(function(s) {
      var disabled = s.staffEvaluated ? "disabled" : "";
      var suffix = s.staffEvaluated ? " — Already marked" : "";
      evalSelect.innerHTML += '<option value="' + s._id + '" ' + disabled + '>' +
        s.name + ' (' + s.userId + ')' + suffix + '</option>';
    });

    // Peer Matrix
    var peerEvals = (data.evaluationMatrix || []).filter(function(e) { return !e.isStaffEvaluation; });
    var matrixBody = document.getElementById("peerMatrixBody");
    var paged = peerEvals.slice((currentPeerPage - 1) * limit, currentPeerPage * limit);

    if (paged.length > 0) {
      matrixBody.innerHTML = paged.map(function(e) {
        var avg = ((e.communication + e.teamwork + e.leadership + e.problemSolving + (e.professionalism || 0)) / 5).toFixed(1);
        return "<tr>" +
          "<td>" + (e.evaluator ? e.evaluator.name : "—") + "</td>" +
          "<td>" + (e.evaluated ? e.evaluated.name : "—") + "</td>" +
          "<td><span class='score-badge'>" + e.communication + "</span></td>" +
          "<td><span class='score-badge'>" + e.teamwork + "</span></td>" +
          "<td><span class='score-badge'>" + e.leadership + "</span></td>" +
          "<td><span class='score-badge'>" + e.problemSolving + "</span></td>" +
          "<td><span class='score-badge'>" + (e.professionalism || 0) + "</span></td>" +
          "<td><strong>" + avg + "</strong></td>" +
          "<td>" + (e.comment || "—") + "</td>" +
          "</tr>";
      }).join("");
    } else {
      matrixBody.innerHTML = '<tr><td colspan="9" class="loading-text">No peer evaluations yet</td></tr>';
    }

    // Final Evaluation Table
    var finalBody = document.getElementById("finalEvaluationBody");
    if (data.students.length > 0) {
      finalBody.innerHTML = data.students.map(function(s) {
        var peerScore = s.peerAvg ? parseFloat(s.peerAvg) : 0;
        var mentorScore = s.staffMarks && s.staffMarks.avg ? parseFloat(s.staffMarks.avg) : 0;
        var total = (peerScore + mentorScore).toFixed(1);
        return "<tr>" +
          "<td>" + s.name + " (" + s.userId + ")</td>" +
          "<td><span class='score-badge'>" + peerScore.toFixed(1) + "</span></td>" +
          "<td><span class='score-badge'>" + (mentorScore > 0 ? mentorScore.toFixed(1) : "—") + "</span></td>" +
          "<td><strong>" + (mentorScore > 0 ? total : "—") + "</strong></td>" +
          "</tr>";
      }).join("");
    } else {
      finalBody.innerHTML = '<tr><td colspan="4" class="loading-text">No data yet</td></tr>';
    }

  } catch (err) {
    console.error("Load error:", err);
    document.getElementById("teamInfo").textContent = "Error loading data";
  }
}

// ===========================
// SEARCH
// ===========================
document.getElementById("studentSearchBtn").addEventListener("click", function() {
  studentSearch = document.getElementById("studentSearchInput").value;
  currentStudentPage = 1;
  loadStudents();
});

// ===========================
// STUDENT PAGINATION
// ===========================
document.getElementById("studentPrevBtn").addEventListener("click", function() {
  if (currentStudentPage > 1) { currentStudentPage--; loadStudents(); }
});
document.getElementById("studentNextBtn").addEventListener("click", function() {
  currentStudentPage++; loadStudents();
});

// ===========================
// PEER PAGINATION
// ===========================
document.getElementById("peerPrevBtn").addEventListener("click", function() {
  if (currentPeerPage > 1) { currentPeerPage--; loadStudents(); }
});
document.getElementById("peerNextBtn").addEventListener("click", function() {
  currentPeerPage++; loadStudents();
});

// ===========================
// SUBMIT STAFF EVALUATION
// ===========================
document.getElementById("submitEvaluation").addEventListener("click", async function() {
  var evaluatedUserId = document.getElementById("evalStudentSelect").value;
  var communication = parseInt(document.getElementById("communication").value);
  var teamwork = parseInt(document.getElementById("teamwork").value);
  var leadership = parseInt(document.getElementById("leadership").value);
  var problemSolving = parseInt(document.getElementById("problemSolving").value);
  var professionalism = parseInt(document.getElementById("professionalism").value);
  var comment = document.getElementById("comment").value;

  if (!evaluatedUserId) return alert("Select a student");
  if (isNaN(communication) || isNaN(teamwork) || isNaN(leadership) || isNaN(problemSolving) || isNaN(professionalism)) {
    return alert("Please fill in all criteria");
  }

  try {
    var res = await apiFetch(API + "/staff/evaluate", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ evaluatedUserId, communication, teamwork, leadership, problemSolving, professionalism, comment })
    });
    var data = await res.json();
    if (!res.ok) return alert(data.message);
    alert("Marks Submitted Successfully!");
    document.getElementById("evalStudentSelect").value = "";
    document.getElementById("comment").value = "";
    ["communication","teamwork","leadership","problemSolving","professionalism"].forEach(function(id) {
      document.getElementById(id).value = "";
    });
    loadStudents();
  } catch (err) {
    alert("Error submitting marks");
  }
});

// ===========================
// SAVE FINAL MARKS
// ===========================
var saveFinalMarksBtn = document.getElementById("saveFinalMarksBtn");
if (saveFinalMarksBtn) {
  saveFinalMarksBtn.addEventListener("click", async function() {
    if (currentStudents.length === 0) return alert("No students to save.");
    if (!confirm("Save final marks permanently?")) return;

    var marksPayload = currentStudents.map(function(s) {
      var mentorMark = s.staffMarks && s.staffMarks.avg ? Number(s.staffMarks.avg) : 0;
      var peerAverage = s.peerAvg ? Number(s.peerAvg) : 0;
      var finalTotal = parseFloat(((peerAverage + mentorMark)).toFixed(2));
      return { name: s.name, reg: s.userId, peerAverage, mentorMark, finalTotal };
    });

    try {
      var res = await apiFetch(API + "/staff/finalMarks", {
        method: "POST", headers: authHeaders(), body: JSON.stringify(marksPayload)
      });
      var data = await res.json();
      if (!res.ok) return alert(data.error || data.message || "Failed");
      alert("Final marks saved successfully!");
    } catch (err) {
      alert("Error saving final marks");
    }
  });
}

// ===========================
// DOWNLOAD PEER EXCEL
// ===========================
document.getElementById("downloadPeerExcel").addEventListener("click", function() {
  var rows = [["Evaluator","Evaluatee","Participation","Responsibility","Learning Growth","Collaboration","Professionalism","Avg","Comment"]];
  (document.querySelectorAll("#peerMatrixBody tr")).forEach(function(row) {
    var cells = Array.from(row.cells).map(function(c) { return c.innerText.trim(); });
    if (cells.length > 1) rows.push(cells);
  });
  downloadCSV("peer_matrix.csv", rows);
});

// ===========================
// DOWNLOAD FINAL EXCEL
// ===========================
document.getElementById("downloadFinalExcel").addEventListener("click", function() {
  var rows = [["Student","Peer Evaluation (100)","Mentor Mark (100)","Total Marks (200)"]];
  (document.querySelectorAll("#finalEvaluationBody tr")).forEach(function(row) {
    var cells = Array.from(row.cells).map(function(c) { return c.innerText.trim(); });
    if (cells.length > 1) rows.push(cells);
  });
  downloadCSV("final_evaluation.csv", rows);
});

// ===========================
// CSV HELPER
// ===========================
function downloadCSV(filename, rows) {
  var csv = rows.map(function(r) {
    return r.map(function(c) {
      var v = String(c == null ? "" : c);
      return (v.includes(",") || v.includes('"') || v.includes("\n")) ? '"' + v.replace(/"/g,'""') + '"' : v;
    }).join(",");
  }).join("\n");
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ===========================
// INIT
// ===========================
loadStudents();