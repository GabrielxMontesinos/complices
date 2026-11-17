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

interface LoginScreenProps {
  onLoginSuccess: (account: CoupleAccount) => void;
  onLogoSecretTap?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onLogoSecretTap,
}) => {
  // authMode: 'credentials' para el titular (creado por el admin), 'code' para la pareja
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

  // 1. Acceso del Titular (Usuario y Contraseña creados en el admin)
  const handleLogin = async () => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Por favor ingresa el usuario y la contraseña asignados.');
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
          myRole: 'partnerOne', // El titular siempre entra como el integrante principal
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
          setLoading(false);
          setErrorMessage(
            `Este código ya fue utilizado. ${remoteCouple.partner_one} ya está vinculado/a con ${remoteCouple.partner_two}.`,
          );
          return;
        }

        setMatchedCouple(remoteCouple);
        setPartnerStep('fillProfile');
        setLoading(false);
        return;
      }

      setLoading(false);
      setErrorMessage(
        'Código no encontrado. Pídele a tu pareja que te reenvíe su código de vinculación.',
      );
    } catch (err: any) {
      console.warn('Code verify error:', err);
      setLoading(false);
      setErrorMessage('Error al verificar el código. Revisa tu conexión a internet.');
    }
  };

  // 2. Paso 2 de la Pareja: Completar sus datos básicos y vincularse
  const handleCompletePartnerLinking = async () => {
    if (!matchedCouple) return;
    const cleanName = partnerTwoName.trim();
    if (!cleanName) {
      setErrorMessage('Por favor dinos tu nombre para personalizar tu espacio de pareja.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      if (!matchedCouple.id) {
        throw new Error('ID de pareja no válido');
      }

      const updatedCouple = await linkPartnerTwo(
        matchedCouple.id,
        cleanName,
        matchedCouple.partner_one,
      );

      const coupleAccount: CoupleAccount = {
        id: updatedCouple.id,
        username: updatedCouple.username,
        password: updatedCouple.password || '',
        coupleNames: `${updatedCouple.partner_one} & ${cleanName}`,
        partnerOne: updatedCouple.partner_one,
        partnerTwo: cleanName,
        anniversaryDate: updatedCouple.anniversary_date || new Date().toISOString().split('T')[0],
        coupleCode: updatedCouple.couple_code,
        planTier: updatedCouple.plan_tier || 'Edición Dorada Exclusiva',
        myRole: 'partnerTwo', // La segunda persona entra siempre como partnerTwo
      };

      setLoading(false);
      onLoginSuccess(coupleAccount);
    } catch (err: any) {
      console.warn('Linking error:', err);
      setLoading(false);
      setErrorMessage(err.message || 'Ocurrió un error al vincular. Inténtalo de nuevo.');
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
        {/* Decoración superior en tonos #561C24 y #6D2932 (5 toques abre bóveda secreta) */}
        <View style={styles.topHero}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onLogoSecretTap}
            style={styles.logoMedallion}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.brandSubtitle}>ESPACIO ÍNTIMO DE PAREJA</Text>
          <Text style={styles.brandTitle}>Cómplices</Text>
          <View style={styles.goldDivider} />
        </View>

        {/* Tarjeta de Entrada */}
        <View style={styles.formCard}>
          {/* Selector de Modo */}
          <View style={styles.tabToggleRow}>
            <TouchableOpacity
              style={[
                styles.tabToggleBtn,
                authMode === 'credentials' && styles.tabToggleBtnActive,
              ]}
              onPress={() => {
                setAuthMode('credentials');
                setErrorMessage('');
              }}>
              <Text
                style={[
                  styles.tabToggleText,
                  authMode === 'credentials' && styles.tabToggleTextActive,
                ]}>
                Soy el Titular (Clave)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabToggleBtn,
                authMode === 'code' && styles.tabToggleBtnActive,
              ]}
              onPress={() => {
                setAuthMode('code');
                setErrorMessage('');
              }}>
              <Text
                style={[
                  styles.tabToggleText,
                  authMode === 'code' && styles.tabToggleTextActive,
                ]}>
                Vincular con Código
              </Text>
            </TouchableOpacity>
          </View>

          {authMode === 'credentials' ? (
            /* ============================================================== */
            /* MODO 1: TITULAR (Usuario y Clave creados por el Administrador) */
            /* ============================================================== */
            <>
              <Text style={styles.cardTitle}>Acceso de Titular</Text>
              <Text style={styles.cardDescription}>
                Ingresa con el usuario y la clave asignados por administración. Luego podrás vincular a tu pareja generando un código.
              </Text>

              {/* Campo Usuario */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>USUARIO ASIGNADO</Text>
                <View style={styles.inputWrapper}>
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
                    style={styles.eyeButton}>
                    <Text style={styles.eyeButtonText}>
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.loginButton, loading && {opacity: 0.7}]}
                disabled={loading}
                onPress={handleLogin}>
                {loading ? (
                  <ActivityIndicator color={COLORS.wineDeep} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>
                    Entrar como Titular
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : partnerStep === 'enterCode' ? (
            /* ============================================================== */
            /* MODO 2: PAREJA INVITADA - PASO 1 (Escribir el Código)           */
            /* ============================================================== */
            <>
              <Text style={styles.cardTitle}>Vincúlate con tu Pareja</Text>
              <Text style={styles.cardDescription}>
                Ingresa el código que te compartió tu pareja desde su app para conectarte al mismo espacio íntimo.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CÓDIGO DE PAREJA</Text>
                <View style={styles.inputWrapper}>
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
                activeOpacity={0.88}
                style={[styles.loginButton, loading && {opacity: 0.7}]}
                disabled={loading}
                onPress={handleVerifyCode}>
                {loading ? (
                  <ActivityIndicator color={COLORS.wineDeep} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>
                    Verificar Código y Continuar →
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* ============================================================== */
            /* MODO 2: PAREJA INVITADA - PASO 2 (Ingresar sus datos básicos)   */
            /* ============================================================== */
            <>
              <View style={styles.matchedBadge}>
                <Text style={styles.matchedBadgeText}>
                  ✦ ESPACIO DE {matchedCouple?.partner_one?.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.cardTitle}>¡Bienvenida/o a su Espacio!</Text>
              <Text style={styles.cardDescription}>
                Tu pareja <Text style={{color: COLORS.goldLight, fontWeight: '700'}}>{matchedCouple?.partner_one}</Text> ya inició este espacio. Ingresa tus datos para completar la vinculación:
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TU NOMBRE O CÓMO TE LLAMAS</Text>
                <View style={styles.inputWrapper}>
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
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ej. Mi reina / Mi cielo"
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
                activeOpacity={0.88}
                style={[styles.loginButton, loading && {opacity: 0.7}]}
                disabled={loading}
                onPress={handleCompletePartnerLinking}>
                {loading ? (
                  <ActivityIndicator color={COLORS.wineDeep} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>
                    ¡Vincularnos y Entrar Juntos! 💕
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
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
          <Text style={styles.footerNote}>
            Cada miembro de la pareja usa su propio celular con sincronización en vivo.
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
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topHero: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  logoMedallion: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 8,
    shadowColor: COLORS.gold,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  brandSubtitle: {
    fontSize: 9.5,
    letterSpacing: 2.8,
    color: COLORS.goldLight,
    fontWeight: '700',
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.creamLight,
    letterSpacing: 1.2,
  },
  goldDivider: {
    width: 44,
    height: 1.5,
    backgroundColor: COLORS.gold,
    marginTop: 10,
    opacity: 0.65,
  },
  formCard: {
    width: '100%',
    backgroundColor: 'rgba(42, 8, 13, 0.78)',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.32)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(25, 4, 7, 0.7)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.25)',
  },
  tabToggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabToggleBtnActive: {
    backgroundColor: COLORS.gold,
  },
  tabToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.taupe,
  },
  tabToggleTextActive: {
    color: COLORS.wineDeep,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.creamLight,
    marginBottom: 6,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.taupe,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.goldLight,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 3, 5, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.35)',
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    height: 46,
    color: COLORS.creamLight,
    fontSize: 13.5,
    fontWeight: '500',
  },
  codeInput: {
    letterSpacing: 2,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  passwordInput: {
    paddingRight: 10,
  },
  eyeButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  eyeButtonText: {
    fontSize: 11,
    color: COLORS.gold,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(224, 108, 117, 0.16)',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11.5,
    textAlign: 'center',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: COLORS.gold,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: COLORS.wineDeep,
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  matchedBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(212, 175, 90, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.45)',
    marginBottom: 10,
  },
  matchedBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.goldLight,
  },
  partnerPickGrid: {
    gap: 12,
    marginVertical: 14,
  },
  partnerPickBtn: {
    backgroundColor: 'rgba(25, 4, 7, 0.85)',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  pickAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 90, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pickAvatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.goldLight,
  },
  pickBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.creamLight,
  },
  pickBtnSub: {
    fontSize: 10.5,
    color: COLORS.taupe,
    marginTop: 2,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 11.5,
    color: COLORS.taupe,
    textDecorationLine: 'underline',
  },
  demoSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 90, 0.18)',
  },
  demoTitle: {
    fontSize: 10.5,
    color: COLORS.taupe,
    marginBottom: 8,
    textAlign: 'center',
  },
  demoRow: {
    gap: 6,
  },
  demoChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 90, 0.22)',
    alignItems: 'center',
  },
  demoChipText: {
    fontSize: 10.5,
    color: COLORS.goldLight,
    fontWeight: '500',
  },
  footerInfo: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  footerNote: {
    fontSize: 10.5,
    color: 'rgba(199, 183, 163, 0.55)',
    textAlign: 'center',
    lineHeight: 15,
  },
});
