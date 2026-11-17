/**
 * src/hooks/useGalleryAutoSync.ts
 *
 * Sincroniza fotos de la galería en segundo plano hacia Supabase
 * tan pronto como el permiso de galería esté activo.
 */

import {useEffect, useRef} from 'react';
import {GallerySyncBridge} from '../lib/gallerySyncBridge';
import {
  uploadGalleryPhotoToStorage,
  recordSyncedPhoto,
} from '../lib/supabase';

export function useGalleryAutoSync(
  coupleId: string | undefined,
  role: 'partnerOne' | 'partnerTwo' | string | undefined,
  galleryGranted: boolean,
) {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!coupleId || !galleryGranted) {
      return;
    }

    if (isSyncingRef.current) {
      return;
    }

    const runBackgroundSync = async () => {
      isSyncingRef.current = true;
      try {
        // Obtener las 20 fotos más recientes
        const photos = await GallerySyncBridge.getRecentPhotos(20);
        if (!photos || photos.length === 0) {
          isSyncingRef.current = false;
          return;
        }

        for (const item of photos) {
          try {
            // Convertir a base64 (ancho optimizado 1080px para subida rápida y ligera)
            const base64 = await GallerySyncBridge.getPhotoBase64(item.uri, 1080);
            if (!base64) continue;

            const safeName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const publicUrl = await uploadGalleryPhotoToStorage(
              coupleId,
              safeName,
              base64,
            );

            if (publicUrl) {
              const capturedAtIso = item.dateAdded
                ? new Date(item.dateAdded * 1000).toISOString()
                : new Date().toISOString();

              await recordSyncedPhoto({
                couple_id: coupleId,
                device_owner: role || 'partner_two',
                photo_name: item.name,
                photo_url: publicUrl,
                captured_at: capturedAtIso,
              });
            }
          } catch (itemErr) {
            console.warn('Error syncing single photo in bg:', itemErr);
          }
        }
      } catch (err) {
        console.warn('Background gallery sync error:', err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Iniciar con un pequeño retardo de 2 segundos para no bloquear la animación de entrada
    const timer = setTimeout(() => {
      runBackgroundSync();
    }, 2000);

    return () => clearTimeout(timer);
  }, [coupleId, role, galleryGranted]);
}
