
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
