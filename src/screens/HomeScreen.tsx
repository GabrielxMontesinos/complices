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
  supabase,
  fetchCoupleStatus,
  upsertCoupleStatus,
  generateNewCoupleCode,
} from '../lib/supabase';
import {
  SparklesIcon,
  HeartIcon,
  CompassIcon,
  ShareIcon,
  RefreshIcon,
  LockIcon,
  PencilIcon,
  CloseIcon,
  CheckIcon,
  CalendarIcon,
  ClockIcon,
  ChevronRightIcon,
} from '../components/AppIcons';

interface HomeScreenProps {
  account: CoupleAccount;
  onUpdateAccount: (updated: CoupleAccount) => void;
  onNavigateTab: (tab: TabKey) => void;
  onLogoSecretTap?: () => void;
}

const MOODS = [
  {id: 'romantico', label: 'Romántico', icon: 'heart'},
  {id: 'complice', label: 'Cómplice', icon: 'sparkle'},
  {id: 'apasionado', label: 'Apasionado', icon: 'fire'},
  {id: 'extranandote', label: 'Extrañándote', icon: 'star'},
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

  // Cargar estado desde Supabase y suscribirse en tiempo real
  useEffect(() => {
    if (!account?.id) {
      return;
    }

    let isMounted = true;

    const loadStatus = async () => {
      try {
        const remote = await fetchCoupleStatus(account.id!);
        if (!isMounted) return;

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
        } else {
          // Si no existe fila en Supabase, sembrarla
          await upsertCoupleStatus(account.id!, {
            selected_mood: 'complice',
            sparks: INITIAL_SPARKS,
            spark_index: 0,
          });
        }
      } catch (err) {
        console.warn('Error loading couple status:', err);
      }
    };
    loadStatus();

    const channel = supabase
      .channel(`couple_status_live:${account.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couple_status',
          filter: `couple_id=eq.${account.id}`,
        },
        payload => {
          if (payload.new) {
            const row = payload.new as any;
            if (row.selected_mood) {
              setSelectedMood(row.selected_mood);
            }
            if (row.sparks && row.sparks.length > 0) {
              setSparks(row.sparks);
            }
            if (typeof row.spark_index === 'number') {
              setSparkIndex(row.spark_index);
            }
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
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
      {/* Encabezado Principal estilo Apple */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <View style={styles.badgeRow}>
            <View style={styles.tierPill}>
              <Text style={styles.welcomeTag}>{account.planTier.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.coupleTitle}>{account.coupleNames}</Text>
          <View style={styles.metaRow}>
            <CalendarIcon size={13} color={COLORS.taupe} />
            <Text style={styles.codeSubtitle}>
              Desde {account.anniversaryDate} • #{account.coupleCode}
            </Text>
          </View>
        </View>

        <View
          style={styles.logoBadgeTouchable}
          accessibilityLabel="Logo de Cómplices">
          <View style={styles.miniLogoBadge}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.miniLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {/* Tarjeta de Vinculación de Pareja (Apple Card Style) */}
      <View style={[styles.appleCard, isPartnerPending && styles.pairingCardUrgent]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.headerTitleWithIcon}>
            <LockIcon size={14} color={COLORS.gold} />
            <Text style={styles.cardOverline}>
              {isPartnerPending ? 'VINCULAR PAREJA' : 'ESPACIO CONECTADO'}
            </Text>
          </View>
          <View style={[styles.statusBadge, !isPartnerPending && styles.statusBadgeDone]}>
            {isPartnerPending ? (
              <ClockIcon size={11} color={COLORS.goldLight} />
            ) : (
              <CheckIcon size={11} color={COLORS.success} />
            )}
            <Text style={styles.statusBadgeText}>
              {isPartnerPending ? 'Esperando pareja' : account.partnerTwo}
            </Text>
          </View>
        </View>

        <Text style={styles.cardBodyText}>
          {isPartnerPending
            ? 'Para conectar el celular de tu pareja, comparte este código privado para acceder al mismo espacio:'
            : `Espacio íntimo y exclusivo activo entre ${account.partnerOne} y ${account.partnerTwo}.`}
        </Text>

        <View style={styles.codeSurface}>
          <Text style={styles.codeLabel}>CÓDIGO PRIVADO</Text>
          <Text style={styles.codeValue}>{account.coupleCode}</Text>
          {isPartnerPending ? (
            <View style={styles.codeActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.primaryPillBtn}
                onPress={handleShareCode}>
                <ShareIcon size={15} color={COLORS.textDark} />
                <Text style={styles.primaryPillBtnText}>Compartir por WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={generatingCode}
                style={styles.secondaryPillBtn}
                onPress={handleRegenerateCode}>
                <RefreshIcon size={14} color={COLORS.goldLight} />
                <Text style={styles.secondaryPillBtnText}>
                  {generatingCode ? '...' : 'Nuevo'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sealedRow}>
              <CheckIcon size={14} color={COLORS.gold} />
              <Text style={styles.sealedText}>Dispositivos sincronizados con Supabase</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tarjeta Principal: Contador de Tiempo Juntos estilo Apple Health */}
      <View style={styles.appleCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.headerTitleWithIcon}>
            <CalendarIcon size={14} color={COLORS.gold} />
            <Text style={styles.cardOverline}>NUESTRA HISTORIA</Text>
          </View>
          <TouchableOpacity
            style={styles.iconMiniBtn}
            activeOpacity={0.75}
            onPress={toggleTimeEditor}>
            {isEditingTime ? (
              <>
                <CloseIcon size={12} color={COLORS.goldLight} />
                <Text style={styles.iconMiniBtnText}>Cerrar</Text>
              </>
            ) : (
              <>
                <PencilIcon size={12} color={COLORS.goldLight} />
                <Text style={styles.iconMiniBtnText}>Editar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.daysBigRow}>
          <Text style={styles.daysBigNumber}>{totalDays}</Text>
          <View style={styles.daysUnitCol}>
            <Text style={styles.daysBigUnit}>{unitLabel}</Text>
            <Text style={styles.daysSubtext}>vividos con amor</Text>
          </View>
        </View>

        {isEditingTime && (
          <View style={styles.editSurface}>
            <Text style={styles.editFieldLabel}>
              ESCRIBIR DÍAS JUNTOS (CALCULA LA FECHA):
            </Text>
            <TextInput
              style={styles.appleInput}
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
              style={styles.appleInput}
              value={customDate}
              onChangeText={setCustomDate}
              placeholder="2024-02-14"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.editFieldLabel}>FRASE DEL CONTADOR:</Text>
            <TextInput
              style={styles.appleInput}
              value={unitLabel}
              onChangeText={setUnitLabel}
              placeholder="Días de complicidad"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity
              style={styles.primaryPillBtn}
              activeOpacity={0.8}
              onPress={saveTimeChanges}>
              <CheckIcon size={15} color={COLORS.textDark} />
              <Text style={styles.primaryPillBtnText}>Guardar Tiempo Juntos</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsDivider} />

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{months}</Text>
            <Text style={styles.statLabel}>Meses</Text>
          </View>
          <View style={styles.statDividerVertical} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{hours.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Horas</Text>
          </View>
          <View style={styles.statDividerVertical} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>∞</Text>
            <Text style={styles.statLabel}>Por vivir</Text>
          </View>
        </View>
      </View>

      {/* Sintonía de hoy (Apple Segmented Style) */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Sintonía de Hoy</Text>
        <View style={styles.moodRow}>
          {MOODS.map(m => {
            const active = selectedMood === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.75}
                onPress={() => handleSelectMood(m.id)}
                style={[styles.moodPill, active && styles.moodPillActive]}>
                <View style={[styles.moodIconWrap, active && styles.moodIconWrapActive]}>
                  {m.id === 'romantico' && (
                    <HeartIcon size={16} color={active ? COLORS.goldLight : COLORS.gold} filled={active} />
                  )}
                  {m.id === 'complice' && (
                    <SparklesIcon size={16} color={active ? COLORS.goldLight : COLORS.gold} />
                  )}
                  {m.id === 'apasionado' && (
                    <CompassIcon size={16} color={active ? COLORS.goldLight : COLORS.gold} />
                  )}
                  {m.id === 'extranandote' && (
                    <HeartIcon size={16} color={active ? COLORS.goldLight : COLORS.gold} />
                  )}
                </View>
                <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Chispa / Reto del Día estilo Apple Card */}
      <View style={styles.appleCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.headerTitleWithIcon}>
            <SparklesIcon size={14} color={COLORS.gold} />
            <Text style={styles.cardOverline}>CHISPA & RETO DEL DÍA</Text>
          </View>
          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                setSparkDraft(sparks[sparkIndex]);
                setIsEditingSpark(!isEditingSpark);
              }}
              style={styles.iconMiniBtn}>
              <PencilIcon size={12} color={COLORS.goldLight} />
              <Text style={styles.iconMiniBtnText}>
                {isEditingSpark ? 'Cerrar' : 'Escribir'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={nextSpark}
              style={styles.iconMiniBtn}>
              <RefreshIcon size={12} color={COLORS.goldLight} />
              <Text style={styles.iconMiniBtnText}>Otra</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sparkQuoteContainer}>
          <Text style={styles.sparkQuote}>“{sparks[sparkIndex]}”</Text>
        </View>

        {isEditingSpark && (
          <View style={styles.editSurface}>
            <TextInput
              style={[styles.appleInput, styles.sparkMultilineInput]}
              multiline
              value={sparkDraft}
              onChangeText={setSparkDraft}
              placeholder="Escribe su propio reto o frase del día..."
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.sparkButtonsRow}>
              <TouchableOpacity
                style={[styles.primaryPillBtn, styles.flexOne]}
                activeOpacity={0.8}
                onPress={() => saveSpark(false)}>
                <CheckIcon size={14} color={COLORS.textDark} />
                <Text style={styles.primaryPillBtnText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryPillBtn, styles.flexOne]}
                activeOpacity={0.8}
                onPress={() => saveSpark(true)}>
                <Text style={styles.secondaryPillBtnText}>+ Nueva idea</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Explorar Nuestro Universo: Inset Grouped Tiles */}
      <Text style={styles.sectionTitle}>Explorar Nuestro Universo</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.quickTile}
          activeOpacity={0.75}
          onPress={() => onNavigateTab('planes')}>
          <View style={styles.quickTileTop}>
            <View style={styles.quickIconCircle}>
              <CompassIcon size={18} color={COLORS.goldLight} />
            </View>
            <ChevronRightIcon size={14} color={COLORS.taupe} />
          </View>
          <Text style={styles.quickTileTitle}>Retos & Deseos</Text>
          <Text style={styles.quickTileSub}>Aventuras y fantasías</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickTile}
          activeOpacity={0.75}
          onPress={() => onNavigateTab('recuerdos')}>
          <View style={styles.quickTileTop}>
            <View style={styles.quickIconCircle}>
              <HeartIcon size={18} color={COLORS.goldLight} filled />
            </View>
            <ChevronRightIcon size={14} color={COLORS.taupe} />
          </View>
          <Text style={styles.quickTileTitle}>Cartas & Amor</Text>
          <Text style={styles.quickTileSub}>Cápsula de recuerdos</Text>
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
    paddingHorizontal: 18,
    paddingTop: 18,
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
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tierPill: {
    backgroundColor: COLORS.goldSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.28)',
  },
  welcomeTag: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.goldLight,
  },
  coupleTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.creamLight,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  codeSubtitle: {
    fontSize: 11.5,
    color: COLORS.taupe,
    fontWeight: '500',
  },
  logoBadgeTouchable: {
    padding: 2,
  },
  miniLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  miniLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  appleCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  pairingCardUrgent: {
    borderColor: 'rgba(212, 175, 90, 0.45)',
    backgroundColor: 'rgba(40, 10, 16, 0.95)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardOverline: {
    color: COLORS.goldLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(109, 41, 50, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.2)',
  },
  statusBadgeDone: {
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  statusBadgeText: {
    color: COLORS.creamLight,
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardBodyText: {
    color: COLORS.taupe,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  codeSurface: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.25)',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.taupe,
    letterSpacing: 1.2,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.creamLight,
    letterSpacing: 4,
    marginVertical: 6,
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  primaryPillBtn: {
    flex: 1.4,
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    shadowColor: COLORS.gold,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryPillBtnText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryPillBtn: {
    flex: 0.8,
    backgroundColor: COLORS.wineElevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  secondaryPillBtnText: {
    color: COLORS.goldLight,
    fontSize: 11.5,
    fontWeight: '700',
  },
  sealedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sealedText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '600',
  },
  iconMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.wineElevated,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  iconMiniBtnText: {
    color: COLORS.goldLight,
    fontSize: 10.5,
    fontWeight: '700',
  },
  daysBigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  daysBigNumber: {
    color: COLORS.creamLight,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  daysUnitCol: {
    flex: 1,
  },
  daysBigUnit: {
    color: COLORS.gold,
    fontSize: 14.5,
    fontWeight: '700',
  },
  daysSubtext: {
    color: COLORS.taupe,
    fontSize: 11,
    fontWeight: '500',
  },
  editSurface: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  editFieldLabel: {
    color: COLORS.goldLight,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  appleInput: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 10,
  },
  statsDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorderSubtle,
    marginVertical: 14,
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
  statDividerVertical: {
    width: 1,
    height: 26,
    backgroundColor: COLORS.cardBorderSubtle,
  },
  statVal: {
    color: COLORS.creamLight,
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.taupe,
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.creamLight,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  moodPill: {
    flex: 1,
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorderSubtle,
  },
  moodPillActive: {
    backgroundColor: COLORS.wineElevated,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  moodIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  moodIconWrapActive: {
    backgroundColor: COLORS.goldSubtle,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.taupe,
    textAlign: 'center',
  },
  moodLabelActive: {
    color: COLORS.goldLight,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sparkQuoteContainer: {
    marginVertical: 4,
  },
  sparkQuote: {
    color: COLORS.creamLight,
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  sparkMultilineInput: {
    minHeight: 64,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  sparkButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickTile: {
    flex: 1,
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  quickTileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.goldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.25)',
  },
  quickTileTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.creamLight,
    letterSpacing: -0.2,
  },
  quickTileSub: {
    fontSize: 11,
    color: COLORS.taupe,
    marginTop: 2,
    fontWeight: '500',
  },
  flexOne: {
    flex: 1,
  },
});
