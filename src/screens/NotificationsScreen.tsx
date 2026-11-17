/**
 * src/screens/NotificationsScreen.tsx
 *
 * Pantalla que muestra el historial de notificaciones de otras apps
 * registradas en Supabase para esta pareja.
 *
 * Integración: agregar la tab en App.tsx y FloatingTabBar si se desea,
 * o usar como modal/overlay desde cualquier pantalla.
 */

import React, {useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import {CoupleAccount} from '../data/assignedUsers';
import {COLORS} from '../theme/colors';
import {useNotificationLogger} from '../hooks/useNotificationLogger';
import {SupabaseNotificationLog} from '../lib/supabase';

interface NotificationsScreenProps {
  account: CoupleAccount;
}

/** Mapeo paquete → emoji para apps populares */
const APP_EMOJI: Record<string, string> = {
  'com.whatsapp': '💬',
  'com.instagram.android': '📸',
  'com.twitter.android': '🐦',
  'com.facebook.katana': '👍',
  'com.facebook.orca': '💙',
  'com.snapchat.android': '👻',
  'com.google.android.gm': '📧',
  'com.google.android.apps.messaging': '💬',
  'com.spotify.music': '🎵',
  'com.netflix.mediaclient': '🎬',
  'com.amazon.mShop.android.shopping': '📦',
  'com.paypal.android.p2pmobile': '💰',
};

function appEmoji(pkg: string): string {
  return APP_EMOJI[pkg] ?? '🔔';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  return d.toLocaleDateString('es', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'});
}

function NotificationCard({item, onDelete}: {item: SupabaseNotificationLog; onDelete: (id: string) => void}) {
  const emoji = appEmoji(item.package_name);
  const body = item.big_text || item.text || '';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardApp} numberOfLines={1}>{item.app_name}</Text>
          <Text style={styles.cardTime}>{formatDate(item.received_at)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          style={styles.deleteBtn}
          hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {!!item.title && (
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      )}
      {!!body && (
        <Text style={styles.cardBody} numberOfLines={3}>{body}</Text>
      )}
      {!!item.sub_text && (
        <Text style={styles.cardSub} numberOfLines={1}>{item.sub_text}</Text>
      )}
    </View>
  );
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({account}) => {
  const {isEnabled, openSettings, logs, refreshLogs, clearLogs, loading} =
    useNotificationLogger(account.id ?? undefined);

  const handleDelete = useCallback(
    async (id: string) => {
      // La eliminación se maneja en el hook; para borrado individual
      // importamos deleteNotificationLog directamente
      const {deleteNotificationLog} = await import('../lib/supabase');
      try {
        await deleteNotificationLog(id);
        await refreshLogs();
      } catch {
        Alert.alert('Error', 'No se pudo eliminar la notificación.');
      }
    },
    [refreshLogs],
  );

  const handleClearAll = () => {
    Alert.alert(
      'Limpiar historial',
      '¿Borrar todas las notificaciones guardadas?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: clearLogs,
        },
      ],
    );
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.center}>
        <Text style={styles.unavailableIcon}>📵</Text>
        <Text style={styles.unavailableTitle}>No disponible en iOS</Text>
        <Text style={styles.unavailableText}>
          Apple no permite interceptar notificaciones de otras aplicaciones en iOS.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerOverline}>REGISTRO PRIVADO</Text>
          <Text style={styles.headerTitle}>Notificaciones</Text>
        </View>
        {logs.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Limpiar ✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Banner de permiso */}
      {!isEnabled && (
        <TouchableOpacity style={styles.permissionBanner} onPress={openSettings} activeOpacity={0.85}>
          <Text style={styles.permissionBannerIcon}>🔒</Text>
          <View style={styles.permissionBannerText}>
            <Text style={styles.permissionBannerTitle}>Permiso requerido</Text>
            <Text style={styles.permissionBannerSub}>
              Toca aquí para activar el acceso a notificaciones en ajustes del sistema.
            </Text>
          </View>
          <Text style={styles.permissionBannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {isEnabled && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>✦ Escuchando notificaciones</Text>
        </View>
      )}

      {/* Lista */}
      {loading && logs.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🔕</Text>
          <Text style={styles.emptyTitle}>Sin notificaciones aún</Text>
          <Text style={styles.emptyText}>
            {isEnabled
              ? 'Las notificaciones que lleguen a tu dispositivo aparecerán aquí.'
              : 'Activa el permiso arriba para empezar a registrar.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <NotificationCard item={item} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshLogs}
              tintColor={COLORS.gold}
              colors={[COLORS.gold]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.wineDeep,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  headerOverline: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: COLORS.goldLight,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.creamLight,
  },
  clearBtn: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  clearBtnText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  permissionBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.wineDark,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionBannerIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  permissionBannerText: {
    flex: 1,
  },
  permissionBannerTitle: {
    color: COLORS.goldLight,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  permissionBannerSub: {
    color: COLORS.taupe,
    fontSize: 11,
    lineHeight: 15,
  },
  permissionBannerArrow: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 8,
  },
  activeBadge: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(212, 175, 90, 0.12)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    alignSelf: 'flex-start',
  },
  activeBadgeText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  cardMeta: {
    flex: 1,
  },
  cardApp: {
    color: COLORS.goldLight,
    fontSize: 12,
    fontWeight: '800',
  },
  cardTime: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deleteBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  cardTitle: {
    color: COLORS.creamLight,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardBody: {
    color: COLORS.taupe,
    fontSize: 12,
    lineHeight: 17,
  },
  cardSub: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    marginTop: 4,
    fontStyle: 'italic',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyTitle: {
    color: COLORS.creamLight,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.taupe,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  unavailableIcon: {
    fontSize: 48,
    marginBottom: 14,
  },
  unavailableTitle: {
    color: COLORS.creamLight,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  unavailableText: {
    color: COLORS.taupe,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
