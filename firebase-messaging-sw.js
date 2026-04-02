importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

// 🚨 Use your EXACT Firebase Config here
firebase.initializeApp({
    apiKey: "AIzaSyDFHskUWiyHhZke3KT9kkOtFI_gPsKfiGo",
    authDomain: "itzhoyoo-f9f7e.firebaseapp.com",
    databaseURL: "https://itzhoyoo-f9f7e-default-rtdb.firebaseio.com",
    projectId: "itzhoyoo-f9f7e",
    storageBucket: "itzhoyoo-f9f7e.firebasestorage.app",
    messagingSenderId: "1055745142104",
    appId: "1:1055745142104:web:8651c6b16e108871408db0"
});

const messaging = firebase.messaging();

// This handles the notification when the app is closed/in background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // or your tournament logo URL
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
