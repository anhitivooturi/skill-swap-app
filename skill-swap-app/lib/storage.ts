import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export async function uploadProfilePhoto(uid: string, uri: string) {
  const res = await fetch(uri);
  const blob = await res.blob();
  const path = `users/${uid}/profile.jpg`;
  const r = ref(storage, path);
  await uploadBytes(r, blob);
  return await getDownloadURL(r);
}
