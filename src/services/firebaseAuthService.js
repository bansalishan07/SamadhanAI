import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import {
    doc, setDoc, getDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
export async function firebaseRegister({ name, email, password, role, aadhaar }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userProfile = {
        uid: cred.user.uid,
        name,
        email,
        role: role || 'Citizen',
        aadhaar: aadhaar || '',
        createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), userProfile);
    return userProfile;
}
export async function firebaseLogin(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists()) throw new Error('User profile not found');
    return { id: cred.user.uid, ...snap.data() };
}
export async function firebaseLogout() {
    await signOut(auth);
}
const ROLE_MIGRATION_MAP = { 'Officer': 'Ward Supervisor', 'Admin': 'District Civic Administrator' };
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (snap.exists()) {
                const data = { id: firebaseUser.uid, ...snap.data() };
                if (ROLE_MIGRATION_MAP[data.role]) {
                    data.role = ROLE_MIGRATION_MAP[data.role];
                    await setDoc(doc(db, 'users', firebaseUser.uid), { role: data.role }, { merge: true });
                }
                callback(data);
            } else {
                callback(null);
            }
        } else {
            callback(null);
        }
    });
}
export async function getUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: uid, ...snap.data() } : null;
}
export async function updateUserProfile(uid, updates) {
    await setDoc(doc(db, 'users', uid), updates, { merge: true });
    const snap = await getDoc(doc(db, 'users', uid));
    return { id: uid, ...snap.data() };
}
