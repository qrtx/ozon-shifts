
let isAdmin = false;
let employees = [];
let points = {};
let allData = {};

let dataReady = {
  points: false,
  shifts: false
};

function tryRender() {
  if (dataReady.points && dataReady.shifts) {
    renderCalendar();
  }
}

function toggleAdminLogin() {
  const login = prompt("Введите логин:");
  const pass = prompt("Введите пароль:");
  if (login === "qwertyxyry" && pass === "Qrtx1234") {
    isAdmin = true;
    localStorage.setItem("ozon_is_admin", "true");
    document.getElementById("adminPanel").style.display = "block";
  }
}

function adminLogout() {
  isAdmin = false;
  localStorage.removeItem("ozon_is_admin");
  location.reload();
}

function checkAdmin() {
  isAdmin = localStorage.getItem("ozon_is_admin") === "true";
  if (isAdmin) document.getElementById("adminPanel").style.display = "block";
}

function markShift() {
  const employee = document.getElementById("employee").value;
  const point = document.getElementById("point").value;
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  firebase.database().ref("shifts").push({ employee, point, date });
}

function removeEntry(id) {
  if (!isAdmin) return alert("Удаление доступно только для администратора");
  if (confirm("Удалить смену?")) firebase.database().ref("shifts/" + id).remove();
}

function renderCalendar() {
  const container = document.getElementById("calendar");
  const now = new Date();
  const isToday = (y, m, d) => y === now.getFullYear() && m === now.getMonth() && d === now.getDate();
  const year = now.getFullYear(), month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const daysInMonth = last.getDate();

  let html = "<div class='grid'>";
  html += "<div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>";

  const weekDay = first.getDay() || 7;
  html += "<div></div>".repeat(weekDay - 1);

  for (let d = 1; d <= daysInMonth; d++) {
    const day = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
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
}

function renderSummary() {
  const summaryA = {}, summaryB = {}, countA = {}, countB = {};

  for (const id in allData) {
    const x = allData[id];
    const [y, m, d] = x.date.split("-").map(n => parseInt(n));
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

    // сохраняем в Firebase
    firebase.database().ref("summary/" + name).set({
      "11_25": { count: ca, total: a },
      "26_10": { count: cb, total: b }
    });
  }

  summaryDiv.innerHTML += "</div>";
}
  const summaryA = {}, summaryB = {}, countA = {}, countB = {};
  for (const id in allData) {
    const x = allData[id];
    const [y, m, d] = x.date.split("-").map(n => parseInt(n));
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
}

firebase.database().ref("employees").on("value", snap => {
  const sel = document.getElementById("employee");
  const bsel = document.getElementById("bankEmployee");
  const del = document.getElementById("deleteEmp");
  sel.innerHTML = del.innerHTML = bsel.innerHTML = "";
  snap.forEach(child => {
    sel.innerHTML += `<option>${child.val()}</option>`;
    bsel.innerHTML += `<option>${child.val()}</option>`;
    del.innerHTML += `<option>${child.val()}</option>`;
  });
});

firebase.database().ref("points").on("value", snap => {
  points = snap.val() || {};
  dataReady.points = true;
  tryRender();
});

firebase.database().ref("shifts").on("value", snap => {
  allData = snap.val() || {};
  dataReady.shifts = true;
  tryRender();
});

function addEmployee() {
  const name = document.getElementById("newEmp").value.trim();
  if (!name) return;
  firebase.database().ref("employees").push(name);
}

function deleteEmployee() {
  const name = document.getElementById("deleteEmp").value;
  firebase.database().ref("employees").once("value", snap => {
    snap.forEach(child => {
      if (child.val() === name) firebase.database().ref("employees/" + child.key).remove();
    });
  });
}

function addPoint() {
  const name = document.getElementById("newPoint").value.trim();
  const rate = parseInt(document.getElementById("newRate").value.trim());
  if (!name || !rate) return;
  firebase.database().ref("points/" + name).set(rate);
}

function deletePoint() {
  const name = document.getElementById("deletePoint").value;
  firebase.database().ref("points/" + name).remove();
}

function submitBankInfo() {
  const employee = document.getElementById("bankEmployee").value;
  const phone = document.getElementById("bankPhone").value.trim();
  const bank = document.getElementById("bankName").value.trim();
  if (!phone || !bank) return;
  firebase.database().ref("bank").push(`${employee}: ${phone} - ${bank}`);
  document.getElementById("bankPhone").value = '';
  document.getElementById("bankName").value = '';
}

function removeBankEntry(id) {
  firebase.database().ref("bank/" + id).remove();
}

function loadBankList() {
  firebase.database().ref("bank").on("value", snap => {
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
checkAdmin();
