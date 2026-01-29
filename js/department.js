const form = document.querySelector('#queue-form');
const departmentTitle = document.querySelector('#department-title');
const visitDateInput = document.querySelector('#visit-date');
const clientInput = document.querySelector('#client');
const visitPurposeInput = document.querySelector('#visit-purpose');
const serviceStatusInput = document.querySelector('#service-status');
const reasonWrapper = document.querySelector('#reason-wrapper');
const reasonInput = document.querySelector('#not-served-reason');
const commentWrapper = document.querySelector('#comment-wrapper');
const commentInput = document.querySelector('#comment');
const formNotice = document.querySelector('#form-notice');
const recentEntries = document.querySelector('#recent-entries');

const params = new URLSearchParams(window.location.search);
const departmentId = params.get('dept');
let department = null;

const updateReasonVisibility = () => {
  const status = serviceStatusInput.value;
  if (status === 'Не обслужен') {
    reasonWrapper.classList.remove('hidden');
    reasonInput.required = true;
  } else {
    reasonWrapper.classList.add('hidden');
    reasonInput.required = false;
    reasonInput.value = '';
  }

  const reasonValue = reasonInput.value;
  if (status === 'Не обслужен' && reasonValue === 'Другое') {
    commentWrapper.classList.remove('hidden');
    commentInput.required = true;
  } else {
    commentWrapper.classList.add('hidden');
    commentInput.required = false;
    commentInput.value = '';
  }
};

serviceStatusInput.addEventListener('change', updateReasonVisibility);
reasonInput.addEventListener('change', updateReasonVisibility);

const renderRecentEntries = () => {
  const records = getRecords()
    .filter((record) => record.departmentId === departmentId)
    .slice(-5)
    .reverse();

  recentEntries.innerHTML = '';

  if (records.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5">Пока нет записей.</td>';
    recentEntries.appendChild(row);
    return;
  }

  records.forEach((record) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDateTime(record.visitDate)}</td>
      <td>${record.client}</td>
      <td>${record.visitPurpose}</td>
      <td>${record.serviceStatus}</td>
      <td>${record.notServedReason || '—'}</td>
    `;
    recentEntries.appendChild(row);
  });
};

const showNotice = (message, type = 'success') => {
  formNotice.textContent = message;
  formNotice.classList.remove('hidden', 'success', 'warning');
  formNotice.classList.add(type === 'warning' ? 'warning' : 'success');
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!department) return;

  const record = {
    id: crypto.randomUUID(),
    departmentId,
    departmentName: department.name,
    visitDate: visitDateInput.value,
    client: clientInput.value.trim(),
    visitPurpose: visitPurposeInput.value,
    serviceStatus: serviceStatusInput.value,
    notServedReason: reasonInput.value,
    comment: commentInput.value.trim(),
    createdAt: new Date().toISOString(),
  };

  saveRecord(record);
  form.reset();
  updateReasonVisibility();
  renderRecentEntries();
  showNotice('Запись сохранена. Спасибо!');
});

const init = () => {
  const departments = getDepartments();
  department = departments.find((item) => item.id === departmentId);

  if (!department) {
    departmentTitle.textContent = 'Подразделение не найдено';
    form.classList.add('hidden');
    formNotice.textContent = 'Проверьте ссылку на подразделение.';
    formNotice.classList.remove('hidden');
    return;
  }

  departmentTitle.textContent = department.name;
  visitDateInput.value = new Date().toISOString().slice(0, 16);
  updateReasonVisibility();
  renderRecentEntries();
};

init();
