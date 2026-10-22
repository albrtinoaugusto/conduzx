import type { Metadata } from "next";
import { CONTACT } from "@/components/site/contact";
import { LegalPage, LegalSection } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Política de Privacidade - ConduzX",
  description: "Como o ConduzX recolhe, utiliza e protege os dados pessoais das escolas de condução e dos seus alunos.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro="A confiança das escolas que utilizam o ConduzX - e dos alunos que elas servem - é a base do nosso trabalho. Esta política explica, de forma clara, que dados tratamos, porquê e como os protegemos."
      updatedAt="21 de outubro de 2026"
    >
      <LegalSection n={1} title="Quem somos">
        <p>
          O ConduzX é uma plataforma de gestão interna para escolas de condução, com sede na {CONTACT.addressLine},{" "}
          {CONTACT.city}. Para qualquer questão sobre privacidade, contacte-nos através de{" "}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> ou do número{" "}
          <a href={CONTACT.phoneHref}>+258 {CONTACT.phone}</a>.
        </p>
      </LegalSection>

      <LegalSection n={2} title="O nosso papel no tratamento de dados">
        <p>
          Cada escola de condução cliente é a <strong>responsável</strong> pelos dados dos seus alunos: é ela que decide
          que informação regista e para que fins. O ConduzX atua como <strong>subcontratante</strong>, tratando esses dados
          apenas em nome da escola e segundo as suas instruções.
        </p>
        <p>
          Em relação aos dados dos utilizadores das escolas (atendentes, gestores e administradores) e dos visitantes deste
          site, o ConduzX é o responsável pelo tratamento.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Que dados tratamos">
        <ul>
          <li>
            <strong>Dados dos alunos</strong>, introduzidos pela escola: nome completo, data de nascimento, número de BI,
            telefone, email, morada, inscrições, categoria de carta, pagamentos e estado do processo no INATRO.
          </li>
          <li>
            <strong>Documentos</strong> carregados pela escola, como BI digitalizado, fotografia ou comprovativos.
          </li>
          <li>
            <strong>Dados dos utilizadores</strong>: nome, email profissional, função na escola e palavra-passe (guardada
            apenas de forma cifrada, nunca em texto legível).
          </li>
          <li>
            <strong>Registos de atividade</strong>: que utilizador criou, alterou ou anulou cada registo, e quando.
          </li>
          <li>
            <strong>Contactos comerciais</strong> que nos envia por email ou telefone, por exemplo para pedir uma
            demonstração.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Para que utilizamos os dados">
        <ul>
          <li>Prestar o serviço contratado pela escola: gerir alunos, inscrições, pagamentos e pendências.</li>
          <li>Autenticar os utilizadores e garantir que cada um só acede aos dados da sua escola.</li>
          <li>Manter um histórico fiável das ações, para controlo interno e auditoria da escola.</li>
          <li>Prestar apoio técnico e responder a pedidos de contacto.</li>
          <li>Cumprir obrigações legais aplicáveis.</li>
        </ul>
        <p>Não vendemos dados pessoais nem os utilizamos para publicidade.</p>
      </LegalSection>

      <LegalSection n={5} title="Partilha de dados">
        <p>
          Os dados de cada escola só são acessíveis aos utilizadores dessa escola. O ConduzX não se liga ao INATRO nem
          envia dados a terceiros em nome da escola. Podemos recorrer a fornecedores de alojamento e infraestrutura
          técnica, que ficam obrigados a tratar os dados apenas para nos prestar esse serviço e com garantias de
          segurança adequadas. Só divulgaremos dados a autoridades quando a lei o exigir.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Como protegemos os dados">
        <ul>
          <li>Separação rigorosa entre escolas: todas as consultas são limitadas à escola do utilizador autenticado.</li>
          <li>Palavras-passe guardadas com algoritmo de cifra unidirecional (hash).</li>
          <li>Sessões protegidas por cookie assinado, inacessível a scripts do navegador.</li>
          <li>Documentos guardados fora da área pública e entregues apenas a utilizadores autenticados da escola.</li>
          <li>Pagamentos nunca são apagados: qualquer anulação fica registada com motivo e responsável.</li>
        </ul>
      </LegalSection>

      <LegalSection n={7} title="Durante quanto tempo guardamos os dados">
        <p>
          Os dados das escolas são conservados enquanto o contrato estiver ativo. Após o seu termo, são devolvidos ou
          eliminados a pedido da escola, salvo quando a lei exija a sua conservação por um período mais longo. Os contactos
          comerciais são guardados apenas pelo tempo necessário para responder ao pedido.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Os seus direitos">
        <p>
          Pode pedir o acesso, a retificação ou a eliminação dos seus dados pessoais, bem como opor-se ao seu tratamento.
          Se for aluno de uma escola de condução, dirija o pedido em primeiro lugar à sua escola, que é a responsável
          pelos seus dados; apoiaremos a escola na resposta. Nos restantes casos, escreva para{" "}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Cookies">
        <p>
          Utilizamos apenas um cookie essencial de sessão, necessário para manter o utilizador autenticado no sistema. Não
          utilizamos cookies de publicidade nem de rastreamento.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Alterações a esta política">
        <p>
          Podemos atualizar esta política para refletir alterações ao serviço ou à legislação. A data da última
          atualização está indicada no topo da página. Alterações relevantes serão comunicadas às escolas clientes.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Lei aplicável">
        <p>
          Esta política rege-se pela legislação da República de Moçambique, incluindo a Lei n.º 3/2017, de 9 de janeiro
          (Lei de Transações Eletrónicas), no que respeita à proteção de dados pessoais.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
