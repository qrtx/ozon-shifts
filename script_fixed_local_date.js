
// --- часть кода пропущена ради краткости ---
function markShift() {
  const employee = document.getElementById("employee").value;
  const point = document.getElementById("point").value;
  const now = new Date();
  const date = now.getFullYear() + "-" +
               String(now.getMonth() + 1).padStart(2, '0') + "-" +
               String(now.getDate()).padStart(2, '0');
  firebase.database().ref("shifts").push({ employee, point, date });
}
// --- остальная часть кода остаётся прежней ---
