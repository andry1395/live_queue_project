const DEFAULT_DEPARTMENTS = [
  { id: 'mnevniki', name: 'Мнёвники' },
  { id: 'proshlyakova', name: 'Прошлякова' },
  { id: 'kurkino', name: 'Куркино' },
  { id: 'kirova', name: 'Кирова' },
  { id: 'solntsevo', name: 'Солнцево' },
];

const API_URL =
  'https://script.google.com/macros/s/AKfycbxlKIXiqDsL2dx-Kq7gsMZPvDMZv_b_N8POfNP-l88u8s8XMWUo1sKhn7fi6VS_sUZg/exec';

const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

const sendRequest = async (payload, options = {}) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};

const getDepartments = async () => {
  try {
    const response = await fetch(`${API_URL}?action=departments`);
    if (!response.ok) throw new Error('Не удалось получить подразделения.');
    const data = await response.json();
    if (!Array.isArray(data.departments)) return [...DEFAULT_DEPARTMENTS];
    return data.departments;
  } catch (error) {
    console.warn('Не удалось получить подразделения из API.', error);
    return [...DEFAULT_DEPARTMENTS];
  }
};

const addDepartment = async (name) => {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const result = await sendRequest({ action: 'addDepartment', name: trimmed });
  return result.department ?? null;
};

const getRecords = async () => {
  try {
    const response = await fetch(`${API_URL}?action=records`);
    if (!response.ok) throw new Error('Не удалось получить записи.');
    const data = await response.json();
    return Array.isArray(data.records) ? data.records : [];
  } catch (error) {
    console.warn('Не удалось получить записи из API.', error);
    return [];
  }
};

const saveRecord = async (record) => {
  const result = await sendRequest({ action: 'addRecord', record });
  return result.record ?? null;
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
