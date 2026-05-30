import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../../config/firebase';
import { RootStackParamList } from '../../types';
import { getCurrentUserData, logoutUser, requestDataDeletion } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

export default function ProfileScreen({ navigation }: Props) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getCurrentUserData(uid).then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Solicitar exclusão de dados',
      'Sua solicitação será processada em até 15 dias úteis conforme a LGPD (Lei 13.709/2018). Todos os seus dados pessoais serão removidos permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar exclusão',
          style: 'destructive',
          onPress: async () => {
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            await requestDataDeletion(uid, 'Solicitação do usuário via app');
            Alert.alert(
              'Solicitação registrada',
              'Recebemos sua solicitação. Você receberá um e-mail de confirmação em até 15 dias úteis.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5C518" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha Conta</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={44} color="#1A1A2E" />
          </View>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          {user?.type === 'both' && (
            <View style={styles.dualBadge}>
              <Ionicons name="car-sport" size={12} color="#F5C518" />
              <Text style={styles.dualBadgeText}>Conta dupla: cliente + motorista parceiro</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMAÇÕES PESSOAIS</Text>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color="#888" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{user?.name || '—'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color="#888" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>E-mail</Text>
              <Text style={styles.infoValue}>{user?.email || '—'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="phone-portrait-outline" size={18} color="#888" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{user?.phone || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL E PRIVACIDADE</Text>

          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Legal', { type: 'terms' })}>
            <Ionicons name="document-text-outline" size={20} color="#1A1A2E" />
            <Text style={styles.actionLabel}>Termos de Uso</Text>
            <Ionicons name="chevron-forward" size={16} color="#aaa" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Legal', { type: 'privacy' })}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#1A1A2E" />
            <Text style={styles.actionLabel}>Política de Privacidade (LGPD)</Text>
            <Ionicons name="chevron-forward" size={16} color="#aaa" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color="#FF4444" />
            <Text style={[styles.actionLabel, { color: '#FF4444' }]}>Solicitar exclusão de dados</Text>
            <Ionicons name="chevron-forward" size={16} color="#aaa" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4444" />
          <Text style={styles.logoutBtnText}>Sair da conta</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ReboCar v1.0 • LGPD compliant</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F7F8FA', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  content: { padding: 20, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  userName: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#888', marginBottom: 10 },
  dualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,197,24,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.3)',
  },
  dualBadgeText: { fontSize: 11, color: '#F5A623', fontWeight: '700' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 1, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#aaa', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  actionLabel: { flex: 1, fontSize: 14, color: '#1A1A2E', fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: '#FF4444' },
  version: { textAlign: 'center', fontSize: 11, color: '#ccc' },
});
