const departmentList = document.querySelector('#department-list');

const departmentCards = DEPARTMENTS.map((department) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.innerHTML = `
    <h3>${department.name}</h3>
    <p>Вести учет клиентов по живой очереди для подразделения.</p>
    <a class="button-link ghost" href="department.html?dept=${department.id}">Открыть форму</a>
  `;
  return wrapper;
});

departmentCards.forEach((card) => departmentList.appendChild(card));
