const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".tabPage");

tabs.forEach(tab => {

tab.addEventListener("click", () => {

const target = tab.dataset.tab;

tabs.forEach(t => t.classList.remove("active"));
pages.forEach(p => p.classList.remove("activePage"));

tab.classList.add("active");
document.getElementById(target).classList.add("activePage");

});

});