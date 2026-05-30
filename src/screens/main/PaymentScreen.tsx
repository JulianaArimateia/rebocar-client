import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import app, { db } from '../../config/firebase';
import { RootStackParamList, TOW_SERVICE_LABELS } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Payment'>;
  route: RouteProp<RootStackParamList, 'Payment'>;
};

const COMMISSION = 0.15;
const fbFunctions = getFunctions(app, 'southamerica-east1');
const criarPagamento = httpsCallable(fbFunctions, 'criarPagamento');

export default function PaymentScreen({ navigation, route }: Props) {
  const { requestId, driverId, driverName, serviceType, amount } = route.params;
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);

  const platformFee = parseFloat((amount * COMMISSION).toFixed(2));
  const driverNet = parseFloat((amount - platformFee).toFixed(2));

  // Cria a preferência de pagamento ao abrir a tela
  useEffect(() => {
    (async () => {
      try {
        const result = await criarPagamento({
          requestId,
          driverId,
          amount,
          serviceType: TOW_SERVICE_LABELS[serviceType],
          driverName,
        }) as { data: { paymentId: string; checkoutUrl: string; sandboxUrl: string; status: string } };

        setPaymentId(result.data.paymentId);
        setCheckoutUrl(result.data.checkoutUrl);
        setPaymentStatus(result.data.status);
      } catch (e: any) {
        setError(e.message || 'Não foi possível iniciar o pagamento.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Monitora o status do pagamento em tempo real
  useEffect(() => {
    if (!paymentId) return;
    const unsub = onSnapshot(doc(db, 'payments', paymentId), (snap) => {
      if (snap.exists()) {
        const status = snap.data().status;
        setPaymentStatus(status);
        if (status === 'approved') {
          navigation.replace('Rating', { requestId, driverId, driverName, serviceType });
        }
      }
    });
    return unsub;
  }, [paymentId]);

  const handlePay = async () => {
    if (!checkoutUrl) return;
    setPaying(true);
    try {
      const canOpen = await Linking.canOpenURL(checkoutUrl);
      if (canOpen) {
        await Linking.openURL(checkoutUrl);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o pagamento. Tente novamente.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o pagamento.');
    } finally {
      setPaying(false);
    }
  };

  const handleSupport = () => {
    Alert.alert('Suporte ReboCar', 'Problemas com o pagamento?\n\nE-mail: suporte@rebocar.com.br\nWhatsApp: (XX) XXXX-XXXX');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5C518" />
        <Text style={styles.loadingText}>Preparando pagamento seguro...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={52} color="#FF4444" />
        <Text style={styles.errorTitle}>Erro ao iniciar pagamento</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryBtnText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPaid = paymentStatus === 'approved';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 38 }} />
        <Text style={styles.headerTitle}>Pagamento Seguro</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Serviço concluído */}
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={44} color="#27AE60" />
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Serviço Concluído!</Text>
            <Text style={styles.successSub}>{driverName} • {TOW_SERVICE_LABELS[serviceType]}</Text>
          </View>
        </View>

        {/* Detalhes do valor */}
        <View style={styles.amountCard}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Valor do serviço</Text>
            <Text style={styles.amountValue}>R$ {amount.toFixed(2)}</Text>
          </View>
          <View style={[styles.amountRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
            <Text style={styles.totalValue}>R$ {amount.toFixed(2)}</Text>
          </View>
          <View style={styles.securedRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#27AE60" />
            <Text style={styles.securedText}>Pagamento processado com segurança pelo Mercado Pago</Text>
          </View>
        </View>

        {/* Métodos de pagamento */}
        <View style={styles.methodsCard}>
          <Text style={styles.methodsTitle}>FORMAS DE PAGAMENTO ACEITAS</Text>
          <View style={styles.methodsRow}>
            <View style={styles.methodBadge}>
              <View style={styles.pixBadge}>
                <Text style={styles.pixText}>PIX</Text>
              </View>
              <Text style={styles.methodLabel}>PIX</Text>
            </View>
            <View style={styles.methodBadge}>
              <Ionicons name="card-outline" size={22} color="#1A1A2E" />
              <Text style={styles.methodLabel}>Débito</Text>
            </View>
            <View style={styles.methodBadge}>
              <Ionicons name="card" size={22} color="#1A1A2E" />
              <Text style={styles.methodLabel}>Crédito</Text>
            </View>
          </View>
          <Text style={styles.installmentsNote}>Crédito em até 12x • Sem juros em 1x</Text>
        </View>

        {/* Status do pagamento */}
        {isPaid && (
          <View style={styles.paidBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
            <Text style={styles.paidText}>Pagamento confirmado! Redirecionando para avaliação...</Text>
          </View>
        )}

        {/* Botão pagar */}
        {!isPaid && (
          <>
            <TouchableOpacity
              style={[styles.payBtn, (!checkoutUrl || paying) && styles.payBtnDisabled]}
              onPress={handlePay}
              disabled={!checkoutUrl || paying}
            >
              {paying ? (
                <ActivityIndicator color="#1A1A2E" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={18} color="#1A1A2E" />
                  <Text style={styles.payBtnText}>Pagar R$ {amount.toFixed(2)}</Text>
                  <Ionicons name="open-outline" size={16} color="#1A1A2E" />
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.redirectNote}>
              Você será redirecionado ao Mercado Pago para concluir o pagamento. Após pagar, o status atualiza automaticamente.
            </Text>

            <TouchableOpacity style={styles.supportBtn} onPress={handleSupport}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#666" />
              <Text style={styles.supportBtnText}>Problemas com o pagamento?</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Segurança / LGPD */}
        <View style={styles.securityCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#27AE60" />
          <Text style={styles.securityText}>
            Seus dados financeiros são processados exclusivamente pelo Mercado Pago (PCI-DSS). A ReboCar não armazena dados de cartão.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA', gap: 16 },
  loadingText: { fontSize: 15, color: '#666' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  errorText: { fontSize: 14, color: '#666', textAlign: 'center' },
  retryBtn: { backgroundColor: '#F5C518', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  retryBtnText: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#E8F8F0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C3E8D0',
  },
  successTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  successSub: { fontSize: 13, color: '#555' },
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  amountLabel: { fontSize: 14, color: '#666' },
  amountValue: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  totalLabel: { fontSize: 12, fontWeight: '800', color: '#888', letterSpacing: 1 },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },
  securedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  securedText: { flex: 1, fontSize: 11, color: '#27AE60' },
  methodsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  methodsTitle: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 1, marginBottom: 16 },
  methodsRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  methodBadge: { alignItems: 'center', gap: 6 },
  pixBadge: { backgroundColor: '#32BCAD', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  pixText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  methodLabel: { fontSize: 11, color: '#666', fontWeight: '600' },
  installmentsNote: { fontSize: 11, color: '#aaa' },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E8F8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C3E8D0',
  },
  paidText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#27AE60' },
  payBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  payBtnText: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  redirectNote: { fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginBottom: 16,
  },
  supportBtnText: { fontSize: 13, color: '#666' },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E8F8F0',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C3E8D0',
  },
  securityText: { flex: 1, fontSize: 12, color: '#27AE60', lineHeight: 18 },
});
