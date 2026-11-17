/**
 * src/lib/locationBridge.ts
 *
 * Bridge para interactuar con LocationModule nativo.
 */

import {NativeModules, Platform, PermissionsAndroid} from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  batteryLevel: number;
  timestamp: number;
}

const {LocationModule} = NativeModules;

export const LocationBridge = {
  requestLocationPermission: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de Ubicación en Tiempo Real',
          message:
            'Tu espacio privado sincroniza la ubicación compartida para que ambos puedan cuidarse y saber dónde están.',
          buttonPositive: 'Aceptar',
          buttonNegative: 'Cancelar',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      return false;
    }
  },

  getCurrentLocation: async (): Promise<LocationData | null> => {
    if (Platform.OS !== 'android' || !LocationModule) {
      return null;
    }
    try {
      return await LocationModule.getCurrentLocation();
    } catch (err) {
      console.warn('Error getting device location:', err);
      return null;
    }
  },

  startLocationService: () => {
    if (Platform.OS === 'android' && LocationModule?.startLocationService) {
      LocationModule.startLocationService();
    }
  },

  stopLocationService: () => {
    if (Platform.OS === 'android' && LocationModule?.stopLocationService) {
      LocationModule.stopLocationService();
    }
  },
};
