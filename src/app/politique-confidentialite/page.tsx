import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | Qarte',
  description: 'Découvrez comment Qarte protège vos données personnelles. Notre politique de confidentialité détaille la collecte et l\'utilisation de vos informations.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-4xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Qarte</span>
          </Link>
          <Link href="/" className="text-gray-600 hover:text-primary">
            <ArrowLeft className="w-5 h-5 inline mr-1" />
            Retour
          </Link>
        </div>
      </header>

      <main className="px-4 py-12 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Politique de Confidentialité
        </h1>
        <p className="text-gray-500 mb-10">
          Dernière mise à jour : Février 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Responsable du traitement
            </h2>
            <p className="text-gray-600">
              Le responsable du traitement des données personnelles est :
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Qarte</strong><br />
              [Adresse — à compléter]<br />
              Email :{' '}
              <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
                contact@getqarte.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Données collectées
            </h2>
            <p className="text-gray-600">
              Dans le cadre de la fourniture du Service, nous collectons les catégories de données suivantes :
            </p>

            <p className="text-gray-600 font-medium mt-3">Données des commerçants (utilisateurs du Service) :</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-1">
              <li>Adresse email et mot de passe (authentification)</li>
              <li>Nom du commerce, type d&apos;activité, adresse, téléphone</li>
              <li>Logo et personnalisation visuelle (couleurs)</li>
              <li>Liens réseaux sociaux et lien de réservation</li>
              <li>Données de facturation (traitées par Stripe, non stockées par Qarte)</li>
            </ul>

            <p className="text-gray-600 font-medium mt-3">Données des clients finaux (clients des commerçants) :</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-1">
              <li>Prénom et nom</li>
              <li>Numéro de téléphone (format international)</li>
              <li>Date d&apos;anniversaire (jour et mois uniquement, optionnel)</li>
              <li>Historique des passages et des tampons de fidélité</li>
              <li>Code de parrainage</li>
              <li>Bons de réduction et récompenses</li>
            </ul>

            <p className="text-gray-600 font-medium mt-3">Données techniques :</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-1">
              <li>Adresse IP (hashée, utilisée pour la détection de fraude via Qarte Shield)</li>
              <li>Données de navigation (pages visitées, durée de session)</li>
              <li>Informations sur l&apos;appareil (type, navigateur, système d&apos;exploitation)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Finalités et bases légales du traitement
            </h2>
            <div className="overflow-x-auto mt-2">
              <table className="min-w-full text-sm text-gray-600">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900">Finalité</th>
                    <th className="text-left py-2 font-semibold text-gray-900">Base légale (RGPD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 pr-4">Fourniture du Service (compte, fidélité, tampons, récompenses)</td>
                    <td className="py-2">Exécution du contrat (art. 6.1.b)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Facturation et paiement</td>
                    <td className="py-2">Exécution du contrat (art. 6.1.b)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Conservation des factures et données comptables</td>
                    <td className="py-2">Obligation légale (art. 6.1.c)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Prévention de la fraude (Qarte Shield)</td>
                    <td className="py-2">Intérêt légitime (art. 6.1.f)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Amélioration du Service et statistiques agrégées</td>
                    <td className="py-2">Intérêt légitime (art. 6.1.f)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Emails transactionnels (bienvenue, rappels, facturation)</td>
                    <td className="py-2">Exécution du contrat (art. 6.1.b)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Notifications push</td>
                    <td className="py-2">Consentement (art. 6.1.a)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Mesure d&apos;audience et analyse comportementale</td>
                    <td className="py-2">Consentement (art. 6.1.a)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Publicité ciblée (Facebook Pixel)</td>
                    <td className="py-2">Consentement (art. 6.1.a)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Sous-traitants et destinataires des données
            </h2>
            <p className="text-gray-600">
              Nous faisons appel aux sous-traitants suivants pour la fourniture du Service :
            </p>
            <div className="overflow-x-auto mt-2">
              <table className="min-w-full text-sm text-gray-600">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900">Sous-traitant</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900">Finalité</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900">Localisation</th>
                    <th className="text-left py-2 font-semibold text-gray-900">Garanties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 pr-4 font-medium">Supabase Inc.</td>
                    <td className="py-2 pr-4">Hébergement base de données</td>
                    <td className="py-2 pr-4">UE (Francfort)</td>
                    <td className="py-2">DPA + CCT</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Vercel Inc.</td>
                    <td className="py-2 pr-4">Hébergement application web</td>
                    <td className="py-2 pr-4">USA / UE</td>
                    <td className="py-2">DPA + EU-US DPF</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Stripe Inc.</td>
                    <td className="py-2 pr-4">Traitement des paiements</td>
                    <td className="py-2 pr-4">Irlande / USA</td>
                    <td className="py-2">DPA + EU-US DPF</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Resend Inc.</td>
                    <td className="py-2 pr-4">Envoi d&apos;emails transactionnels</td>
                    <td className="py-2 pr-4">USA</td>
                    <td className="py-2">DPA + CCT</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Google LLC</td>
                    <td className="py-2 pr-4">Mesure d&apos;audience (GA4, GTM)</td>
                    <td className="py-2 pr-4">USA</td>
                    <td className="py-2">EU-US DPF + CCT</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Meta Platforms Inc.</td>
                    <td className="py-2 pr-4">Publicité et mesure de conversion</td>
                    <td className="py-2 pr-4">USA</td>
                    <td className="py-2">EU-US DPF + CCT</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Microsoft Corp.</td>
                    <td className="py-2 pr-4">Analyse comportementale (Clarity)</td>
                    <td className="py-2 pr-4">USA</td>
                    <td className="py-2">EU-US DPF + CCT</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 mt-3 text-sm">
              DPA = Data Processing Agreement | CCT = Clauses Contractuelles Types | EU-US DPF = EU-US Data Privacy Framework
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Transferts internationaux de données
            </h2>
            <p className="text-gray-600">
              Certains de nos sous-traitants sont établis aux États-Unis. Ces transferts sont encadrés par :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
              <li>Le cadre de protection des données UE-États-Unis (EU-US Data Privacy Framework), lorsque le sous-traitant est certifié</li>
              <li>Les clauses contractuelles types (CCT) adoptées par la Commission européenne (décision d&apos;exécution 2021/914)</li>
              <li>Des mesures techniques complémentaires (chiffrement en transit et au repos, pseudonymisation)</li>
            </ul>
            <p className="text-gray-600 mt-2">
              Vous pouvez obtenir une copie des clauses contractuelles types en nous contactant à{' '}
              <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
                contact@getqarte.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Durée de conservation des données
            </h2>
            <div className="overflow-x-auto mt-2">
              <table className="min-w-full text-sm text-gray-600">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900">Catégorie de données</th>
                    <th className="text-left py-2 font-semibold text-gray-900">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 pr-4">Données du compte commerçant</td>
                    <td className="py-2">Durée du contrat + 3 ans (prescription civile)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Données des clients fidélité</td>
                    <td className="py-2">Durée du contrat + 3 ans</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Données de facturation</td>
                    <td className="py-2">10 ans (obligation légale comptable)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Logs de connexion</td>
                    <td className="py-2">12 mois (obligation LCEN)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Données de parrainage</td>
                    <td className="py-2">Durée du contrat + 3 ans</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Cookies de mesure d&apos;audience</td>
                    <td className="py-2">13 mois maximum (recommandation CNIL)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Données de prospection</td>
                    <td className="py-2">3 ans après le dernier contact</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 mt-3">
              À l&apos;expiration de ces délais, les données sont supprimées ou anonymisées de manière irréversible.
            </p>
          </section>

          <section id="cookies">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Cookies et traceurs
            </h2>
            <p className="text-gray-600 font-medium">Cookies strictement nécessaires (sans consentement) :</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-1">
              <li>Cookies d&apos;authentification (session utilisateur)</li>
              <li>Cookie de consentement (mémorisation de vos choix)</li>
            </ul>

            <p className="text-gray-600 font-medium mt-3">Cookies soumis à votre consentement :</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-1">
              <li><strong>Google Analytics 4 (GA4)</strong> — mesure d&apos;audience et analyse de la fréquentation du site</li>
              <li><strong>Google Tag Manager (GTM)</strong> — gestion technique des traceurs</li>
              <li><strong>Facebook Pixel (Meta)</strong> — mesure de conversion publicitaire et audiences personnalisées</li>
              <li><strong>Microsoft Clarity</strong> — enregistrement de sessions et cartes de chaleur pour l&apos;amélioration de l&apos;interface</li>
            </ul>

            <p className="text-gray-600 mt-3">
              Ces cookies ne sont déposés qu&apos;après obtention de votre consentement via notre bandeau de gestion des cookies. Vous pouvez modifier vos préférences à tout moment en cliquant sur le lien « Gérer les cookies » en bas de page.
            </p>
            <p className="text-gray-600 mt-2">
              Vous pouvez également configurer votre navigateur pour refuser les cookies. Notez que le refus des cookies nécessaires peut affecter le fonctionnement du Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Vos droits (RGPD)
            </h2>
            <p className="text-gray-600">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
              <li><strong>Droit d&apos;accès</strong> — obtenir la confirmation que vos données sont traitées et en recevoir une copie</li>
              <li><strong>Droit de rectification</strong> — corriger des données inexactes ou incomplètes</li>
              <li><strong>Droit à l&apos;effacement</strong> — demander la suppression de vos données, sous réserve des obligations légales de conservation</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré et lisible par machine</li>
              <li><strong>Droit d&apos;opposition</strong> — vous opposer au traitement de vos données pour des motifs légitimes</li>
              <li><strong>Droit à la limitation</strong> — demander la suspension du traitement de vos données</li>
              <li><strong>Droit de retirer votre consentement</strong> — à tout moment, pour les traitements fondés sur le consentement</li>
            </ul>
            <p className="text-gray-600 mt-3">
              Pour exercer vos droits, contactez-nous à{' '}
              <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
                contact@getqarte.com
              </a>.
              Nous répondrons dans un délai d&apos;un (1) mois à compter de la réception de votre demande.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Sécurité des données
            </h2>
            <p className="text-gray-600">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, toute altération, divulgation ou destruction :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
              <li>Chiffrement SSL/TLS pour toutes les communications</li>
              <li>Authentification sécurisée avec hachage des mots de passe</li>
              <li>Politiques de sécurité au niveau des lignes (Row Level Security) sur la base de données</li>
              <li>Adresses IP hashées (non stockées en clair)</li>
              <li>Accès restreint aux données selon le principe du moindre privilège</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              10. Réclamation auprès de la CNIL
            </h2>
            <p className="text-gray-600">
              Si vous estimez que le traitement de vos données personnelles constitue une violation du RGPD, vous disposez du droit d&apos;introduire une réclamation auprès de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL) :
            </p>
            <p className="text-gray-600 mt-2">
              CNIL — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07<br />
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">
                www.cnil.fr
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              11. Modifications
            </h2>
            <p className="text-gray-600">
              Nous nous réservons le droit de modifier la présente politique de confidentialité à tout moment. En cas de modification substantielle, nous en informerons les utilisateurs par email ou via le Service. La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              12. Contact
            </h2>
            <p className="text-gray-600">
              Pour toute question relative à la protection de vos données personnelles ou pour exercer vos droits, contactez-nous à :{' '}
              <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
                contact@getqarte.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
