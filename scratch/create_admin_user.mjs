import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC8l6QDzwKnrEEafqrkYt4AEsExCZ51v0E",
  authDomain: "anand-hardware-f946b.firebaseapp.com",
  projectId: "anand-hardware-f946b",
  storageBucket: "anand-hardware-f946b.firebasestorage.app",
  messagingSenderId: "970626883701",
  appId: "1:970626883701:web:bda015c51c8c9fcd1d583c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const email = 'admin@anandhardware.com';
const password = 'AnandAdmin2026!';

async function setupAdmin() {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    console.log('SUCCESS: Created Admin User:', res.user.email, 'UID:', res.user.uid);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists. Attempting sign-in verification...');
      try {
        const signRes = await signInWithEmailAndPassword(auth, email, password);
        console.log('SUCCESS: Verified Admin Login for:', signRes.user.email);
      } catch (signErr) {
        console.error('Sign in error:', signErr.message);
      }
    } else {
      console.error('Error setting up admin user:', err.message);
    }
  }
}

setupAdmin();
