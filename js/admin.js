const loginSection = document.querySelector('#login-section');
const loginForm = document.querySelector('#login-form');
const loginNotice = document.querySelector('#login-notice');
const dashboard = document.querySelector('#dashboard');
const statsContainer = document.querySelector('#stats');
const departmentStatsBody = document.querySelector('#department-stats');
const reasonStatsBody = document.querySelector('#reason-stats');
const exportBtn = document.querySelector('#export-btn');
const logoutBtn = document.querySelector('#logout-btn');

const SESSION_KEY = 'liveQueueAdminAuthenticated';

const isAuthenticated = () => sessionStorage.getItem(SESSION_KEY) === 'true';

const setAuthenticated = (value) => {
  sessionStorage.setItem(SESSION_KEY, value ? 'true' : 'false');
};

const showDashboard = () => {
  loginSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
  renderStats();
};

const showLogin = () => {
  loginSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
};

const renderStats = () => {
  const records = getRecords();

  const total = records.length;
  const served = records.filter((record) => record.serviceStatus === 'Обслужен').length;
  const notServed = records.filter((record) => record.serviceStatus === 'Не обслужен').length;

  statsContainer.innerHTML = '';

  const stats = [
    { label: 'Всего визитов', value: total },
    { label: 'Обслужены', value: served },
    { label: 'Не обслужены', value: notServed },
  ];

  stats.forEach((stat) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${stat.value}</h3>
      <p>${stat.label}</p>
    `;
    statsContainer.appendChild(card);
  });

  departmentStatsBody.innerHTML = '';
  DEPARTMENTS.forEach((department) => {
    const departmentRecords = records.filter(
      (record) => record.departmentId === department.id
    );
    const departmentServed = departmentRecords.filter(
      (record) => record.serviceStatus === 'Обслужен'
    ).length;
    const departmentNotServed = departmentRecords.filter(
      (record) => record.serviceStatus === 'Не обслужен'
    ).length;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${department.name}</td>
      <td>${departmentRecords.length}</td>
      <td>${departmentServed}</td>
      <td>${departmentNotServed}</td>
    `;
    departmentStatsBody.appendChild(row);
  });

  const reasons = records
    .filter((record) => record.serviceStatus === 'Не обслужен')
    .reduce((acc, record) => {
      const key = record.notServedReason || 'Не указано';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  reasonStatsBody.innerHTML = '';
  const reasonEntries = Object.entries(reasons);
  if (reasonEntries.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="2">Нет данных по отказам.</td>';
    reasonStatsBody.appendChild(row);
  } else {
    reasonEntries.forEach(([reason, count]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${reason}</td>
        <td>${count}</td>
      `;
      reasonStatsBody.appendChild(row);
    });
  }
};

const exportToCsv = () => {
  const records = getRecords();
  if (records.length === 0) {
    alert('Пока нет данных для экспорта.');
    return;
  }

  const headers = [
    'ID',
    'Подразделение',
    'Дата визита',
    'Клиент',
    'Цель визита',
    'Статус обслуживания',
    'Причина отказа',
    'Комментарий',
    'Создано',
  ];

  const rows = records.map((record) => [
    record.id,
    record.departmentName,
    formatDateTime(record.visitDate),
    record.client,
    record.visitPurpose,
    record.serviceStatus,
    record.notServedReason || '—',
    record.comment || '—',
    formatDateTime(record.createdAt),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const filename = `live-queue-export-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
};

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const username = loginForm.querySelector('#username').value.trim();
  const password = loginForm.querySelector('#password').value.trim();

  if (username === LOGIN_CREDENTIALS.username && password === LOGIN_CREDENTIALS.password) {
    setAuthenticated(true);
    loginNotice.classList.add('hidden');
    showDashboard();
  } else {
    loginNotice.textContent = 'Неверный логин или пароль.';
    loginNotice.classList.remove('hidden');
  }
});

exportBtn.addEventListener('click', exportToCsv);
logoutBtn.addEventListener('click', () => {
  setAuthenticated(false);
  showLogin();
});

if (isAuthenticated()) {
  showDashboard();
} else {
  showLogin();
}
