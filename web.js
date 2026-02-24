// const { link } = require("node:fs");
// Boolean id = false ;
// Boolean pass= false;
//git // Password toggle
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const submit= document.getElementById("submit");  

submit.addEventListener("click",(e)=>{
  e.preventDefault(); // Prevent default form submission behavior
  if(validateForm()){
  window.location.href = "home.html";}
  else{
     alert("Please fill in all fields correctly."); 
     console.log("enter a crt passwrd");
  }
} );



togglePassword.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePassword.textContent = "⊘";
  } else {
    passwordInput.type = "password";
    togglePassword.textContent = "👁";
  }
});

// Role-based text change
const userType = document.getElementById("userType");
const userId = document.getElementById("userId");
const infoText = document.getElementById("infoText");

userType.addEventListener("change", () => {
  if (userType.value === "student") {
    userId.placeholder = "Enter Register Number";
    infoText.textContent =
      "Enter Register Number and Password to access student panel.";
  } else if (userType.value === "staff") {
    userId.placeholder = "Enter Staff ID";
    infoText.textContent =
      "Enter Staff ID and Password to access staff panel.";
  } else {
    userId.placeholder = "Enter Admin ID";
    infoText.textContent =
      "Enter Admin ID and Password to access admin panel.";
  }

  userId.value = "";
});

// Submit (temporary)
// document.getElementById("login-form").addEventListener("submit", (e) => {
//   e.preventDefault();
//   alert("Backend not connected");
// });



function validateForm() {
  const idval = userId.value.trim();
  const password = document.getElementById("password").value.trim();
  
  if (idval === "" || password === "") {
    alert("Please enter your ID and password.");
    return false;
  }
  if(userType.value ==="student" && idval.length !==7) {
    alert("Please enter a valid ID .");
    return false;
  }
  if(userType.value ==="staff" && idval.length< 8){
    alert("Please enter a valid ID .");
    return false;

  }
  if(userType.value ==="admin" && idval.length< 5){
    alert("Please enter a valid ID .");
    return false;
  }
  //if(userId.length < 7) {
  //   alert("Please enter a valid ID .");
  //   return false;
  // }

  return true;
}
