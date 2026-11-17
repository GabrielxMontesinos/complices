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

interface ProfileScreenProps {
  account: CoupleAccount;
  onUpdateAccount: (updated: CoupleAccount) => void;
  onLogoSecretTap?: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  account,
  onUpdateAccount,
  onLogoSecretTap,
  onLogout,
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
        message: `¡Hola amor! Descarga nuestra app Cómplices, selecciona 'Vincular con Código' e ingresa nuestro código privado: ${account.coupleCode} para que conectemos nuestros celulares 💕`,
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Tarjeta superior del perfil de pareja */}
      <View style={styles.heroCard}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onLogoSecretTap}
          style={styles.logoRing}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.coupleNames}>{account.coupleNames}</Text>
        <Text style={styles.tierLabel}>{account.planTier}</Text>

        <View style={styles.codePill}>
          <Text style={styles.codePillText}>
            CÓDIGO DE PAREJA: {account.coupleCode}
          </Text>
        </View>

        <View style={styles.codeActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.codeShareBtn}
            onPress={handleShareCode}>
            <Text style={styles.codeShareBtnText}>Compartir por WhatsApp ✦</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={generatingCode}
            style={styles.codeRegenBtn}
            onPress={handleRegenerateCode}>
            <Text style={styles.codeRegenBtnText}>
              {generatingCode ? '...' : 'Nuevo Código ↻'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Identidad en este teléfono */}
      <View style={styles.deviceCard}>
        <Text style={styles.sectionHeader}>TU IDENTIDAD EN ESTE CELULAR</Text>
        <Text style={styles.deviceSubtitle}>
          Mensajes y planes se firman a nombre de:
        </Text>
        <View style={styles.deviceRow}>
          <View style={styles.currentNameBadge}>
            <Text style={styles.currentNameText}>
              👤 {account.myRole === 'partnerTwo' ? account.partnerTwo : account.partnerOne}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.switchRoleBtn}
            onPress={() => {
              const newRole =
                account.myRole === 'partnerTwo' ? 'partnerOne' : 'partnerTwo';
              onUpdateAccount({...account, myRole: newRole});
            }}>
            <Text style={styles.switchRoleBtnText}>
              Probar como {account.myRole === 'partnerTwo' ? account.partnerOne : account.partnerTwo} ⇄
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.deviceHint}>
          ✦ Para conectar a tu pareja, pídele que descargue la app, seleccione "Vincular con Código" e ingrese este código: {account.coupleCode}.
        </Text>
      </View>

      {/* Detalles de la Cuenta Asignada / Edición */}
      <View style={styles.infoCard}>
        <View style={styles.headerEditRow}>
          <Text style={styles.sectionHeader}>DATOS DE LA PAREJA</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editBtnText}>
              {isEditing ? 'Cancelar ✕' : '✎ Editar Datos'}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View>
            <Text style={styles.inputLabel}>NOMBRE DE LA PAREJA</Text>
            <TextInput
              style={styles.textInput}
              value={coupleNames}
              onChangeText={setCoupleNames}
            />
            <Text style={styles.inputLabel}>INTEGRANTE 1</Text>
            <TextInput
              style={styles.textInput}
              value={partnerOne}
              onChangeText={setPartnerOne}
            />
            <Text style={styles.inputLabel}>INTEGRANTE 2</Text>
            <TextInput
              style={styles.textInput}
              value={partnerTwo}
              onChangeText={setPartnerTwo}
            />
            <Text style={styles.inputLabel}>
              FECHA DE INICIO / ANIVERSARIO (AAAA-MM-DD)
            </Text>
            <TextInput
              style={styles.textInput}
              value={anniversaryDate}
              onChangeText={setAnniversaryDate}
            />
            <Text style={styles.inputLabel}>CÓDIGO DE PAREJA</Text>
            <TextInput
              style={styles.textInput}
              value={coupleCode}
              onChangeText={setCoupleCode}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Guardar Datos de Pareja ✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
              <Text style={styles.infoKey}>Fecha de Inicio / Aniversario</Text>
              <Text style={styles.infoVal}>{account.anniversaryDate}</Text>
            </View>
          </>
        )}
      </View>

      {/* Botón Cerrar Sesión */}
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.logoutBtn}
        onPress={onLogout}>
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
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 120,
  },
  heroCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    marginBottom: 20,
  },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.wineDeep,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoImg: {
    width: 82,
    height: 82,
  },
  coupleNames: {
    color: COLORS.cream,
    fontSize: 17.5,
    fontWeight: '800',
  },
  tierLabel: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
    marginBottom: 12,
  },
  codePill: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.taupe,
  },
  codePillText: {
    color: COLORS.cream,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    width: '100%',
  },
  codeShareBtn: {
    flex: 1.3,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeShareBtnText: {
    color: COLORS.wineDeep,
    fontSize: 11,
    fontWeight: '800',
  },
  codeRegenBtn: {
    flex: 1,
    backgroundColor: COLORS.wineDeep,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  codeRegenBtnText: {
    color: COLORS.goldLight,
    fontSize: 10.5,
    fontWeight: '700',
  },
  deviceCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gold,
    marginBottom: 16,
  },
  deviceSubtitle: {
    color: COLORS.taupe,
    fontSize: 12,
    marginTop: 4,
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
    backgroundColor: COLORS.wineDeep,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
  },
  currentNameText: {
    color: COLORS.cream,
    fontSize: 14,
    fontWeight: '800',
  },
  switchRoleBtn: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.taupe,
  },
  switchRoleBtnText: {
    color: COLORS.goldLight,
    fontSize: 11.5,
    fontWeight: '700',
  },
  deviceHint: {
    color: COLORS.goldLight,
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.85,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    marginBottom: 16,
  },
  headerEditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: COLORS.goldLight,
  },
  editBtn: {
    backgroundColor: COLORS.wineDeep,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  editBtnText: {
    color: COLORS.goldLight,
    fontSize: 10.5,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.goldLight,
    marginBottom: 4,
    marginTop: 6,
  },
  textInput: {
    backgroundColor: COLORS.wineDeep,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    paddingHorizontal: 10,
    height: 36,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
  },
  saveBtnText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoKey: {
    fontSize: 12.5,
    color: COLORS.taupe,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 12.5,
    color: COLORS.creamLight,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.goldMuted,
    opacity: 0.4,
  },
  logoutBtn: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 15,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  logoutBtnText: {
    color: COLORS.goldLight,
    fontSize: 13,
    fontWeight: '800',
  },
});

