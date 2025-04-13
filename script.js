
const SUPABASE_URL = 'https://wxpnomwthmmwxmwqgxxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cG5vbXd0aG1td3htd3FneHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDk4OTksImV4cCI6MjA2MDEyNTg5OX0.JXWOpO1Nv9FFaKlrWIm3y2r5Pk7r_O4wJFUldVdwWLY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const rates = {
  "МО_ХИМКИ_89": 2666,
  "ХИМКИ_241": 2000
};

async function markShift() {
  const employee = document.getElementById("employee").value;
  const point = document.getElementById("point").value;
  const date = new Date().toISOString().split("T")[0];

  await supabase.from("shifts").insert([{ date, employee, point }]);
  loadData();
}

async function loadData() {
  const { data, error } = await supabase.from("shifts").select("*");
  if (error) {
    console.error("Ошибка загрузки:", error);
    return;
  }

  const grouped = {};
  data.forEach(entry => {
    if (!grouped[entry.date]) grouped[entry.date] = [];
    grouped[entry.date].push(entry);
  });

  renderCalendar(grouped);
  renderSummary(grouped);
}

function renderCalendar(data) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "<h2>Календарь</h2>";
  for (const date in data) {
    const div = document.createElement("div");
    div.className = "day";
    div.innerHTML = "<strong>" + date + "</strong><br>" +
      data[date].map(d => d.employee + " — " + d.point).join("<br>");
    calendar.appendChild(div);
  }
}

function renderSummary(data) {
  const summary = {};
  for (const date in data) {
    for (const record of data[date]) {
      const key = record.employee;
      if (!summary[key]) summary[key] = { count: 0, money: 0 };
      summary[key].count++;
      summary[key].money += rates[record.point];
    }
  }

  const container = document.getElementById("totals");
  container.innerHTML = Object.entries(summary)
    .map(([name, s]) => `${name}: ${s.count} смен, ${s.money}₽`)
    .join("<br>");
}

loadData();
