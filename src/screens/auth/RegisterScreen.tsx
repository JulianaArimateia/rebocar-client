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
import { Ionicons } from '@expo/vector-icons';
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
      Alert.alert(
        'Conta criada!',
        'Bem-vindo ao ReboCar. Sua conta de cliente foi criada com sucesso.',
        [{ text: 'Continuar', onPress: () => navigation.replace('Home') }]
      );
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
          <Ionicons name="arrow-back" size={20} color="#1A1A2E" />
          <Text style={styles.backText}>ReboCar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>Pronto para a estrada com a segurança da ReboCar.</Text>

        <View style={styles.dualAccountNote}>
          <Ionicons name="information-circle-outline" size={16} color="#2980B9" />
          <Text style={styles.dualAccountText}>
            Motorista parceiro? Use o mesmo e-mail e senha da sua conta de motorista para criar sua conta de cliente.
          </Text>
        </View>

        <Text style={styles.label}>NOME COMPLETO</Text>
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={18} color="#aaa" style={styles.inputIcon} />
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
          <Ionicons name="mail-outline" size={18} color="#aaa" style={styles.inputIcon} />
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
          <Ionicons name="phone-portrait-outline" size={18} color="#aaa" style={styles.inputIcon} />
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
          <Ionicons name="lock-closed-outline" size={18} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.inputField}
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

        <View style={styles.termsLinksRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Legal', { type: 'terms' })}>
            <Text style={styles.termsLinkBtn}>Ler Termos de Uso</Text>
          </TouchableOpacity>
          <Text style={styles.termsDot}> · </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Legal', { type: 'privacy' })}>
            <Text style={styles.termsLinkBtn}>Política de Privacidade</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAccepted(!accepted)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
          <Text style={styles.termsText}>
            Li e aceito os Termos de Uso e a Política de Privacidade da ReboCar.
            {'\n'}
            <Text style={styles.lgpdNote}>
              Meus dados serão tratados conforme a LGPD (Lei 13.709/2018).
            </Text>
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
            <Text style={styles.registerBtnText}>Criar Conta</Text>
          )}
        </TouchableOpacity>

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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
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
  inputIcon: { marginRight: 10 },
  inputField: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1A1A2E' },
  eyeBtn: { padding: 4 },
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
  loginLink: { textAlign: 'center', fontSize: 14, color: '#666' },
  loginLinkBold: { color: '#F5C518', fontWeight: '700' },
  dualAccountNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EBF5FB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#AED6F1',
  },
  dualAccountText: { flex: 1, fontSize: 12, color: '#2980B9', lineHeight: 18 },
  termsLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  termsLinkBtn: { fontSize: 13, color: '#F5C518', fontWeight: '700', textDecorationLine: 'underline' },
  termsDot: { fontSize: 13, color: '#aaa' },
  lgpdNote: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
});
