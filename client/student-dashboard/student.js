var BASE = "http://localhost:5000";
var API = BASE + "/api";

// ==================== PAGINATION + SEARCH ====================
var currentEvalPage = 1;
var currentSubmittedPage = 1;

var limit = 5;

var memberSearch = "";

var token = localStorage.getItem("token");
var user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user._id) {
  window.location.href = BASE + "/index.html";
}

document.getElementById("studentName").textContent =
  user.name || "Student";

document.getElementById("navUser").textContent =
  user.userId || "";

// ==================== LOGOUT ====================
document
  .getElementById("logoutBtn")
  .addEventListener("click", function () {
    localStorage.clear();

    window.location.href = BASE + "/index.html";
  });

// ==================== TAB SWITCHING ====================
var tabBtns = document.querySelectorAll(".tab-btn");

var tabContents =
  document.querySelectorAll(".tab-content");

tabBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    tabBtns.forEach(function (b) {
      b.classList.remove("active");
    });

    tabContents.forEach(function (t) {
      t.classList.remove("active-tab");
    });

    btn.classList.add("active");

    document
      .getElementById(btn.dataset.tab)
      .classList.add("active-tab");
  });
});

// ==================== API HELPERS ====================
function authHeaders() {
  return {
    "Content-Type": "application/json",

    Authorization: "Bearer " + token,
  };
}

// ==================== LOAD TEAM MEMBERS ====================
async function loadTeamMembers() {
  try {
    // Loading state
    document.getElementById("memberList").innerHTML =
      '<li class="loading-text">Loading members...</li>';

    const res = await fetch(
      API +
        "/users/team-members?search=" +
        memberSearch,
      {
        headers: authHeaders(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      document.getElementById(
        "memberList"
      ).innerHTML =
        '<li class="loading-text">' +
        (data.message || "No team assigned") +
        "</li>";

      document.getElementById(
        "teamInfo"
      ).textContent = "No team assigned yet.";

      return;
    }

    // ==================== LOAD SUBMITTED EVALUATIONS ====================
    const subRes = await fetch(
      API + "/evaluations/submitted",
      {
        headers: authHeaders(),
      }
    );

    var submittedEvals = await subRes.json();

    var evaluatedIds = submittedEvals.map(function (e) {
      return e.evaluatedUserId
        ? e.evaluatedUserId._id ||
            e.evaluatedUserId
        : "";
    });

    var teamName =
      data[0] && data[0].teamId
        ? data[0].teamId.teamName
        : "Your Team";

    document.getElementById(
      "teamInfo"
    ).textContent =
      "Team: " +
      teamName +
      " • " +
      data.length +
      " member(s)";

    var memberList =
      document.getElementById("memberList");

    memberList.innerHTML = "";

    var evaluateSelect =
      document.getElementById("evaluateSelect");

    evaluateSelect.innerHTML =
      '<option value="">— Choose a teammate —</option>';

    data.forEach(function (member) {
      var memberId = member.id || member._id;
      var userId = user.id || user._id;
      var isMe = memberId === userId;

      var isEvaluated =
        evaluatedIds.indexOf(memberId) !== -1;

      var initials = member.name
        .split(" ")
        .map(function (n) {
          return n[0];
        })
        .join("")
        .toUpperCase()
        .slice(0, 2);

      var badge = "";

      if (isMe) {
        badge =
          '<span class="you-badge">You</span>';
      } else if (isEvaluated) {
        badge =
          '<span class="evaluated-badge">✓ Evaluated</span>';
      } else {
        badge =
          '<span class="pending-badge">Pending</span>';
      }

      memberList.innerHTML +=
        "<li>" +
        '<div class="member-avatar">' +
        initials +
        "</div>" +
        '<span class="member-name">' +
        member.name +
        ' <small style="color:#999">(' +
        member.userId +
        ")</small></span>" +
        badge +
        "</li>";

      if (!isMe) {
        var disabled = isEvaluated
          ? "disabled"
          : "";

        var suffix = isEvaluated
          ? " — Already evaluated"
          : "";

        evaluateSelect.innerHTML +=
          '<option value="' +
          memberId +
          '" ' +
          disabled +
          ">" +
          member.name +
          " (" +
          member.userId +
          ")" +
          suffix +
          "</option>";
      }
    });
  } catch (error) {
    console.error("Error:", error);

    document.getElementById(
      "memberList"
    ).innerHTML =
      '<li class="loading-text">Error loading team</li>';
  }
}

// ==================== SEARCH ====================
document
  .getElementById("memberSearchBtn")
  .addEventListener("click", function () {
    memberSearch =
      document.getElementById(
        "memberSearchInput"
      ).value;

    loadTeamMembers();
  });

// ==================== SUBMIT EVALUATION ====================
document
  .getElementById("submitEvaluation")
  .addEventListener("click", async function () {
    var evaluatedUserId =
      document.getElementById(
        "evaluateSelect"
      ).value;

    var communication = parseInt(
      document.getElementById(
        "communication"
      ).value
    );

    var teamwork = parseInt(
      document.getElementById("teamwork")
        .value
    );

    var leadership = parseInt(
      document.getElementById(
        "leadership"
      ).value
    );

    var problemSolving = parseInt(
      document.getElementById(
        "problemSolving"
      ).value
    );

    var comment =
      document.getElementById("comment").value;

    if (!evaluatedUserId) {
      alert("Please select a teammate");
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
      var res = await fetch(
        API + "/evaluations/submit",
        {
          method: "POST",

          headers: authHeaders(),

          body: JSON.stringify({
            evaluatedUserId:
              evaluatedUserId,

            communication: communication,

            teamwork: teamwork,

            leadership: leadership,

            problemSolving:
              problemSolving,

            comment: comment,
          }),
        }
      );

      var data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Evaluation submitted!");

      document.getElementById(
        "evaluateSelect"
      ).value = "";

      document.getElementById(
        "comment"
      ).value = "";

      [
        "communication",
        "teamwork",
        "leadership",
        "problemSolving",
      ].forEach(function (m) {
        document.getElementById(m).value =
          "";
      });

      loadTeamMembers();

      loadMyEvaluations();

      loadSubmitted();
    } catch (error) {
      console.error(error);

      alert("Error submitting evaluation");
    }
  });

// ==================== LOAD MY EVALUATIONS ====================
async function loadMyEvaluations() {
  try {
    var res = await fetch(
      API + "/evaluations/my-evaluations",
      {
        headers: authHeaders(),
      }
    );

    var data = await res.json();

    // ==================== PEER AVERAGES ====================
    var avgGrid =
      document.getElementById("avgScores");

    if (data.totalPeerCount > 0) {
      avgGrid.innerHTML =
        '<div class="avg-card"><div class="avg-label">Communication</div><div class="avg-value">' +
        data.peerAverages.communication +
        "</div></div>" +
        '<div class="avg-card"><div class="avg-label">Teamwork</div><div class="avg-value">' +
        data.peerAverages.teamwork +
        "</div></div>" +
        '<div class="avg-card"><div class="avg-label">Leadership</div><div class="avg-value">' +
        data.peerAverages.leadership +
        "</div></div>" +
        '<div class="avg-card"><div class="avg-label">Problem Solving</div><div class="avg-value">' +
        data.peerAverages.problemSolving +
        "</div></div>" +
        '<div class="avg-card overall"><div class="avg-label">Peer Overall</div><div class="avg-value">' +
        data.peerAverages.overall +
        "</div></div>";
    } else {
      avgGrid.innerHTML =
        '<p class="loading-text" style="grid-column:1/-1">No peer evaluations received yet</p>';
    }

    // ==================== STAFF MARKS ====================
    var staffSection =
      document.getElementById(
        "staffMarksSection"
      );

    if (data.staffEvaluation) {
      var sm = data.staffEvaluation;

      staffSection.innerHTML =
        '<div class="card"><div class="card-header">Staff Evaluation — by ' +
        sm.evaluator +
        '</div><div class="card-body">' +
        '<div class="avg-grid">' +
        '<div class="avg-card"><div class="avg-label">Communication</div><div class="avg-value">' +
        sm.communication +
        "</div></div>" +
        '<div class="avg-card"><div class="avg-label">Teamwork</div><div class="avg-value">' +
        sm.teamwork +
        "</div></div>" +
        '<div class="avg-card"><div class="avg-label">Leadership</div><div class="avg-value">' +
        sm.leadership +
        "</div></div>" +
        '<div class="avg-card"><div class="avg-label">Problem Solving</div><div class="avg-value">' +
        sm.problemSolving +
        "</div></div>" +
        '<div class="avg-card overall"><div class="avg-label">Staff Overall</div><div class="avg-value">' +
        sm.overall +
        "</div></div>" +
        "</div>" +
        (sm.comment
          ? '<p style="margin-top:12px;color:#666"><b>Comment:</b> ' +
            sm.comment +
            "</p>"
          : "") +
        "</div></div>";
    } else {
      staffSection.innerHTML =
        '<div class="card"><div class="card-header">Staff Evaluation</div><div class="card-body"><p class="loading-text">Staff has not evaluated you yet</p></div></div>';
    }

    // ==================== PEER EVALUATION TABLE ====================
    var tbody =
      document.getElementById(
        "evaluationsBody"
      );

    if (data.peerEvaluations.length > 0) {
      var paginatedEvaluations =
        data.peerEvaluations.slice(
          (currentEvalPage - 1) * limit,
          currentEvalPage * limit
        );

      tbody.innerHTML =
        paginatedEvaluations
          .map(function (e) {
            return (
              "<tr>" +
              "<td>" +
              (e.evaluator
                ? e.evaluator.name
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
              "<td>" +
              (e.comment || "—") +
              "</td>" +
              "</tr>"
            );
          })
          .join("");
    } else {
      tbody.innerHTML =
        '<tr><td colspan="6" class="loading-text">No peer evaluations yet</td></tr>';
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// ==================== PEER PAGINATION ====================
document
  .getElementById("peerPrevBtn")
  .addEventListener("click", function () {
    if (currentEvalPage > 1) {
      currentEvalPage--;

      loadMyEvaluations();
    }
  });

document
  .getElementById("peerNextBtn")
  .addEventListener("click", function () {
    currentEvalPage++;

    loadMyEvaluations();
  });

// ==================== LOAD SUBMITTED ====================
async function loadSubmitted() {
  try {
    var res = await fetch(
      API + "/evaluations/submitted",
      {
        headers: authHeaders(),
      }
    );

    var data = await res.json();

    var tbody =
      document.getElementById("submittedBody");

    if (data.length > 0) {
      var paginatedSubmitted = data.slice(
        (currentSubmittedPage - 1) * limit,
        currentSubmittedPage * limit
      );

      tbody.innerHTML =
        paginatedSubmitted
          .map(function (e) {
            return (
              "<tr>" +
              "<td>" +
              (e.evaluated
                ? e.evaluated.name
                : "—") +
              "</td>" +
              "<td>" +
              e.communication +
              "</td>" +
              "<td>" +
              e.teamwork +
              "</td>" +
              "<td>" +
              e.leadership +
              "</td>" +
              "<td>" +
              e.problemSolving +
              "</td>" +
              "<td>" +
              (e.comment || "—") +
              "</td>" +
              "</tr>"
            );
          })
          .join("");
    } else {
      tbody.innerHTML =
        '<tr><td colspan="6" class="loading-text">Not submitted yet</td></tr>';
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// ==================== SUBMITTED PAGINATION ====================
document
  .getElementById("submittedPrevBtn")
  .addEventListener("click", function () {
    if (currentSubmittedPage > 1) {
      currentSubmittedPage--;

      loadSubmitted();
    }
  });

document
  .getElementById("submittedNextBtn")
  .addEventListener("click", function () {
    currentSubmittedPage++;

    loadSubmitted();
  });

// ==================== INIT ====================
loadTeamMembers();

loadMyEvaluations();

loadSubmitted();