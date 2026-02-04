const DEFAULT_DEPARTMENTS = [
  { id: 'mnevniki', name: 'Мнёвники', pin: '0000' },
  { id: 'proshlyakova', name: 'Прошлякова', pin: '0000' },
  { id: 'kurkino', name: 'Куркино', pin: '0000' },
  { id: 'kirova', name: 'Кирова', pin: '0000' },
  { id: 'solntsevo', name: 'Солнцево', pin: '0000' },
];

const STORAGE_KEY = 'liveQueueRecords';
const DEPARTMENTS_KEY = 'liveQueueDepartments';
const RECORDS_COLLECTION = 'records';
const DEPARTMENTS_COLLECTION = 'departments';

const DEFAULT_LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};
const ADMIN_CREDENTIALS_KEY = 'liveQueueAdminCredentials';
const SETTINGS_COLLECTION = 'settings';

const hasRemoteDb = () => Boolean(window.firebaseDb);

const sortRecordsByDate = (records) =>
  [...records].sort((first, second) => {
    const firstDate = new Date(first.createdAt || first.visitDate || 0).getTime();
    const secondDate = new Date(second.createdAt || second.visitDate || 0).getTime();
    return secondDate - firstDate;
  });

const getAdminCredentials = async () => {
  if (hasRemoteDb()) {
    const doc = await window.firebaseDb
      .collection(SETTINGS_COLLECTION)
      .doc('adminCredentials')
      .get();
    if (doc.exists) {
      return { ...DEFAULT_LOGIN_CREDENTIALS, ...doc.data() };
    }
  }

  const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
  if (!raw) return { ...DEFAULT_LOGIN_CREDENTIALS };
  try {
    return { ...DEFAULT_LOGIN_CREDENTIALS, ...JSON.parse(raw) };
  } catch (error) {
    console.warn('Не удалось прочитать учетные данные администратора.', error);
    return { ...DEFAULT_LOGIN_CREDENTIALS };
  }
};

const saveAdminCredentials = async (credentials) => {
  if (hasRemoteDb()) {
    await window.firebaseDb
      .collection(SETTINGS_COLLECTION)
      .doc('adminCredentials')
      .set(credentials, { merge: true });
    return;
  }

  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(credentials));
};

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

const addDepartment = async (name, pin) => {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/(^-|-$)/g, '');
  const id = `${slug}-${Date.now()}`;
  const newDepartment = { id, name: trimmed, pin };

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
    const snapshot = await window.firebaseDb.collection(RECORDS_COLLECTION).get();
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return sortRecordsByDate(records);
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return sortRecordsByDate(JSON.parse(raw));
  } catch (error) {
    console.warn('Не удалось прочитать локальные данные.', error);
    return [];
  }
};

const saveRecord = async (record) => {
  if (hasRemoteDb()) {
    await window.firebaseDb.collection(RECORDS_COLLECTION).doc(record.id).set(record);
    return;
  }

  const records = await getRecords();
  records.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const updateRecord = async (recordId, updates) => {
  if (hasRemoteDb()) {
    await window.firebaseDb.collection(RECORDS_COLLECTION).doc(recordId).update(updates);
    return;
  }

  const records = await getRecords();
  const next = records.map((record) =>
    record.id === recordId ? { ...record, ...updates } : record
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

const deleteRecord = async (recordId) => {
  if (hasRemoteDb()) {
    await window.firebaseDb.collection(RECORDS_COLLECTION).doc(recordId).delete();
    return;
  }

  const records = await getRecords();
  const next = records.filter((record) => record.id !== recordId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

const updateDepartment = async (departmentId, updates) => {
  if (hasRemoteDb()) {
    await window.firebaseDb
      .collection(DEPARTMENTS_COLLECTION)
      .doc(departmentId)
      .update(updates);
    return;
  }

  const existingCustom = (await getDepartments()).filter(
    (department) => !DEFAULT_DEPARTMENTS.some((item) => item.id === department.id)
  );
  const next = existingCustom.map((department) =>
    department.id === departmentId ? { ...department, ...updates } : department
  );
  saveCustomDepartments(next);
};

const deleteDepartment = async (departmentId) => {
  if (hasRemoteDb()) {
    await window.firebaseDb.collection(DEPARTMENTS_COLLECTION).doc(departmentId).delete();
    return;
  }

  const existingCustom = (await getDepartments()).filter(
    (department) => !DEFAULT_DEPARTMENTS.some((item) => item.id === department.id)
  );
  const next = existingCustom.filter((department) => department.id !== departmentId);
  saveCustomDepartments(next);
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
