import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

export async function createArriendo(deviceId, userId, fechaInicio, fechaTermino) {
  await setDoc(doc(db, "arriendos", deviceId), {
    deviceId,
    userId,
    fechaInicio,
    fechaTermino,
    creadoEn: new Date(),
  });
}

export async function getArriendo(deviceId) {
  const ref = doc(db, "arriendos", deviceId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function updateArriendo(deviceId, data) {
  const ref = doc(db, "arriendos", deviceId);
  await updateDoc(ref, data);
}
