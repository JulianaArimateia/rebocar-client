import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { submitEvaluation } from '../../services/requestService';
import { auth } from '../../config/firebase';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Rating'>;
  route: RouteProp<RootStackParamList, 'Rating'>;
};

const TAGS = ['Pontual', 'Cordial', 'Equipamento Limpo', 'Profissional', 'Rápido'];

export default function RatingScreen({ navigation, route }: Props) {
  const { requestId, driverId, driverName } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Avaliação necessária', 'Selecione pelo menos 1 estrela.');
      return;
    }
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid!;
      await submitEvaluation(requestId, uid, driverId, rating, comment, selectedTags);
      Alert.alert('Obrigado!', 'Sua avaliação foi enviada com sucesso.', [
        { text: 'OK', onPress: () => navigation.replace('Home') },
      ]);
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Não foi possível enviar a avaliação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.replace('Home')}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.appName}>ReboCar</Text>
        <View style={styles.profileCircle}>
          <Text>👤</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Serviço Concluído</Text>
        <Text style={styles.subtitle}>Como foi sua experiência com nosso parceiro?</Text>

        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverEmoji}>👷</Text>
          </View>
          <Text style={styles.driverName}>{driverName}</Text>
          <Text style={styles.driverSubtitle}>🚛 GUINCHO PLATAFORMA</Text>

          <Text style={styles.ratingLabel}>SUA AVALIAÇÃO</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.fieldLabel}>COMENTÁRIO (OPCIONAL)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Conte-nos como foi o atendimento..."
          placeholderTextColor="#aaa"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
        />

        <View style={styles.tagsRow}>
          {TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1A1A2E" />
          ) : (
            <Text style={styles.submitBtnText}>Finalizar e Voltar ao Início →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeBtn: { fontSize: 20, color: '#666' },
  appName: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  driverCard: {
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  driverAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  driverEmoji: { fontSize: 36 },
  driverName: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  driverSubtitle: { fontSize: 12, color: '#888', marginBottom: 16 },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 10,
  },
  starsRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 36, color: '#E0E0E0' },
  starActive: { color: '#F5C518' },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A2E',
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  tag: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tagActive: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
  tagText: { fontSize: 13, color: '#666', fontWeight: '600' },
  tagTextActive: { color: '#1A1A2E' },
  submitBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
});
