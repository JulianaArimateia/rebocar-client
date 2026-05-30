import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { RootStackParamList, TOW_SERVICE_LABELS } from '../../types';
import { subscribeToPayment, confirmPaymentByClient } from '../../services/requestService';
import { auth } from '../../config/firebase';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Payment'>;
  route: RouteProp<RootStackParamList, 'Payment'>;
};

const PIX_TYPE_LABELS: Record<string, string> = {
  phone: 'Telefone',
  email: 'E-mail',
  cpf: 'CPF',
  random: 'Chave Aleatória',
  cnpj: 'CNPJ',
};

export default function PaymentScreen({ navigation, route }: Props) {
  const { requestId, driverId, driverName, serviceType, amount } = route.params;
  const [pixKey, setPixKey] = useState<string | null>(null);
  const [pixKeyType, setPixKeyType] = useState<string>('phone');
  const [payment, setPayment] = useState<any | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'drivers', driverId)).then((snap) => {
      if (snap.exists()) {
        setPixKey(snap.data().pixKey || null);
        setPixKeyType(snap.data().pixKeyType || 'phone');
      }
    });
  }, [driverId]);

  useEffect(() => {
    const unsub = subscribeToPayment(requestId, (p) => {
      setPayment(p);
      if (p?.status === 'driver_confirmed') {
        navigation.replace('Rating', {
          requestId,
          driverId,
          driverName,
          serviceType,
        });
      }
    });
    return unsub;
  }, [requestId]);

  const handleCopyKey = () => {
    if (!pixKey) return;
    Clipboard.setString(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConfirmPayment = () => {
    if (!payment) {
      Alert.alert('Aguarde', 'O registro de pagamento ainda está sendo criado. Tente novamente em instantes.');
      return;
    }
    Alert.alert(
      'Confirmar Pagamento',
      `Você confirma que realizou o pagamento de R$ ${amount.toFixed(2)} via PIX para ${driverName}?`,
      [
        { text: 'Ainda não', style: 'cancel' },
        {
          text: 'Sim, paguei',
          onPress: async () => {
            setConfirming(true);
            try {
              await confirmPaymentByClient(payment.id);
              Alert.alert(
                'Pagamento confirmado',
                'Obrigado! O motorista foi notificado. Você poderá avaliar o serviço em breve.',
                [{ text: 'OK' }]
              );
            } catch (e: any) {
              Alert.alert('Erro', 'Não foi possível registrar a confirmação. Tente novamente.');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  const handleDispute = () => {
    Alert.alert(
      'Registrar Problema',
      'Se houve algum problema com o pagamento ou serviço, entre em contato com nosso suporte.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Contatar Suporte',
          onPress: () => Alert.alert('Suporte', 'suporte@rebocar.com.br\n(XX) XXXX-XXXX'),
        },
      ]
    );
  };

  const isPaid = payment?.status === 'client_confirmed' || payment?.status === 'driver_confirmed';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 38 }} />
        <Text style={styles.headerTitle}>Pagamento</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Success Banner */}
        <View style={styles.successBanner}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={40} color="#27AE60" />
          </View>
          <Text style={styles.successTitle}>Serviço Concluído!</Text>
          <Text style={styles.successSubtitle}>
            {driverName} finalizou o atendimento com sucesso.
          </Text>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>VALOR DO SERVIÇO</Text>
          <Text style={styles.amountValue}>R$ {amount.toFixed(2)}</Text>
          <View style={styles.serviceTypePill}>
            <Ionicons name="car-sport" size={12} color="#F5C518" />
            <Text style={styles.serviceTypeText}>{TOW_SERVICE_LABELS[serviceType]}</Text>
          </View>
        </View>

        {/* PIX Card */}
        <View style={styles.pixCard}>
          <View style={styles.pixHeader}>
            <View style={styles.pixLogo}>
              <Text style={styles.pixLogoText}>PIX</Text>
            </View>
            <Text style={styles.pixTitle}>Pague via PIX</Text>
          </View>

          <Text style={styles.pixInstructions}>
            Copie a chave PIX abaixo e realize o pagamento pelo aplicativo do seu banco.
          </Text>

          {pixKey ? (
            <>
              <Text style={styles.pixKeyTypeLabel}>
                {PIX_TYPE_LABELS[pixKeyType] || pixKeyType}
              </Text>
              <TouchableOpacity style={styles.pixKeyBox} onPress={handleCopyKey}>
                <Text style={styles.pixKeyText} numberOfLines={1}>{pixKey}</Text>
                <View style={[styles.copyBtn, copied && styles.copyBtnActive]}>
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={copied ? '#fff' : '#F5C518'}
                  />
                  <Text style={[styles.copyBtnText, copied && styles.copyBtnTextActive]}>
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.pixKeyLoading}>
              <ActivityIndicator size="small" color="#F5C518" />
              <Text style={styles.pixKeyLoadingText}>Carregando chave PIX...</Text>
            </View>
          )}

          <View style={styles.pixSteps}>
            <Text style={styles.pixStepsTitle}>Como pagar:</Text>
            {[
              'Abra o app do seu banco',
              'Acesse Pix > Pagar',
              'Cole a chave copiada',
              'Confirme o valor e pague',
              'Volte aqui e confirme o pagamento',
            ].map((step, i) => (
              <View key={i} style={styles.pixStep}>
                <View style={styles.pixStepNum}>
                  <Text style={styles.pixStepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.pixStepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* LGPD/Security note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#27AE60" />
          <Text style={styles.securityNoteText}>
            O pagamento é realizado diretamente entre você e o motorista via PIX (Banco Central do Brasil). A ReboCar não armazena dados bancários.
          </Text>
        </View>

        {/* Action Buttons */}
        {!isPaid ? (
          <>
            <TouchableOpacity
              style={[styles.confirmBtn, (!pixKey || confirming) && styles.confirmBtnDisabled]}
              onPress={handleConfirmPayment}
              disabled={!pixKey || confirming}
            >
              {confirming ? (
                <ActivityIndicator color="#1A1A2E" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#1A1A2E" />
                  <Text style={styles.confirmBtnText}>Já realizei o pagamento</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.disputeBtn} onPress={handleDispute}>
              <Ionicons name="alert-circle-outline" size={18} color="#FF4444" />
              <Text style={styles.disputeBtnText}>Reportar Problema</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.paidBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
            <Text style={styles.paidBannerText}>
              {payment?.status === 'driver_confirmed'
                ? 'Pagamento confirmado pelo motorista!'
                : 'Aguardando confirmação do motorista...'}
            </Text>
          </View>
        )}
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
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  content: { padding: 20, paddingBottom: 48 },
  successBanner: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  successIcon: { marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  successSubtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  amountCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: { fontSize: 11, color: '#888', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  amountValue: { fontSize: 36, fontWeight: '800', color: '#F5C518', marginBottom: 10 },
  serviceTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245,197,24,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  serviceTypeText: { fontSize: 11, color: '#F5C518', fontWeight: '700' },
  pixCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pixHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  pixLogo: {
    backgroundColor: '#32BCAD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pixLogoText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  pixTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  pixInstructions: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16 },
  pixKeyTypeLabel: { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 1, marginBottom: 8 },
  pixKeyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  pixKeyText: { flex: 1, fontSize: 14, color: '#1A1A2E', fontWeight: '600' },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5C518',
  },
  copyBtnActive: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  copyBtnText: { fontSize: 12, color: '#F5C518', fontWeight: '700' },
  copyBtnTextActive: { color: '#fff' },
  pixKeyLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  pixKeyLoadingText: { fontSize: 13, color: '#888' },
  pixSteps: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 16 },
  pixStepsTitle: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 1, marginBottom: 12 },
  pixStep: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  pixStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixStepNumText: { fontSize: 11, fontWeight: '800', color: '#1A1A2E' },
  pixStepText: { flex: 1, fontSize: 13, color: '#555' },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E8F8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C3E8D0',
  },
  securityNoteText: { flex: 1, fontSize: 12, color: '#27AE60', lineHeight: 18 },
  confirmBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  disputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  disputeBtnText: { fontSize: 14, color: '#FF4444', fontWeight: '600' },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E8F8F0',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#C3E8D0',
  },
  paidBannerText: { flex: 1, fontSize: 14, color: '#27AE60', fontWeight: '700' },
});
