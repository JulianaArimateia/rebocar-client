import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { RootStackParamList, Location as LocType } from '../../types';
import { logoutUser } from '../../services/authService';
import { haversineDistance } from '../../services/requestService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

interface NearbyDriver {
  id: string;
  name: string;
  location: LocType;
  serviceTypes: string[];
  rating: number;
}

export default function HomeScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<LocType | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [nearbyCount, setNearbyCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'O ReboCar precisa da sua localização para funcionar.');
        setLoadingLocation(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setLoadingLocation(false);
    })();
  }, []);

  // Subscribe to nearby available drivers
  useEffect(() => {
    if (!location) return;
    const q = query(
      collection(db, 'drivers'),
      where('status', '==', 'available')
    );
    const unsub = onSnapshot(q, (snap) => {
      const drivers: NearbyDriver[] = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((d) => d.location && haversineDistance(location, d.location) <= 50)
        .map((d) => ({
          id: d.id,
          name: d.name || 'Motorista',
          location: d.location,
          serviceTypes: d.serviceTypes || [],
          rating: d.rating || 5,
        }));
      setNearbyDrivers(drivers);
      setNearbyCount(drivers.length);
    });
    return unsub;
  }, [location]);

  const handleRequestTow = () => {
    if (!location) {
      Alert.alert('Localização indisponível', 'Aguarde enquanto obtemos sua localização.');
      return;
    }
    navigation.navigate('ReportIncident');
  };

  const handleLogout = async () => {
    await logoutUser();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      {loadingLocation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5C518" />
          <Text style={styles.loadingText}>Obtendo sua localização...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton
          initialRegion={
            location
              ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
              : { latitude: -5.795, longitude: -35.209, latitudeDelta: 0.05, longitudeDelta: 0.05 }
          }
        >
          {nearbyDrivers.map((driver) => (
            <Marker
              key={driver.id}
              coordinate={driver.location}
              title={driver.name}
              description={`Avaliação: ${driver.rating.toFixed(1)} ★`}
            >
              <View style={styles.driverMarker}>
                <Ionicons name="car-sport" size={18} color="#1A1A2E" />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Menu', 'Funcionalidade em breve.')}>
          <Ionicons name="menu" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.appName}>ReboCar</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
          <Ionicons name="person-circle-outline" size={22} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      {/* Nearby drivers badge */}
      {nearbyCount > 0 && !loadingLocation && (
        <View style={styles.nearbyBadge}>
          <View style={styles.nearbyDot} />
          <Text style={styles.nearbyText}>
            {nearbyCount} guincheiro{nearbyCount > 1 ? 's' : ''} disponível{nearbyCount > 1 ? 'eis' : ''} próximo{nearbyCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText} numberOfLines={1}>
            {location ? 'Minha localização atual' : 'Aguardando localização...'}
          </Text>
        </View>

        <View style={styles.destinationRow}>
          <View style={styles.destinationDot} />
          <Text style={styles.destinationText} numberOfLines={1}>
            Para onde vamos levar o veículo...
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.requestBtn, !location && styles.requestBtnDisabled]}
          onPress={handleRequestTow}
          disabled={!location}
        >
          <Ionicons name="car-sport" size={22} color="#1A1A2E" />
          <Text style={styles.requestBtnText}>Solicitar Guincho</Text>
        </TouchableOpacity>

        {nearbyCount === 0 && !loadingLocation && location && (
          <Text style={styles.etaText}>Buscando guincheiros disponíveis na região...</Text>
        )}
        {nearbyCount > 0 && (
          <Text style={styles.etaText}>Estimativa de chegada: 12 - 18 min</Text>
        )}

        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="map" size={22} color="#F5C518" />
            <Text style={styles.tabLabelActive}>MAP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('History')}>
            <Ionicons name="list-outline" size={22} color="#aaa" />
            <Text style={styles.tabLabel}>HISTORY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => Alert.alert('Alertas', 'Funcionalidade em breve.')}>
            <Ionicons name="notifications-outline" size={22} color="#aaa" />
            <Text style={styles.tabLabel}>ALERTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#aaa" />
            <Text style={styles.tabLabel}>SAIR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  appName: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  nearbyBadge: {
    position: 'absolute',
    top: 106,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  nearbyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#27AE60' },
  nearbyText: { fontSize: 12, fontWeight: '700', color: '#1A1A2E' },
  bottomPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 4,
  },
  locationDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F5C518', marginRight: 12 },
  locationText: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  destinationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 16 },
  destinationDot: { width: 12, height: 12, borderRadius: 3, backgroundColor: '#1A1A2E', marginRight: 12 },
  destinationText: { flex: 1, fontSize: 14, color: '#999' },
  requestBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  requestBtnDisabled: { opacity: 0.5 },
  requestBtnText: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  etaText: { textAlign: 'center', fontSize: 12, color: '#888', marginBottom: 16 },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  tabItem: { alignItems: 'center', paddingVertical: 4 },
  tabLabel: { fontSize: 10, color: '#aaa', marginTop: 2 },
  tabLabelActive: { fontSize: 10, color: '#F5C518', fontWeight: '700', marginTop: 2 },
});
