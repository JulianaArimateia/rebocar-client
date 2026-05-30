import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { loginUser, forgotPassword } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      navigation.replace('Home');
    } catch (e: any) {
      Alert.alert('Erro no login', e.message || 'Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Ionicons name="car-sport" size={40} color="#1A1A2E" />
          </View>
          <Text style={styles.appName}>ReboCar</Text>
        </View>

        <Text style={styles.title}>Bem-vindo de volta</Text>
        <Text style={styles.subtitle}>Sua segurança na estrada a apenas um toque de distância.</Text>

        <Text style={styles.label}>E-MAIL</Text>
        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={18} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="exemplo@email.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>SENHA</Text>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#aaa"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => {
            if (!email.trim()) {
              Alert.alert('Digite seu e-mail', 'Informe seu e-mail acima antes de recuperar a senha.');
              return;
            }
            Alert.alert(
              'Recuperar senha',
              `Enviar link de redefinição para:\n${email.trim()}?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Enviar',
                  onPress: async () => {
                    try {
                      await forgotPassword(email.trim());
                      Alert.alert('E-mail enviado', 'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.');
                    } catch (e: any) {
                      Alert.alert('Erro', 'Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.');
                    }
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.forgotText}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.loginBtnText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>
            Não tem uma conta? <Text style={styles.registerLinkBold}>Cadastre-se agora</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    marginBottom: 6,
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
  },
  eyeBtn: {
    padding: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#F5C518',
    fontWeight: '600',
    fontSize: 13,
  },
  loginBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  registerLink: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  registerLinkBold: {
    color: '#F5C518',
    fontWeight: '700',
  },
});
