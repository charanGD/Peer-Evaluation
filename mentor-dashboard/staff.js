// logout

document.getElementById("logout").onclick = () => {
  localStorage.clear();
  window.location.href = "index.html";
};



// tab switching

function showTab(tab) {

  let matrix = document.getElementById("matrix-section");
  let final = document.getElementById("final-section");

  let tabs = document.querySelectorAll(".tab");

  tabs.forEach(t => t.classList.remove("active"));

  if (tab === "matrix") {

    matrix.style.display = "block";
    final.style.display = "none";

    tabs[0].classList.add("active");

  } else {

    matrix.style.display = "none";
    final.style.display = "block";

    tabs[1].classList.add("active");

  }

}



/* BACKEND SPACE */

function loadMatrix(){

// future backend call
// fetch("/api/staff/matrix")
// .then(res=>res.json())
// .then(data=>{
// render matrix
// })

}



/* SUBMIT MENTOR MARKS */
function submitMentorMarks(){

const rows = document.querySelectorAll("#finalTable tr");

let data = [];

rows.forEach((row, index) => {

if(index === 0) return; // skip header

const name = row.cells[0].innerText;
const reg = row.cells[1].innerText;

const peerAvg = parseFloat(row.cells[2].innerText);

const mentorInput = row.querySelector(".mentor-input");

const mentorMark = parseFloat(mentorInput.value) || 0;

const total = peerAvg + mentorMark;

// update UI total
row.cells[4].innerHTML = `<span class="final-score">${total}</span>`;

data.push({
name,
reg,
peerAverage: peerAvg,
mentorMark: mentorMark,
finalTotal: total
});

});

console.log("Sending:",data);

// send to backend

fetch("http://localhost:5000/api/staff/finalMarks",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(data)

})
.then(res=>res.json())
.then(res=>{
alert("Marks saved successfully");
})
.catch(err=>{
console.error(err);
});

}