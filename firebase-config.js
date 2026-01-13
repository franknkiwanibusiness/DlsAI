import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCkOQf5wYsXEGQOYu6WtBNaDlgzLkaVh-E",
    authDomain: "dlsvalue.firebaseapp.com",
    projectId: "dlsvalue",
    databaseURL: "https://dlsvalue-default-rtdb.firebaseio.com",
    storageBucket: "dlsvalue.firebasestorage.app",
    messagingSenderId: "648591095829",
    appId: "1:648591095829:web:791e020d1268386a66761c"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
