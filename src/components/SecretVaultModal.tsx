import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import {COLORS} from '../theme/colors';

export interface GalleryPhotoItem {
  id: string;
  title: string;
  album: string;
  date: string;
  loveNote: string;
  author: string;
}

interface SecretVaultModalProps {
  visible: boolean;
  onClose: () => void;
  photos: GalleryPhotoItem[];
  onUpdatePhotoNote: (id: string, note: string, author: string) => void;
  onSendPhotoToChat: (photo: GalleryPhotoItem) => void;
  partnerOne: string;
  partnerTwo: string;
}

export const SecretVaultModal: React.FC<SecretVaultModalProps> = ({
  visible,
  onClose,
  photos,
  onUpdatePhotoNote,
  onSendPhotoToChat,
  partnerOne,
  partnerTwo,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhotoItem | null>(
    null,
  );
  const [noteDraft, setNoteDraft] = useState('');
  const [authorDraft, setAuthorDraft] = useState(partnerOne);

  const handlePressDigit = (digit: string) => {
    if (enteredPin.length >= 4) {
      return;
    }
    const next = enteredPin + digit;
    setEnteredPin(next);
    setPinError('');
    if (next.length === 4) {
      if (next === '2026' || next === '1234') {
        setUnlocked(true);
      } else {
        setPinError('Código incorrecto (PIN VIP: 2026)');
        setEnteredPin('');
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setPinError('');
  };

  const handleCloseAll = () => {
    setEnteredPin('');
    setUnlocked(false);
    setSelectedPhoto(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        {!unlocked ? (
          /* PANTALLA DE CONTRASEÑA SECRETA (5 TOQUES EN EL LOGO) */
          <View style={styles.pinContainer}>
            <TouchableOpacity
              style={styles.closePinBtn}
              onPress={handleCloseAll}>
              <Text style={styles.closePinText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.pinHeader}>
              <Text style={styles.pinTitle}>Ingrese su contraseña</Text>
              <Text style={styles.pinSubtitle}>
                Panel de Administración Cómplices VIP
              </Text>

              <View style={styles.dotsRow}>
                {[0, 1, 2, 3].map(i => {
                  const filled = i < enteredPin.length;
                  return (
                    <View
                      key={i}
                      style={[styles.dot, filled && styles.dotFilled]}
                    />
                  );
                })}
              </View>
              {pinError ? (
                <Text style={styles.errorText}>{pinError}</Text>
              ) : (
                <Text style={styles.hintText}>Código VIP: 2026</Text>
              )}
            </View>

            <View style={styles.keypadGrid}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                <TouchableOpacity
                  key={d}
                  style={styles.keyCircle}
                  onPress={() => handlePressDigit(d)}>
                  <Text style={styles.keyText}>{d}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.keyCircleEmpty} />
              <TouchableOpacity
                style={styles.keyCircle}
                onPress={() => handlePressDigit('0')}>
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyCircle}
                onPress={handleBackspace}>
                <Text style={styles.keyText}>⌫</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.enterPillBtn}
              onPress={() => {
                if (enteredPin === '2026' || enteredPin === '1234') {
                  setUnlocked(true);
                } else {
                  setPinError('Ingresa el PIN de 4 dígitos (2026)');
                }
              }}>
              <Text style={styles.enterPillText}>⇥  Entrar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ADMINISTRADOR DE GALERÍA DEL CELULAR Y NOTITAS DE AMOR */
          <View style={styles.galleryContainer}>
            <View style={styles.galleryHeader}>
              <View>
                <Text style={styles.galleryOverline}>
                  BÓVEDA SECRETA • GALERÍA MÓVIL
                </Text>
                <Text style={styles.galleryTitle}>
                  Mis Fotos & Notitas de Amor
                </Text>
              </View>
              <TouchableOpacity
                style={styles.exitBtn}
                onPress={handleCloseAll}>
                <Text style={styles.exitBtnText}>Salir ✕</Text>
              </TouchableOpacity>
            </View>

            {selectedPhoto ? (
              <ScrollView contentContainerStyle={styles.detailScroll}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setSelectedPhoto(null)}>
                  <Text style={styles.backBtnText}>
                    ← Volver a toda la galería
                  </Text>
                </TouchableOpacity>

                <View style={styles.photoPreviewBox}>
                  <Text style={styles.photoPreviewTitle}>
                    ✦ {selectedPhoto.title}
                  </Text>
                  <Text style={styles.photoPreviewMeta}>
                    {selectedPhoto.album} • {selectedPhoto.date}
                  </Text>
                  {noteDraft ? (
                    <View style={styles.noteOverlayPill}>
                      <Text style={styles.noteOverlayAuthor}>
                        ♡ NOTITA DE {authorDraft.toUpperCase()}
                      </Text>
                      <Text style={styles.noteOverlayText}>“{noteDraft}”</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.fieldLabel}>
                  ESCRIBIR NOTITA DE AMOR EN ESTA FOTO:
                </Text>
                <View style={styles.authorRow}>
                  {[partnerOne, partnerTwo].map(p => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setAuthorDraft(p)}
                      style={[
                        styles.authorChip,
                        authorDraft === p && styles.authorChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.authorChipText,
                          authorDraft === p && {color: COLORS.wineDark},
                        ]}>
                        Firma: {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.noteInput}
                  multiline
                  placeholder="Escribe aquí una notita de amor para esta foto..."
                  placeholderTextColor={COLORS.textMuted}
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                />

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.saveNoteBtn}
                    onPress={() => {
                      onUpdatePhotoNote(
                        selectedPhoto.id,
                        noteDraft,
                        authorDraft,
                      );
                      setSelectedPhoto(null);
                    }}>
                    <Text style={styles.saveNoteBtnText}>✓ Guardar Nota</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sendChatBtn}
                    onPress={() => {
                      onUpdatePhotoNote(
                        selectedPhoto.id,
                        noteDraft,
                        authorDraft,
                      );
                      onSendPhotoToChat({
                        ...selectedPhoto,
                        loveNote: noteDraft,
                        author: authorDraft,
                      });
                      handleCloseAll();
                    }}>
                    <Text style={styles.sendChatBtnText}>
                      ✦ Enviar al Chat
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <ScrollView contentContainerStyle={styles.gridScroll}>
                <View style={styles.gridWrap}>
                  {photos.map(ph => (
                    <TouchableOpacity
                      key={ph.id}
                      style={styles.gridCard}
                      onPress={() => {
                        setSelectedPhoto(ph);
                        setNoteDraft(ph.loveNote);
                        setAuthorDraft(ph.author || partnerOne);
                      }}>
                      <View style={styles.gridThumb}>
                        <Text style={styles.gridThumbTitle}>{ph.title}</Text>
                        <Text style={styles.gridThumbSub}>{ph.album}</Text>
                        {ph.loveNote ? (
                          <View style={styles.noteBadge}>
                            <Text style={styles.noteBadgeText}>
                              ♡ Con notita
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.gridFooter}>
                        <Text style={styles.gridEditLabel}>✎ Poner nota</Text>
                        <TouchableOpacity
                          style={styles.miniSendBtn}
                          onPress={() => {
                            onSendPhotoToChat(ph);
                            handleCloseAll();
                          }}>
                          <Text style={styles.miniSendText}>Al Chat ✦</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#190407',
  },
  pinContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 42,
    paddingHorizontal: 24,
  },
  closePinBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePinText: {
    color: COLORS.taupe,
    fontSize: 13,
  },
  pinHeader: {
    alignItems: 'center',
    marginTop: 18,
  },
  pinTitle: {
    color: COLORS.creamLight,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  pinSubtitle: {
    color: COLORS.taupe,
    fontSize: 11.5,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 22,
    marginBottom: 8,
  },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.8,
    borderColor: COLORS.gold,
  },
  dotFilled: {
    backgroundColor: COLORS.gold,
  },
  errorText: {
    color: '#F3A6B0',
    fontSize: 11,
    marginTop: 4,
  },
  hintText: {
    color: COLORS.taupe,
    fontSize: 10,
    opacity: 0.6,
    marginTop: 4,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 246,
    justifyContent: 'space-between',
    rowGap: 16,
  },
  keyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2B0B10',
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyCircleEmpty: {
    width: 68,
    height: 68,
  },
  keyText: {
    color: COLORS.creamLight,
    fontSize: 20,
    fontWeight: '700',
  },
  enterPillBtn: {
    paddingHorizontal: 36,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(109, 41, 50, 0.42)',
    borderWidth: 1,
    borderColor: COLORS.taupe,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterPillText: {
    color: COLORS.taupe,
    fontSize: 13,
    fontWeight: '700',
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: COLORS.wineDeep,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.wineVelvet,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.goldMuted,
  },
  galleryOverline: {
    color: COLORS.goldLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  galleryTitle: {
    color: COLORS.creamLight,
    fontSize: 17,
    fontWeight: '800',
  },
  exitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.maroon,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  exitBtnText: {
    color: COLORS.creamLight,
    fontSize: 10.5,
    fontWeight: '700',
  },
  gridScroll: {
    padding: 14,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    overflow: 'hidden',
  },
  gridThumb: {
    height: 130,
    backgroundColor: COLORS.wineDark,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridThumbTitle: {
    color: COLORS.creamLight,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  gridThumbSub: {
    color: COLORS.taupe,
    fontSize: 9.5,
    marginTop: 2,
  },
  noteBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  noteBadgeText: {
    color: COLORS.wineDark,
    fontSize: 8.5,
    fontWeight: '800',
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  gridEditLabel: {
    color: COLORS.goldLight,
    fontSize: 10,
    fontWeight: '700',
  },
  miniSendBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniSendText: {
    color: COLORS.textDark,
    fontSize: 9,
    fontWeight: '800',
  },
  detailScroll: {
    padding: 16,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.wineVelvet,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    marginBottom: 12,
  },
  backBtnText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  photoPreviewBox: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    marginBottom: 14,
  },
  photoPreviewTitle: {
    color: COLORS.creamLight,
    fontSize: 16,
    fontWeight: '800',
  },
  photoPreviewMeta: {
    color: COLORS.taupe,
    fontSize: 10.5,
    marginTop: 2,
  },
  noteOverlayPill: {
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderLeftWidth: 2,
    borderLeftColor: COLORS.gold,
  },
  noteOverlayAuthor: {
    color: COLORS.goldLight,
    fontSize: 9,
    fontWeight: '800',
  },
  noteOverlayText: {
    color: COLORS.creamLight,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  fieldLabel: {
    color: COLORS.goldLight,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  authorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  authorChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.wineVelvet,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  authorChipActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.goldLight,
  },
  authorChipText: {
    color: COLORS.creamLight,
    fontSize: 10,
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    padding: 12,
    minHeight: 74,
    fontSize: 12,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveNoteBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.wineVelvet,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  saveNoteBtnText: {
    color: COLORS.goldLight,
    fontSize: 11.5,
    fontWeight: '800',
  },
  sendChatBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendChatBtnText: {
    color: COLORS.textDark,
    fontSize: 11.5,
    fontWeight: '800',
  },
});

