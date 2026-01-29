const DEFAULT_DEPARTMENTS = [
  { id: 'mnevniki', name: 'Мнёвники' },
  { id: 'proshlyakova', name: 'Прошлякова' },
  { id: 'kurkino', name: 'Куркино' },
  { id: 'kirova', name: 'Кирова' },
  { id: 'solntsevo', name: 'Солнцево' },
];

const STORAGE_KEY = 'liveQueueRecords';
const DEPARTMENTS_KEY = 'liveQueueDepartments';

const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

const getDepartments = () => {
  const raw = localStorage.getItem(DEPARTMENTS_KEY);
  if (!raw) return [...DEFAULT_DEPARTMENTS];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_DEPARTMENTS];
    return [...DEFAULT_DEPARTMENTS, ...parsed];
  } catch (error) {
    console.warn('Не удалось прочитать список подразделений.', error);
    return [...DEFAULT_DEPARTMENTS];
  }
};

const saveCustomDepartments = (departments) => {
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
};

const addDepartment = (name) => {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/(^-|-$)/g, '');
  const id = `${slug}-${Date.now()}`;
  const newDepartment = { id, name: trimmed };
  const existingCustom = getDepartments().filter(
    (department) => !DEFAULT_DEPARTMENTS.some((item) => item.id === department.id)
  );
  existingCustom.push(newDepartment);
  saveCustomDepartments(existingCustom);
  return newDepartment;
};

const getRecords = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Не удалось прочитать локальные данные.', error);
    return [];
  }
};

const saveRecord = (record) => {
  const records = getRecords();
  records.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ru-RU');
};

const downloadFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
