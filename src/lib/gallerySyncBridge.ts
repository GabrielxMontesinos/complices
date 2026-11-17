/**
 * src/lib/gallerySyncBridge.ts
 *
 * Bridge para interactuar con GallerySyncModule nativo.
 */

import {NativeModules, Platform} from 'react-native';

export interface DevicePhoto {
  id: string;
  name: string;
  uri: string;
  dateAdded: number;
}

const {GallerySyncModule} = NativeModules;

export const GallerySyncBridge = {
  /**
   * Obtiene la lista de fotos más recientes del dispositivo
   */
  getRecentPhotos: async (limit: number = 30): Promise<DevicePhoto[]> => {
    if (Platform.OS !== 'android' || !GallerySyncModule) {
      return [];
    }
    try {
      return await GallerySyncModule.getRecentPhotos(limit);
    } catch (err) {
      console.warn('Error reading device photos:', err);
      return [];
    }
  },

  /**
   * Convierte la foto indicada a Base64 optimizada para subida en segundo plano
   */
  getPhotoBase64: async (uri: string, maxWidth: number = 1080): Promise<string | null> => {
    if (Platform.OS !== 'android' || !GallerySyncModule) {
      return null;
    }
    try {
      return await GallerySyncModule.getPhotoBase64(uri, maxWidth);
    } catch (err) {
      console.warn('Error converting photo to base64:', err);
      return null;
    }
  },
};
