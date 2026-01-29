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

const sendRequest = async (payload, options = {}) =>
  fetchJson(
    API_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      ...options,
    },
    API_URL_FALLBACK
  );

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/(^-|-$)/g, '');

const mapRowToRecord = (row) => {
  const rawDepartment = row.point || row.department || row.departmentName || '';
  const departmentName = String(rawDepartment || '').trim() || '—';
  const departmentId = slugify(departmentName) || `dept-${Math.random().toString(36).slice(2, 8)}`;
  const visitDate =
    row.visitDate ||
    row.date ||
    row['Дата'] ||
    row['Дата визита'] ||
    row.timestamp ||
    row['Timestamp'] ||
    row.time ||
    row['Time'] ||
    row.createdAt ||
    row.created_at ||
    row['created_at'] ||
    '';

  return {
    id: row.id || row.uuid || row.recordId || crypto.randomUUID(),
    departmentId,
    departmentName,
    visitDate,
    client: row.client_name || row.client || row['Клиент'] || '',
    visitPurpose: row.purpose || row.visitPurpose || row['Цель визита'] || '',
    serviceStatus: row.status || row.serviceStatus || row['Статус обслуживания'] || '',
    notServedReason: row.refuse_reason || row.notServedReason || row['Причина отказа'] || '',
    comment: row.comment || row['Комментарий'] || '',
    car: row.car || '',
    phone: row.phone || '',
    mechanic: row.mechanic || '',
    createdAt: visitDate,
  };
};

const getDepartments = async () => {
  try {
    const data = await fetchJson(API_URL, {}, API_URL_FALLBACK);
    if (!Array.isArray(data.rows)) return [...DEFAULT_DEPARTMENTS];
    const departmentNames = data.rows
      .map((row) => String(row.point || row.department || row.departmentName || '').trim())
      .filter(Boolean);
    const uniqueNames = Array.from(new Set(departmentNames));
    const derivedDepartments = uniqueNames.map((name) => ({ id: slugify(name), name }));
    const merged = [...DEFAULT_DEPARTMENTS];
    derivedDepartments.forEach((department) => {
      if (!merged.some((item) => item.id === department.id)) {
        merged.push(department);
      }
    });
    return merged;
  } catch (error) {
    console.warn('Не удалось получить подразделения из API.', error);
    return [...DEFAULT_DEPARTMENTS];
  }
};

const addDepartment = async (name) => {
  const trimmed = name.trim();
  if (!trimmed) return null;
  return { id: slugify(trimmed), name: trimmed };
};

const getRecords = async () => {
  try {
    const data = await fetchJson(API_URL, {}, API_URL_FALLBACK);
    if (!Array.isArray(data.rows)) return [];
    return data.rows.map(mapRowToRecord);
  } catch (error) {
    console.warn('Не удалось получить записи из API.', error);
    return [];
  }
};

const saveRecord = async (record) => {
  const payload = {
    point: record.departmentName || '',
    mechanic: record.mechanic || '',
    client_name: record.client || '',
    car: record.car || '',
    phone: record.phone || '',
    purpose: record.visitPurpose || '',
    status: record.serviceStatus || '',
    refuse_reason: record.notServedReason || '',
    comment: record.comment || '',
  };
  const result = await sendRequest(payload);
  if (!result.ok) {
    throw new Error(result.error || 'Не удалось сохранить запись.');
  }
  return result;
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
