import type { Metadata } from "next";
import { CONTACT } from "@/components/site/contact";
import { LegalPage, LegalSection } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Termos de Uso — ConduzX",
  description: "Condições de utilização da plataforma ConduzX para escolas de condução.",
};

export default function TermsOfUsePage() {
  return (
    <LegalPage
      title="Termos de Uso"
      intro="Estes termos definem as regras de utilização do ConduzX. Ao aceder à plataforma, a escola e os seus utilizadores aceitam as condições abaixo. Escrevemo-los a pensar na operação da sua escola — se algo não estiver claro, fale connosco."
      updatedAt="21 de outubro de 2026"
    >
      <LegalSection n={1} title="O serviço">
        <p>
          O ConduzX é um sistema de gestão interna para escolas de condução. Permite registar alunos e inscrições, controlar
          pagamentos totais ou parciais, guardar documentos e acompanhar manualmente o estado de cada processo no INATRO.
        </p>
      </LegalSection>

      <LegalSection n={2} title="O que o ConduzX não é">
        <ul>
          <li>
            <strong>Não é um sistema oficial</strong> nem substitui o INATRO. O registo oficial dos candidatos continua a
            ser feito pela escola diretamente no INATRO.
          </li>
          <li>
            <strong>Não tem integração com o INATRO.</strong> O estado do processo é indicado manualmente pela escola.
          </li>
          <li>
            <strong>Não processa pagamentos.</strong> O ConduzX regista os pagamentos recebidos pela escola, mas não
            movimenta dinheiro.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Contas e acessos">
        <p>
          O administrador da escola cria e gere as contas dos seus utilizadores e define a função de cada um (atendente,
          gestor ou administrador). Cada conta é pessoal e intransmissível. A escola é responsável por manter as
          palavras-passe em sigilo, desativar o acesso de quem deixe de trabalhar consigo e comunicar-nos de imediato
          qualquer utilização indevida.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Responsabilidades da escola">
        <ul>
          <li>Garantir que os dados introduzidos são verdadeiros, completos e atualizados.</li>
          <li>Recolher e tratar os dados dos alunos de acordo com a lei, informando-os sobre essa utilização.</li>
          <li>Utilizar o ConduzX apenas para a gestão legítima da própria escola.</li>
          <li>Não tentar aceder a dados de outras escolas nem comprometer a segurança da plataforma.</li>
        </ul>
      </LegalSection>

      <LegalSection n={5} title="Registos e pagamentos">
        <p>
          Para garantir a rastreabilidade, os pagamentos registados não podem ser editados nem apagados. Um pagamento
          introduzido por engano é anulado com motivo obrigatório, ficando identificado quem o anulou e quando. O histórico
          de ações é mantido para controlo interno da escola.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Disponibilidade">
        <p>
          Trabalhamos para manter o ConduzX disponível e seguro, mas não podemos garantir um funcionamento ininterrupto.
          Poderão ocorrer interrupções para manutenção, que procuraremos agendar fora do horário de atendimento e
          comunicar com antecedência sempre que possível.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Dados pessoais">
        <p>
          O tratamento de dados pessoais é regido pela nossa{" "}
          <a href="/privacy">Política de Privacidade</a>, que faz parte integrante destes termos. Os dados introduzidos
          pela escola pertencem à escola.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Propriedade intelectual">
        <p>
          O software, a marca ConduzX e os restantes elementos da plataforma são propriedade do ConduzX. A escola recebe
          um direito de utilização limitado à duração do contrato, não podendo copiar, modificar ou revender o serviço.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Suspensão e cessação">
        <p>
          Podemos suspender o acesso em caso de violação destes termos ou de risco para a segurança da plataforma. A
          escola pode deixar de utilizar o serviço a qualquer momento; nesse caso, os seus dados serão devolvidos ou
          eliminados, conforme a Política de Privacidade.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Limitação de responsabilidade">
        <p>
          O ConduzX não é responsável por decisões tomadas pela escola com base em dados incorretos ou incompletos que ela
          própria tenha introduzido, nem por falhas ou indisponibilidade de sistemas de terceiros, incluindo o INATRO.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Alterações e lei aplicável">
        <p>
          Podemos atualizar estes termos; alterações relevantes serão comunicadas às escolas clientes. Estes termos regem-se
          pela lei da República de Moçambique, sendo competente o foro da cidade de Maputo.
        </p>
        <p>
          Dúvidas? Escreva para <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> ou ligue para{" "}
          <a href={CONTACT.phoneHref}>+258 {CONTACT.phone}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
