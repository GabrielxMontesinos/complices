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
} from 'react-native';
import {COLORS} from '../theme/colors';
import {ASSIGNED_ACCOUNTS, CoupleAccount} from '../data/assignedUsers';

interface LoginScreenProps {
  onLoginSuccess: (account: CoupleAccount) => void;
  onLogoSecretTap?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onLogoSecretTap,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = () => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage(
        'Por favor ingresa el usuario y la contraseña asignados.',
      );
      return;
    }

    const foundAccount = ASSIGNED_ACCOUNTS.find(
      acc => acc.username.toLowerCase() === cleanUser && acc.password === cleanPass,
    );

    if (foundAccount) {
      setErrorMessage('');
      onLoginSuccess(foundAccount);
    } else {
      setErrorMessage(
        'Credenciales no reconocidas. Verifica los datos proporcionados por administración.',
      );
    }
  };

  const fillDemoCredentials = (index: number) => {
    const acc = ASSIGNED_ACCOUNTS[index];
    if (acc) {
      setUsername(acc.username);
      setPassword(acc.password);
      setErrorMessage('');
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

        {/* Tarjeta de Inicio de Sesión */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>
          <Text style={styles.cardDescription}>
            Ingresa con el usuario y la contraseña exclusivos que te fueron
            entregados para acceder al universo de tu relación.
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
                  if (errorMessage) {
                    setErrorMessage('');
                  }
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
                  if (errorMessage) {
                    setErrorMessage('');
                  }
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

          {/* Botón Principal */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.loginButton}
            onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Entrar a Nuestro Espacio</Text>
          </TouchableOpacity>

          {/* Acceso rápido de prueba para el desarrollador */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>
              Cuentas asignadas activas (Toca para autocompletar):
            </Text>
            <View style={styles.demoRow}>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => fillDemoCredentials(0)}>
                <Text style={styles.demoChipText}>
                  pareja.vip / amor2026
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => fillDemoCredentials(1)}>
                <Text style={styles.demoChipText}>admin / 123456</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pie informativo */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerNote}>
            Acceso privado únicamente mediante credenciales asignadas.
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
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 28,
  },
  topHero: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  logoMedallion: {
    width: 142,
    height: 142,
    borderRadius: 71,
    backgroundColor: COLORS.wineVelvet,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: 124,
    height: 124,
  },
  brandSubtitle: {
    color: COLORS.taupe, // #C7B7A3
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 3,
  },
  brandTitle: {
    color: COLORS.cream, // #E8D8C4
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  goldDivider: {
    width: 44,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    marginTop: 8,
  },
  formCard: {
    backgroundColor: COLORS.wineVelvet,
    marginHorizontal: 20,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.creamLight,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.taupe,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: COLORS.goldLight,
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.wineDeep,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: 42,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeButton: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: COLORS.wineVelvet,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  eyeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.goldLight,
  },
  errorBox: {
    backgroundColor: 'rgba(224, 108, 117, 0.14)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11.5,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 15,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  loginButtonText: {
    color: COLORS.textDark,
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  demoSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.goldMuted,
  },
  demoTitle: {
    fontSize: 10.5,
    color: COLORS.taupe,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  demoChip: {
    backgroundColor: COLORS.wineDeep,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  demoChipText: {
    color: COLORS.goldLight,
    fontSize: 10.5,
    fontWeight: '700',
  },
  footerInfo: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 14,
  },
  footerNote: {
    color: COLORS.taupe,
    fontSize: 10.5,
    textAlign: 'center',
  },
});

