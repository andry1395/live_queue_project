const DEFAULT_DEPARTMENTS = [
  { id: 'mnevniki', name: 'Мнёвники' },
  { id: 'proshlyakova', name: 'Прошлякова' },
  { id: 'kurkino', name: 'Куркино' },
  { id: 'kirova', name: 'Кирова' },
  { id: 'solntsevo', name: 'Солнцево' },
];

const STORAGE_KEY = 'liveQueueRecords';
const DEPARTMENTS_KEY = 'liveQueueDepartments';
const RECORDS_COLLECTION = 'records';
const DEPARTMENTS_COLLECTION = 'departments';

const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

const hasRemoteDb = () => Boolean(window.firebaseDb);

const getDepartments = async () => {
  if (hasRemoteDb()) {
    const snapshot = await window.firebaseDb.collection(DEPARTMENTS_COLLECTION).get();
    const departments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    if (departments.length > 0) return departments;
  }

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

const addDepartment = async (name) => {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/(^-|-$)/g, '');
  const id = `${slug}-${Date.now()}`;
  const newDepartment = { id, name: trimmed };

  if (hasRemoteDb()) {
    await window.firebaseDb.collection(DEPARTMENTS_COLLECTION).doc(id).set(newDepartment);
    return newDepartment;
  }

  const existingCustom = (await getDepartments()).filter(
    (department) => !DEFAULT_DEPARTMENTS.some((item) => item.id === department.id)
  );
  existingCustom.push(newDepartment);
  saveCustomDepartments(existingCustom);
  return newDepartment;
};

const getRecords = async () => {
  if (hasRemoteDb()) {
    const snapshot = await window.firebaseDb
      .collection(RECORDS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Не удалось прочитать локальные данные.', error);
    return [];
  }
};

const saveRecord = async (record) => {
  if (hasRemoteDb()) {
    await window.firebaseDb.collection(RECORDS_COLLECTION).add(record);
    return;
  }

  const records = await getRecords();
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
