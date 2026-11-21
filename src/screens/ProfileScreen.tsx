import React, {useState} from 'react';
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
import {COLORS} from '../theme/colors';
import {CoupleAccount} from '../data/assignedUsers';
import {generateNewCoupleCode} from '../lib/supabase';
import {
  UserIcon,
  LockIcon,
  ShareIcon,
  RefreshIcon,
  PencilIcon,
  CloseIcon,
  CheckIcon,
  CalendarIcon,
  ArrowRightLeftIcon,
  ShieldCheckIcon,
} from '../components/AppIcons';

interface ProfileScreenProps {
  account: CoupleAccount;
  onUpdateAccount: (updated: CoupleAccount) => void;
  onLogout: () => void;
  onLogoSecretTap?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  account,
  onUpdateAccount,
  onLogout,
  onLogoSecretTap,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [coupleNames, setCoupleNames] = useState(account.coupleNames);
  const [partnerOne, setPartnerOne] = useState(account.partnerOne);
  const [partnerTwo, setPartnerTwo] = useState(account.partnerTwo);
  const [anniversaryDate, setAnniversaryDate] = useState(
    account.anniversaryDate,
  );
  const [coupleCode, setCoupleCode] = useState(account.coupleCode);
  const [generatingCode, setGeneratingCode] = useState(false);

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `¡Hola mi amor! Descarga nuestra app Cómplices, selecciona 'Vincular con Código' e ingresa nuestro código privado: ${account.coupleCode} para que conectemos nuestros celulares 💕`,
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
      setCoupleCode(newCode);
      onUpdateAccount({...account, coupleCode: newCode});
      Alert.alert('Nuevo Código Generado', `Tu nuevo código de vinculación es:\n${newCode}`);
    } catch (err) {
      console.warn('Generate error:', err);
      Alert.alert('Error', 'No se pudo generar nuevo código.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleSave = () => {
    onUpdateAccount({
      ...account,
      coupleNames: coupleNames.trim() || `${partnerOne} & ${partnerTwo}`,
      partnerOne: partnerOne.trim() || account.partnerOne,
      partnerTwo: partnerTwo.trim() || account.partnerTwo,
      anniversaryDate: anniversaryDate.trim() || account.anniversaryDate,
      coupleCode: coupleCode.trim() || account.coupleCode,
    });
    setIsEditing(false);
  };

  const currentRoleName = account.myRole === 'partnerTwo' ? account.partnerTwo : account.partnerOne;
  const alternateRoleName = account.myRole === 'partnerTwo' ? account.partnerOne : account.partnerTwo;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Tarjeta Hero estilo Apple ID */}
      <View style={styles.heroCard}>
        <View
          style={styles.logoRing}
          accessibilityLabel="Emblema de pareja">
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.coupleNames}>{account.coupleNames}</Text>
        <View style={styles.tierPill}>
          <Text style={styles.tierLabel}>{account.planTier.toUpperCase()}</Text>
        </View>

        <View style={styles.codePill}>
          <LockIcon size={12} color={COLORS.gold} />
          <Text style={styles.codePillText}>
            CÓDIGO: {account.coupleCode}
          </Text>
        </View>

        <View style={styles.codeActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.primaryPillBtn}
            onPress={handleShareCode}>
            <ShareIcon size={14} color={COLORS.textDark} />
            <Text style={styles.primaryPillBtnText}>Compartir por WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={generatingCode}
            style={styles.secondaryPillBtn}
            onPress={handleRegenerateCode}>
            <RefreshIcon size={13} color={COLORS.goldLight} />
            <Text style={styles.secondaryPillBtnText}>
              {generatingCode ? '...' : 'Nuevo'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Identidad en este celular estilo Apple Device Card */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <UserIcon size={14} color={COLORS.gold} />
          <Text style={styles.sectionHeader}>TU IDENTIDAD EN ESTE CELULAR</Text>
        </View>
        <Text style={styles.deviceSubtitle}>
          Las notas, cartas y mensajes se envían a nombre de:
        </Text>

        <View style={styles.deviceRow}>
          <View style={styles.currentNameBadge}>
            <UserIcon size={13} color={COLORS.goldLight} />
            <Text style={styles.currentNameText}>{currentRoleName}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.switchRoleBtn}
            onPress={() => {
              const newRole =
                account.myRole === 'partnerTwo' ? 'partnerOne' : 'partnerTwo';
              onUpdateAccount({...account, myRole: newRole});
            }}>
            <ArrowRightLeftIcon size={12} color={COLORS.goldLight} />
            <Text style={styles.switchRoleBtnText}>
              Cambiar a {alternateRoleName}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.deviceHint}>
          Tu pareja se conecta en su celular con el código: #{account.coupleCode}
        </Text>
      </View>

      {/* Detalles de la Cuenta estilo iOS Grouped Inset */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRowBetween}>
          <View style={styles.cardHeaderRow}>
            <ShieldCheckIcon size={14} color={COLORS.gold} />
            <Text style={styles.sectionHeader}>DATOS DE LA PAREJA</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.editBtn}
            onPress={() => setIsEditing(!isEditing)}>
            {isEditing ? (
              <>
                <CloseIcon size={12} color={COLORS.goldLight} />
                <Text style={styles.editBtnText}>Cerrar</Text>
              </>
            ) : (
              <>
                <PencilIcon size={12} color={COLORS.goldLight} />
                <Text style={styles.editBtnText}>Editar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <Text style={styles.inputLabel}>NOMBRE DE LA PAREJA</Text>
            <TextInput
              style={styles.appleInput}
              value={coupleNames}
              onChangeText={setCoupleNames}
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.inputLabel}>INTEGRANTE 1 (TITULAR)</Text>
            <TextInput
              style={styles.appleInput}
              value={partnerOne}
              onChangeText={setPartnerOne}
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.inputLabel}>INTEGRANTE 2 (PAREJA)</Text>
            <TextInput
              style={styles.appleInput}
              value={partnerTwo}
              onChangeText={setPartnerTwo}
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.inputLabel}>
              FECHA DE INICIO / ANIVERSARIO (AAAA-MM-DD)
            </Text>
            <TextInput
              style={styles.appleInput}
              value={anniversaryDate}
              onChangeText={setAnniversaryDate}
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.inputLabel}>CÓDIGO DE PAREJA</Text>
            <TextInput
              style={styles.appleInput}
              value={coupleCode}
              onChangeText={setCoupleCode}
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity
              style={styles.primaryPillBtn}
              activeOpacity={0.8}
              onPress={handleSave}>
              <CheckIcon size={14} color={COLORS.textDark} />
              <Text style={styles.primaryPillBtnText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.insetGroup}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Usuario Asignado</Text>
              <Text style={styles.infoVal}>@{account.username}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Integrante 1</Text>
              <Text style={styles.infoVal}>{account.partnerOne}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Integrante 2</Text>
              <Text style={styles.infoVal}>{account.partnerTwo}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Fecha de Inicio</Text>
              <Text style={styles.infoVal}>{account.anniversaryDate}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Botón Cerrar Sesión estilo Apple Destructive */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.logoutBtn}
        onPress={onLogout}>
        <CloseIcon size={14} color={COLORS.danger} />
        <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
      </TouchableOpacity>
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
  heroCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  logoRing: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.gold,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImg: {
    width: 90,
    height: 90,
    borderRadius: 24,
  },
  coupleNames: {
    color: COLORS.creamLight,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tierPill: {
    backgroundColor: COLORS.goldSubtle,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.25)',
  },
  tierLabel: {
    color: COLORS.goldLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.wineElevated,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorderSubtle,
  },
  codePillText: {
    color: COLORS.creamLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    width: '100%',
  },
  primaryPillBtn: {
    flex: 1.4,
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: COLORS.gold,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryPillBtnText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryPillBtn: {
    flex: 0.7,
    backgroundColor: COLORS.wineElevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorderSubtle,
  },
  secondaryPillBtnText: {
    color: COLORS.goldLight,
    fontSize: 11.5,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.goldLight,
  },
  deviceSubtitle: {
    fontSize: 11.5,
    color: COLORS.taupe,
    marginTop: 6,
    marginBottom: 10,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  currentNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.wineElevated,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorderSubtle,
  },
  currentNameText: {
    color: COLORS.creamLight,
    fontSize: 12,
    fontWeight: '700',
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.goldSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.28)',
  },
  switchRoleBtnText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  deviceHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.wineElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorderSubtle,
  },
  editBtnText: {
    color: COLORS.goldLight,
    fontSize: 10.5,
    fontWeight: '700',
  },
  editForm: {
    marginTop: 6,
  },
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.goldLight,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  appleInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: 10,
  },
  insetGroup: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorderSubtle,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoKey: {
    fontSize: 12.5,
    color: COLORS.taupe,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 13,
    color: COLORS.creamLight,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorderSubtle,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.dangerBg,
    borderRadius: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
    marginTop: 4,
    marginBottom: 20,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontSize: 13.5,
    fontWeight: '700',
  },
});
