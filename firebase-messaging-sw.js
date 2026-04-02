importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

// USE YOUR EXACT CONFIG HERE
firebase.initializeApp({
    apiKey: "AIzaSyDFHskUWiyHhZke3KT9kkOtFI_gPsKfiGo",
    projectId: "itzhoyoo-f9f7e",
    messagingSenderId: "1055745142104",
    appId: "1:1055745142104:web:8651c6b16e108871408db0"
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || 'https://i.imgur.com/0HqPbxn_d.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
