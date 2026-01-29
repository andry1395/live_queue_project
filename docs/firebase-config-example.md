# Firebase config (пример)

Ниже — типичный вид объекта `firebaseConfig`, который вы получаете в консоли Firebase
после добавления Web‑приложения.

```js
const firebaseConfig = {
  apiKey: "AIzaSyD-EXAMPLE_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890",
  measurementId: "G-ABCDEFGH12" // бывает не у всех проектов
};
```

Где взять эти ключи:
1. Откройте Firebase Console → Project settings.
2. В секции **Your apps** выберите Web‑приложение.
3. Скопируйте объект `firebaseConfig` из блока SDK setup.
