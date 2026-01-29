const DEFAULT_DEPARTMENTS = [
  { id: 'mnevniki', name: 'Мнёвники' },
  { id: 'proshlyakova', name: 'Прошлякова' },
  { id: 'kurkino', name: 'Куркино' },
  { id: 'kirova', name: 'Кирова' },
  { id: 'solntsevo', name: 'Солнцево' },
];

const API_URL =
  'https://script.googleusercontent.com/macros/s/AKfycbxlKIXiqDsL2dx-Kq7gsMZPvDMZv_b_N8POfNP-l88u8s8XMWUo1sKhn7fi6VS_sUZg/exec';
const API_URL_FALLBACK =
  'https://script.google.com/macros/s/AKfycbxlKIXiqDsL2dx-Kq7gsMZPvDMZv_b_N8POfNP-l88u8s8XMWUo1sKhn7fi6VS_sUZg/exec';

const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

const fetchJson = async (url, options = {}, retryUrl = null) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (retryUrl) {
      const response = await fetch(retryUrl, options);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    }
    throw error;
  }
};

const sendRequest = async (payload, options = {}) => {
  const formBody = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    formBody.append(key, typeof value === 'string' ? value : JSON.stringify(value));
  });

  return fetchJson(
    API_URL,
    {
      method: 'POST',
      body: formBody,
      ...options,
    },
    API_URL_FALLBACK
  );
};

const getDepartments = async () => {
  try {
    const data = await fetchJson(
      `${API_URL}?action=departments`,
      {},
      `${API_URL_FALLBACK}?action=departments`
    );
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
    const data = await fetchJson(
      `${API_URL}?action=records`,
      {},
      `${API_URL_FALLBACK}?action=records`
    );
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
