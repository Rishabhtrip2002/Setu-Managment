/**
 * Setu CRM — Browser Push Notification & Audio Alert Service
 * Handles:
 * - Permission requests (Onscreen & Native)
 * - Browser Push Notifications (Web Notification API & ServiceWorker)
 * - Audio Chime Alert Synthesizer (Native Web Audio API, zero dependencies)
 * - Automated Follow-up & Scheduled Calls Watcher
 */

// Key for session deduplication so the user isn't spammed for the same task
const NOTIFIED_CACHE_KEY = 'setu_crm_notified_alerts_cache';
const PERM_DISMISSED_KEY = 'setu_crm_perm_prompt_dismissed';

/**
 * Check if the browser supports notifications
 */
export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current browser notification permission
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return { success: false, permission: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Clear dismissal flag if granted
      try {
        sessionStorage.removeItem(PERM_DISMISSED_KEY);
      } catch (e) {}
      // Play confirmation chime
      playNotificationChime();
      // Send welcome test notification
      sendBrowserNotification('🎉 Notifications Activated!', {
        body: 'You will receive timely alerts for upcoming follow-ups and scheduled calls.',
        tag: 'setu_welcome_notification',
        silent: false
      });
      return { success: true, permission: 'granted' };
    }
    return { success: false, permission };
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return { success: false, permission: Notification.permission };
  }
};

/**
 * Check if user previously dismissed onscreen permission prompt in this session
 */
export const isPermissionPromptDismissed = () => {
  try {
    return sessionStorage.getItem(PERM_DISMISSED_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

/**
 * Mark permission prompt dismissed for the current session
 */
export const dismissPermissionPrompt = () => {
  try {
    sessionStorage.setItem(PERM_DISMISSED_KEY, 'true');
  } catch (e) {}
};

/**
 * Native Web Audio API Chime Synthesizer
 * Generates an elegant, crystal-clear two-tone chime without external MP3 files
 */
export const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: 784 Hz (G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2: 1046.5 Hz (C6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (err) {
    // Audio synthesis fallback (silent)
  }
};

/**
 * Dispatch a Browser Notification
 * @param {string} title
 * @param {NotificationOptions} options
 */
export const sendBrowserNotification = (title, options = {}) => {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    // Play chime sound unless explicitly silenced
    if (options.silent !== true) {
      playNotificationChime();
    }

    const defaultOptions = {
      icon: '/SETULOGO.png',
      badge: '/SETULOGO.png',
      dir: 'auto',
      renotify: true,
      tag: options.tag || `setu_alert_${Date.now()}`,
      ...options
    };

    // Try serviceWorker registration first (for PWA / background support)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, defaultOptions).catch(() => {
          // Fallback to standard window Notification
          const n = new Notification(title, defaultOptions);
          n.onclick = () => {
            window.focus();
            if (options.onClick) options.onClick();
            n.close();
          };
        });
      }).catch(() => {
        const n = new Notification(title, defaultOptions);
        n.onclick = () => {
          window.focus();
          if (options.onClick) options.onClick();
          n.close();
        };
      });
      return true;
    }

    // Standard Notification constructor
    const notification = new Notification(title, defaultOptions);
    notification.onclick = () => {
      window.focus();
      if (options.onClick) options.onClick();
      notification.close();
    };
    return notification;
  } catch (err) {
    console.warn('Failed to send browser notification:', err);
    return null;
  }
};

/**
 * Get IDs of follow-ups that have already been notified today
 */
const getNotifiedTaskIds = () => {
  try {
    const raw = sessionStorage.getItem(NOTIFIED_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Mark a task ID as notified in this session
 */
const markTaskAsNotified = (taskId) => {
  try {
    const ids = getNotifiedTaskIds();
    if (!ids.includes(taskId)) {
      ids.push(taskId);
      sessionStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(ids));
    }
  } catch (e) {}
};

/**
 * Check follow-ups and trigger push notifications for due items
 * @param {Array} followUps - List of follow-ups from CRMContext
 * @param {string} today - Today's date YYYY-MM-DD
 * @param {function} onNotificationTriggered - Optional callback for on-screen notification
 */
export const checkAndNotifyDueFollowUps = (followUps = [], today = '', onNotificationTriggered = null) => {
  if (!Array.isArray(followUps) || followUps.length === 0) return 0;
  if (!today) {
    const now = new Date();
    today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  const alreadyNotified = getNotifiedTaskIds();

  // Find pending follow-ups due today or overdue that haven't been notified yet
  const dueItems = followUps.filter(f => 
    f.status === 'Pending' &&
    f.dueDate <= today &&
    !alreadyNotified.includes(f.id)
  );

  if (dueItems.length === 0) return 0;

  let notifiedCount = 0;

  // Process up to 2 due items at a time to avoid notification spam
  const toNotify = dueItems.slice(0, 2);

  toNotify.forEach((task) => {
    markTaskAsNotified(task.id);
    notifiedCount++;

    const isCall = task.type === 'Call' || (task.title && task.title.toLowerCase().includes('call'));
    const title = isCall 
      ? `📞 Scheduled Call Due: ${task.leadName || 'Prospect'}`
      : `🔔 Follow-up Reminder: ${task.leadName || 'Client'}`;

    const body = `${task.title || 'Follow-up Due'}\n${task.dueTime ? `⏰ Time: ${task.dueTime}` : ''} ${task.notes ? `• "${task.notes.slice(0, 60)}..."` : ''}`;

    // 1. Send native browser push notification
    sendBrowserNotification(title, {
      body,
      tag: `fu_${task.id}`,
      onClick: () => {
        if (onNotificationTriggered) {
          onNotificationTriggered(task);
        }
      }
    });

    // 2. Trigger on-screen callback if provided
    if (onNotificationTriggered) {
      onNotificationTriggered(task);
    }
  });

  return notifiedCount;
};
