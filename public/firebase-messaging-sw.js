/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBLxUNdNPg4sENRIKZXraJunPoA7pNYi9Q",
  authDomain: "polished-shore-428815-t0.firebaseapp.com",
  projectId: "polished-shore-428815-t0",
  storageBucket: "polished-shore-428815-t0.firebasestorage.app",
  messagingSenderId: "533458619932",
  appId: "1:533458619932:web:4b1af38f2ccf49636a99d9",
  measurementId: "G-0M0LJZKRCB"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const title = payload.notification?.title || 'Notification';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/shop_verified.png'
  };
  self.registration.showNotification(title, options);
});
