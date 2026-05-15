var BASE = "http://localhost:5000";
var API = BASE + "/api";

// ==================== PAGINATION + SEARCH ====================
var currentStudentPage = 1;
var currentPeerPage = 1;

var limit = 5;

var studentSearch = "";
var currentStudents = [];

var token = localStorage.getItem("token");
var user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || user.role !== "staff") {
  alert("Staff access only! Please login first.");
  window.location.href = BASE + "/index.html";
}

document.getElementById("navUser").textContent =
  user.name + " (" + user.userId + ")";

// ==================== LOGOUT ====================
document
  .getElementById("logoutBtn")
  .addEventListener("click", function () {
    localStorage.clear();
    window.location.href = BASE + "/index.html";
  });

// ==================== AUTH HEADERS ====================
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
}

// ==================== TAB SWITCHING ====================
var tabs = document.querySelectorAll(".tab");
var pages = document.querySelectorAll(".tabPage");

tabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    var target = tab.getAttribute("data-target");

    tabs.forEach(function (t) {
      t.classList.remove("active");
    });

    tab.classList.add("active");

    pages.forEach(function (page) {
      page.classList.remove("activePage");

      if (page.id === target) {
        page.classList.add("activePage");
      }
    });
  });
});

// ==================== LOAD STUDENTS ====================
async function loadStudents() {
  try {
    // Loading state
    document.getElementById("studentsTableBody").innerHTML =
      '<tr><td colspan="5" class="loading-text">Loading students...</td></tr>';

    var res = await fetch(
      API +
        "/staff/my-students?page=" +
        currentStudentPage +
        "&limit=" +
        limit +
        "&search=" +
        studentSearch,
      {
        headers: authHeaders(),
      }
    );

    var data = await res.json();

    if (!res.ok) {
      document.getElementById("teamInfo").textContent =
        data.message || "No team assigned";

      document.getElementById("studentsTableBody").innerHTML =
        '<tr><td colspan="5" class="loading-text">' +
        (data.message || "No team") +
        "</td></tr>";

      return;
    }

    document.getElementById("teamInfo").textContent =
      "Team: " +
      data.team.teamName +
      " • " +
      data.students.length +
      " student(s)";

    // ==================== STUDENTS TABLE ====================
    var tbody = document.getElementById("studentsTableBody");
    currentStudents = data.students || [];

    if (data.students.length > 0) {
      tbody.innerHTML = data.students
        .map(function (s) {
          var staffMark =
            s.staffMarks && s.staffMarks.avg
              ? Number(s.staffMarks.avg).toFixed(1)
              : "—";

          var status = s.staffEvaluated
            ? '<span class="evaluated-badge">✓ Marked</span>'
            : '<span class="pending-badge">Pending</span>';

          return (
            "<tr>" +
            "<td><strong>" +
            s.name +
            "</strong></td>" +
            "<td>" +
            s.userId +
            "</td>" +
            "<td><span class='score-badge'>" +
            s.peerAvg +
            "</span> <small>(" +
            s.peerCount +
            " evals)</small></td>" +
            "<td><span class='score-badge'>" +
            staffMark +
            "</span></td>" +
            "<td>" +
            status +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    } else {
      tbody.innerHTML =
        '<tr><td colspan="5" class="loading-text">No students found</td></tr>';
    }

    // ==================== EVALUATE DROPDOWN ====================
    var evalSelect = document.getElementById("evalStudentSelect");

    evalSelect.innerHTML =
      '<option value="">— Select Student —</option>';

    data.students.forEach(function (s) {
      var disabled = s.staffEvaluated ? "disabled" : "";

      var suffix = s.staffEvaluated
        ? " — Already marked"
        : "";

      evalSelect.innerHTML +=
        '<option value="' +
        s._id +
        '" ' +
        disabled +
        ">" +
        s.name +
        " (" +
        s.userId +
        ")" +
        suffix +
        "</option>";
    });

    // ==================== PEER MATRIX ====================
    var matrixBody = document.getElementById("peerMatrixBody");

    var peerEvals = data.evaluationMatrix
      .filter(function (e) {
        return !e.isStaffEvaluation;
      })
      .slice(
        (currentPeerPage - 1) * limit,
        currentPeerPage * limit
      );

    if (peerEvals.length > 0) {
      matrixBody.innerHTML = peerEvals
        .map(function (e) {
          var avg = (
            (e.communication +
              e.teamwork +
              e.leadership +
              e.problemSolving) /
            4
          ).toFixed(1);

          return (
            "<tr>" +
            "<td>" +
            (e.evaluatorId
              ? e.evaluatorId.name
              : "—") +
            "</td>" +
            "<td>" +
            (e.evaluatedUserId
              ? e.evaluatedUserId.name
              : "—") +
            "</td>" +
            "<td><span class='score-badge'>" +
            e.communication +
            "</span></td>" +
            "<td><span class='score-badge'>" +
            e.teamwork +
            "</span></td>" +
            "<td><span class='score-badge'>" +
            e.leadership +
            "</span></td>" +
            "<td><span class='score-badge'>" +
            e.problemSolving +
            "</span></td>" +
            "<td><strong>" +
            avg +
            "</strong></td>" +
            "<td>" +
            (e.comment || "—") +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    } else {
      matrixBody.innerHTML =
        '<tr><td colspan="8" class="loading-text">No peer evaluations yet</td></tr>';
    }
  } catch (error) {
    console.error("Error:", error);

    document.getElementById("teamInfo").textContent =
      "Error loading data";
  }
}

// ==================== SEARCH ====================
document
  .getElementById("studentSearchBtn")
  .addEventListener("click", function () {
    studentSearch =
      document.getElementById("studentSearchInput").value;

    currentStudentPage = 1;

    loadStudents();
  });

// ==================== STUDENT PAGINATION ====================
document
  .getElementById("studentPrevBtn")
  .addEventListener("click", function () {
    if (currentStudentPage > 1) {
      currentStudentPage--;

      loadStudents();
    }
  });

document
  .getElementById("studentNextBtn")
  .addEventListener("click", function () {
    currentStudentPage++;

    loadStudents();
  });

// ==================== PEER PAGINATION ====================
document
  .getElementById("peerPrevBtn")
  .addEventListener("click", function () {
    if (currentPeerPage > 1) {
      currentPeerPage--;

      loadStudents();
    }
  });

document
  .getElementById("peerNextBtn")
  .addEventListener("click", function () {
    currentPeerPage++;

    loadStudents();
  });

// ==================== SUBMIT STAFF EVALUATION ====================
document
  .getElementById("submitEvaluation")
  .addEventListener("click", async function () {
    var evaluatedUserId =
      document.getElementById("evalStudentSelect").value;

    var communication = parseInt(
      document.getElementById("communication").value
    );

    var teamwork = parseInt(
      document.getElementById("teamwork").value
    );

    var leadership = parseInt(
      document.getElementById("leadership").value
    );

    var problemSolving = parseInt(
      document.getElementById("problemSolving").value
    );

    var comment =
      document.getElementById("comment").value;

    if (!evaluatedUserId) {
      alert("Select a student");
      return;
    }

    if (
      communication < 1 ||
      teamwork < 1 ||
      leadership < 1 ||
      problemSolving < 1
    ) {
      alert("Please rate all 4 criteria");
      return;
    }

    try {
      var res = await fetch(API + "/staff/evaluate", {
        method: "POST",

        headers: authHeaders(),

        body: JSON.stringify({
          evaluatedUserId: evaluatedUserId,

          communication: communication,

          teamwork: teamwork,

          leadership: leadership,

          problemSolving: problemSolving,

          comment: comment,
        }),
      });

      var data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Marks submitted!");

      // Reset form
      document.getElementById(
        "evalStudentSelect"
      ).value = "";

      document.getElementById("comment").value = "";

      [
        "communication",
        "teamwork",
        "leadership",
        "problemSolving",
      ].forEach(function (m) {
        document.getElementById(m).value = "";
      });

      loadStudents();
    } catch (error) {
      console.error(error);

      alert("Error submitting marks");
    }
  });

// ==================== SAVE FINAL MARKS ====================
var saveFinalMarksBtn = document.getElementById("saveFinalMarksBtn");
if (saveFinalMarksBtn) {
  saveFinalMarksBtn.addEventListener("click", async function() {
    if (currentStudents.length === 0) return alert("No students to save.");
    
    var confirmSave = confirm("Are you sure you want to permanently save final marks? This will push all current averages to the database.");
    if (!confirmSave) return;

    var marksPayload = currentStudents.map(function(s) {
      var mentorMark = s.staffMarks && s.staffMarks.avg ? Number(s.staffMarks.avg) : 0;
      var peerAverage = s.peerAvg ? Number(s.peerAvg) : 0;
      var finalTotal = parseFloat(((peerAverage + mentorMark) / 2).toFixed(2));
      return {
        name: s.name,
        reg: s.userId,
        peerAverage: peerAverage,
        mentorMark: mentorMark,
        finalTotal: finalTotal
      };
    });

    try {
      var res = await fetch(API + "/staff/finalMarks", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(marksPayload)
      });
      
      var data = await res.json();
      if (!res.ok) {
        alert(data.error || data.message || "Failed to save marks");
        return;
      }
      
      alert("Final marks successfully saved to the database!");
    } catch (err) {
      console.error(err);
      alert("Error saving final marks");
    }
  });
}

// ==================== INIT ====================
loadStudents();