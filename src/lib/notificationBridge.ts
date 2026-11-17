/**
 * src/lib/notificationBridge.ts
 *
 * Bridge entre el módulo nativo Android (NotificationModule / NotificationService)
 * y el código TypeScript de la app.
 *
 * Uso:
 *   import { NotificationBridge } from './notificationBridge';
 *
 *   // Comprobar si el permiso está activo
 *   const enabled = await NotificationBridge.isEnabled();
 *
 *   // Pedir al usuario que lo habilite en ajustes
 *   NotificationBridge.openSettings();
 *
 *   // Escuchar notificaciones entrantes
 *   const sub = NotificationBridge.addListener(notif => console.log(notif));
 *   sub.remove(); // para limpiar
 */

import {NativeModules, NativeEventEmitter, Platform, EmitterSubscription} from 'react-native';

export interface IncomingNotification {
  appName: string;
  packageName: string;
  title: string;
  text: string;
  bigText: string;
  subText: string;
  /** Timestamp Unix en ms */
  receivedAt: number;
}

const {NotificationModule} = NativeModules;

/** Nombre del evento emitido por NotificationService.kt */
const EVENT_NAME = 'onNotificationReceived';

let emitter: NativeEventEmitter | null = null;

function getEmitter(): NativeEventEmitter | null {
  if (Platform.OS !== 'android') return null;
  if (!NotificationModule) return null;
  if (!emitter) {
    emitter = new NativeEventEmitter(NotificationModule);
  }
  return emitter;
}

export const NotificationBridge = {
  /**
   * Verifica si el Notification Listener está habilitado en ajustes del sistema.
   * Siempre retorna false en plataformas distintas de Android.
   */
  isEnabled: async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !NotificationModule) return false;
    return NotificationModule.isNotificationListenerEnabled();
  },

  /**
   * Abre la pantalla de ajustes del sistema para que el usuario active el permiso.
   */
  openSettings: () => {
    if (Platform.OS === 'android' && NotificationModule) {
      NotificationModule.openNotificationListenerSettings();
    }
  },

  /**
   * Suscribe un callback a notificaciones entrantes.
   * @returns objeto con método `.remove()` para cancelar la suscripción.
   */
  addListener: (
    callback: (notification: IncomingNotification) => void,
  ): EmitterSubscription | {remove: () => void} => {
    const ev = getEmitter();
    if (!ev) return {remove: () => {}};
    return (ev as any).addListener(EVENT_NAME, callback);
  },
};
