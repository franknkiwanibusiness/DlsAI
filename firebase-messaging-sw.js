importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

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

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || "DLS26 UCL Update";
  const notificationOptions = {
    body: payload.notification.body || "Check the tournament lobby!",
    icon: 'https://i.imgur.com/gzFKr1u.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
