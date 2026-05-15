var BASE = "http://localhost:5000";
var API = BASE + "/api";

// DOWNLOAD EXCEL BUTTONS

document
  .getElementById("downloadEvaluationsExcel")
  ?.addEventListener("click", function () {

    window.open(
      API + "/admin/export/evaluations",
      "_blank"
    );

  });

document
  .getElementById("downloadLeaderboardExcel")
  ?.addEventListener("click", function () {

    window.open(
      API + "/admin/export/leaderboard",
      "_blank"
    );

  });

document
  .getElementById("downloadTeamsExcel")
  ?.addEventListener("click", function () {

    window.open(
      API + "/admin/export/teams",
      "_blank"
    );

  });

// UPDATED AVG CALCULATION

function calculateAverage(e) {

  return (
    (
      e.communication +
      e.teamwork +
      e.leadership +
      e.problemSolving +
      e.professionalism
    ) / 5
  ).toFixed(1);

}