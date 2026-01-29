const DEPARTMENTS = [
  { id: 'branch-1', name: 'Мневники' },
  { id: 'branch-2', name: 'Куркино' },
  { id: 'branch-3', name: 'Прошлякова' },
  { id: 'branch-4', name: 'Кирова' },
  { id: 'branch-5', name: 'Солнцево' },
];

const STORAGE_KEY = 'liveQueueRecords';

const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
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
