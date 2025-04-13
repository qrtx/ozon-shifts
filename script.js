
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
  if (!isAdmin) {
    alert("Удаление смен доступно только администратору.");
    return;
  }
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


  function refreshData() {
    dataReady.points = false;
    dataReady.shifts = false;

    firebase.database().ref("points").once("value", snap => {
      points = snap.val() || {};
      dataReady.points = true;
      tryRender();
    });

    firebase.database().ref("shifts").once("value", snap => {
      allData = snap.val() || {};
      dataReady.shifts = true;
      tryRender();
    });

    firebase.database().ref("employees").once("value", snap => {
      const sel = document.getElementById("employee");
      sel.innerHTML = "";
      snap.forEach(child => {
        sel.innerHTML += `<option>${child.val()}</option>`;
      });
    });

    alert("✅ Данные обновлены!");
  }


  function autoRefreshData() {
    firebase.database().ref("points").once("value", snap => {
      points = snap.val() || {};
      dataReady.points = true;
      tryRender();
    });

    firebase.database().ref("shifts").once("value", snap => {
      allData = snap.val() || {};
      dataReady.shifts = true;
      tryRender();
    });

    firebase.database().ref("employees").once("value", snap => {
      const sel = document.getElementById("employee");
      sel.innerHTML = "";
      snap.forEach(child => {
        sel.innerHTML += `<option>${child.val()}</option>`;
      });
    });
  }

  setInterval(autoRefreshData, 10000);

function toggleAdminLogin() {
  const login = prompt("Введите логин:");
  const pass = prompt("Введите пароль:");
  if (login === "qwertyxyry" && pass === "Qrtx1234") {
    isAdmin = true;
    localStorage.setItem("ozon_is_admin", "true");
    document.getElementById("adminPanel").style.display = "block";
      loadEmployeesAndPoints();
  }
}

function checkAdmin() {
  isAdmin = localStorage.getItem("ozon_is_admin") === "true";
  if (isAdmin && document.getElementById("adminPanel")) {
    document.getElementById("adminPanel").style.display = "block";
      loadEmployeesAndPoints();
    document.getElementById("adminPanel").style.display = "block";
      loadEmployeesAndPoints();
  }
}


function removeEntry(id) {
  if (!isAdmin) {
    alert("Удаление смен доступно только администратору.");
    return;
  }
  if (confirm("Удалить эту смену?")) db.ref("shifts/" + id).remove();
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


function renderSummary() {
  const summaryA = {}, summaryB = {};
  const today = new Date();
  for (const id in allData) {
    const x = allData[id];
    const [y, m, d] = x.date.split("-").map(n => parseInt(n));
    const date = new Date(y, m - 1, d);
    const name = x.employee;
    const rate = points[x.point] || 0;

    if (!summaryA[name]) summaryA[name] = 0;
    if (!summaryB[name]) summaryB[name] = 0;

    if (d >= 11 && d <= 25) summaryA[name] += rate;
    else summaryB[name] += rate;
  }

  const summaryDiv = document.createElement("div");
  summaryDiv.innerHTML = "<h3>💰 Расчёт зарплат:</h3><div style='display:flex;gap:50px;flex-wrap:wrap;'>";

  for (const name of Object.keys({...summaryA, ...summaryB})) {
    const a = summaryA[name] || 0;
    const b = summaryB[name] || 0;
    summaryDiv.innerHTML += `<div><strong>${name}</strong><br>11–25: ${a}₽<br>26–10: ${b}₽</div>`;
  }

  summaryDiv.innerHTML += "</div>";
  document.getElementById("summary")?.remove();
  summaryDiv.id = "summary";
  document.getElementById("calendar").after(summaryDiv);
}

// Переопределим renderCalendar
renderCalendar = function () {
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
    + "<button onclick='changeMonth(1)'>Вперёд &gt;</button></div>";

  html += "<div class='grid'><div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>";

  const weekDay = first.getDay() || 7;
  html += "<div></div>".repeat(weekDay - 1);

  for (let d = 1; d <= daysInMonth; d++) {
    const day = `${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
    const shifts = Object.entries(allData).filter(([id, x]) => x.date === day);
    const todayClass = isToday(year, month, d) ? "today" : "";
    let inner = `<strong>${d}</strong><br>`;
    inner += shifts.map(([id, x]) =>
      `${x.employee} — ${x.point} (${points[x.point] || 0}₽)`
      + (isAdmin ? ` <span class='remove-btn' onclick='removeEntry("${id}")'>×</span>` : "")
    ).join("<br>");
    html += `<div class='day-cell ${todayClass}'>${inner}</div>`;
  }

  html += "</div>";
  container.innerHTML = html;
  renderSummary();
};


function adminLogout() {
  isAdmin = false;
  localStorage.removeItem("ozon_is_admin");
  alert("Вы вышли из учётки администратора.");
  location.reload();
}


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

function renderSummary() {
  

  const summaryA = {}, summaryB = {}, countA = {}, countB = {};
  const today = new Date();

  for (const id in allData) {
    const x = allData[id];
    const [y, m, d] = x.date.split("-").map(n => parseInt(n));
    const date = new Date(y, m - 1, d);
    const name = x.employee;
    const rate = points[x.point] || 0;

    if (!summaryA[name]) summaryA[name] = 0;
    if (!summaryB[name]) summaryB[name] = 0;
    if (!countA[name]) countA[name] = 0;
    if (!countB[name]) countB[name] = 0;

    if (d >= 11 && d <= 25) {
      summaryA[name] += rate;
      countA[name]++;
    } else {
      summaryB[name] += rate;
      countB[name]++;
    }
  }

  const summaryDiv = document.getElementById("summary");
  summaryDiv.innerHTML = "<h3>💰 Расчёт зарплат:</h3><div style='display:flex;gap:50px;flex-wrap:wrap;'>";

  for (const name of Object.keys({...summaryA, ...summaryB})) {
    const a = summaryA[name] || 0;
    const b = summaryB[name] || 0;
    const ca = countA[name] || 0;
    const cb = countB[name] || 0;
    summaryDiv.innerHTML += `<div><strong>${name}</strong><br>11–25: ${a}₽ (${ca} смен)<br>26–10: ${b}₽ (${cb} смен)</div>`;
  }

  summaryDiv.innerHTML += "</div>";
  summaryDiv.style.display = "block";
}


function submitBankInfo() {
  const phone = document.getElementById("bankPhone").value.trim();
  const bank = document.getElementById("bankName").value.trim();
  if (!phone || !bank) return alert("Заполните оба поля");
  const employee = document.getElementById("bankEmployee").value;
  db.ref("bank").push(`${employee}: ${phone} - ${bank}`);
  document.getElementById("bankPhone").value = '';
  document.getElementById("bankName").value = '';
}

function removeBankEntry(id) {
  db.ref("bank/" + id).remove();
}

function loadBankList() {
  db.ref("bank").on("value", snap => {
    const ul = document.getElementById("bankList");
    ul.innerHTML = "";
    snap.forEach(child => {
      const li = document.createElement("li");
      li.innerHTML = `${child.val()} <span class="bank-remove" onclick="removeBankEntry('${child.key}')">×</span>`;
      ul.appendChild(li);
    });
  });
}

loadBankList();

function updateBankEmployeeDropdown() {
  db.ref("employees").once("value", snap => {
    const sel = document.getElementById("bankEmployee");
    if (!sel) return;
    sel.innerHTML = "";
    snap.forEach(child => {
      sel.innerHTML += `<option>${child.val()}</option>`;
    });
  });
}

updateBankEmployeeDropdown();
