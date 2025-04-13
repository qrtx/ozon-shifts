
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let allData = {};
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

function markShift() {
  const employee = document.getElementById("employee").value;
  const point = document.getElementById("point").value;
  const date = new Date().toISOString().split("T")[0];
  db.ref("shifts").push({ date, employee, point });
}

function changeMonth(offset) {
  currentMonth += offset;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
}

function removeEntry(id) {
  if (confirm("Удалить эту смену?")) db.ref("shifts/" + id).remove();
}

function renderCalendar() {
  const container = document.getElementById("calendar");
  const now = new Date();
  const isToday = (y, m, d) => y === now.getFullYear() && m === now.getMonth() && d === now.getDate();
  const year = currentYear, month = currentMonth;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const daysInMonth = last.getDate();

  let html = "<div style='margin-bottom:10px; display:flex; justify-content:space-between; align-items:center'>"
    + "<button onclick='changeMonth(-1)'>&lt; Назад</button>"
    + `<strong>${first.toLocaleString('ru-RU', { month: 'long' })} ${year}</strong>`
    + "<button onclick='changeMonth(1)'>Вперёд &gt;</button></div><div class='grid'>";

  const weekDay = first.getDay() || 7;
  html += "<div></div>".repeat(weekDay - 1);

  for (let d = 1; d <= daysInMonth; d++) {
    const day = `${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
    const shifts = Object.entries(allData).filter(([id, x]) => x.date === day);
    const todayClass = isToday(year, month, d) ? "today" : "";
    let inner = `<strong>${d}</strong><br>`;
    inner += shifts.map(([id, x]) => `${x.employee}<span class='remove-btn' onclick='removeEntry("${id}")'>×</span>`).join("<br>");
    html += `<div class='day-cell ${todayClass}'>${inner}</div>`;
  }

  html += "</div>";
  container.innerHTML = html;
}

db.ref("shifts").on("value", snap => {
  allData = snap.val() || {};
  renderCalendar();
});

window.onload = renderCalendar;


let isAdmin = false;
let employees = [];
let points = {};

function toggleAdminLogin() {
  const login = prompt("Введите логин:");
  const pass = prompt("Введите пароль:");
  if (login === "qwertyxyry" && pass === "Qrtx1234") {
    isAdmin = true;
    localStorage.setItem("ozon_is_admin", "true");
    document.getElementById("adminPanel").style.display = "block";
  }
}

function checkAdmin() {
  isAdmin = localStorage.getItem("ozon_is_admin") === "true";
  if (isAdmin && document.getElementById("adminPanel")) {
    document.getElementById("adminPanel").style.display = "block";
  }
}

function removeEntry(id) {
  if (!isAdmin) return alert("Удаление только для админа!");
  if (confirm("Удалить смену?")) db.ref("shifts/" + id).remove();
}

// EMPLOYEES
function addEmployee() {
  const name = document.getElementById("newEmp").value.trim();
  if (!name) return;
  db.ref("employees").push(name);
}

function deleteEmployee() {
  const name = document.getElementById("deleteEmp").value;
  db.ref("employees").once("value", snap => {
    snap.forEach(child => {
      if (child.val() === name) db.ref("employees/" + child.key).remove();
    });
  });
}

// POINTS
function addPoint() {
  const name = document.getElementById("newPoint").value.trim();
  const rate = parseInt(document.getElementById("newRate").value.trim());
  if (!name || !rate) return;
  db.ref("points/" + name).set(rate);
}

function deletePoint() {
  const name = document.getElementById("deletePoint").value;
  db.ref("points/" + name).remove();
}

// LOAD DATA
function loadEmployeesAndPoints() {
  db.ref("employees").on("value", snap => {
    employees = [];
    const sel = document.getElementById("employee");
    const del = document.getElementById("deleteEmp");
    sel.innerHTML = del.innerHTML = "";
    snap.forEach(child => {
      employees.push(child.val());
      sel.innerHTML += `<option>${child.val()}</option>`;
      del.innerHTML += `<option>${child.val()}</option>`;
    });
  });

  db.ref("points").on("value", snap => {
    points = snap.val() || {};
    const sel = document.getElementById("point");
    const del = document.getElementById("deletePoint");
    sel.innerHTML = del.innerHTML = "";
    for (const name in points) {
      sel.innerHTML += `<option value="${name}">${name} (${points[name]}₽)</option>`;
      del.innerHTML += `<option value="${name}">${name}</option>`;
    }
  });
}

// INIT
loadEmployeesAndPoints();
checkAdmin();
