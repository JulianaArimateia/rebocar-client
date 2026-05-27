import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, ServiceRequest } from '../../types';
import { getClientHistory } from '../../services/requestService';
import { auth } from '../../config/firebase';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'History'>;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  waiting: { label: 'Aguardando', color: '#F5A623', bg: '#FFF8DC' },
  accepted: { label: 'Aceito', color: '#27AE60', bg: '#E8F8F0' },
  on_the_way: { label: 'A Caminho', color: '#2980B9', bg: '#EBF5FB' },
  arrived: { label: 'Chegou', color: '#8E44AD', bg: '#F5EEF8' },
  completed: { label: 'Concluído', color: '#27AE60', bg: '#E8F8F0' },
  cancelled: { label: 'Cancelado', color: '#E74C3C', bg: '#FDEDEC' },
};

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function HistoryScreen({ navigation }: Props) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = await getClientHistory(uid);
    setRequests(data);
  };

  useEffect(() => {
    loadHistory().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: ServiceRequest }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.waiting;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.vehicleIcon}>
            <Text style={styles.vehicleEmoji}>🚗</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.vehicleName}>{item.vehicleModel}</Text>
            <Text style={styles.vehiclePlate}>{item.vehiclePlate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <Text style={styles.problemText} numberOfLines={2}>{item.problemDescription}</Text>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>

        {item.destinationAddress && item.destinationAddress !== 'Não informado' && (
          <View style={styles.destinationRow}>
            <Text style={styles.destinationIcon}>📍</Text>
            <Text style={styles.destinationText} numberOfLines={1}>{item.destinationAddress}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5C518" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F5C518" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>Nenhuma solicitação</Text>
              <Text style={styles.emptySubtitle}>Seu histórico de serviços aparecerá aqui.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
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
  backBtn: { fontSize: 22, color: '#1A1A2E', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  list: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleEmoji: { fontSize: 22 },
  cardInfo: { flex: 1 },
  vehicleName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  vehiclePlate: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardDivider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },
  problemText: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
  dateText: { fontSize: 11, color: '#aaa', marginBottom: 6 },
  destinationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  destinationIcon: { fontSize: 12 },
  destinationText: { flex: 1, fontSize: 12, color: '#888' },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
});
