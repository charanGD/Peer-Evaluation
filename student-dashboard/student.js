// auto total calculation

const rows = document.querySelectorAll("table tr");

rows.forEach(row => {

const inputs = row.querySelectorAll(".mark");

inputs.forEach(input => {

input.addEventListener("input",()=>{

let total = 0;

inputs.forEach(i=>{
total += Number(i.value) || 0;
});

const totalCell = row.querySelector(".total");

if(totalCell){
totalCell.textContent = total;
}

});

});

});


// placeholder for backend save

document.querySelector(".submit-btn").addEventListener("click",()=>{

const marksData = [];

document.querySelectorAll("table tr").forEach(row=>{

const name = row.cells[0]?.textContent;

const inputs = row.querySelectorAll(".mark");

if(inputs.length){

marksData.push({
name,
c1:inputs[0].value,
c2:inputs[1].value,
c3:inputs[2].value
});

}

});

console.log("Send to backend:",marksData);

// future API call here
// fetch("/api/evaluation",...)

alert("Evaluation ready to submit (backend pending)");

});