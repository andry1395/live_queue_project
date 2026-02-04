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
const pinSection = document.querySelector('#pin-section');
const pinForm = document.querySelector('#pin-form');
const pinInput = document.querySelector('#pin-input');
const pinNotice = document.querySelector('#pin-notice');
const formSection = document.querySelector('#form-section');
const recentSection = document.querySelector('#recent-section');
const cancelEditButton = document.querySelector('#cancel-edit');
const submitButton = form.querySelector('button[type="submit"]');

const params = new URLSearchParams(window.location.search);
const departmentId = params.get('dept');
let department = null;
let editingRecordId = null;
let recentRecords = [];

const setDefaultVisitDate = () => {
  visitDateInput.value = new Date().toISOString().slice(0, 16);
};

const resetEditState = () => {
  editingRecordId = null;
  cancelEditButton.classList.add('hidden');
  submitButton.textContent = 'Сохранить запись';
};

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

const renderRecentEntries = async () => {
  const records = (await getRecords())
    .filter((record) => record.departmentId === departmentId)
    .sort((first, second) => {
      const firstDate = new Date(first.createdAt || first.visitDate || 0).getTime();
      const secondDate = new Date(second.createdAt || second.visitDate || 0).getTime();
      return firstDate - secondDate;
    })
    .reverse();
  recentRecords = records;

  recentEntries.innerHTML = '';

  if (records.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6">Пока нет записей.</td>';
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
      <td>
        <button class="ghost" type="button" data-action="edit-record" data-id="${record.id}">
          Редактировать
        </button>
      </td>
    `;
    recentEntries.appendChild(row);
  });
};

const showNotice = (message, type = 'success') => {
  formNotice.textContent = message;
  formNotice.classList.remove('hidden', 'success', 'warning');
  formNotice.classList.add(type === 'warning' ? 'warning' : 'success');
};

const showPinNotice = (message, type = 'warning') => {
  pinNotice.textContent = message;
  pinNotice.classList.remove('hidden', 'success', 'warning');
  pinNotice.classList.add(type === 'success' ? 'success' : 'warning');
};

const unlockDepartment = () => {
  pinSection.classList.add('hidden');
  formSection.classList.remove('hidden');
  recentSection.classList.remove('hidden');
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!department) return;

  const recordPayload = {
    departmentId,
    departmentName: department.name,
    visitDate: visitDateInput.value,
    client: clientInput.value.trim(),
    visitPurpose: visitPurposeInput.value,
    serviceStatus: serviceStatusInput.value,
    notServedReason: reasonInput.value,
    comment: commentInput.value.trim(),
  };

  if (editingRecordId) {
    await updateRecord(editingRecordId, {
      ...recordPayload,
      updatedAt: new Date().toISOString(),
    });
    showNotice('Запись обновлена.', 'success');
  } else {
    const record = {
      id: crypto.randomUUID(),
      ...recordPayload,
      createdAt: new Date().toISOString(),
    };
    await saveRecord(record);
    showNotice('Запись сохранена. Спасибо!', 'success');
  }

  form.reset();
  updateReasonVisibility();
  setDefaultVisitDate();
  resetEditState();
  await renderRecentEntries();
});

cancelEditButton.addEventListener('click', () => {
  form.reset();
  updateReasonVisibility();
  setDefaultVisitDate();
  resetEditState();
  showNotice('Редактирование отменено.', 'warning');
});

recentEntries.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action="edit-record"]');
  if (!button) return;

  const recordId = button.dataset.id;
  let record = recentRecords.find((item) => item.id === recordId);
  if (!record) {
    record = (await getRecords()).find((item) => item.id === recordId);
  }
  if (!record) return;

  editingRecordId = record.id;
  visitDateInput.value = record.visitDate;
  clientInput.value = record.client;
  visitPurposeInput.value = record.visitPurpose;
  serviceStatusInput.value = record.serviceStatus;
  reasonInput.value = record.notServedReason || '';
  commentInput.value = record.comment || '';
  updateReasonVisibility();
  submitButton.textContent = 'Обновить запись';
  cancelEditButton.classList.remove('hidden');
  showNotice('Редактирование записи. Внесите изменения и сохраните.', 'warning');
});

const init = async () => {
  const departments = await getDepartments();
  department = departments.find((item) => item.id === departmentId);

  if (!department) {
    departmentTitle.textContent = 'Подразделение не найдено';
    form.classList.add('hidden');
    formNotice.textContent = 'Проверьте ссылку на подразделение.';
    formNotice.classList.remove('hidden');
    return;
  }

  departmentTitle.textContent = department.name;
  setDefaultVisitDate();
  updateReasonVisibility();

  if (!department.pin) {
    showPinNotice('PIN-код не установлен. Обратитесь к администратору.');
    return;
  }

  pinForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const pin = pinInput.value.trim();
    if (pin === department.pin) {
      showPinNotice('PIN принят.', 'success');
      unlockDepartment();
      await renderRecentEntries();
    } else {
      showPinNotice('Неверный PIN-код.');
      pinInput.value = '';
    }
  });
};

init();
