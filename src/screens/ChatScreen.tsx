import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {COLORS} from '../theme/colors';
import {CoupleAccount} from '../data/assignedUsers';
import {GalleryPhotoItem} from '../components/SecretVaultModal';
import {
  supabase,
  fetchChatMessages,
  insertChatMessage,
  deleteChatMessageFromDb,
  SupabaseChatMessage,
} from '../lib/supabase';

export interface ChatMessage {
  id: string;
  sender: 'partnerOne' | 'partnerTwo' | 'me' | 'partner' | string;
  text: string;
  time: string;
  photoTitle?: string;
  photoNote?: string;
}

interface ChatScreenProps {
  account: CoupleAccount;
  galleryPhotos?: GalleryPhotoItem[];
  externalMessages?: ChatMessage[];
  onOpenPermissions?: () => void;
}

const QUICK_WHISPERS = [
  'Te extraño ♡',
  'Hoy noche especial ✦',
  'Pensando en ti ✦',
  '¿Listo/a para un reto? ✦',
];

export const ChatScreen: React.FC<ChatScreenProps> = ({
  account,
  galleryPhotos = [],
  externalMessages = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Identidad fija de este teléfono (Alejandro o Valentina)
  const [deviceRole, setDeviceRole] = useState<'partnerOne' | 'partnerTwo'>(
    account.myRole || 'partnerOne',
  );

  const myRole = deviceRole;
  const partnerRole = myRole === 'partnerOne' ? 'partnerTwo' : 'partnerOne';
  const myName = myRole === 'partnerOne' ? account.partnerOne : account.partnerTwo;
  const partnerName = myRole === 'partnerOne' ? account.partnerTwo : account.partnerOne;

  const [inputText, setInputText] = useState('');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  // Cargar mensajes desde Supabase y suscribirse en tiempo real
  useEffect(() => {
    if (!account?.id) {
      return;
    }

    const loadRemoteMessages = async () => {
      try {
        const remote = await fetchChatMessages(account.id!);
        if (remote && remote.length > 0) {
          setMessages(
            remote.map((m: SupabaseChatMessage) => ({
              id: m.id,
              sender: m.sender || 'partnerOne',
              text: m.text,
              time: m.time_label || 'Ahora',
              photoTitle: m.photo_title || undefined,
              photoNote: m.photo_note || undefined,
            })),
          );
        }
      } catch (err) {
        console.warn('Error loading chat from Supabase:', err);
      }
    };

    loadRemoteMessages();

    // Canal Realtime de Supabase
    const channel = supabase
      .channel(`chat_messages:${account.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `couple_id=eq.${account.id}`,
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as SupabaseChatMessage;
            setMessages(prev => {
              if (prev.some(m => m.id === newRow.id)) {
                return prev;
              }
              return [
                ...prev,
                {
                  id: newRow.id,
                  sender: newRow.sender || 'partnerTwo',
                  text: newRow.text,
                  time: newRow.time_label || 'Ahora',
                  photoTitle: newRow.photo_title || undefined,
                  photoNote: newRow.photo_note || undefined,
                },
              ];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old.id;
            setMessages(prev => prev.filter(m => m.id !== oldId));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [account?.id]);

  const allMessages = [...messages, ...externalMessages];

  const sendMessage = async (customText?: string) => {
    const content = (customText ?? inputText).trim();
    if (!content) {
      return;
    }
    const tempId = Date.now().toString();
    const newMsg: ChatMessage = {
      id: tempId,
      sender: myRole,
      text: content,
      time: 'Ahora',
    };
    setMessages(prev => [...prev, newMsg]);
    if (!customText) {
      setInputText('');
    }

    if (account?.id) {
      try {
        const saved = await insertChatMessage({
          couple_id: account.id,
          sender: myRole,
          text: content,
          time_label: 'Ahora',
        });
        if (saved && saved.id) {
          setMessages(prev =>
            prev.map(m => (m.id === tempId ? {...m, id: saved.id} : m)),
          );
        }
      } catch (e) {
        console.warn('Error saving message in Supabase:', e);
      }
    }
  };

  const sendPhotoFromGallery = async (photo: GalleryPhotoItem) => {
    const tempId = Date.now().toString();
    const photoNote = photo.loveNote;
    const photoTitle = photo.title;
    const msgText = photoNote || `✦ Foto compartida: ${photoTitle}`;

    const newMsg: ChatMessage = {
      id: tempId,
      sender: myRole,
      text: msgText,
      time: 'Ahora',
      photoTitle,
      photoNote,
    };
    setMessages(prev => [...prev, newMsg]);
    setShowPhotoPicker(false);

    if (account?.id) {
      try {
        const saved = await insertChatMessage({
          couple_id: account.id,
          sender: myRole,
          text: msgText,
          time_label: 'Ahora',
          photo_title: photoTitle,
          photo_note: photoNote,
        });
        if (saved && saved.id) {
          setMessages(prev =>
            prev.map(m => (m.id === tempId ? {...m, id: saved.id} : m)),
          );
        }
      } catch (e) {
        console.warn('Error saving photo message in Supabase:', e);
      }
    }
  };

  const deleteMessage = async (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    if (account?.id) {
      try {
        await deleteChatMessageFromDb(id);
      } catch (e) {
        console.warn('Error deleting message from Supabase:', e);
      }
    }
  };

  const toggleTestRole = () => {
    setDeviceRole(prev => (prev === 'partnerOne' ? 'partnerTwo' : 'partnerOne'));
  };

  return (
    <View style={styles.container}>
      {/* Cabecera del Chat: Muestra a tu pareja en el otro celular */}
      <View style={styles.chatHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {partnerName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.partnerName}>{partnerName}</Text>
          <Text style={styles.onlineStatus}>● En línea en su espacio privado</Text>
        </View>
        <TouchableOpacity
          style={styles.whisperChip}
          onPress={toggleTestRole}>
          <Text style={styles.whisperText}>Tú: {myName} ⇄</Text>
        </TouchableOpacity>
      </View>

      {/* Mensajes */}
      <ScrollView
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}>
        {allMessages.map(msg => {
          const isMe =
            msg.sender === myRole ||
            (myRole === 'partnerOne' && msg.sender === 'me') ||
            (myRole === 'partnerTwo' && msg.sender === 'partner');
          return (
            <TouchableOpacity
              key={msg.id}
              activeOpacity={0.9}
              onLongPress={() => deleteMessage(msg.id)}
              style={[
                styles.bubbleWrapper,
                isMe ? styles.bubbleRight : styles.bubbleLeft,
              ]}>
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.bubbleMe : styles.bubblePartner,
                ]}>
                {msg.photoTitle ? (
                  <View style={styles.photoCard}>
                    <View style={styles.photoPreviewBox}>
                      <Text style={styles.photoPreviewIcon}>◫</Text>
                      <Text style={styles.photoPreviewTitle}>
                        {msg.photoTitle}
                      </Text>
                    </View>
                    {msg.photoNote ? (
                      <Text
                        style={[
                          styles.photoNoteText,
                          isMe ? styles.bubbleTextMe : styles.bubbleTextPartner,
                        ]}>
                        “{msg.photoNote}”
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.bubbleText,
                      isMe ? styles.bubbleTextMe : styles.bubbleTextPartner,
                    ]}>
                    {msg.text}
                  </Text>
                )}
                <Text
                  style={[
                    styles.timeText,
                    isMe ? styles.timeTextMe : styles.timeTextPartner,
                  ]}>
                  {msg.time}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Susurros rápidos + Caja de texto */}
      <View style={styles.bottomArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.whispersRow}>
          {QUICK_WHISPERS.map(w => (
            <TouchableOpacity
              key={w}
              style={styles.whisperChip}
              onPress={() => sendMessage(w)}>
              <Text style={styles.whisperText}>{w}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.camBtn}
            onPress={() => setShowPhotoPicker(true)}>
            <Text style={styles.camBtnText}>◫</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.chatInput}
            placeholder={`Escribe un mensaje a ${partnerName}...`}
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => sendMessage()}>
            <Text style={styles.sendBtnText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal para elegir foto de la galería al enviar al chat */}
      <Modal visible={showPhotoPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalTitle}>
                Enviar Foto de tu Galería ({galleryPhotos.length})
              </Text>
              <TouchableOpacity onPress={() => setShowPhotoPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Selecciona una foto con su notita de amor para enviarla al chat:
            </Text>
            <ScrollView style={styles.photoPickerList}>
              {galleryPhotos.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.photoPickerRow}
                  onPress={() => sendPhotoFromGallery(item)}>
                  <View style={styles.photoThumb}>
                    <Text style={styles.photoThumbEmoji}>◫</Text>
                  </View>
                  <View style={styles.photoPickerInfo}>
                    <Text style={styles.photoPickerTitle}>{item.title}</Text>
                    <Text style={styles.photoPickerNote} numberOfLines={1}>
                      {item.loveNote
                        ? `♡ “${item.loveNote}”`
                        : 'Sin notita adjunta'}
                    </Text>
                  </View>
                  <Text style={styles.sendArrow}>Enviar →</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.wineDeep,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.wineVelvet,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderBottomWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.wineDeep,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitial: {
    color: COLORS.goldLight,
    fontSize: 14,
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
  },
  partnerName: {
    color: COLORS.cream,
    fontSize: 14,
    fontWeight: '800',
  },
  onlineStatus: {
    color: COLORS.goldLight,
    fontSize: 10,
    marginTop: 1,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  bubbleWrapper: {
    marginBottom: 9,
    flexDirection: 'row',
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  bubbleLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleMe: {
    backgroundColor: COLORS.wineDark,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  bubblePartner: {
    backgroundColor: COLORS.wineVelvet,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  bubbleText: {
    fontSize: 12,
    lineHeight: 17,
  },
  bubbleTextMe: {
    color: COLORS.creamLight,
    fontWeight: '600',
  },
  bubbleTextPartner: {
    color: COLORS.creamLight,
    fontWeight: '600',
  },
  photoCard: {
    marginBottom: 3,
  },
  photoPreviewBox: {
    backgroundColor: 'rgba(19, 3, 6, 0.35)',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  photoPreviewIcon: {
    fontSize: 18,
    color: COLORS.goldLight,
    marginBottom: 3,
  },
  photoPreviewTitle: {
    color: COLORS.creamLight,
    fontSize: 11,
    fontWeight: '800',
  },
  photoNoteText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  timeText: {
    fontSize: 9,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  timeTextMe: {
    color: COLORS.taupe,
  },
  timeTextPartner: {
    color: COLORS.textMuted,
  },
  bottomArea: {
    paddingHorizontal: 14,
    paddingBottom: 102,
    paddingTop: 4,
  },
  whispersRow: {
    gap: 6,
    paddingBottom: 7,
  },
  whisperChip: {
    backgroundColor: COLORS.wineVelvet,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  whisperText: {
    color: COLORS.goldLight,
    fontSize: 10.5,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    paddingLeft: 6,
    paddingRight: 5,
    height: 42,
  },
  camBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.wineDeep,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  camBtnText: {
    fontSize: 13,
    color: COLORS.goldLight,
  },
  chatInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  sendBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: COLORS.textDark,
    fontWeight: '800',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.wineVelvet,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    borderTopWidth: 1,
    borderColor: COLORS.gold,
    maxHeight: '65%',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    color: COLORS.creamLight,
    fontSize: 14,
    fontWeight: '800',
  },
  modalClose: {
    color: COLORS.taupe,
    fontSize: 14,
    padding: 4,
  },
  modalSub: {
    color: COLORS.taupe,
    fontSize: 10.5,
    marginBottom: 10,
  },
  photoPickerList: {
    marginTop: 4,
  },
  photoPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.wineDeep,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  photoThumb: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.wineVelvet,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  photoThumbEmoji: {
    fontSize: 15,
    color: COLORS.goldLight,
  },
  photoPickerInfo: {
    flex: 1,
  },
  photoPickerTitle: {
    color: COLORS.creamLight,
    fontSize: 11.5,
    fontWeight: '800',
  },
  photoPickerNote: {
    color: COLORS.taupe,
    fontSize: 10,
    marginTop: 2,
  },
  sendArrow: {
    color: COLORS.goldLight,
    fontSize: 10.5,
    fontWeight: '800',
    marginLeft: 8,
  },
});
