const loginSection = document.querySelector('#login-section');
const loginForm = document.querySelector('#login-form');
const loginNotice = document.querySelector('#login-notice');
const dashboard = document.querySelector('#dashboard');
const statsContainer = document.querySelector('#stats');
const departmentStatsBody = document.querySelector('#department-stats');
const reasonStatsBody = document.querySelector('#reason-stats');
const departmentAdminList = document.querySelector('#department-admin-list');
const recordAdminList = document.querySelector('#record-admin-list');
const credentialsForm = document.querySelector('#credentials-form');
const credentialsNotice = document.querySelector('#credentials-notice');
const adminUsernameInput = document.querySelector('#admin-username');
const adminPasswordInput = document.querySelector('#admin-password');
const exportBtn = document.querySelector('#export-btn');
const logoutBtn = document.querySelector('#logout-btn');

const SESSION_KEY = 'liveQueueAdminAuthenticated';

const isAuthenticated = () => sessionStorage.getItem(SESSION_KEY) === 'true';

const setAuthenticated = (value) => {
  sessionStorage.setItem(SESSION_KEY, value ? 'true' : 'false');
};

const showDashboard = async () => {
  loginSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
  const credentials = await getAdminCredentials();
  adminUsernameInput.value = credentials.username;
  adminPasswordInput.value = credentials.password;
  await renderStats();
};

const showLogin = () => {
  loginSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
};

const renderStats = async () => {
  const records = await getRecords();
  const departments = await getDepartments();

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
  departments.forEach((department) => {
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

  departmentAdminList.innerHTML = '';
  departments.forEach((department) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${department.name}</td>
      <td class="actions">
        <button class="ghost" data-action="edit-department" data-id="${department.id}">
          Редактировать
        </button>
        <button class="ghost" data-action="delete-department" data-id="${department.id}">
          Удалить
        </button>
      </td>
    `;
    departmentAdminList.appendChild(row);
  });

  recordAdminList.innerHTML = '';
  records.forEach((record) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDateTime(record.visitDate)}</td>
      <td>${record.client}</td>
      <td>${record.departmentName}</td>
      <td>${record.serviceStatus}</td>
      <td class="actions">
        <button class="ghost" data-action="edit-record" data-id="${record.id}">
          Редактировать
        </button>
        <button class="ghost" data-action="delete-record" data-id="${record.id}">
          Удалить
        </button>
      </td>
    `;
    recordAdminList.appendChild(row);
  });
};

const exportToCsv = async () => {
  const records = await getRecords();
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

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = loginForm.querySelector('#username').value.trim();
  const password = loginForm.querySelector('#password').value.trim();
  const credentials = await getAdminCredentials();

  if (username === credentials.username && password === credentials.password) {
    setAuthenticated(true);
    loginNotice.classList.add('hidden');
    await showDashboard();
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

credentialsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = adminUsernameInput.value.trim();
  const password = adminPasswordInput.value.trim();
  if (!username || !password) return;

  await saveAdminCredentials({ username, password });
  credentialsNotice.textContent = 'Данные администратора обновлены.';
  credentialsNotice.classList.remove('hidden');
  credentialsNotice.classList.add('success');
});

departmentAdminList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const departmentId = button.dataset.id;

  if (action === 'edit-department') {
    const current = await getDepartments();
    const department = current.find((item) => item.id === departmentId);
    if (!department) return;
    const name = window.prompt('Новое название подразделения', department.name);
    if (!name) return;
    await updateDepartment(departmentId, { name: name.trim() });
    await renderStats();
  }

  if (action === 'delete-department') {
    const confirmed = window.confirm('Удалить подразделение?');
    if (!confirmed) return;
    await deleteDepartment(departmentId);
    await renderStats();
  }
});

recordAdminList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const recordId = button.dataset.id;

  if (action === 'edit-record') {
    const records = await getRecords();
    const record = records.find((item) => item.id === recordId);
    if (!record) return;
    const status = window.prompt('Статус обслуживания', record.serviceStatus);
    if (!status) return;
    const reason = window.prompt('Причина отказа', record.notServedReason || '');
    await updateRecord(recordId, {
      serviceStatus: status.trim(),
      notServedReason: reason ? reason.trim() : '',
    });
    await renderStats();
  }

  if (action === 'delete-record') {
    const confirmed = window.confirm('Удалить запись?');
    if (!confirmed) return;
    await deleteRecord(recordId);
    await renderStats();
  }
});

if (isAuthenticated()) {
  showDashboard();
} else {
  showLogin();
}
