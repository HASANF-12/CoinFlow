import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { isNative } from './platform';

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export const newSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);

/** PBKDF2 so the PIN is never stored in plain text (v1 stored it as-is). */
export const hashPin = async (pin: string, salt: string): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120_000, hash: 'SHA-256' },
    key,
    256,
  );
  return toHex(bits);
};

export const verifyPin = async (pin: string, hash: string, salt: string) => (await hashPin(pin, salt)) === hash;

export interface DeviceAuth {
  /** Fingerprint/face available and enrolled. */
  biometry: boolean;
  /** Any secure lock (biometric, or device PIN/pattern/password). */
  deviceSecure: boolean;
}

export const checkDeviceAuth = async (): Promise<DeviceAuth> => {
  if (!isNative) return { biometry: false, deviceSecure: false };
  try {
    const r = await BiometricAuth.checkBiometry();
    return { biometry: r.isAvailable && r.biometryType !== BiometryType.none, deviceSecure: r.deviceIsSecure };
  } catch {
    return { biometry: false, deviceSecure: false };
  }
};

/**
 * Prompts for fingerprint/face, or the phone's own screen lock when allowed.
 * Used both for quick unlock and as the "forgot PIN" recovery path.
 */
export const authenticateWithDevice = async (reason: string, allowDeviceCredential: boolean): Promise<boolean> => {
  if (!isNative) return false;
  try {
    await BiometricAuth.authenticate({
      reason,
      androidTitle: 'CoinFlow',
      androidSubtitle: reason,
      allowDeviceCredential,
      cancelTitle: 'Cancel',
    });
    return true;
  } catch {
    return false;
  }
};
