import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {COLORS, TabKey} from '../theme/colors';
import {CoupleAccount} from '../data/assignedUsers';

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

  const nextSpark = () => {
    setSparkIndex(prev => (prev + 1) % sparks.length);
  };

  const saveSpark = (asNew: boolean) => {
    if (!sparkDraft.trim()) {
      return;
    }
    if (asNew) {
      setSparks([sparkDraft.trim(), ...sparks]);
      setSparkIndex(0);
    } else {
      setSparks(prev =>
        prev.map((s, idx) => (idx === sparkIndex ? sparkDraft.trim() : s)),
      );
    }
    setIsEditingSpark(false);
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
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onLogoSecretTap}
          style={styles.miniLogoBadge}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.miniLogo}
            resizeMode="contain"
          />
        </TouchableOpacity>
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
                onPress={() => setSelectedMood(m.id)}
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

