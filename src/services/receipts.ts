import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Directory, Filesystem } from '@capacitor/filesystem';
import type { Transaction } from '../domain/types';
import { newId } from '../domain/types';
import { isNative } from './platform';

const DIR = 'receipts';
const MAX_SIDE = 1600;
const QUALITY = 0.7;

/** Shrinks a photo before saving; phone cameras produce 3-8 MB images. */
const compress = (dataUrl: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', QUALITY));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

const pickOnWeb = (): Promise<string | null> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.readAsDataURL(file);
    };
    input.click();
  });

/** Saves a data URL as a file and returns its path (native), or keeps the data URL (web). */
export const storeReceipt = async (dataUrl: string): Promise<string> => {
  const small = await compress(dataUrl);
  if (!isNative) return small;
  const path = `${DIR}/${newId()}.jpg`;
  await Filesystem.writeFile({ path, directory: Directory.Data, data: small.split(',')[1], recursive: true });
  return path;
};

/** Opens the camera or gallery. Returns the stored receipt reference, or null if cancelled. */
export const captureReceipt = async (source: 'camera' | 'gallery'): Promise<string | null> => {
  try {
    if (!isNative) {
      const dataUrl = await pickOnWeb();
      return dataUrl ? storeReceipt(dataUrl) : null;
    }
    const photo = await Camera.getPhoto({
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      resultType: CameraResultType.DataUrl,
      quality: 80,
      width: MAX_SIDE,
      correctOrientation: true,
      allowEditing: false,
    });
    return photo.dataUrl ? storeReceipt(photo.dataUrl) : null;
  } catch {
    return null; // cancelled or permission denied
  }
};

const isFileRef = (receipt: string) => !receipt.startsWith('data:');

/** Resolves a receipt reference into something an <img> can display. */
export const receiptSrc = async (receipt: string): Promise<string> => {
  if (!isFileRef(receipt)) return receipt;
  const { uri } = await Filesystem.getUri({ path: receipt, directory: Directory.Data });
  return Capacitor.convertFileSrc(uri);
};

export const deleteReceipt = async (receipt: string | undefined) => {
  if (!receipt || !isFileRef(receipt) || !isNative) return;
  try {
    await Filesystem.deleteFile({ path: receipt, directory: Directory.Data });
  } catch {
    /* already gone */
  }
};

/**
 * v1 embedded receipts as base64 inside the data blob, which filled WebView storage and
 * silently stopped saves. Moves them to files. Returns the same array when nothing changed.
 */
export const externalizeReceipts = async (transactions: Transaction[]): Promise<Transaction[]> => {
  if (!isNative || !transactions.some((t) => t.receipt?.startsWith('data:'))) return transactions;
  const out: Transaction[] = [];
  for (const tx of transactions) {
    if (tx.receipt?.startsWith('data:')) {
      try {
        out.push({ ...tx, receipt: await storeReceipt(tx.receipt) });
        continue;
      } catch {
        /* keep inline if the write fails */
      }
    }
    out.push(tx);
  }
  return out;
};
