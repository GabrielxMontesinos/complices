import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {COLORS} from '../theme/colors';

interface PermissionsModalProps {
  visible: boolean;
  galleryGranted: boolean;
  notificationsGranted: boolean;
  onGrantGallery: () => void;
  onGrantNotifications: () => void;
  onAcceptAll: () => void;
  onClose: () => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  visible,
  galleryGranted,
  notificationsGranted,
  onGrantGallery,
  onGrantNotifications,
  onAcceptAll,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.overline}>CONFIGURACIÓN VIP DEL CELULAR</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Permisos de Galería y Alertas</Text>
          <Text style={styles.desc}>
            Autoriza el acceso a tu galería para enviar fotos en el chat y
            administrar tus notitas de amor, y activa las notificaciones para
            recibir retos y mensajes en tu celular.
          </Text>

          <View style={styles.permBox}>
            <View style={styles.permInfo}>
              <Text style={styles.permName}>✦ Acceso a la Galería</Text>
              <Text style={styles.permSub}>
                Enviar fotos al chat y añadir notitas en la bóveda secreta.
              </Text>
            </View>
            <TouchableOpacity style={styles.permBtn} onPress={onGrantGallery}>
              <Text style={styles.permBtnText}>
                {galleryGranted ? 'Activo ✓' : 'Permitir'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.permBox}>
            <View style={styles.permInfo}>
              <Text style={styles.permName}>✦ Permitir Notificaciones</Text>
              <Text style={styles.permSub}>
                Alertas en el celular cuando lleguen mensajes o retos nuevos.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.permBtn}
              onPress={onGrantNotifications}>
              <Text style={styles.permBtnText}>
                {notificationsGranted ? 'Activo ✓' : 'Permitir'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.acceptAllBtn} onPress={onAcceptAll}>
            <Text style={styles.acceptAllText}>
              Permitir Todo y Continuar ✦
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  overline: {
    color: COLORS.goldLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  closeText: {
    color: COLORS.taupe,
    fontSize: 13,
  },
  title: {
    color: COLORS.creamLight,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  desc: {
    color: COLORS.taupe,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 14,
  },
  permBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.wineDeep,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  permInfo: {
    flex: 1,
    paddingRight: 10,
  },
  permName: {
    color: COLORS.creamLight,
    fontSize: 12,
    fontWeight: '800',
  },
  permSub: {
    color: COLORS.taupe,
    fontSize: 10,
    marginTop: 2,
  },
  permBtn: {
    backgroundColor: COLORS.wineDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  permBtnText: {
    color: COLORS.goldLight,
    fontSize: 10,
    fontWeight: '800',
  },
  acceptAllBtn: {
    backgroundColor: COLORS.gold,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  acceptAllText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
});

