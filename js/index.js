const departmentList = document.querySelector('#department-list');
const addDepartmentForm = document.querySelector('#add-department-form');
const newDepartmentInput = document.querySelector('#new-department-name');

const renderDepartments = async () => {
  departmentList.innerHTML = '';
  const departments = await getDepartments();

  departments.forEach((department) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.innerHTML = `
      <h3>${department.name}</h3>
      <p>Вести учет клиентов по живой очереди для подразделения.</p>
      <a class="button-link ghost" href="department.html?dept=${department.id}">Открыть форму</a>
    `;
    departmentList.appendChild(wrapper);
  });
};

addDepartmentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = newDepartmentInput.value.trim();
  if (!name) return;
  const newDepartment = await addDepartment(name);
  if (!newDepartment) {
    alert('Не удалось добавить подразделение.');
    return;
  }
  newDepartmentInput.value = '';
  await renderDepartments();
});

renderDepartments();
