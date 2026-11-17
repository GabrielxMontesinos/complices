/**
 * src/hooks/useNotificationLogger.ts
 *
 * Hook que:
 * 1. Verifica si el Notification Listener está activo.
 * 2. Se suscribe a notificaciones entrantes via NotificationBridge.
 * 3. Las guarda automáticamente en Supabase (tabla notification_logs).
 *
 * Uso en un componente:
 *   const { isEnabled, openSettings, logs, clearLogs } =
 *     useNotificationLogger(coupleId);
 */

import {useState, useEffect, useCallback, useRef} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {NotificationBridge, IncomingNotification} from '../lib/notificationBridge';
import {
  insertNotificationLog,
  fetchNotificationLogs,
  clearNotificationLogs,
  SupabaseNotificationLog,
} from '../lib/supabase';

export interface UseNotificationLoggerResult {
  /** Si el Notification Listener está habilitado en ajustes del sistema */
  isEnabled: boolean;
  /** Abre la pantalla de ajustes del sistema para activar el permiso */
  openSettings: () => void;
  /** Logs cargados desde Supabase */
  logs: SupabaseNotificationLog[];
  /** Recarga los logs desde Supabase */
  refreshLogs: () => Promise<void>;
  /** Borra todos los logs del couple en Supabase */
  clearLogs: () => Promise<void>;
  loading: boolean;
}

export function useNotificationLogger(
  coupleId: string | undefined,
): UseNotificationLoggerResult {
  const [isEnabled, setIsEnabled] = useState(false);
  const [logs, setLogs] = useState<SupabaseNotificationLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Verificar permiso al montar y cuando la app vuelve al primer plano
  const checkEnabled = useCallback(async () => {
    const enabled = await NotificationBridge.isEnabled();
    setIsEnabled(enabled);
  }, []);

  useEffect(() => {
    checkEnabled();
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkEnabled();
    });
    return () => sub.remove();
  }, [checkEnabled]);

  // Cargar logs históricos desde Supabase
  const refreshLogs = useCallback(async () => {
    if (!coupleId) return;
    setLoading(true);
    try {
      const data = await fetchNotificationLogs(coupleId);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  // Suscribirse a notificaciones entrantes y guardarlas en Supabase
  const coupleIdRef = useRef(coupleId);
  coupleIdRef.current = coupleId;

  useEffect(() => {
    if (!isEnabled) return;

    const sub = NotificationBridge.addListener(
      async (notif: IncomingNotification) => {
        const cid = coupleIdRef.current;
        if (!cid) return;

        try {
          const saved = await insertNotificationLog({
            couple_id: cid,
            app_name: notif.appName,
            package_name: notif.packageName,
            title: notif.title || null,
            text: notif.text || null,
            big_text: notif.bigText || null,
            sub_text: notif.subText || null,
            received_at: new Date(notif.receivedAt).toISOString(),
          });
          // Agregar al inicio de la lista local
          setLogs(prev => [saved, ...prev].slice(0, 100));
        } catch (err) {
          console.warn('useNotificationLogger: error saving notification', err);
        }
      },
    );

    return () => sub.remove();
  }, [isEnabled]);

  const clearLogs = useCallback(async () => {
    if (!coupleId) return;
    await clearNotificationLogs(coupleId);
    setLogs([]);
  }, [coupleId]);

  return {
    isEnabled,
    openSettings: NotificationBridge.openSettings,
    logs,
    refreshLogs,
    clearLogs,
    loading,
  };
}
