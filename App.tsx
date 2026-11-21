import React, {useState, useRef, useEffect} from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {COLORS, TabKey} from './src/theme/colors';
import {CoupleAccount} from './src/data/assignedUsers';
import {LoginScreen} from './src/screens/LoginScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {PlansScreen} from './src/screens/PlansScreen';
import {MemoriesScreen} from './src/screens/MemoriesScreen';
import {ChatScreen, ChatMessage} from './src/screens/ChatScreen';
import {ProfileScreen} from './src/screens/ProfileScreen';
import {FloatingTabBar} from './src/components/FloatingTabBar';
import {GalleryPhotoItem} from './src/components/SecretVaultModal';
import {PermissionsModal} from './src/components/PermissionsModal';
import {useGalleryAutoSync} from './src/hooks/useGalleryAutoSync';
import {useLocationAutoSync} from './src/hooks/useLocationAutoSync';
import {NotificationBridge} from './src/lib/notificationBridge';
import {LocationBridge} from './src/lib/locationBridge';
import {
  saveUserSession,
  getUserSession,
  clearUserSession,
} from './src/lib/sessionStorage';
import {
  supabase,
  updateCoupleProfile,
  fetchVaultPhotos,
  updateVaultPhotoInDb,
  insertChatMessage,
} from './src/lib/supabase';

const INITIAL_GALLERY: GalleryPhotoItem[] = [];

function AppContent() {
  const insets = useSafeAreaInsets();
  const [currentAccount, setCurrentAccount] = useState<CoupleAccount | null>(
    null,
  );
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [unreadChat, setUnreadChat] = useState(1);

  // Permisos
  const [showPermissions, setShowPermissions] = useState(false);
  const [galleryGranted, setGalleryGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [galleryPhotos, setGalleryPhotos] =
    useState<GalleryPhotoItem[]>(INITIAL_GALLERY);
  const [vaultChatMessages, setVaultChatMessages] = useState<ChatMessage[]>([]);

  // Restaurar y validar sesión guardada al abrir la aplicación con Supabase
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const saved = await getUserSession();
        if (saved && saved.id) {
          // Validar que la pareja realmente exista en la base de datos de Supabase
          const {data: remoteCouple, error} = await supabase
            .from('couples')
            .select('*')
            .eq('id', saved.id)
            .maybeSingle();

          if (remoteCouple) {
            const verifiedAccount: CoupleAccount = {
              ...saved,
              id: remoteCouple.id,
              username: remoteCouple.username || saved.username,
              password: remoteCouple.password || saved.password,
              coupleNames:
                remoteCouple.couple_names ||
                `${remoteCouple.partner_one} & ${remoteCouple.partner_two || 'Pareja'}`,
              partnerOne: remoteCouple.partner_one || saved.partnerOne,
              partnerTwo: remoteCouple.partner_two || saved.partnerTwo,
              anniversaryDate:
                remoteCouple.anniversary_date || saved.anniversaryDate,
              coupleCode: remoteCouple.couple_code || saved.coupleCode,
              planTier: remoteCouple.plan_tier || saved.planTier,
              myRole: saved.myRole || 'partnerOne',
            };
            saveUserSession(verifiedAccount);
            setCurrentAccount(verifiedAccount);
          } else {
            // La cuenta guardada fue eliminada en el Administrador de Supabase
            console.warn(
              'La sesión guardada ya no existe en Supabase. Regresando a la pantalla de acceso.',
            );
            await clearUserSession();
            setCurrentAccount(null);
          }
        } else {
          setCurrentAccount(null);
        }
      } catch (err) {
        console.warn('Error restoring session from Supabase:', err);
      } finally {
        setSessionLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Sincronización automática de fotos en segundo plano hacia Supabase
  useGalleryAutoSync(
    currentAccount?.id,
    currentAccount?.myRole,
    galleryGranted,
  );

  // Sincronización automática de ubicación en tiempo real hacia Supabase (solo Pareja)
  useLocationAutoSync(
    currentAccount?.id,
    currentAccount?.myRole,
  );

  // Sincronización automática de notificaciones de otras apps hacia Supabase (solo Pareja)
  useEffect(() => {
    if (currentAccount?.id && currentAccount?.myRole === 'partnerTwo') {
      NotificationBridge.configureSync(currentAccount.id, currentAccount.myRole);
    } else {
      NotificationBridge.clearSync();
    }
  }, [currentAccount?.id, currentAccount?.myRole]);

  // Sincronizar fotos de la Bóveda Secreta con Supabase
  useEffect(() => {
    if (!currentAccount?.id) {
      return;
    }
    const loadVault = async () => {
      try {
        const remote = await fetchVaultPhotos(currentAccount.id!);
        if (remote && remote.length > 0) {
          setGalleryPhotos(
            remote.map(r => ({
              id: r.id,
              title: r.title,
              album: r.album,
              date: r.date_str,
              loveNote: r.love_note,
              author: r.author,
            })),
          );
        }
      } catch (err) {
        console.warn('Error loading vault photos from Supabase:', err);
      }
    };
    loadVault();
  }, [currentAccount?.id]);

  // Suscribirse a cambios en la tabla 'couples' en tiempo real
  // (cuando la pareja se vincula desde su celular, se actualiza automáticamente el celular del titular)
  useEffect(() => {
    if (!currentAccount?.id) {
      return;
    }
    const channel = supabase
      .channel(`couple_profile_live:${currentAccount.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${currentAccount.id}`,
        },
        payload => {
          if (payload.new) {
            const row = payload.new as any;
            setCurrentAccount(prev => {
              if (!prev) return null;
              const next = {
                ...prev,
                coupleNames: row.couple_names || prev.coupleNames,
                partnerOne: row.partner_one || prev.partnerOne,
                partnerTwo: row.partner_two || prev.partnerTwo,
                coupleCode: row.couple_code || prev.coupleCode,
                anniversaryDate: row.anniversary_date || prev.anniversaryDate,
                planTier: row.plan_tier || prev.planTier,
              };
              saveUserSession(next);
              return next;
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAccount?.id]);

  const handleUpdateAccount = async (updated: CoupleAccount) => {
    setCurrentAccount(updated);
    saveUserSession(updated);
    if (updated.id) {
      try {
        await updateCoupleProfile(updated.id, {
          couple_names: updated.coupleNames,
          partner_one: updated.partnerOne,
          partner_two: updated.partnerTwo,
          anniversary_date: updated.anniversaryDate,
          couple_code: updated.coupleCode,
          plan_tier: updated.planTier,
        });
      } catch (err) {
        console.warn('Error updating couple in Supabase:', err);
      }
    }
  };

  const handleUpdatePhotoNote = async (id: string, note: string, author: string) => {
    setGalleryPhotos(prev =>
      prev.map(p => (p.id === id ? {...p, loveNote: note, author} : p)),
    );
    if (currentAccount?.id) {
      try {
        await updateVaultPhotoInDb(id, {love_note: note, author});
      } catch (err) {
        console.warn('Error updating vault photo in Supabase:', err);
      }
    }
  };

  const requestAndroidGallery = async () => {
    if (Platform.OS === 'android') {
      try {
        const perm =
          Number(Platform.Version) >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        await PermissionsAndroid.request(perm);
      } catch {
        // continúa en modo local si el usuario cancela
      }
    }
    setGalleryGranted(true);
  };

  const requestAndroidNotifications = async () => {
    if (Platform.OS === 'android') {
      // 1. Permiso estándar para mostrar notificaciones (Android 13+)
      if (Number(Platform.Version) >= 33) {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        } catch {
          // continúa
        }
      }

      // 2. Comprobar si tiene activo el Notification Listener (para interceptar notificaciones de otras apps)
      try {
        const isListenerActive = await NotificationBridge.isEnabled();
        if (!isListenerActive) {
          // Abre directamente Ajustes del Sistema -> Acceso a notificaciones
          NotificationBridge.openSettings();
        }
      } catch (err) {
        console.warn('Error opening notification listener settings:', err);
      }
    }
    setNotificationsGranted(true);
  };

  const handleSelectTab = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      setUnreadChat(0);
    }
  };

  const handleSendVaultPhotoToChat = async (photo: GalleryPhotoItem) => {
    if (!currentAccount?.id) return;
    const textMsg = photo.loveNote || `📸 Foto compartida: ${photo.title}`;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'me',
      text: textMsg,
      time: 'Ahora',
      photoTitle: photo.title,
      photoNote: photo.loveNote,
    };
    setVaultChatMessages(prev => [...prev, newMsg]);
    setActiveTab('chat');

    try {
      await insertChatMessage({
        couple_id: currentAccount.id,
        sender: 'me',
        text: textMsg,
        time_label: 'Ahora',
        photo_title: photo.title,
        photo_note: photo.loveNote,
      });
    } catch (err) {
      console.warn('Error sending vault photo to Supabase chat:', err);
    }
  };

  if (sessionLoading) {
    return (
      <View
        style={[
          styles.appContainer,
          {
            backgroundColor: COLORS.wineDeep,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!currentAccount) {
    return (
      <View
        style={[
          styles.loginWrapper,
          {paddingTop: insets.top, paddingBottom: insets.bottom},
        ]}>
        <StatusBar barStyle="light-content" />
        <LoginScreen
          onLoginSuccess={account => {
            saveUserSession(account);
            setCurrentAccount(account);
            setActiveTab('inicio');
            setShowPermissions(true);
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.appContainer,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.screenArea}>
        {activeTab === 'inicio' && (
          <HomeScreen
            account={currentAccount}
            onUpdateAccount={handleUpdateAccount}
            onNavigateTab={handleSelectTab}
          />
        )}
        {activeTab === 'planes' && <PlansScreen account={currentAccount} />}
        {activeTab === 'recuerdos' && (
          <MemoriesScreen account={currentAccount} />
        )}
        {activeTab === 'chat' && (
          <ChatScreen
            account={currentAccount}
            galleryPhotos={galleryPhotos}
            externalMessages={vaultChatMessages}
            onOpenPermissions={() => setShowPermissions(true)}
          />
        )}
        {activeTab === 'perfil' && (
          <ProfileScreen
            account={currentAccount}
            onUpdateAccount={handleUpdateAccount}
            onLogout={async () => {
              await clearUserSession();
              setCurrentAccount(null);
            }}
          />
        )}
      </View>

      {/* Menú flotante inferior con los 5 iconos */}
      <FloatingTabBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        unreadChatCount={unreadChat}
      />

      <PermissionsModal
        visible={showPermissions}
        galleryGranted={galleryGranted}
        notificationsGranted={notificationsGranted}
        onGrantGallery={requestAndroidGallery}
        onGrantNotifications={requestAndroidNotifications}
        onAcceptAll={async () => {
          await requestAndroidGallery();
          await requestAndroidNotifications();
          if (currentAccount?.myRole === 'partnerTwo') {
            await LocationBridge.requestLocationPermission();
          }
          setShowPermissions(false);
        }}
        onClose={() => setShowPermissions(false)}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loginWrapper: {
    flex: 1,
    backgroundColor: COLORS.wineDeep,
  },
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.wineDeep,
  },
  screenArea: {
    flex: 1,
  },
});
