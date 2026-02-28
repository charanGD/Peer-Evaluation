<<<<<<< HEAD
=======
// const { link } = require("node:fs");
// Boolean id = false ;
// Boolean pass= false;
//git // Password toggle
>>>>>>> 20b2be1fd7fd9fa1f83f35fe53c21698fdf9ae8f
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

<<<<<<< HEAD

=======
// Submit (temporary)
<<<<<<< HEAD
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
=======
// Submit (Backend Connected)
>>>>>>> 20b2be1fd7fd9fa1f83f35fe53c21698fdf9ae8f
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const userIdValue = userId.value;
  const passwordValue = passwordInput.value;
  const roleValue = userType.value;

  try {
    const response = await fetch("http://localhost:5000/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: userIdValue,
        password: passwordValue,
        role: roleValue
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

   
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    alert("Login successful 🔥");

    
    if (data.role === "admin") {
      window.location.href = "admin.html";
    } else if (data.role === "staff") {
      window.location.href = "staff.html";
    } else {
      window.location.href = "home.html";
    }

  } catch (error) {
    console.error(error);
    alert("Server error");
  }
});
>>>>>>> main
