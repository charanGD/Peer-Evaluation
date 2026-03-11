const role = localStorage.getItem("role");

const studentSection = document.getElementById("studentSection");
const staffSection = document.getElementById("staffSection");
const adminSection = document.getElementById("adminSection");

if(role === "student"){
studentSection.style.display="block";
}

else if(role === "staff"){
staffSection.style.display="block";
}

else if(role === "admin"){
adminSection.style.display="block";
}


// logout
document.getElementById("logout").addEventListener("click",()=>{
localStorage.clear();
window.location.href="index.html";
});