import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, ServiceRequest, Location as LocType, TOW_SERVICE_PRICES } from '../../types';
import { subscribeToRequest, subscribeToDriverLocation, cancelRequest } from '../../services/requestService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Tracking'>;
  route: RouteProp<RootStackParamList, 'Tracking'>;
};

const STATUS_LABELS: Record<string, string> = {
  accepted: 'Chamado Aceito',
  on_the_way: 'A Caminho',
  arrived: 'Chegou ao Local',
  completed: 'Concluído',
};

export default function TrackingScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const mapRef = useRef<MapView>(null);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [driverLocation, setDriverLocation] = useState<LocType | null>(null);
  const [driverName, setDriverName] = useState('Guincheiro');
  const [driverRating, setDriverRating] = useState(0);

  useEffect(() => {
    const unsubReq = subscribeToRequest(requestId, async (req) => {
      setRequest(req);

      if (req.driverId && driverName === 'Guincheiro') {
        const driverSnap = await getDoc(doc(db, 'users', req.driverId));
        if (driverSnap.exists()) {
          setDriverName(driverSnap.data().name || 'Guincheiro');
        }
        const driverDataSnap = await getDoc(doc(db, 'drivers', req.driverId));
        if (driverDataSnap.exists()) {
          setDriverRating(driverDataSnap.data().rating || 0);
        }
      }

      if (req.status === 'completed') {
        const amount = req.estimatedPrice ?? TOW_SERVICE_PRICES[req.serviceType] ?? 145;
        navigation.replace('Payment', {
          requestId,
          driverId: req.driverId!,
          driverName,
          serviceType: req.serviceType,
          amount,
        });
      }
    });

    return unsubReq;
  }, [requestId]);

  useEffect(() => {
    if (!request?.driverId) return;
    const unsubLoc = subscribeToDriverLocation(request.driverId, (loc) => {
      setDriverLocation(loc);
      mapRef.current?.animateToRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    });
    return unsubLoc;
  }, [request?.driverId]);

  const handleCancel = () => {
    if (request?.status !== 'accepted') {
      Alert.alert('Não é possível cancelar', 'O guincheiro já está a caminho.');
      return;
    }
    Alert.alert('Cancelar?', 'Deseja cancelar a solicitação?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim',
        style: 'destructive',
        onPress: async () => {
          await cancelRequest(requestId);
          navigation.replace('Home');
        },
      },
    ]);
  };

  const statusKeys = ['accepted', 'on_the_way', 'arrived', 'completed'];
  const currentIdx = request ? statusKeys.indexOf(request.status) : 0;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        initialRegion={
          request?.clientLocation
            ? {
                latitude: request.clientLocation.latitude,
                longitude: request.clientLocation.longitude,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              }
            : undefined
        }
      >
        {request?.clientLocation && (
          <Marker coordinate={request.clientLocation} title="Você" pinColor="#F5C518" />
        )}
        {driverLocation && (
          <Marker coordinate={driverLocation} title="Guincheiro">
            <View style={styles.driverMarker}>
              <Ionicons name="car-sport" size={22} color="#1A1A2E" />
            </View>
          </Marker>
        )}
        {driverLocation && request?.clientLocation && (
          <Polyline
            coordinates={[driverLocation, request.clientLocation]}
            strokeColor="#F5C518"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Driver info card */}
      <View style={styles.driverCard}>
        <View style={styles.driverRow}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={28} color="#1A1A2E" />
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driverName}</Text>
            <Text style={styles.driverRating}>{'★'.repeat(Math.round(driverRating))} {driverRating.toFixed(1)}</Text>
          </View>
          <View style={styles.driverActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Chat', 'Funcionalidade em breve.')}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Ligar', 'Funcionalidade em breve.')}>
              <Ionicons name="call-outline" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.etaRow}>
          <View style={styles.etaBox}>
            <Ionicons name="time-outline" size={18} color="#F5C518" />
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaValue}>~15 min</Text>
          </View>
        </View>

        {/* Status timeline */}
        <View style={styles.timeline}>
          {statusKeys.map((key, idx) => (
            <View key={key} style={styles.timelineItem}>
              <View style={[styles.timelineDot, idx <= currentIdx && styles.timelineDotActive]}>
                {idx <= currentIdx && <Text style={styles.timelineDotCheck}>✓</Text>}
              </View>
              <Text style={[styles.timelineLabel, idx <= currentIdx && styles.timelineLabelActive]}>
                {STATUS_LABELS[key]}
              </Text>
              {idx < statusKeys.length - 1 && (
                <View style={[styles.timelineLine, idx < currentIdx && styles.timelineLineActive]} />
              )}
            </View>
          ))}
        </View>

        {request?.status === 'accepted' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancelar Solicitação</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  driverCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  driverRating: { fontSize: 13, color: '#F5C518', marginTop: 2 },
  driverActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaRow: { marginBottom: 16 },
  etaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  etaLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  etaValue: { fontSize: 14, fontWeight: '800', color: '#1A1A2E', marginLeft: 'auto' },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  timelineItem: { flex: 1, alignItems: 'center', position: 'relative' },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timelineDotActive: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
  timelineDotCheck: { fontSize: 12, color: '#fff', fontWeight: '800' },
  timelineLabel: { fontSize: 9, color: '#aaa', textAlign: 'center', fontWeight: '600' },
  timelineLabelActive: { color: '#1A1A2E' },
  timelineLine: {
    position: 'absolute',
    top: 11,
    right: -'50%' as any,
    width: '100%',
    height: 2,
    backgroundColor: '#E0E0E0',
    zIndex: -1,
  },
  timelineLineActive: { backgroundColor: '#F5C518' },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, color: '#FF4444', fontWeight: '700' },
});
