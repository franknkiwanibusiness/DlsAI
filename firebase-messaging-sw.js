importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDFHskUWiyHhZke3KT9kkOtFI_gPsKfiGo",
  projectId: "itzhoyoo-f9f7e",
  messagingSenderId: "1094792075584",
  appId: "1:1094792075584:web:d49e9c3f899d3cd31082a5",
});

const messaging = firebase.messaging();

// Handles notifications when the app is in the background or closed
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
