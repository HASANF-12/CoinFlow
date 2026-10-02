import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { looksLikeV1, migrateV1, parseV2 } from '../domain/migrate';
import type { AppData } from '../domain/types';
import { isNative, safeStorage } from './platform';

/** Where v1.x kept everything. Left untouched after migration as a safety net. */
export const V1_KEY = 'moneyflow_app_v1';
const WEB_KEY = 'coinflow_v2';
const FILE = 'coinflow-data.json';
const TMP = 'coinflow-data.tmp';
const SNAPSHOT_DIR = 'snapshots';
const SNAPSHOTS_KEPT = 7;

export interface LoadResult {
  data: AppData | null;
  source: 'v2' | 'v1' | 'snapshot' | 'none';
  legacyPin?: string;
}

const readText = async (path: string): Promise<string | null> => {
  try {
    const r = await Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 });
    return typeof r.data === 'string' ? r.data : null;
  } catch {
    return null;
  }
};

const tryParse = (text: string | null): AppData | null => {
  if (!text) return null;
  try {
    return parseV2(JSON.parse(text));
  } catch {
    return null;
  }
};

const latestSnapshot = async (): Promise<AppData | null> => {
  try {
    const { files } = await Filesystem.readdir({ path: SNAPSHOT_DIR, directory: Directory.Data });
    const names = files.map((f) => f.name).sort().reverse();
    for (const name of names) {
      const data = tryParse(await readText(`${SNAPSHOT_DIR}/${name}`));
      if (data) return data;
    }
  } catch {
    /* no snapshots yet */
  }
  return null;
};

export const loadData = async (): Promise<LoadResult> => {
  if (isNative) {
    // TMP exists alone only if the app died between deleting FILE and renaming TMP.
    const data = tryParse(await readText(FILE)) ?? tryParse(await readText(TMP));
    if (data) return { data, source: 'v2' };
    const snap = await latestSnapshot();
    if (snap) return { data: snap, source: 'snapshot' };
  } else {
    const data = tryParse(safeStorage.get(WEB_KEY));
    if (data) return { data, source: 'v2' };
  }

  const v1 = safeStorage.get(V1_KEY);
  if (v1) {
    try {
      const raw = JSON.parse(v1);
      if (looksLikeV1(raw) || raw?.user) {
        const { data, legacyPin } = migrateV1(raw, cachedRatesForMigration());
        return { data, source: 'v1', legacyPin };
      }
    } catch {
      /* unreadable v1 data: start fresh rather than crash */
    }
  }
  return { data: null, source: 'none' };
};

const cachedRatesForMigration = () => {
  try {
    return JSON.parse(safeStorage.get('coinflow_exchange_rates') ?? '{}').rates ?? {};
  } catch {
    return {};
  }
};

const writeNative = async (json: string) => {
  await Filesystem.writeFile({ path: TMP, directory: Directory.Data, data: json, encoding: Encoding.UTF8 });
  try {
    await Filesystem.deleteFile({ path: FILE, directory: Directory.Data });
  } catch {
    /* first save */
  }
  await Filesystem.rename({ from: TMP, to: FILE, directory: Directory.Data, toDirectory: Directory.Data });
};

const todayKey = () => new Date().toISOString().slice(0, 10);
let lastSnapshotDay = '';

/** Keeps one copy per day for the last week, so a bad write or bad import is recoverable. */
const snapshot = async (json: string) => {
  const day = todayKey();
  if (day === lastSnapshotDay) return;
  lastSnapshotDay = day;
  try {
    await Filesystem.writeFile({
      path: `${SNAPSHOT_DIR}/${day}.json`,
      directory: Directory.Data,
      data: json,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    const { files } = await Filesystem.readdir({ path: SNAPSHOT_DIR, directory: Directory.Data });
    const old = files.map((f) => f.name).sort().reverse().slice(SNAPSHOTS_KEPT);
    await Promise.all(old.map((name) => Filesystem.deleteFile({ path: `${SNAPSHOT_DIR}/${name}`, directory: Directory.Data })));
  } catch (e) {
    console.warn('Snapshot failed', e);
  }
};

let pending: AppData | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let writing: Promise<void> = Promise.resolve();

const flushNow = async () => {
  if (!pending) return;
  const json = JSON.stringify(pending);
  pending = null;
  if (isNative) {
    writing = writing.then(async () => {
      try {
        await writeNative(json);
        await snapshot(json);
      } catch (e) {
        console.error('Saving data failed', e);
      }
    });
    await writing;
  } else {
    safeStorage.set(WEB_KEY, json);
  }
};

export const saveData = (data: AppData) => {
  pending = data;
  clearTimeout(timer);
  timer = setTimeout(flushNow, 300);
};

/** Called when the app goes to background so nothing is lost if Android kills it. */
export const flushData = () => {
  clearTimeout(timer);
  return flushNow();
};

export const wipeAllLocalData = async () => {
  pending = null;
  clearTimeout(timer);
  if (isNative) {
    for (const path of [FILE, TMP]) {
      try {
        await Filesystem.deleteFile({ path, directory: Directory.Data });
      } catch {
        /* missing */
      }
    }
    for (const dir of [SNAPSHOT_DIR, 'receipts']) {
      try {
        await Filesystem.rmdir({ path: dir, directory: Directory.Data, recursive: true });
      } catch {
        /* missing */
      }
    }
  }
  safeStorage.remove(WEB_KEY);
  safeStorage.remove(V1_KEY);
};
