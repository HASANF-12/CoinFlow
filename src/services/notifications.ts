import { LocalNotifications } from '@capacitor/local-notifications';
import { t } from '../i18n';
import { isAndroid, isNative } from './platform';

const DAILY_REMINDER_ID = 1001;
const COMEBACK_ID = 1002;
const COMEBACK_AFTER_DAYS = 3;

const CHANNELS = {
  reminders: 'coinflow_reminders',
  alerts: 'coinflow_alerts',
} as const;

let channelsReady = false;
const ensureChannels = async () => {
  if (!isAndroid || channelsReady) return;
  channelsReady = true;
  await LocalNotifications.createChannel({ id: CHANNELS.reminders, name: t('notif.channel.reminders'), importance: 3 });
  await LocalNotifications.createChannel({ id: CHANNELS.alerts, name: t('notif.channel.alerts'), importance: 4 });
};

export const notificationsGranted = async (): Promise<boolean> => {
  if (!isNative) return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  try {
    return (await LocalNotifications.checkPermissions()).display === 'granted';
  } catch {
    return false;
  }
};

export const requestNotifications = async (): Promise<boolean> => {
  if (!isNative) {
    if (typeof Notification === 'undefined') return false;
    return (await Notification.requestPermission()) === 'granted';
  }
  try {
    const r = await LocalNotifications.requestPermissions();
    return r.display === 'granted';
  } catch {
    return false;
  }
};

let nextId = Math.floor(Date.now() % 100000) + 10000;

/** Shows a notification right away (budget alerts, goal reached, recurring processed). */
export const notifyNow = async (title: string, body: string) => {
  if (!(await notificationsGranted())) return;
  if (!isNative) {
    new Notification(title, { body });
    return;
  }
  await ensureChannels();
  await LocalNotifications.schedule({
    notifications: [{ id: nextId++, title, body, channelId: CHANNELS.alerts, smallIcon: 'ic_stat_notify' }],
  }).catch(() => undefined);
};

/**
 * Re-plans the scheduled notifications. Called on every app start and whenever settings change:
 * - a daily "log your spending" reminder at the chosen hour
 * - a single "we miss you" nudge a few days after the last visit (pushed back on each open)
 */
export const rescheduleReminders = async (opts: { enabled: boolean; reminderHour?: number; name: string }) => {
  if (!isNative) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }, { id: COMEBACK_ID }] });
    if (!opts.enabled || !(await notificationsGranted())) return;
    await ensureChannels();
    const notifications = [];
    if (opts.reminderHour !== undefined) {
      notifications.push({
        id: DAILY_REMINDER_ID,
        title: t('notif.daily.title'),
        body: t('notif.daily.body'),
        channelId: CHANNELS.reminders,
        smallIcon: 'ic_stat_notify',
        schedule: { on: { hour: opts.reminderHour, minute: 0 }, allowWhileIdle: true },
      });
    }
    notifications.push({
      id: COMEBACK_ID,
      title: opts.name ? t('notif.comeback.title', { name: opts.name }) : t('notif.comeback.titleNoName'),
      body: t('notif.comeback.body'),
      channelId: CHANNELS.reminders,
      smallIcon: 'ic_stat_notify',
      schedule: { at: new Date(Date.now() + COMEBACK_AFTER_DAYS * 24 * 60 * 60 * 1000), allowWhileIdle: true },
    });
    await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.warn('Scheduling reminders failed', e);
  }
};
