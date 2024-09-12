import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAEdhHLW8sxDKy0mBBwcXJy-oeI79EtVyg",
    authDomain: "giftcard-809f3.firebaseapp.com",
    projectId: "giftcard-809f3",
    storageBucket: "giftcard-809f3.appspot.com",
    messagingSenderId: "705440238101",
    appId: "1:705440238101:web:569ff2f3562f27c6695c1c",
    measurementId: "G-LHM209JX35"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, getFirestore };
