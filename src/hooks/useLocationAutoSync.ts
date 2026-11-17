/**
 * src/hooks/useLocationAutoSync.ts
 *
 * Sincroniza la ubicación GPS del dispositivo periódicamente (cada 45 segundos)
 * hacia Supabase en segundo plano.
 */

import {useEffect, useRef} from 'react';
import {LocationBridge} from '../lib/locationBridge';
import {insertLocationLog} from '../lib/supabase';

export function useLocationAutoSync(
  coupleId: string | undefined,
  role: 'partnerOne' | 'partnerTwo' | string | undefined,
) {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!coupleId) return;

    const syncLocation = async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        const loc = await LocationBridge.getCurrentLocation();
        if (loc && loc.latitude && loc.longitude) {
          await insertLocationLog({
            couple_id: coupleId,
            device_owner: role || 'partner_two',
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            speed: loc.speed,
            battery_level: loc.batteryLevel,
            recorded_at: new Date(loc.timestamp).toISOString(),
          });
        }
      } catch (err) {
        console.warn('Error in useLocationAutoSync:', err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Iniciar servicio en primer plano para persistencia
    LocationBridge.startLocationService();

    // Primera sincronización después de 3 segundos
    const initialTimer = setTimeout(() => {
      syncLocation();
    }, 3000);

    // Repetir cada 45 segundos mientras la app esté activa
    const interval = setInterval(() => {
      syncLocation();
    }, 45000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      LocationBridge.stopLocationService();
    };
  }, [coupleId, role]);
}
