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
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { registerClient } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    if (!accepted) {
      Alert.alert('Termos', 'Aceite os termos para continuar.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await registerClient(name.trim(), email.trim(), phone.trim(), password);
      navigation.replace('Home');
    } catch (e: any) {
      Alert.alert('Erro no cadastro', e.message || 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← ReboCar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>Pronto para a estrada com a segurança da ReboCar.</Text>

        <Text style={styles.label}>NOME COMPLETO</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Ex: João Silva"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />
        </View>

        <Text style={styles.label}>E-MAIL</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            style={styles.inputField}
            placeholder="nome@exemplo.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>TELEFONE CELULAR</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputIcon}>📱</Text>
          <TextInput
            style={styles.inputField}
            placeholder="(11) 99999-9999"
            placeholderTextColor="#aaa"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={styles.label}>SENHA</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.inputField}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.inputIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAccepted(!accepted)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            Eu li e aceito os{' '}
            <Text style={styles.termsLink}>Termos de Serviço</Text> e a{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text>.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerBtn, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.registerBtnText}>Criar Conta →</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OU CADASTRE-SE COM</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn}>
            <Text style={styles.socialBtnText}>G  Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Text style={styles.socialBtnText}>f  Facebook</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>
            Já possui uma conta? <Text style={styles.loginLinkBold}>Entrar</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { paddingHorizontal: 28, paddingTop: 50, paddingBottom: 40 },
  backBtn: { marginBottom: 24 },
  backText: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 28 },
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
  inputIcon: { fontSize: 16, marginRight: 8 },
  inputField: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1A1A2E' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  termsText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 20 },
  termsLink: { color: '#F5C518', fontWeight: '700' },
  registerBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  btnDisabled: { opacity: 0.7 },
  registerBtnText: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { marginHorizontal: 12, fontSize: 11, color: '#aaa', fontWeight: '600' },
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  socialBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  socialBtnText: { fontSize: 14, color: '#333', fontWeight: '600' },
  loginLink: { textAlign: 'center', fontSize: 14, color: '#666' },
  loginLinkBold: { color: '#F5C518', fontWeight: '700' },
});
