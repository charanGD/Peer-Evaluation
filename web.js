// ================= PASSWORD TOGGLE =================
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePassword.textContent = "⊘";
  } else {
    passwordInput.type = "password";
    togglePassword.textContent = "👁";
  }
});

// ================= DYNAMIC USER TYPE =================
const userTypeSelect = document.getElementById("userType");
const idLabel = document.getElementById("idLabel");
const userIdInput = document.getElementById("userId");
const infoText = document.getElementById("infoText");

userTypeSelect.addEventListener("change", () => {
  const userType = userTypeSelect.value;

  if (userType === "student") {
    idLabel.textContent = "Register Number";
    userIdInput.placeholder = "Enter Register Number";
    infoText.textContent =
      "Enter your Register Number and Password to access student panel.";
  } 
  else if (userType === "staff") {
    idLabel.textContent = "Staff ID";
    userIdInput.placeholder = "Enter Staff ID";
    infoText.textContent =
      "Enter your Staff ID and Password to access staff panel.";
  } 
  else if (userType === "admin") {
    idLabel.textContent = "Admin ID";
    userIdInput.placeholder = "Enter Admin ID";
    infoText.textContent =
      "Enter your Admin ID and Password to access admin panel.";
  }

  userIdInput.value = ""; // clear input when switching roles
});

// ================= FORM SUBMIT =================
const form = document.getElementById("login-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userType = userTypeSelect.value;
  const userId = userIdInput.value.trim();
  const password = passwordInput.value.trim();

  if (!userType || !userId || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userType,
        userId,
        password
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Login successful");
      // window.location.href = `${userType}-dashboard.html`;
    } else {
      alert(data.message || "Invalid credentials");
    }
  } catch (error) {
    alert("Backend not running or server error");
  }
});
