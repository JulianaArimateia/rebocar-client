import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, ServiceRequest } from '../../types';
import { subscribeToRequest, cancelRequest } from '../../services/requestService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Waiting'>;
  route: RouteProp<RootStackParamList, 'Waiting'>;
};

const pulseAnim = new Animated.Value(1);

export default function WaitingScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const unsub = subscribeToRequest(requestId, (req) => {
      setRequest(req);

      if (req.status === 'accepted' || req.status === 'on_the_way') {
        navigation.replace('Tracking', { requestId });
      }
      if (req.status === 'cancelled') {
        Alert.alert('Solicitação cancelada', 'Sua solicitação foi cancelada.');
        navigation.replace('Home');
      }
    });
    return unsub;
  }, [requestId]);

  const handleCancel = () => {
    Alert.alert('Cancelar solicitação', 'Tem certeza que deseja cancelar?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          await cancelRequest(requestId);
          navigation.replace('Home');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <MapView
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
            : {
                latitude: -5.795,
                longitude: -35.209,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
        }
      >
        {request?.clientLocation && (
          <Marker coordinate={request.clientLocation} title="Sua localização" pinColor="#F5C518" />
        )}
      </MapView>

      <View style={styles.topBar}>
        <Text style={styles.appName}>≡ ReboCar</Text>
        <View style={styles.profileCircle}>
          <Text style={styles.profileIcon}>👤</Text>
        </View>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.searchAnimation}>
          <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.pulseInner}>
            <Text style={styles.truckEmoji}>🚛</Text>
          </View>
        </View>

        <Text style={styles.searchTitle}>Localizando guinchos próximos...</Text>
        <Text style={styles.searchSubtitle}>
          Estamos conectando você com o profissional mais perto da sua localização atual.
        </Text>

        <View style={styles.securityRow}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.securityText}>Sua localização está criptografada e segura.</Text>
        </View>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color="#666" size="small" />
          ) : (
            <Text style={styles.cancelBtnText}>✕  Cancelar Busca</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  map: { flex: 1 },
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
  appName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: { fontSize: 16 },
  bottomCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  searchAnimation: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pulseOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 197, 24, 0.2)',
  },
  pulseInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
  },
  truckEmoji: { fontSize: 28 },
  searchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  searchSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 8,
    width: '100%',
  },
  lockIcon: { fontSize: 16 },
  securityText: { flex: 1, fontSize: 12, color: '#666' },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelBtnText: { fontSize: 14, color: '#666', fontWeight: '600' },
});
