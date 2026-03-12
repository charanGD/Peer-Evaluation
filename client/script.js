var BASE = window.location.origin;
var API = BASE + "/api";

// Force redirect to localhost:5000 if opened as file://
if (window.location.protocol === "file:") {
  window.location.href = BASE + "/index.html";
}

var togglePassword = document.getElementById("togglePassword");
var passwordInput = document.getElementById("password");
var userType = document.getElementById("userType");
var userIdInput = document.getElementById("userId");
var infoText = document.getElementById("infoText");

// Toggle password
togglePassword.addEventListener("click", function() {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePassword.textContent = "⊘";
  } else {
    passwordInput.type = "password";
    togglePassword.textContent = "👁";
  }
});

// Role-based text change
userType.addEventListener("change", function() {
  if (userType.value === "student") {
    userIdInput.placeholder = "Enter Register Number";
    infoText.textContent = "Enter Register Number and Password to access student panel.";
  } else if (userType.value === "staff") {
    userIdInput.placeholder = "Enter Staff ID";
    infoText.textContent = "Enter Staff ID and Password to access staff panel.";
  } else {
    userIdInput.placeholder = "Enter Admin ID";
    infoText.textContent = "Enter Admin ID and Password to access admin panel.";
  }
  userIdInput.value = "";
});

// Login Submit
document.getElementById("login-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  try {
    var response = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userIdInput.value,
        password: passwordInput.value,
        role: userType.value
      })
    });

    var data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("user", JSON.stringify(data.user));

    alert("Login successful");

    if (data.role === "admin") {
      window.location.href = BASE + "/admin-dashbaord/admin.html";
    } else if (data.role === "staff") {
      window.location.href = BASE + "/mentor-dashboard/dashboard.html";
    } else {
      window.location.href = BASE + "/student-dashboard/dashboard.html";
    }

  } catch (error) {
    console.error(error);
    alert("Server error - make sure server is running on port 5000");
  }
});
