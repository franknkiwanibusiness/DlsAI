importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDFHskUWiyHhZke3KT9kkOtFI_gPsKfiGo",
    authDomain: "itzhoyoo-f9f7e.firebaseapp.com",
    databaseURL: "https://itzhoyoo-f9f7e-default-rtdb.firebaseio.com",
    projectId: "itzhoyoo-f9f7e",
    messagingSenderId: "1055745142104" // Replace this with your actual Sender ID from Firebase Settings
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://i.imgur.com/gzFKr1u.png' // Your DLS26 Logo
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
