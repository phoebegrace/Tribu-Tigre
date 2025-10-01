// Replace with your Firebase config
// Get this from Firebase Console > Project settings > General > Your apps
window.firebaseConfig = {
  apiKey: "AIzaSyBpIXhE7vebD-GqTxsK-cCWg84VM1SZDmo",
  authDomain: "tributigre-d7006.firebaseapp.com",
  projectId: "tributigre-d7006",
  storageBucket: "tributigre-d7006.firebasestorage.app",
  messagingSenderId: "341539964799",
  appId: "1:341539964799:web:0475085787c7e6f9dcbc4a",
  measurementId: "G-H4S73Z5H6L"
};

if (!firebase.apps.length) {
  firebase.initializeApp(window.firebaseConfig);
}
