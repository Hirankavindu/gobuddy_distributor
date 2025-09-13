// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyD4IXvVLhejEpkI8sRr7mVawXlTmgihp74",
    authDomain: "gobuddy-95150.firebaseapp.com",
    projectId: "gobuddy-95150",
    storageBucket: "gobuddy-95150.firebasestorage.app",
    messagingSenderId: "420847925074",
    appId: "1:420847925074:web:6ffe9c6eeb611d54f42c8b",
    measurementId: "G-P5P3WLMEVK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);