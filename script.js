
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

function toggleAdminLogin() {
  const modal = document.getElementById("adminModal");
  modal.style.display = modal.style.display === "none" ? "flex" : "none";
}

function adminLogin() {
  const login = document.getElementById("login").value;
  const password = document.getElementById("password").value;
  if (login === "qwertyxyry" && password === "Qrtx1234") {
    isAdmin = true;
    localStorage.setItem("ozon_is_admin", "true");
    toggleAdminLogin();
    renderCalendar();
    renderAdminPanel();
  } else {
    alert("Неверные данные");
  }
}

function checkAdmin() {
  isAdmin = localStorage.getItem("ozon_is_admin") === "true";
}

function removeEntry(id) {
  if (!isAdmin) return alert("Удаление доступно только администратору");
  if (confirm("Удалить эту смену?")) db.ref("shifts/" + id).remove();
}

function renderAdminPanel() {
  const container = document.createElement("div");
  container.className = "admin-panel";
  container.innerHTML = `
    <h3>⚙️ Управление сотрудниками и пунктами</h3>
    <div>
      <label>Добавить сотрудника: </label>
      <input id="newEmp" placeholder="Имя" />
      <button onclick="addEmployee()">Добавить</button>
    </div>
    <div>
      <label>Добавить пункт: </label>
      <input id="newPoint" placeholder="Название" />
      <input id="newRate" placeholder="Зарплата" />
      <button onclick="addPoint()">Добавить</button>
    </div>
  `;
  document.body.appendChild(container);
}

function addEmployee() {
  const emp = document.getElementById("newEmp").value.trim();
  if (!emp) return;
  const sel = document.getElementById("employee");
  const opt = document.createElement("option");
  opt.value = opt.innerText = emp;
  sel.appendChild(opt);
  alert("Сотрудник добавлен");
}

function addPoint() {
  const name = document.getElementById("newPoint").value.trim();
  const rate = parseInt(document.getElementById("newRate").value.trim());
  if (!name || !rate) return;
  const sel = document.getElementById("point");
  const opt = document.createElement("option");
  opt.value = name;
  opt.innerText = name + " (" + rate + "₽)";
  sel.appendChild(opt);
  alert("Пункт добавлен");
}

checkAdmin();
