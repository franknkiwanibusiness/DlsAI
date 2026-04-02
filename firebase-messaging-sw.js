importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDFHskUWiyHhZke3KT9kkOtFI_gPsKfiGo",
    projectId: "itzhoyoo-f9f7e",
    messagingSenderId: "774136582531", 
    appId: "1:774136582531:web:..." 
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const title = payload.notification.title;
    const options = {
        body: payload.notification.body,
        icon: 'https://i.imgur.com/gzFKr1u.png', // Your UCL Logo
    };
    self.registration.showNotification(title, options);
});
