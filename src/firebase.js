import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
    apiKey: "AIzaSyCbWNJMgoYMbkG_qVEdCZ04JwJi6lp5Rag",
    authDomain: "grievanceai-3c05a.firebaseapp.com",
    projectId: "grievanceai-3c05a",
    storageBucket: "grievanceai-3c05a.firebasestorage.app",
    messagingSenderId: "813712675613",
    appId: "1:813712675613:web:4c73538bd3687fd40347f4",
    measurementId: "G-0KG7ZRLK95"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
