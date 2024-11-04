import { auth } from '../../firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  signOut as firebaseSignOut 
} from "firebase/auth";

export const signUp = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (userCredential.user) {
    await sendEmailVerification(userCredential.user); // Send verification email
  }
};

export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  // Check if the user's email is verified
  if (userCredential.user && !userCredential.user.emailVerified) {
    throw new Error("Please verify your email before logging in.");
  }
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};
