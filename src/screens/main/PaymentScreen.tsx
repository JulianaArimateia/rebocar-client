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
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { RootStackParamList, TOW_SERVICE_LABELS } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Payment'>;
  route: RouteProp<RootStackParamList, 'Payment'>;
};

const PIX_KEY_LABELS: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave aleatória',
};

export default function PaymentScreen({ navigation, route }: Props) {
  const { requestId, driverId, driverName, serviceType, amount } = route.params;

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState('pending_client');

  const [companyPixKey, setCompanyPixKey] = useState('');
  const [companyPixKeyType, setCompanyPixKeyType] = useState('');
  const [commissionRate, setCommissionRate] = useState(0.15);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null); // Mercado Pago (quando disponível)

  const platformFee = parseFloat((amount * commissionRate).toFixed(2));
  const driverNet = parseFloat((amount - platformFee).toFixed(2));

  // ─── 1. Carrega config da plataforma e cria registro de pagamento ────────────
  useEffect(() => {
    (async () => {
      try {
        // Lê configurações da empresa (chave PIX, comissão) do Firestore
        const configSnap = await getDoc(doc(db, 'config', 'platform'));
        let pixKey = '';
        let pixType = 'email';
        let commission = 0.15;
        let mpCheckoutUrl: string | null = null;

        if (configSnap.exists()) {
          const cfg = configSnap.data();
          pixKey = cfg.companyPixKey ?? '';
          pixType = cfg.companyPixKeyType ?? 'email';
          commission = typeof cfg.commissionRate === 'number' ? cfg.commissionRate : 0.15;
          mpCheckoutUrl = cfg.mercadoPagoCheckoutUrl ?? null;
        }

        setCompanyPixKey(pixKey);
        setCompanyPixKeyType(pixType);
        setCommissionRate(commission);
        setCheckoutUrl(mpCheckoutUrl);

        // Verifica se já existe pagamento para este pedido
        const existingSnap = await getDoc(doc(db, 'requests', requestId));
        const existingPaymentId = existingSnap.exists() ? existingSnap.data().paymentId : null;

        if (existingPaymentId) {
          setPaymentId(existingPaymentId);
        } else {
          // Cria novo registro de pagamento no Firestore
          const fee = parseFloat((amount * commission).toFixed(2));
          const net = parseFloat((amount - fee).toFixed(2));

          const payRef = await addDoc(collection(db, 'payments'), {
            requestId,
            clientId: auth.currentUser!.uid,
            driverId,
            amount,
            commissionRate: commission,
            platformFee: fee,
            driverAmount: net,
            companyPixKey: pixKey,
            companyPixKeyType: pixType,
            status: 'pending_client',
            createdAt: serverTimestamp(),
          });

          // Vincula ao pedido
          await updateDoc(doc(db, 'requests', requestId), {
            paymentId: payRef.id,
            paymentStatus: 'pending',
          });

          setPaymentId(payRef.id);
        }
      } catch (e: any) {
        Alert.alert('Erro', 'Não foi possível iniciar o pagamento. Tente novamente.\n\n' + (e.message || ''));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── 2. Monitora status do pagamento em tempo real ───────────────────────────
  useEffect(() => {
    if (!paymentId) return;
    const unsub = onSnapshot(doc(db, 'payments', paymentId), (snap) => {
      if (snap.exists()) {
        const s = snap.data().status;
        setPaymentStatus(s);
        if (s === 'driver_confirmed') {
          navigation.replace('Rating', { requestId, driverId, driverName, serviceType });
        }
      }
    });
    return unsub;
  }, [paymentId]);

  // ─── Ações ───────────────────────────────────────────────────────────────────
  const handleCopyPix = () => {
    if (!companyPixKey) return;
    Clipboard.setString(companyPixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenCheckout = async () => {
    if (!checkoutUrl) return;
    const ok = await Linking.canOpenURL(checkoutUrl);
    if (ok) await Linking.openURL(checkoutUrl);
    else Alert.alert('Erro', 'Não foi possível abrir o link de pagamento.');
  };

  const handleConfirmPayment = (method: 'pix' | 'checkout') => {
    Alert.alert(
      'Confirmar pagamento',
      `Você confirma que realizou o pagamento de R$ ${amount.toFixed(2)} para ReboCar?`,
      [
        { text: 'Ainda não', style: 'cancel' },
        {
          text: 'Sim, paguei',
          onPress: async () => {
            if (!paymentId) return;
            setConfirming(true);
            try {
              await updateDoc(doc(db, 'payments', paymentId), {
                status: 'client_confirmed',
                paymentMethod: method,
                clientConfirmedAt: serverTimestamp(),
              });
              await updateDoc(doc(db, 'requests', requestId), {
                paymentStatus: 'paid',
              });
              Alert.alert(
                'Pagamento confirmado!',
                'Obrigado! O motorista será notificado. Você poderá avaliar o atendimento em instantes.',
                [{ text: 'OK' }]
              );
            } catch (e: any) {
              Alert.alert('Erro', 'Não foi possível registrar o pagamento. Tente novamente.');
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
      'Reportar problema',
      'Se houve algum problema com o serviço ou pagamento, entre em contato com o suporte.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Contatar suporte',
          onPress: () => {
            Linking.openURL('mailto:suporte@rebocar.com.br?subject=Problema no pagamento - Pedido ' + requestId);
          },
        },
      ]
    );
  };

  // ─── Renderização ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5C518" />
        <Text style={styles.loadingText}>Preparando cobrança...</Text>
      </View>
    );
  }

  const isPaid = paymentStatus === 'client_confirmed' || paymentStatus === 'driver_confirmed';
  const hasMercadoPago = !!checkoutUrl;
  const hasPixKey = !!companyPixKey;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 38 }} />
        <Text style={styles.headerTitle}>Pagamento</Text>
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

        {/* Valor */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>TOTAL A PAGAR</Text>
          <Text style={styles.amountValue}>R$ {amount.toFixed(2)}</Text>
          <View style={styles.amountDivider} />
          <View style={styles.amountRow}>
            <Text style={styles.amountDetailLabel}>Serviço ({TOW_SERVICE_LABELS[serviceType]})</Text>
            <Text style={styles.amountDetailValue}>R$ {amount.toFixed(2)}</Text>
          </View>
          <View style={[styles.amountRow, { marginTop: 2 }]}>
            <Text style={[styles.amountDetailLabel, { fontSize: 11, color: '#555' }]}>
              Inclui taxa da plataforma ({Math.round(commissionRate * 100)}%)
            </Text>
          </View>
        </View>

        {!isPaid ? (
          <>
            {/* Opção 1: Mercado Pago (PIX + cartão) — quando disponível */}
            {hasMercadoPago && (
              <View style={styles.paymentCard}>
                <View style={styles.paymentCardHeader}>
                  <View style={styles.pixBadge}><Text style={styles.pixBadgeText}>PIX</Text></View>
                  <Ionicons name="card-outline" size={22} color="#1A1A2E" />
                  <Text style={styles.paymentCardTitle}>PIX ou Cartão (Mercado Pago)</Text>
                </View>
                <TouchableOpacity style={styles.payBtn} onPress={handleOpenCheckout}>
                  <Ionicons name="lock-closed" size={16} color="#1A1A2E" />
                  <Text style={styles.payBtnText}>Pagar R$ {amount.toFixed(2)} agora</Text>
                  <Ionicons name="open-outline" size={14} color="#1A1A2E" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmLink} onPress={() => handleConfirmPayment('checkout')}>
                  <Text style={styles.confirmLinkText}>Já realizei o pagamento →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Opção 2: PIX manual com chave da empresa */}
            {hasPixKey && (
              <View style={styles.paymentCard}>
                <View style={styles.paymentCardHeader}>
                  <View style={styles.pixBadge}><Text style={styles.pixBadgeText}>PIX</Text></View>
                  <Text style={styles.paymentCardTitle}>Pagar via PIX</Text>
                </View>

                <Text style={styles.pixInstructions}>
                  Abra o app do seu banco, acesse Pix → Pagar e use a chave abaixo:
                </Text>

                <Text style={styles.pixKeyTypeLabel}>
                  {PIX_KEY_LABELS[companyPixKeyType] || companyPixKeyType}
                </Text>
                <TouchableOpacity style={styles.pixKeyBox} onPress={handleCopyPix}>
                  <Text style={styles.pixKeyText} numberOfLines={1}>{companyPixKey}</Text>
                  <View style={[styles.copyBtn, copied && styles.copyBtnDone]}>
                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={copied ? '#fff' : '#F5C518'} />
                    <Text style={[styles.copyBtnText, copied && styles.copyBtnTextDone]}>
                      {copied ? 'Copiado!' : 'Copiar'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <Text style={styles.pixAmountNote}>
                  Valor exato: <Text style={{ fontWeight: '800' }}>R$ {amount.toFixed(2)}</Text>
                </Text>

                <TouchableOpacity
                  style={[styles.payBtn, (confirming) && { opacity: 0.6 }]}
                  onPress={() => handleConfirmPayment('pix')}
                  disabled={confirming}
                >
                  {confirming ? (
                    <ActivityIndicator color="#1A1A2E" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#1A1A2E" />
                      <Text style={styles.payBtnText}>Já paguei via PIX</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Nenhuma forma de pagamento configurada */}
            {!hasMercadoPago && !hasPixKey && (
              <View style={styles.noPaymentCard}>
                <Ionicons name="alert-circle-outline" size={32} color="#F5A623" />
                <Text style={styles.noPaymentTitle}>Pagamento não configurado</Text>
                <Text style={styles.noPaymentText}>
                  A chave PIX da empresa ainda não foi cadastrada no sistema. Entre em contato com o suporte para receber as instruções de pagamento.
                </Text>
                <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('mailto:suporte@rebocar.com.br')}>
                  <Text style={styles.supportBtnText}>Contatar suporte</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.disputeBtn} onPress={handleDispute}>
              <Ionicons name="alert-circle-outline" size={16} color="#888" />
              <Text style={styles.disputeBtnText}>Reportar problema com o pagamento</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.paidBanner}>
            <Ionicons name="checkmark-circle" size={28} color="#27AE60" />
            <View style={{ flex: 1 }}>
              <Text style={styles.paidTitle}>
                {paymentStatus === 'driver_confirmed' ? 'Pagamento confirmado!' : 'Pagamento registrado!'}
              </Text>
              <Text style={styles.paidSub}>
                {paymentStatus === 'driver_confirmed'
                  ? 'Tudo certo! Você será redirecionado para avaliar o atendimento.'
                  : 'Aguardando confirmação do motorista...'}
              </Text>
            </View>
          </View>
        )}

        {/* Segurança */}
        <View style={styles.securityCard}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#27AE60" />
          <Text style={styles.securityText}>
            Pagamentos processados com segurança. A ReboCar não armazena dados bancários.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 15, color: '#666' },
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
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  amountLabel: { fontSize: 11, color: '#888', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  amountValue: { fontSize: 38, fontWeight: '800', color: '#F5C518', marginBottom: 12 },
  amountDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amountDetailLabel: { fontSize: 13, color: '#888' },
  amountDetailValue: { fontSize: 13, fontWeight: '600', color: '#fff' },
  paymentCard: {
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
  paymentCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  paymentCardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', flex: 1 },
  pixBadge: {
    backgroundColor: '#32BCAD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pixBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  pixInstructions: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 14 },
  pixKeyTypeLabel: { fontSize: 10, fontWeight: '700', color: '#aaa', letterSpacing: 1, marginBottom: 8 },
  pixKeyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 10,
  },
  pixKeyText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
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
  copyBtnDone: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  copyBtnText: { fontSize: 11, fontWeight: '700', color: '#F5C518' },
  copyBtnTextDone: { color: '#fff' },
  pixAmountNote: { fontSize: 13, color: '#888', marginBottom: 16 },
  payBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  payBtnText: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  confirmLink: { alignItems: 'center', paddingTop: 14 },
  confirmLinkText: { fontSize: 13, color: '#F5C518', fontWeight: '700' },
  noPaymentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FDE8C0',
  },
  noPaymentTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  noPaymentText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  supportBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 6,
  },
  supportBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  disputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginBottom: 8,
  },
  disputeBtnText: { fontSize: 13, color: '#888' },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E8F8F0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C3E8D0',
  },
  paidTitle: { fontSize: 16, fontWeight: '800', color: '#27AE60', marginBottom: 4 },
  paidSub: { fontSize: 13, color: '#555' },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#C3E8D0',
  },
  securityText: { flex: 1, fontSize: 11, color: '#27AE60' },
});
