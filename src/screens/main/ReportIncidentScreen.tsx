import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../../config/firebase';
import { RootStackParamList, TowServiceType, TOW_SERVICE_LABELS, TOW_SERVICE_PRICES } from '../../types';
import { createRequest } from '../../services/requestService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ReportIncident'>;
};

const SERVICE_OPTIONS: { type: TowServiceType; label: string; sub: string; price: number; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'car', label: 'Guincho para Carro', sub: 'Sedan, SUV, pickup leve', price: TOW_SERVICE_PRICES.car, icon: 'car-outline' },
  { type: 'truck', label: 'Guincho para Caminhão', sub: 'Caminhões e veículos pesados', price: TOW_SERVICE_PRICES.truck, icon: 'bus-outline' },
  { type: 'munck', label: 'Caminhão Munck', sub: 'Içamento com guindaste', price: TOW_SERVICE_PRICES.munck, icon: 'construct-outline' },
];

export default function ReportIncidentScreen({ navigation }: Props) {
  const [serviceType, setServiceType] = useState<TowServiceType | null>(null);
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    Alert.alert('Adicionar foto', 'Escolha uma opção', [
      {
        text: 'Câmera',
        onPress: async () => {
          if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Permita o acesso à câmera.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6,
            allowsEditing: true,
          });
          if (!result.canceled) {
            setPhotos((prev) => [...prev, result.assets[0].uri]);
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6,
            allowsEditing: true,
          });
          if (!result.canceled) {
            setPhotos((prev) => [...prev, result.assets[0].uri]);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleConfirm = async () => {
    if (!serviceType) {
      Alert.alert('Tipo de serviço', 'Selecione o tipo de guincho necessário.');
      return;
    }
    if (!vehicleModel.trim() || !vehiclePlate.trim() || !problemDescription.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha modelo, placa e descrição do problema.');
      return;
    }

    setLoading(true);
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const uid = auth.currentUser?.uid;
      const displayName = auth.currentUser?.displayName || auth.currentUser?.email || 'Cliente';

      if (!uid) throw new Error('Usuário não autenticado.');

      const requestId = await createRequest(
        uid,
        displayName,
        serviceType,
        vehicleModel.trim(),
        vehiclePlate.trim().toUpperCase(),
        problemDescription.trim(),
        { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
        destination.trim() || 'Não informado',
        photos[0]
      );

      navigation.replace('Waiting', { requestId });
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Não foi possível criar a solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ReboCar</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Solicitar Guincho</Text>
        <Text style={styles.sectionSubtitle}>
          Escolha o tipo de serviço e informe os dados do veículo.
        </Text>

        <Text style={styles.serviceLabel}>TIPO DE SERVIÇO</Text>
        {SERVICE_OPTIONS.map((opt) => {
          const selected = serviceType === opt.type;
          return (
            <TouchableOpacity
              key={opt.type}
              style={[styles.serviceCard, selected && styles.serviceCardSelected]}
              onPress={() => setServiceType(opt.type)}
            >
              <View style={[styles.serviceIconBox, selected && styles.serviceIconBoxSelected]}>
                <Ionicons name={opt.icon} size={24} color={selected ? '#1A1A2E' : '#888'} />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceCardLabel, selected && styles.serviceCardLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.serviceCardSub}>{opt.sub}</Text>
              </View>
              <View style={styles.servicePriceBox}>
                <Text style={[styles.servicePrice, selected && styles.servicePriceSelected]}>
                  R$ {opt.price},00
                </Text>
                <View style={[styles.serviceRadio, selected && styles.serviceRadioSelected]}>
                  {selected && <View style={styles.serviceRadioDot} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>| Informações do Veículo</Text>

          <Text style={styles.fieldLabel}>MODELO DO VEÍCULO</Text>
          <TextInput
            style={styles.input}
            placeholder="ex. Toyota Camry 2022"
            placeholderTextColor="#aaa"
            value={vehicleModel}
            onChangeText={setVehicleModel}
          />

          <Text style={styles.fieldLabel}>PLACA</Text>
          <TextInput
            style={styles.input}
            placeholder="E.G. ABC-1234"
            placeholderTextColor="#aaa"
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            autoCapitalize="characters"
          />

          <Text style={styles.fieldLabel}>DESCRIÇÃO DO PROBLEMA</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Descreva o problema do veículo..."
            placeholderTextColor="#aaa"
            value={problemDescription}
            onChangeText={setProblemDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.fieldLabel}>DESTINO (OPCIONAL)</Text>
          <TextInput
            style={styles.input}
            placeholder="Para onde levar o veículo?"
            placeholderTextColor="#aaa"
            value={destination}
            onChangeText={setDestination}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.photoHeader}>
            <Text style={styles.cardTitle}>| Damage Photos</Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>REQUIRED</Text>
            </View>
          </View>

          <View style={styles.photosGrid}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => setPhotos(photos.filter((_, i) => i !== idx))}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {photos.length < 4 && (
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto}>
                <Ionicons name="camera-outline" size={24} color="#aaa" />
                <Text style={styles.addPhotoText}>
                  {photos.length === 0 ? 'FRONT VIEW' : 'ADD OTHERS'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmBtnIcon}>✓</Text>
              <Text style={styles.confirmBtnText}>Confirmar Detalhes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backIcon: { fontSize: 22, color: '#1A1A2E', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 18 },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  serviceCardSelected: { borderColor: '#F5C518', backgroundColor: '#FFFBEA' },
  serviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconBoxSelected: { backgroundColor: '#F5C518' },
  serviceInfo: { flex: 1 },
  serviceCardLabel: { fontSize: 14, fontWeight: '700', color: '#888', marginBottom: 2 },
  serviceCardLabelSelected: { color: '#1A1A2E' },
  serviceCardSub: { fontSize: 11, color: '#aaa' },
  servicePriceBox: { alignItems: 'flex-end', gap: 6 },
  servicePrice: { fontSize: 13, fontWeight: '700', color: '#aaa' },
  servicePriceSelected: { color: '#1A1A2E' },
  serviceRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceRadioSelected: { borderColor: '#F5C518' },
  serviceRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5C518',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    marginBottom: 6,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A2E',
    marginBottom: 14,
    backgroundColor: '#FAFAFA',
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  photoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  requiredBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requiredText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: { width: '100%', height: '100%' },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  addPhotoBtn: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: { fontSize: 9, color: '#aaa', fontWeight: '600' },
  confirmBtn: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnIcon: { fontSize: 18, color: '#F5C518' },
  confirmBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
