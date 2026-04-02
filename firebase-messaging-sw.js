import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-sw.js";

const firebaseConfig = { 
    apiKey: "AIzaSyDFHskUWiyHhZke3KT9kkOtFI_gPsKfiGo", 
    authDomain: "itzhoyoo-f9f7e.firebaseapp.com", 
    databaseURL: "https://itzhoyoo-f9f7e-default-rtdb.firebaseio.com", 
    projectId: "itzhoyoo-f9f7e",
    storageBucket: "itzhoyoo-f9f7e.firebasestorage.app",
    messagingSenderId: "1055745142104",
    appId: "1:1055745142104:web:8651c6b16e108871408db0"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png' // Replace with your logo path
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
