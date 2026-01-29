const departmentList = document.querySelector('#department-list');
const addDepartmentBtn = document.querySelector('#add-department-btn');

const renderDepartments = () => {
  departmentList.innerHTML = '';
  const departments = getDepartments();

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

addDepartmentBtn.addEventListener('click', () => {
  const name = window.prompt('Введите название нового подразделения');
  if (!name) return;
  const newDepartment = addDepartment(name);
  if (!newDepartment) {
    alert('Не удалось добавить подразделение.');
    return;
  }
  renderDepartments();
});

renderDepartments();
