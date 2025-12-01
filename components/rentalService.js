import { db } from "../firebaseConfig";
import { collection, doc, setDoc, getDoc, getDocs, updateDoc } from "firebase/firestore";

export const createRental = async (data) => {
  const ref = doc(collection(db, "rentals"));
  await setDoc(ref, { ...data, id: ref.id, createdAt: new Date() });
  return ref.id;
};

export const getRentalByDevice = async (deviceId) => {
  const snapshot = await getDocs(collection(db, "rentals"));
  let rental = null;

  snapshot.forEach((docu) => {
    if (docu.data().deviceId === deviceId) rental = docu.data();
  });

  return rental;
};

export const renewRental = async (id, newEndDate) => {
  const ref = doc(db, "rentals", id);
  await updateDoc(ref, {
    endDate: newEndDate,
    renewedTimes: increment(1),
  });
};
