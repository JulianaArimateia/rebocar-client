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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../../config/firebase';
import { RootStackParamList, ServiceRequest, TOW_SERVICE_LABELS } from '../../types';
import { getClientHistory } from '../../services/requestService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Alerts'>;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  waiting:    { label: 'Aguardando motorista',    color: '#F5A623', icon: 'time-outline',            bg: '#FFF8DC' },
  accepted:   { label: 'Motorista a caminho',      color: '#2980B9', icon: 'car-outline',             bg: '#EBF5FB' },
  on_the_way: { label: 'Motorista em rota',        color: '#2980B9', icon: 'navigate-outline',        bg: '#EBF5FB' },
  arrived:    { label: 'Motorista chegou',         color: '#8E44AD', icon: 'location',                bg: '#F5EEF8' },
  completed:  { label: 'Serviço concluído',        color: '#27AE60', icon: 'checkmark-circle-outline', bg: '#E8F8F0' },
  cancelled:  { label: 'Solicitação cancelada',    color: '#E74C3C', icon: 'close-circle-outline',    bg: '#FDEDEC' },
};

const formatDate = (ts: any): string => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatRelative = (ts: any): string => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return formatDate(ts);
};

export default function AlertsScreen({ navigation }: Props) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const data = await getClientHistory(uid);
    setRequests(data);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: ServiceRequest }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.waiting;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (item.status === 'waiting' || item.status === 'accepted' || item.status === 'on_the_way' || item.status === 'arrived') {
            navigation.navigate('Tracking', { requestId: item.id });
          }
        }}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{cfg.label}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {item.vehicleModel} {item.vehiclePlate && `• ${item.vehiclePlate}`}
            {item.serviceType && ` • ${TOW_SERVICE_LABELS[item.serviceType]}`}
          </Text>
          <Text style={styles.cardTime}>{formatRelative(item.createdAt)}</Text>
        </View>
        {(item.status === 'accepted' || item.status === 'on_the_way' || item.status === 'arrived') && (
          <Ionicons name="chevron-forward" size={16} color="#aaa" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#F5C518" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F5C518" />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={52} color="#DDD" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
              <Text style={styles.emptySub}>Suas solicitações de guincho aparecerão aqui.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBox: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  cardSub: { fontSize: 12, color: '#888', marginBottom: 4 },
  cardTime: { fontSize: 11, color: '#aaa' },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#888', textAlign: 'center' },
});
