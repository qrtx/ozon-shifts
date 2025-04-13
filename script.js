
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let allData = {};

function loadPage(page) {
  if (page === 'main') return renderMain();
  fetch(page + '.html').then(r => r.text()).then(html => {
    document.getElementById("content").innerHTML = html;
  });
}

function renderMain() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class='form-block'>
      <select id='employee'>
        <option>Сергей З.</option><option>Сергей Ш.</option><option>Арина</option><option>Андрей</option>
        <option>Валера</option><option>Даша</option><option>Ростислав</option><option>Алексей</option><option>Саня</option>
      </select>
      <select id='point'>
        <option value='МО_ХИМКИ_89'>МО_ХИМКИ_89 (2666₽)</option>
        <option value='ХИМКИ_241'>ХИМКИ_241 (2000₽)</option>
      </select>
      <button onclick='markShift()'>Отметиться</button>
    </div>
    <div id='calendar'></div>
  `;
  renderCalendar();
}

function markShift() {
  const employee = document.getElementById("employee").value;
  const point = document.getElementById("point").value;
  const date = new Date().toISOString().split("T")[0];
  db.ref("shifts").push({ date, employee, point });
}

db.ref("shifts").on("value", snap => {
  allData = snap.val() || {};
  if (document.getElementById("calendar")) renderCalendar();
});

function removeEntry(id) {
  if (confirm("Удалить эту смену?")) db.ref("shifts/" + id).remove();
}

function renderCalendar() {
  const container = document.getElementById("calendar");
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const daysInMonth = last.getDate();

  let html = "<div class='grid'>";
  const weekDay = first.getDay() || 7;
  html += "<div></div>".repeat(weekDay - 1);

  for (let d = 1; d <= daysInMonth; d++) {
    const day = `${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
    const shifts = Object.entries(allData).filter(([id, x]) => x.date === day);
    let inner = `<strong>${d}</strong><br>`;
    inner += shifts.map(([id, x]) => `${x.employee}<span class='remove-btn' onclick='removeEntry("${id}")'>×</span>`).join("<br>");
    html += `<div class='day-cell'>${inner}</div>`;
  }

  html += "</div>";
  container.innerHTML = html;
}

loadPage('main');
