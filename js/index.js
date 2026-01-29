const departmentList = document.querySelector('#department-list');
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

renderDepartments();
