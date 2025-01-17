import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD5ry95ruqzgBUx1k9Ykn4yTC6_0ChnlZk",
  authDomain: "productscannerapp-14146.firebaseapp.com",
  projectId: "productscannerapp-14146",
  storageBucket: "productscannerapp-14146.firebasestorage.app",
  messagingSenderId: "903862842637",
  appId: "1:903862842637:web:cfa68864fdb763f21b2c44"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
