
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const rates = {
  "МО_ХИМКИ_89": 2666,
  "ХИМКИ_241": 2000
};

function markShift() {
  const employee = document.getElementById("employee").value;
  const point = document.getElementById("point").value;
  const date = new Date().toISOString().split("T")[0];
  const newRef = db.ref("shifts").push();
  newRef.set({ date, employee, point });
}

db.ref("shifts").on("value", (snapshot) => {
  const data = snapshot.val();
  const grouped = {};

  for (const key in data) {
    const { date, employee, point } = data[key];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push({ employee, point });
  }

  renderCalendar(grouped);
  renderSummary(grouped);
});

function renderCalendar(data) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "<h2>Календарь</h2>";
  for (const date in data) {
    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `<strong>${date}</strong><br>` +
      data[date].map(e => `${e.employee} — ${e.point}`).join("<br>");
    calendar.appendChild(div);
  }
}

function renderSummary(data) {
  const summary = {};
  for (const date in data) {
    for (const r of data[date]) {
      if (!summary[r.employee]) summary[r.employee] = { count: 0, money: 0 };
      summary[r.employee].count++;
      summary[r.employee].money += rates[r.point];
    }
  }

  const totals = document.getElementById("totals");
  totals.innerHTML = "<h2>Итоги</h2>" + Object.entries(summary).map(
    ([name, val]) => `${name}: ${val.count} смен, ${val.money}₽`
  ).join("<br>");
}
