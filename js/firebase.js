const initFirebase = () => {
  if (typeof firebase === 'undefined') return null;
  if (!window.firebaseConfig) return null;

  try {
    firebase.initializeApp(window.firebaseConfig);
    return firebase.firestore();
  } catch (error) {
    if (error.code === 'app/duplicate-app') {
      return firebase.firestore();
    }
    console.warn('Firebase init failed', error);
    return null;
  }
};

window.firebaseDb = initFirebase();
