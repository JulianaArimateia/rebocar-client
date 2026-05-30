import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Legal'>;
  route: RouteProp<RootStackParamList, 'Legal'>;
};

const TERMS_CONTENT = `
TERMOS DE USO — REBOCAR
Versão 1.0 — Vigência: a partir de 01/06/2025

1. IDENTIFICAÇÃO E ACEITE

O aplicativo ReboCar é operado por ReboCar Tecnologia e Serviços Ltda., inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, com sede no Brasil ("ReboCar", "nós"). Ao criar uma conta e utilizar o aplicativo, o usuário ("Você") declara ter lido, compreendido e aceitado integralmente estes Termos, em conformidade com o art. 8º da Lei 12.965/2014 (Marco Civil da Internet).

2. OBJETO DO SERVIÇO

O ReboCar é uma plataforma de intermediação que conecta usuários que necessitam de serviços de guincho e reboque ("Clientes") a profissionais autônomos habilitados que prestam tais serviços ("Motoristas Parceiros"). A ReboCar NÃO é prestadora direta do serviço de guincho — ela atua como marketplace de serviços, conforme o art. 3º, §2º do Marco Civil da Internet.

3. ELEGIBILIDADE

Para utilizar o aplicativo você deve: (a) ter capacidade civil plena (art. 5º do Código Civil); (b) fornecer informações verdadeiras no cadastro; (c) não ter sido previamente suspenso ou banido da plataforma.

4. CADASTRO E RESPONSABILIDADE DA CONTA

4.1. Você é responsável pela veracidade e atualização das informações cadastradas.
4.2. O login e senha são pessoais e intransferíveis. Qualquer acesso indevido deve ser informado imediatamente à ReboCar.
4.3. A ReboCar poderá suspender ou encerrar contas com informações falsas, violação de termos ou uso fraudulento.

5. SERVIÇOS E PREÇOS

5.1. Os preços exibidos no aplicativo são estimativas com base no tipo de veículo e serviço. O valor final pode variar conforme a distância e condições do local.
5.2. Os preços são definidos individualmente por cada Motorista Parceiro, sendo a ReboCar responsável apenas pela intermediação.
5.3. O pagamento é realizado diretamente entre o Cliente e o Motorista Parceiro via PIX ou outro meio acordado entre as partes.

6. PAGAMENTOS E CANCELAMENTOS

6.1. O Cliente deve confirmar o pagamento no aplicativo após a conclusão do serviço.
6.2. Cancelamentos realizados após a aceitação do pedido pelo motorista poderão gerar cobrança de taxa de deslocamento.
6.3. Disputas de pagamento devem ser registradas no aplicativo em até 24 horas após o serviço.

7. RESPONSABILIDADES DO CLIENTE

7.1. Fornecer localização precisa e informações corretas sobre o veículo e o problema.
7.2. Garantir acesso seguro ao veículo para o motorista parceiro.
7.3. Não utilizar a plataforma para fins ilícitos.

8. RESPONSABILIDADES DA REBOCAR

8.1. A ReboCar não se responsabiliza por danos causados diretamente pelos Motoristas Parceiros ao veículo do Cliente, salvo comprovada falha exclusiva da plataforma na verificação do motorista.
8.2. A ReboCar empreenderá esforços razoáveis para verificar a habilitação dos motoristas parceiros (CNH e documentação).
8.3. Em caso de falha na prestação do serviço, o Cliente poderá registrar reclamação no aplicativo.

9. PROTEÇÃO DO CONSUMIDOR (LEI 8.078/1990)

9.1. Você tem direito à informação clara sobre os serviços e preços.
9.2. Reclamações podem ser registradas no aplicativo, pelo e-mail suporte@rebocar.com.br ou pelo PROCON/Consumidor.gov.br.
9.3. A ReboCar responde solidariamente por vícios decorrentes da intermediação, nos termos do art. 14 do CDC.

10. PROPRIEDADE INTELECTUAL

O aplicativo, marcas, logos e conteúdos são propriedade exclusiva da ReboCar. É vedada qualquer reprodução, modificação ou distribuição sem autorização prévia por escrito.

11. LIMITAÇÃO DE RESPONSABILIDADE

A responsabilidade total da ReboCar por quaisquer danos, em qualquer circunstância, fica limitada ao valor pago pelo serviço objeto da reclamação, conforme permitido pela legislação vigente.

12. ALTERAÇÕES DOS TERMOS

A ReboCar poderá atualizar estes Termos, notificando os usuários com antecedência mínima de 15 dias via e-mail ou notificação no aplicativo. O uso continuado após a vigência das alterações implica aceitação.

13. FORO E LEI APLICÁVEL

Estes Termos são regidos pelas leis da República Federativa do Brasil. Eventuais conflitos serão submetidos ao foro da comarca de domicílio do consumidor, nos termos do art. 101, I do CDC, ou ao Juizado Especial Cível competente.

Contato: suporte@rebocar.com.br
`;

const PRIVACY_CONTENT = `
POLÍTICA DE PRIVACIDADE — REBOCAR
Versão 1.0 — Vigência: a partir de 01/06/2025
Encarregado de Dados (DPO): privacidade@rebocar.com.br

Esta Política foi elaborada em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018), o Marco Civil da Internet (Lei 12.965/2014) e demais normas aplicáveis.

1. CONTROLADOR DOS DADOS

ReboCar Tecnologia e Serviços Ltda.
CNPJ: XX.XXX.XXX/0001-XX
E-mail do DPO: privacidade@rebocar.com.br
(art. 5º, VI e VIII, LGPD)

2. DADOS COLETADOS

2.1. Dados fornecidos por você:
• Nome completo
• Endereço de e-mail
• Número de telefone celular
• Localização GPS (apenas durante o uso ativo do app)

2.2. Dados coletados automaticamente:
• Logs de acesso (IP, data/hora, ação) — obrigação legal: art. 15, Marco Civil da Internet
• Identificadores de dispositivo (para segurança)
• Dados de uso do aplicativo (para melhoria do serviço)

2.3. NÃO coletamos:
• Dados biométricos
• Dados de saúde
• Dados financeiros (o pagamento PIX ocorre fora da plataforma)

3. FINALIDADE E BASE LEGAL (art. 7º LGPD)

• Prestação do serviço de intermediação — Execução de contrato (art. 7º, V)
• Comunicações sobre pedidos e suporte — Legítimo interesse (art. 7º, IX)
• Cumprimento de obrigações legais — Obrigação legal (art. 7º, II)
• Marketing e novidades ReboCar — Consentimento (art. 7º, I) — você pode revogar a qualquer momento
• Localização GPS — Consentimento explícito (art. 11, §2º, I) — necessário para o funcionamento do serviço

4. COMPARTILHAMENTO DE DADOS

Compartilhamos seus dados apenas com:
• Motoristas Parceiros: nome e localização durante o atendimento
• Google (Firebase): infraestrutura de banco de dados e autenticação, com sede nos EUA — coberto pelo DPF (Data Privacy Framework)
• Autoridades públicas: quando exigido por lei ou ordem judicial

Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins comerciais.

5. TRANSFERÊNCIA INTERNACIONAL

Seus dados são armazenados no Google Firebase (EUA). O Google mantém certificações adequadas de proteção de dados, incluindo cláusulas contratuais padrão reconhecidas pela ANPD.

6. RETENÇÃO DE DADOS

• Dados de conta: mantidos enquanto a conta estiver ativa + 5 anos (prazo prescricional: art. 206, §5º, CC)
• Logs de acesso: 6 meses (art. 15, Marco Civil da Internet)
• Dados de pagamento: 5 anos (obrigação fiscal e contábil)

Após os prazos acima, os dados são anonimizados ou excluídos de forma segura.

7. SEUS DIREITOS (art. 18 LGPD)

Você tem direito a:
✓ Confirmar a existência de tratamento
✓ Acessar seus dados
✓ Corrigir dados incompletos ou desatualizados
✓ Solicitar anonimização, bloqueio ou eliminação de dados desnecessários
✓ Portabilidade dos dados
✓ Revogar consentimento a qualquer momento
✓ Peticionar à ANPD (Autoridade Nacional de Proteção de Dados)
✓ Solicitar a exclusão da conta e dos dados (art. 18, VI, LGPD)

Para exercer seus direitos: privacidade@rebocar.com.br
Prazo de resposta: até 15 dias úteis (art. 18, §3º, LGPD)

Para solicitar exclusão de conta: acesse Configurações > Privacidade > Solicitar Exclusão de Dados no aplicativo.

8. SEGURANÇA

Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados, incluindo:
• Criptografia em trânsito (TLS)
• Autenticação via Firebase Auth
• Regras de acesso ao banco de dados (Firestore Security Rules)
• Acesso restrito apenas às equipes autorizadas

Em caso de incidente de segurança que coloque em risco seus dados, você será notificado conforme o art. 48, LGPD.

9. COOKIES E TECNOLOGIAS SIMILARES

O aplicativo mobile não utiliza cookies de rastreamento. Identificadores de dispositivo são usados exclusivamente para segurança e prevenção de fraude.

10. MENORES DE IDADE

O ReboCar não é destinado a menores de 18 anos. Não coletamos conscientemente dados de menores. Se identificarmos tal situação, a conta será encerrada e os dados excluídos.

11. ALTERAÇÕES DESTA POLÍTICA

Notificaremos alterações relevantes com antecedência mínima de 15 dias. A versão atual sempre estará disponível no aplicativo.

12. CONTATO E DPO

Encarregado de Proteção de Dados (DPO):
E-mail: privacidade@rebocar.com.br
Telefone: (XX) XXXX-XXXX
Prazo de resposta: até 15 dias úteis

Autoridade Nacional de Proteção de Dados (ANPD):
www.gov.br/anpd
`;

export default function LegalScreen({ navigation, route }: Props) {
  const isTerms = route.params?.type === 'terms';
  const title = isTerms ? 'Termos de Uso' : 'Política de Privacidade';
  const content = isTerms ? TERMS_CONTENT : PRIVACY_CONTENT;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#27AE60" />
          <Text style={styles.infoText}>
            Documento em conformidade com a LGPD (Lei 13.709/2018)
          </Text>
        </View>

        <Text style={styles.body}>{content.trim()}</Text>

        <View style={styles.footer}>
          <Ionicons name="lock-closed-outline" size={14} color="#888" />
          <Text style={styles.footerText}>
            Seus dados são tratados com segurança e transparência.
          </Text>
        </View>
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  content: { padding: 20, paddingBottom: 48 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C3E8D0',
  },
  infoText: { flex: 1, fontSize: 12, color: '#27AE60', fontWeight: '600' },
  body: {
    fontSize: 13,
    color: '#333',
    lineHeight: 22,
    fontFamily: undefined,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: { fontSize: 11, color: '#888' },
});
