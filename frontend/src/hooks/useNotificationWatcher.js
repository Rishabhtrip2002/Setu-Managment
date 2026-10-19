import { useEffect, useState, useCallback, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  checkAndNotifyDueFollowUps, 
  sendBrowserNotification,
  playNotificationChime,
  isNotificationSupported 
} from '../services/notificationService';

export const useNotificationWatcher = (onTaskClick = null) => {
  const { followUps, getTodayDateString } = useCRM();
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const timerRef = useRef(null);

  // Sync permission state
  const refreshPermission = useCallback(() => {
    const current = getNotificationPermission();
    setPermission(current);
    return current;
  }, []);

  // Request permission helper
  const enableNotifications = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermission(res.permission);
    return res;
  }, []);

  // Send a test notification
  const sendTestNotification = useCallback(() => {
    playNotificationChime();
    sendBrowserNotification('📞 Test Call & Follow-up Alert', {
      body: 'Notifications are working! You will be alerted when calls or follow-ups are due.',
      tag: 'test_notification_manual',
      silent: false
    });
  }, []);

  // Check due follow-ups whenever follow-ups change or every 60 seconds
  useEffect(() => {
    if (!followUps || followUps.length === 0) return;

    const runCheck = () => {
      const today = getTodayDateString ? getTodayDateString() : '';
      checkAndNotifyDueFollowUps(followUps, today, (task) => {
        if (onTaskClick) {
          onTaskClick(task);
        }
      });
    };

    // Run initial check
    runCheck();

    // Run check every 60 seconds
    timerRef.current = setInterval(runCheck, 60000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [followUps, getTodayDateString, onTaskClick]);

  return {
    permission,
    isSupported: isNotificationSupported(),
    enableNotifications,
    refreshPermission,
    sendTestNotification
  };
};

export default useNotificationWatcher;
