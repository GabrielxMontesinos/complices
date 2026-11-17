import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import {COLORS, TabKey} from '../theme/colors';
import {CoupleAccount} from '../data/assignedUsers';
import {
  fetchCoupleStatus,
  upsertCoupleStatus,
  generateNewCoupleCode,
} from '../lib/supabase';

interface HomeScreenProps {
  account: CoupleAccount;
  onUpdateAccount: (updated: CoupleAccount) => void;
  onNavigateTab: (tab: TabKey) => void;
  onLogoSecretTap?: () => void;
}

const MOODS = [
  {id: 'romantico', label: 'Romántico', emoji: '✧'},
  {id: 'complice', label: 'Cómplice', emoji: '✦'},
  {id: 'apasionado', label: 'Apasionado', emoji: '✹'},
  {id: 'extranandote', label: 'Extrañándote', emoji: '♡'},
];

const INITIAL_SPARKS = [
  'Envíale un mensaje secreto diciendo cuál fue tu momento favorito de este mes.',
  'Planeen una velada sin teléfonos esta semana con música suave y una copa de vino.',
  'Escribe una nota en la sección Amor contándole un deseo que quieras cumplir juntos.',
  'Sorpréndele hoy con un abrazo de 60 segundos sin decir una sola palabra.',
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  account,
  onUpdateAccount,
  onNavigateTab,
  onLogoSecretTap,
}) => {
  const [selectedMood, setSelectedMood] = useState('complice');
  const [sparks, setSparks] = useState<string[]>(INITIAL_SPARKS);
  const [sparkIndex, setSparkIndex] = useState(0);

  // Cargar estado desde Supabase
  useEffect(() => {
    if (!account?.id) {
      return;
    }
    const loadStatus = async () => {
      try {
        const remote = await fetchCoupleStatus(account.id!);
        if (remote) {
          if (remote.selected_mood) {
            setSelectedMood(remote.selected_mood);
          }
          if (remote.sparks && remote.sparks.length > 0) {
            setSparks(remote.sparks);
          }
          if (typeof remote.spark_index === 'number') {
            setSparkIndex(remote.spark_index);
          }
        }
      } catch (err) {
        console.warn('Error loading couple status:', err);
      }
    };
    loadStatus();
  }, [account?.id]);

  const handleSelectMood = async (moodId: string) => {
    setSelectedMood(moodId);
    if (account?.id) {
      try {
        await upsertCoupleStatus(account.id, {selected_mood: moodId});
      } catch (err) {
        console.warn('Error saving mood:', err);
      }
    }
  };

  // Estado de edición de tiempo juntos
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [customDate, setCustomDate] = useState(account.anniversaryDate);
  const [customDaysInput, setCustomDaysInput] = useState('');
  const [unitLabel, setUnitLabel] = useState('Días de complicidad');

  // Estado de edición de chispa / reto del día
  const [isEditingSpark, setIsEditingSpark] = useState(false);
  const [sparkDraft, setSparkDraft] = useState('');

  // Cálculo de días juntos desde anniversaryDate
  const start = new Date(account.anniversaryDate);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - start.getTime());
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(totalDays / 30);
  const hours = totalDays * 24;

  const toggleTimeEditor = () => {
    setCustomDate(account.anniversaryDate);
    setCustomDaysInput(String(totalDays));
    setIsEditingTime(!isEditingTime);
  };

  const handleDaysChange = (val: string) => {
    setCustomDaysInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      const d = new Date();
      d.setDate(d.getDate() - num);
      setCustomDate(d.toISOString().split('T')[0]);
    }
  };

  const saveTimeChanges = () => {
    if (customDate.trim()) {
      onUpdateAccount({...account, anniversaryDate: customDate.trim()});
    }
    setIsEditingTime(false);
  };

  const nextSpark = async () => {
    const nextIdx = (sparkIndex + 1) % sparks.length;
    setSparkIndex(nextIdx);
    if (account?.id) {
      try {
        await upsertCoupleStatus(account.id, {spark_index: nextIdx});
      } catch (err) {
        console.warn('Error saving spark index:', err);
      }
    }
  };

  const saveSpark = async (asNew: boolean) => {
    if (!sparkDraft.trim()) {
      return;
    }
    let newSparks = sparks;
    let newIdx = sparkIndex;
    if (asNew) {
      newSparks = [sparkDraft.trim(), ...sparks];
      newIdx = 0;
      setSparks(newSparks);
      setSparkIndex(0);
    } else {
      newSparks = sparks.map((s, idx) => (idx === sparkIndex ? sparkDraft.trim() : s));
      setSparks(newSparks);
    }
    setIsEditingSpark(false);

    if (account?.id) {
      try {
        await upsertCoupleStatus(account.id, {
          sparks: newSparks,
          spark_index: newIdx,
        });
      } catch (err) {
        console.warn('Error saving sparks list:', err);
      }
    }
  };

  const [generatingCode, setGeneratingCode] = useState(false);
  const isPartnerPending =
    !account.partnerTwo ||
    account.partnerTwo === 'Pendiente' ||
    account.partnerTwo === 'Pareja';

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `¡Hola mi amor! Descarga nuestra app Cómplices y usa nuestro código privado: ${account.coupleCode} para que conectemos nuestros celulares 💕`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleRegenerateCode = async () => {
    if (!account.id) return;
    setGeneratingCode(true);
    try {
      const newCode = await generateNewCoupleCode(account.id);
      onUpdateAccount({...account, coupleCode: newCode});
      Alert.alert('Nuevo Código Generado', `Tu nuevo código de vinculación es:\n${newCode}`);
    } catch (err) {
      console.warn('Generate error:', err);
      Alert.alert('Error', 'No se pudo generar nuevo código.');
    } finally {
      setGeneratingCode(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Encabezado Principal */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.welcomeTag}>{account.planTier.toUpperCase()}</Text>
          <Text style={styles.coupleTitle}>{account.coupleNames}</Text>
          <Text style={styles.codeSubtitle}>
            Desde: {account.anniversaryDate} • #{account.coupleCode}
          </Text>
        </View>
      </View>

      {/* Tarjeta de Vinculación de Pareja */}
      <View style={[styles.pairingCard, isPartnerPending && styles.pairingCardUrgent]}>
        <View style={styles.pairingHeaderRow}>
          <Text style={styles.pairingOverline}>
            {isPartnerPending ? '✦ VINCULAR A TU PAREJA' : '✦ ESPACIO DE PAREJA CONECTADO'}
          </Text>
          <View style={[styles.statusBadge, !isPartnerPending && styles.statusBadgeDone]}>
            <Text style={styles.statusBadgeText}>
              {isPartnerPending ? '⏳ Esperando a tu pareja' : `✓ ${account.partnerTwo}`}
            </Text>
          </View>
        </View>

        <Text style={styles.pairingBodyText}>
          {isPartnerPending
            ? 'Para conectar el celular de tu pareja, dale este código. Ella/Él solo debe abrir la app e ingresar con el código:'
            : 'Tu pareja ya está conectada a este espacio. Ambos comparten este código privado:'}
        </Text>

        <View style={styles.pairingCodeContainer}>
          <Text style={styles.pairingCodeValue}>{account.coupleCode}</Text>
          {isPartnerPending ? (
            <View style={styles.pairingActionsRow}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.pairingShareBtn}
                onPress={handleShareCode}>
                <Text style={styles.pairingShareBtnText}>Compartir por WhatsApp ✦</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.82}
                disabled={generatingCode}
                style={styles.pairingRegenBtn}
                onPress={handleRegenerateCode}>
                <Text style={styles.pairingRegenBtnText}>
                  {generatingCode ? '...' : 'Generar Nuevo ↻'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{alignItems: 'center', marginTop: 4}}>
              <Text style={{color: COLORS.goldLight, fontSize: 11, fontWeight: '700'}}>
                🔒 Espacio exclusivo y sellado entre {account.partnerOne} y {account.partnerTwo}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Tarjeta Principal: Contador de Tiempo Juntos (Editable) */}
      <View style={styles.counterCard}>
        <View style={styles.counterHeaderRow}>
          <Text style={styles.counterOverline}>NUESTRA HISTORIA JUNTOS</Text>
          <TouchableOpacity
            style={styles.editMiniBtn}
            onPress={toggleTimeEditor}>
            <Text style={styles.editMiniBtnText}>
              {isEditingTime ? 'Cerrar ✕' : '✎ Editar tiempo'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.daysBigRow}>
          <Text style={styles.daysBigNumber}>{totalDays}</Text>
          <Text style={styles.daysBigUnit}>{unitLabel}</Text>
        </View>

        {isEditingTime && (
          <View style={styles.editBox}>
            <Text style={styles.editFieldLabel}>
              ESCRIBIR DÍAS JUNTOS (CALCULA LA FECHA):
            </Text>
            <TextInput
              style={styles.editInput}
              keyboardType="numeric"
              value={customDaysInput}
              onChangeText={handleDaysChange}
              placeholder="Ej. 365"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.editFieldLabel}>
              O FECHA DE INICIO (AAAA-MM-DD):
            </Text>
            <TextInput
              style={styles.editInput}
              value={customDate}
              onChangeText={setCustomDate}
              placeholder="2024-02-14"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.editFieldLabel}>FRASE DEL CONTADOR:</Text>
            <TextInput
              style={styles.editInput}
              value={unitLabel}
              onChangeText={setUnitLabel}
              placeholder="Días de complicidad"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity
              style={styles.saveEditBtn}
              onPress={saveTimeChanges}>
              <Text style={styles.saveEditBtnText}>
                Guardar Tiempo Juntos ✓
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsDivider} />

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{months}</Text>
            <Text style={styles.statLabel}>Meses</Text>
          </View>
          <View style={styles.statVerticalLine} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{hours.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Horas</Text>
          </View>
          <View style={styles.statVerticalLine} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>∞</Text>
            <Text style={styles.statLabel}>Por vivir</Text>
          </View>
        </View>
      </View>

      {/* Estado de sintonía hoy */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>¿En qué sintonía estás hoy?</Text>
        <View style={styles.moodRow}>
          {MOODS.map(m => {
            const active = selectedMood === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => handleSelectMood(m.id)}
                style={[styles.moodCard, active && styles.moodCardActive]}>
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text
                  style={[styles.moodLabel, active && styles.moodLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Chispa / Reto del Día (Editable) */}
      <View style={styles.sparkCard}>
        <View style={styles.sparkHeader}>
          <Text style={styles.sparkBadge}>CHISPA / RETO DEL DÍA</Text>
          <View style={styles.sparkActions}>
            <TouchableOpacity
              onPress={() => {
                setSparkDraft(sparks[sparkIndex]);
                setIsEditingSpark(!isEditingSpark);
              }}
              style={styles.sparkRefreshBtn}>
              <Text style={styles.sparkRefreshText}>
                {isEditingSpark ? 'Cerrar' : '✎ Escribir'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={nextSpark} style={styles.sparkRefreshBtn}>
              <Text style={styles.sparkRefreshText}>Otra ↻</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.sparkQuote}>“{sparks[sparkIndex]}”</Text>

        {isEditingSpark && (
          <View style={styles.editBox}>
            <TextInput
              style={[styles.editInput, styles.sparkEditInput]}
              multiline
              value={sparkDraft}
              onChangeText={setSparkDraft}
              placeholder="Escribe su propio reto o frase del día..."
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.sparkSaveRow}>
              <TouchableOpacity
                style={[styles.saveEditBtn, styles.flexOne]}
                onPress={() => saveSpark(false)}>
                <Text style={styles.saveEditBtnText}>Guardar cambios</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveEditBtnAlt, styles.flexOne]}
                onPress={() => saveSpark(true)}>
                <Text style={styles.saveEditBtnAltText}>+ Nueva idea</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Accesos rápidos a las funciones del menú */}
      <Text style={styles.sectionTitle}>Explorar Nuestro Universo</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigateTab('planes')}>
          <Text style={styles.quickNumber}>✎</Text>
          <Text style={styles.quickCardTitle}>Retos & Deseos</Text>
          <Text style={styles.quickCardSub}>Escribir y editar planes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigateTab('recuerdos')}>
          <Text style={styles.quickNumber}>♡</Text>
          <Text style={styles.quickCardTitle}>Cartas & Amor</Text>
          <Text style={styles.quickCardSub}>Cápsula editable</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.wineDeep,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  welcomeTag: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: COLORS.goldLight,
    marginBottom: 2,
  },
  coupleTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.creamLight,
  },
  codeSubtitle: {
    fontSize: 11,
    color: COLORS.taupe,
    marginTop: 2,
    fontWeight: '600',
  },
  miniLogoBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.wineVelvet,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  miniLogo: {
    width: 40,
    height: 40,
  },
  pairingCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    marginBottom: 16,
    shadowColor: COLORS.gold,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  pairingCardUrgent: {
    borderColor: COLORS.goldLight,
    backgroundColor: 'rgba(60, 14, 22, 0.95)',
  },
  pairingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pairingOverline: {
    color: COLORS.goldLight,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  statusBadge: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.taupe,
  },
  statusBadgeDone: {
    borderColor: COLORS.goldLight,
    backgroundColor: 'rgba(212, 175, 90, 0.25)',
  },
  statusBadgeText: {
    color: COLORS.cream,
    fontSize: 10,
    fontWeight: '700',
  },
  pairingBodyText: {
    color: COLORS.taupe,
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 12,
  },
  pairingCodeContainer: {
    backgroundColor: COLORS.wineDeep,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    alignItems: 'center',
  },
  pairingCodeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.creamLight,
    letterSpacing: 3,
    marginBottom: 10,
  },
  pairingActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  pairingShareBtn: {
    flex: 1.4,
    backgroundColor: COLORS.gold,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairingShareBtnText: {
    color: COLORS.wineDeep,
    fontSize: 11.5,
    fontWeight: '800',
  },
  pairingRegenBtn: {
    flex: 1,
    backgroundColor: COLORS.maroon,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  pairingRegenBtnText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  counterCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  counterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  counterOverline: {
    color: COLORS.taupe, // #C7B7A3
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  editMiniBtn: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  editMiniBtnText: {
    color: COLORS.goldLight,
    fontSize: 10,
    fontWeight: '700',
  },
  editBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.wineDeep,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  editFieldLabel: {
    color: COLORS.goldLight,
    fontSize: 9.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  editInput: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    paddingHorizontal: 10,
    height: 36,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
  },
  saveEditBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveEditBtnText: {
    color: COLORS.textDark,
    fontSize: 11.5,
    fontWeight: '800',
  },
  saveEditBtnAlt: {
    backgroundColor: COLORS.wineDark,
    borderRadius: 10,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  saveEditBtnAltText: {
    color: COLORS.cream,
    fontSize: 11.5,
    fontWeight: '800',
  },
  sparkActions: {
    flexDirection: 'row',
    gap: 6,
  },
  sparkSaveRow: {
    flexDirection: 'row',
    gap: 8,
  },
  daysBigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  daysBigNumber: {
    color: COLORS.cream, // #E8D8C4
    fontSize: 34,
    fontWeight: '900',
  },
  daysBigUnit: {
    color: COLORS.gold,
    fontSize: 13.5,
    fontWeight: '700',
  },
  statsDivider: {
    height: 1,
    backgroundColor: COLORS.maroon,
    marginVertical: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVerticalLine: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.maroon,
  },
  statVal: {
    color: COLORS.cream,
    fontSize: 14.5,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.taupe,
    fontSize: 10.5,
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.creamLight,
    marginBottom: 10,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodCard: {
    flex: 1,
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  moodCardActive: {
    backgroundColor: COLORS.wineDark,
    borderColor: COLORS.gold,
  },
  moodEmoji: {
    fontSize: 18,
    color: COLORS.goldLight,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.taupe,
    textAlign: 'center',
  },
  moodLabelActive: {
    color: COLORS.goldLight,
  },
  sparkCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  sparkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sparkBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.goldLight,
  },
  sparkRefreshBtn: {
    backgroundColor: COLORS.wineDark,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sparkRefreshText: {
    color: COLORS.cream,
    fontSize: 10.5,
    fontWeight: '700',
  },
  sparkQuote: {
    color: COLORS.cream,
    fontSize: 12.5,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  quickNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.goldLight,
    marginBottom: 2,
  },
  quickCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.creamLight,
  },
  quickCardSub: {
    fontSize: 11,
    color: COLORS.taupe,
    marginTop: 2,
  },
  sparkEditInput: {
    minHeight: 56,
  },
  flexOne: {
    flex: 1,
  },
});

