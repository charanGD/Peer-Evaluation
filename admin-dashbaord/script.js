const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".tabPage");

tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    // remove active class from all tabs
    tabs.forEach((b) => b.classList.remove("active"));

    // hide all pages
    pages.forEach((p) => p.classList.remove("activePage"));

    // activate clicked tab
    btn.classList.add("active");

    // show corresponding page
    const id = btn.getAttribute("data-tab");
    document.getElementById(id).classList.add("activePage");
  });
});

// download button demo (frontend only)
const downloadBtn = document.querySelector(".downloadBtn");
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    alert("Frontend only: Excel report download will be integrated with backend later.");
  });
}
