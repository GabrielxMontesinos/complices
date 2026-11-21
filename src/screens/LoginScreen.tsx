import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {COLORS} from '../theme/colors';
import {CoupleAccount} from '../data/assignedUsers';
import {
  fetchCoupleByCredentials,
  fetchCoupleByCode,
  linkPartnerTwo,
  SupabaseCouple,
} from '../lib/supabase';
import {
  KeyIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  HeartIcon,
  ShieldCheckIcon,
  UserIcon,
} from '../components/AppIcons';

interface LoginScreenProps {
  onLoginSuccess: (account: CoupleAccount) => void;
  onLogoSecretTap?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onLogoSecretTap,
}) => {
  // authMode: 'credentials' para el titular, 'code' para la pareja invitada
  const [authMode, setAuthMode] = useState<'credentials' | 'code'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estado para la vinculación con código (pareja invitada)
  const [coupleCodeInput, setCoupleCodeInput] = useState('');
  const [partnerStep, setPartnerStep] = useState<'enterCode' | 'fillProfile'>('enterCode');
  const [matchedCouple, setMatchedCouple] = useState<SupabaseCouple | null>(null);
  const [partnerTwoName, setPartnerTwoName] = useState('');
  const [partnerTwoNickname, setPartnerTwoNickname] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Acceso del Titular (Usuario y Contraseña)
  const handleLogin = async () => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const remoteCouple = await fetchCoupleByCredentials(cleanUser, cleanPass);

      if (remoteCouple) {
        const coupleAccount: CoupleAccount = {
          id: remoteCouple.id,
          username: remoteCouple.username,
          password: cleanPass,
          coupleNames: remoteCouple.couple_names || `${remoteCouple.partner_one} & Pareja`,
          partnerOne: remoteCouple.partner_one || 'Titular',
          partnerTwo: remoteCouple.partner_two || 'Pendiente',
          anniversaryDate: remoteCouple.anniversary_date || new Date().toISOString().split('T')[0],
          coupleCode: remoteCouple.couple_code,
          planTier: remoteCouple.plan_tier || 'Edición Dorada Exclusiva',
          myRole: 'partnerOne',
        };
        setLoading(false);
        onLoginSuccess(coupleAccount);
        return;
      }

      setLoading(false);
      setErrorMessage(
        'Credenciales no reconocidas. Verifica el usuario y clave creados por el administrador.',
      );
    } catch (err: any) {
      console.warn('Login error:', err);
      setLoading(false);
      setErrorMessage(
        'Error de conexión. Verifica tu internet o los datos asignados.',
      );
    }
  };

  // 2. Paso 1 de la Pareja: Verificar el Código recibido
  const handleVerifyCode = async () => {
    const cleanCode = coupleCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Por favor escribe el código de vinculación que te dio tu pareja.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const remoteCouple = await fetchCoupleByCode(cleanCode);
      if (remoteCouple) {
        // Bloquear si ya está vinculado
        const isAlreadyLinked =
          remoteCouple.partner_two &&
          remoteCouple.partner_two !== 'Pendiente' &&
          remoteCouple.partner_two !== 'Pareja';

        if (isAlreadyLinked) {
          const coupleAccount: CoupleAccount = {
            id: remoteCouple.id,
            username: remoteCouple.username,
            password: remoteCouple.password || '',
            coupleNames:
              remoteCouple.couple_names ||
              `${remoteCouple.partner_one} & ${remoteCouple.partner_two}`,
            partnerOne: remoteCouple.partner_one,
            partnerTwo: remoteCouple.partner_two,
            anniversaryDate:
              remoteCouple.anniversary_date ||
              new Date().toISOString().split('T')[0],
            coupleCode: remoteCouple.couple_code,
            planTier: remoteCouple.plan_tier || 'Edición Dorada Exclusiva',
            myRole: 'partnerTwo',
          };
          setLoading(false);
          onLoginSuccess(coupleAccount);
          return;
        }

        // Si aún no está vinculado, pasar al paso 2
        setMatchedCouple(remoteCouple);
        setPartnerStep('fillProfile');
        setLoading(false);
        return;
      }

      setLoading(false);
      setErrorMessage('Código no encontrado. Pídele a tu pareja que verifique el código en su app.');
    } catch (err) {
      console.warn('Code verify error:', err);
      setLoading(false);
      setErrorMessage('Error al verificar el código. Comprueba tu conexión a internet.');
    }
  };

  // 3. Paso 2 de la Pareja: Completar vinculación
  const handleCompletePartnerLinking = async () => {
    const cleanName = partnerTwoName.trim();
    if (!cleanName) {
      setErrorMessage('Por favor escribe tu nombre para que tu pareja te reconozca.');
      return;
    }

    if (!matchedCouple) {
      setErrorMessage('Error de sesión. Vuelve a ingresar el código.');
      setPartnerStep('enterCode');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const updatedCouple = await linkPartnerTwo(
        matchedCouple.id,
        cleanName,
        partnerTwoNickname.trim() || undefined,
      );

      const coupleAccount: CoupleAccount = {
        id: updatedCouple.id,
        username: updatedCouple.username,
        password: updatedCouple.password || '',
        coupleNames:
          updatedCouple.couple_names ||
          `${updatedCouple.partner_one} & ${cleanName}`,
        partnerOne: updatedCouple.partner_one,
        partnerTwo: cleanName,
        anniversaryDate:
          updatedCouple.anniversary_date ||
          new Date().toISOString().split('T')[0],
        coupleCode: updatedCouple.couple_code,
        planTier: updatedCouple.plan_tier || 'Edición Dorada Exclusiva',
        myRole: 'partnerTwo',
      };

      setLoading(false);
      onLoginSuccess(coupleAccount);
    } catch (err: any) {
      console.warn('Link partner error:', err);
      setLoading(false);
      setErrorMessage('No se pudo vincular en este momento. Inténtalo nuevamente.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Top Hero estilo Apple */}
        <View style={styles.topHero}>
          <View
            style={styles.logoMedallion}
            accessibilityLabel="Logo de Cómplices">
            <Image
              source={require('../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandSubtitle}>SUITE PRIVADA DE PAREJA</Text>
          <Text style={styles.brandTitle}>Cómplices</Text>
          <View style={styles.goldDivider} />
        </View>

        {/* Tarjeta de Entrada Glassmorphic */}
        <View style={styles.formCard}>
          {/* Selector de Modo estilo Apple Segmented Control */}
          <View style={styles.tabToggleRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.tabToggleBtn,
                authMode === 'credentials' && styles.tabToggleBtnActive,
              ]}
              onPress={() => {
                setAuthMode('credentials');
                setErrorMessage('');
              }}>
              <KeyIcon
                size={13}
                color={authMode === 'credentials' ? COLORS.goldLight : COLORS.taupe}
              />
              <Text
                style={[
                  styles.tabToggleText,
                  authMode === 'credentials' && styles.tabToggleTextActive,
                ]}>
                Titular
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.tabToggleBtn,
                authMode === 'code' && styles.tabToggleBtnActive,
              ]}
              onPress={() => {
                setAuthMode('code');
                setErrorMessage('');
              }}>
              <LockIcon
                size={13}
                color={authMode === 'code' ? COLORS.goldLight : COLORS.taupe}
              />
              <Text
                style={[
                  styles.tabToggleText,
                  authMode === 'code' && styles.tabToggleTextActive,
                ]}>
                Con Código
              </Text>
            </TouchableOpacity>
          </View>

          {authMode === 'credentials' ? (
            /* ============================================================== */
            /* MODO 1: TITULAR                                                */
            /* ============================================================== */
            <>
              <Text style={styles.cardTitle}>Acceso de Titular</Text>
              <Text style={styles.cardDescription}>
                Ingresa con las credenciales asignadas por administración para abrir tu espacio.
              </Text>

              {/* Campo Usuario */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>USUARIO ASIGNADO</Text>
                <View style={styles.inputWrapper}>
                  <UserIcon size={16} color={COLORS.goldLight} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ej. pareja.vip"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={text => {
                      setUsername(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                </View>
              </View>

              {/* Campo Contraseña */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONTRASEÑA</Text>
                <View style={styles.inputWrapper}>
                  <KeyIcon size={16} color={COLORS.goldLight} />
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={password}
                    onChangeText={text => {
                      setPassword(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}>
                    {showPassword ? (
                      <EyeOffIcon size={18} color={COLORS.goldLight} />
                    ) : (
                      <EyeIcon size={18} color={COLORS.taupe} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.loginButton, loading && {opacity: 0.7}]}
                disabled={loading}
                onPress={handleLogin}>
                {loading ? (
                  <ActivityIndicator color={COLORS.textDark} size="small" />
                ) : (
                  <>
                    <CheckIcon size={16} color={COLORS.textDark} />
                    <Text style={styles.loginButtonText}>Entrar como Titular</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : partnerStep === 'enterCode' ? (
            /* ============================================================== */
            /* MODO 2: PAREJA INVITADA - PASO 1 (Código)                      */
            /* ============================================================== */
            <>
              <Text style={styles.cardTitle}>Vincúlate con tu Pareja</Text>
              <Text style={styles.cardDescription}>
                Ingresa el código que te compartió tu pareja para sincronizar ambos celulares.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CÓDIGO DE PAREJA</Text>
                <View style={styles.inputWrapper}>
                  <LockIcon size={16} color={COLORS.goldLight} />
                  <TextInput
                    style={[styles.textInput, styles.codeInput]}
                    placeholder="Ej. ALMA-2026"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    value={coupleCodeInput}
                    onChangeText={text => {
                      setCoupleCodeInput(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                </View>
              </View>

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.loginButton, loading && {opacity: 0.7}]}
                disabled={loading}
                onPress={handleVerifyCode}>
                {loading ? (
                  <ActivityIndicator color={COLORS.textDark} size="small" />
                ) : (
                  <>
                    <CheckIcon size={16} color={COLORS.textDark} />
                    <Text style={styles.loginButtonText}>Verificar Código</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* ============================================================== */
            /* MODO 2: PAREJA INVITADA - PASO 2 (Datos)                       */
            /* ============================================================== */
            <>
              <View style={styles.matchedBadge}>
                <HeartIcon size={13} color={COLORS.goldLight} filled />
                <Text style={styles.matchedBadgeText}>
                  ESPACIO DE {matchedCouple?.partner_one?.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.cardTitle}>¡Bienvenida/o a su Espacio!</Text>
              <Text style={styles.cardDescription}>
                Tu pareja <Text style={{color: COLORS.goldLight, fontWeight: '700'}}>{matchedCouple?.partner_one}</Text> ya inició este espacio. Completa tu nombre para finalizar:
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TU NOMBRE</Text>
                <View style={styles.inputWrapper}>
                  <UserIcon size={16} color={COLORS.goldLight} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ej. Valentina"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={partnerTwoName}
                    onChangeText={text => {
                      setPartnerTwoName(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>APODO CARIÑOSO (OPCIONAL)</Text>
                <View style={styles.inputWrapper}>
                  <HeartIcon size={16} color={COLORS.goldLight} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ej. Mi amor"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={partnerTwoNickname}
                    onChangeText={setPartnerTwoNickname}
                  />
                </View>
              </View>

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.loginButton, loading && {opacity: 0.7}]}
                disabled={loading}
                onPress={handleCompletePartnerLinking}>
                {loading ? (
                  <ActivityIndicator color={COLORS.textDark} size="small" />
                ) : (
                  <>
                    <HeartIcon size={16} color={COLORS.textDark} filled />
                    <Text style={styles.loginButtonText}>Vincularnos y Entrar</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.7}
                onPress={() => {
                  setPartnerStep('enterCode');
                  setErrorMessage('');
                }}>
                <Text style={styles.backButtonText}>← Usar otro código</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Pie informativo */}
        <View style={styles.footerInfo}>
          <ShieldCheckIcon size={14} color={COLORS.taupe} />
          <Text style={styles.footerNote}>
            Espacio cifrado y sincronizado en la nube para dos celulares.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.wineDeep,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topHero: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  logoMedallion: {
    width: 84,
    height: 84,
    borderRadius: 22,
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
  logoImage: {
    width: 84,
    height: 84,
    borderRadius: 22,
  },
  brandSubtitle: {
    fontSize: 9.5,
    letterSpacing: 2.2,
    color: COLORS.goldLight,
    fontWeight: '800',
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.creamLight,
    letterSpacing: -0.5,
  },
  goldDivider: {
    width: 36,
    height: 2,
    backgroundColor: COLORS.gold,
    marginTop: 10,
    borderRadius: 1,
    opacity: 0.65,
  },
  formCard: {
    width: '100%',
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorderSubtle,
  },
  tabToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 11,
  },
  tabToggleBtnActive: {
    backgroundColor: COLORS.wineElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.35)',
  },
  tabToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.taupe,
  },
  tabToggleTextActive: {
    color: COLORS.goldLight,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.creamLight,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.taupe,
    lineHeight: 17,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.goldLight,
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 12,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: 8,
  },
  codeInput: {
    letterSpacing: 2,
    fontWeight: '700',
  },
  eyeButton: {
    padding: 6,
  },
  errorBox: {
    backgroundColor: COLORS.dangerBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    height: 44,
    marginTop: 6,
    shadowColor: COLORS.gold,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '800',
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.goldSubtle,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.25)',
    marginBottom: 8,
  },
  matchedBadgeText: {
    color: COLORS.goldLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  backButtonText: {
    color: COLORS.taupe,
    fontSize: 12,
    fontWeight: '600',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    paddingHorizontal: 12,
  },
  footerNote: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
