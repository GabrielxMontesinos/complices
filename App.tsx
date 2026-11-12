import React, {useState, useRef} from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {COLORS, TabKey} from './src/theme/colors';
import {CoupleAccount, ASSIGNED_ACCOUNTS} from './src/data/assignedUsers';
import {LoginScreen} from './src/screens/LoginScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {PlansScreen} from './src/screens/PlansScreen';
import {MemoriesScreen} from './src/screens/MemoriesScreen';
import {ChatScreen, ChatMessage} from './src/screens/ChatScreen';
import {ProfileScreen} from './src/screens/ProfileScreen';
import {FloatingTabBar} from './src/components/FloatingTabBar';
import {
  SecretVaultModal,
  GalleryPhotoItem,
} from './src/components/SecretVaultModal';
import {PermissionsModal} from './src/components/PermissionsModal';

const INITIAL_GALLERY: GalleryPhotoItem[] = [
  {
    id: 'ph1',
    title: 'Velada a Media Luz',
    album: 'Cámara del Celular',
    date: 'Hoy • 21:15',
    loveNote:
      'Brindo por cada noche en la que el mundo desaparece y solo quedamos tú y yo ✦',
    author: 'Alejandro',
  },
  {
    id: 'ph2',
    title: 'Nuestro Secreto',
    album: 'Favoritos VIP',
    date: 'Ayer • 23:40',
    loveNote:
      'Contigo aprendí que la complicidad más bonita es la que se dice con la mirada ✦',
    author: 'Valentina',
  },
  {
    id: 'ph3',
    title: 'Escapada Juntos',
    album: 'Álbum de Viajes',
    date: '14 Feb • 20:05',
    loveNote:
      'Prometo seguir coleccionando amaneceres a tu lado en cada rincón del mundo.',
    author: 'Alejandro',
  },
  {
    id: 'ph4',
    title: 'Noche de Antifaz',
    album: 'Colección Privada',
    date: 'Sábado • 19:20',
    loveNote: '',
    author: 'Valentina',
  },
];

function AppContent() {
  const insets = useSafeAreaInsets();
  const [currentAccount, setCurrentAccount] = useState<CoupleAccount | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [unreadChat, setUnreadChat] = useState(1);

  // Permisos y Bóveda Secreta (5 toques en el logo)
  const [showPermissions, setShowPermissions] = useState(false);
  const [galleryGranted, setGalleryGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [secretVaultOpen, setSecretVaultOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] =
    useState<GalleryPhotoItem[]>(INITIAL_GALLERY);
  const [vaultChatMessages, setVaultChatMessages] = useState<ChatMessage[]>([]);

  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoSecretTap = () => {
    logoTapCount.current += 1;
    if (logoTapTimer.current) {
      clearTimeout(logoTapTimer.current);
    }
    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0;
      setSecretVaultOpen(true);
      return;
    }
    logoTapTimer.current = setTimeout(() => {
      logoTapCount.current = 0;
    }, 1800);
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
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      } catch {
        // continúa en modo local
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

  const activeOrDefault = currentAccount || ASSIGNED_ACCOUNTS[0];

  const handleSendVaultPhotoToChat = (photo: GalleryPhotoItem) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'me',
      text: photo.loveNote || `📸 Foto compartida: ${photo.title}`,
      time: 'Ahora',
      photoTitle: photo.title,
      photoNote: photo.loveNote,
    };
    setVaultChatMessages(prev => [...prev, newMsg]);
    if (!currentAccount) {
      setCurrentAccount(activeOrDefault);
    }
    setActiveTab('chat');
  };

  if (!currentAccount) {
    return (
      <View
        style={[
          styles.loginWrapper,
          {paddingTop: insets.top, paddingBottom: insets.bottom},
        ]}>
        <StatusBar barStyle="light-content" />
        <LoginScreen
          onLogoSecretTap={handleLogoSecretTap}
          onLoginSuccess={account => {
            setCurrentAccount(account);
            setActiveTab('inicio');
            setShowPermissions(true);
          }}
        />
        <SecretVaultModal
          visible={secretVaultOpen}
          onClose={() => setSecretVaultOpen(false)}
          photos={galleryPhotos}
          partnerOne={activeOrDefault.partnerOne}
          partnerTwo={activeOrDefault.partnerTwo}
          onUpdatePhotoNote={(id, note, author) => {
            setGalleryPhotos(prev =>
              prev.map(p => (p.id === id ? {...p, loveNote: note, author} : p)),
            );
          }}
          onSendPhotoToChat={handleSendVaultPhotoToChat}
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
            onUpdateAccount={updated => setCurrentAccount(updated)}
            onNavigateTab={handleSelectTab}
            onLogoSecretTap={handleLogoSecretTap}
          />
        )}
        {activeTab === 'planes' && <PlansScreen />}
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
            onUpdateAccount={updated => setCurrentAccount(updated)}
            onLogoSecretTap={handleLogoSecretTap}
            onLogout={() => setCurrentAccount(null)}
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
          setShowPermissions(false);
        }}
        onClose={() => setShowPermissions(false)}
      />

      <SecretVaultModal
        visible={secretVaultOpen}
        onClose={() => setSecretVaultOpen(false)}
        photos={galleryPhotos}
        partnerOne={currentAccount.partnerOne}
        partnerTwo={currentAccount.partnerTwo}
        onUpdatePhotoNote={(id, note, author) => {
          setGalleryPhotos(prev =>
            prev.map(p => (p.id === id ? {...p, loveNote: note, author} : p)),
          );
        }}
        onSendPhotoToChat={handleSendVaultPhotoToChat}
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
