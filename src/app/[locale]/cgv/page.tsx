import { Link } from '@/i18n/navigation';
import { ArrowLeft, CreditCard } from 'lucide-react';
import NoRightClick from '@/components/NoRightClick';
import { getTranslations, getLocale } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('cgv');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

function CGVContentFR() {
  return (
    <div className="prose prose-gray max-w-none space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          1. Objet
        </h2>
        <p className="text-gray-600">
          Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent les relations contractuelles entre la société SAS Tenga Labs, éditrice du service Qarte, dont le siège social est situé au 60 rue François 1er, 75008 Paris (ci-après « le Prestataire ») et tout professionnel ou particulier (ci-après « le Client ») souscrivant au service Qarte, une plateforme SaaS de page professionnelle et de programme de fidélité digital pour les professionnels de la beauté et du bien-être.
        </p>
        <p className="text-gray-600 mt-2">
          Toute souscription au Service implique l&apos;acceptation pleine et entière des présentes CGV, qui prévalent sur tout autre document.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          2. Description du Service
        </h2>
        <p className="text-gray-600">
          Qarte propose aux commerçants une solution permettant de créer et gérer un programme de fidélité digital. Le Service inclut notamment :
        </p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li>La création et la personnalisation d&apos;une carte de fidélité digitale (mode passages ou cagnotte)</li>
          <li>La génération de QR codes et la compatibilité carte NFC pour l&apos;enregistrement des passages clients</li>
          <li>Une page professionnelle personnalisée (bio, prestations, tarifs, horaires, galerie photos)</li>
          <li>Un module de planning en ligne pour la gestion des disponibilités</li>
          <li>Un tableau de bord de suivi et de statistiques</li>
          <li>La gestion des clients et des récompenses</li>
          <li>Un système de parrainage client</li>
          <li>Des relances automatiques et l&apos;envoi de notifications push aux clients</li>
          <li>La collecte d&apos;avis Google</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          3. Tarification et modalités de paiement
        </h2>
        <p className="text-gray-600">
          Le Service est proposé selon les formules suivantes :
        </p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li><strong>Abonnement mensuel :</strong> 24€ HT par mois, sans engagement de durée, renouvelable par tacite reconduction chaque mois.</li>
          <li><strong>Abonnement annuel :</strong> 240€ HT par an (soit 20€ HT/mois), facturé en une seule fois, en contrepartie d&apos;un engagement ferme de douze (12) mois.</li>
          <li><strong>Essai gratuit :</strong> Un essai gratuit de 7 jours est proposé sans carte bancaire. À l&apos;issue de l&apos;essai, le Client doit souscrire un abonnement pour continuer à utiliser le Service.</li>
        </ul>
        <p className="text-gray-600 mt-3">
          Le paiement est effectué par carte bancaire via la plateforme sécurisée Stripe. Les prix s&apos;entendent hors taxes et sont majorés de la TVA applicable au jour de la facturation.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          4. Droit de rétractation
        </h2>
        <p className="text-gray-600">
          Conformément à l&apos;article L221-28, 13° du Code de la consommation, le Client reconnaît et accepte que l&apos;exécution du Service commence dès la validation de son inscription et l&apos;accès à son espace personnel.
        </p>
        <p className="text-gray-600 mt-2">
          En conséquence, le Client renonce expressément à son droit de rétractation de quatorze (14) jours prévu à l&apos;article L221-18 du Code de la consommation.
        </p>
        <p className="text-gray-600 mt-2">
          Le Client reconnaît avoir été informé de cette renonciation préalablement à la souscription de l&apos;abonnement et avoir accepté expressément que la fourniture du Service débute avant l&apos;expiration du délai de rétractation.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          5. Durée et résiliation
        </h2>
        <p className="text-gray-600 font-medium">Abonnement mensuel :</p>
        <p className="text-gray-600 mt-1">
          Le contrat est conclu pour une durée indéterminée avec une période minimale d&apos;un (1) mois, renouvelable par tacite reconduction. Le Client peut résilier à tout moment depuis son tableau de bord. La résiliation prend effet à l&apos;expiration de la période mensuelle en cours. Le Service reste accessible jusqu&apos;à la fin de la période payée.
        </p>
        <p className="text-gray-600 font-medium mt-3">Abonnement annuel :</p>
        <p className="text-gray-600 mt-1">
          Le contrat est conclu pour une durée de douze (12) mois, renouvelable par tacite reconduction. Le Client peut s&apos;opposer au renouvellement en résiliant depuis son tableau de bord. Conformément à l&apos;article L215-1 du Code de la consommation, le Client sera informé par email de la possibilité de ne pas reconduire le contrat au plus tard un (1) mois avant le terme de la période en cours.
        </p>
        <p className="text-gray-600 font-medium mt-3">Suspension pour non-paiement :</p>
        <p className="text-gray-600 mt-1">
          En cas de non-paiement, le Prestataire se réserve le droit de suspendre l&apos;accès au Service après notification restée sans effet pendant huit (8) jours.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          6. Non-remboursement
        </h2>
        <p className="text-gray-600 font-medium">Abonnement mensuel :</p>
        <p className="text-gray-600 mt-1">
          En cas de résiliation en cours de mois, le Service reste accessible jusqu&apos;à la fin de la période facturée. Aucun remboursement au prorata ne sera effectué pour la période entamée.
        </p>
        <p className="text-gray-600 font-medium mt-3">Abonnement annuel :</p>
        <p className="text-gray-600 mt-1">
          L&apos;abonnement annuel est facturé en une seule fois pour l&apos;intégralité de la période de 12 mois. Les sommes versées sont acquises au Prestataire et ne donnent lieu à aucun remboursement, même partiel, en cas de résiliation anticipée à l&apos;initiative du Client. Le Service reste accessible jusqu&apos;au terme de la période annuelle payée.
        </p>
        <p className="text-gray-600 mt-2">
          Le Client reconnaît que le tarif annuel constitue un tarif préférentiel consenti en contrepartie de l&apos;engagement sur la durée de 12 mois, et que la résiliation anticipée ne saurait ouvrir droit à un remboursement au prorata temporis.
        </p>
        <p className="text-gray-600 mt-2">
          En cas de résiliation du contrat à l&apos;initiative du Prestataire pour un motif autre que la faute du Client, le Client sera remboursé au prorata temporis des sommes versées pour la période restant à courir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          7. Obligations du Client
        </h2>
        <p className="text-gray-600">Le Client s&apos;engage à :</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li>Fournir des informations exactes et à jour lors de son inscription</li>
          <li>Utiliser le Service conformément à sa destination et aux présentes CGV</li>
          <li>Ne pas utiliser le Service à des fins illicites ou contraires à l&apos;ordre public</li>
          <li>Assurer la confidentialité de ses identifiants de connexion</li>
          <li>Respecter la réglementation applicable en matière de protection des données personnelles de ses propres clients</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          8. Obligations du Prestataire
        </h2>
        <p className="text-gray-600">Le Prestataire s&apos;engage à :</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li>Fournir le Service conformément à sa description</li>
          <li>Assurer la sécurité et la confidentialité des données hébergées</li>
          <li>Informer le Client de toute interruption programmée du Service</li>
          <li>Mettre en œuvre les moyens nécessaires pour assurer la disponibilité du Service</li>
        </ul>
        <p className="text-gray-600 mt-3">
          Les obligations du Prestataire constituent des obligations de moyens. Le Prestataire s&apos;engage à fournir le Service avec diligence et selon les règles de l&apos;art, à l&apos;exclusion de toute obligation de résultat.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          9. Suspension et résiliation par le Prestataire
        </h2>
        <p className="text-gray-600">
          Le Prestataire se réserve le droit de suspendre ou de résilier l&apos;accès au Service, sans préavis ni indemnité, dans les cas suivants :
        </p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li>Non-respect des présentes CGV</li>
          <li>Utilisation frauduleuse ou abusive du Service</li>
          <li>Fourniture d&apos;informations fausses ou incomplètes lors de l&apos;inscription</li>
          <li>Activité illicite ou portant atteinte aux droits de tiers</li>
          <li>Non-paiement après notification restée sans effet pendant huit (8) jours</li>
        </ul>
        <p className="text-gray-600 mt-2">
          En cas de résiliation pour faute du Client, aucun remboursement ne sera dû. Le Prestataire informera le Client par email de la suspension ou de la résiliation de son compte.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          10. Disponibilité et évolution du Service
        </h2>
        <p className="text-gray-600">
          Le Prestataire s&apos;efforce de maintenir le Service accessible 24 heures sur 24, 7 jours sur 7, avec un objectif de disponibilité de 99,5% par mois, hors périodes de maintenance programmée.
        </p>
        <p className="text-gray-600 mt-2">
          Le Prestataire se réserve le droit d&apos;interrompre temporairement le Service pour des opérations de maintenance, de mise à jour ou d&apos;amélioration, en s&apos;efforçant d&apos;informer le Client dans un délai raisonnable.
        </p>
        <p className="text-gray-600 mt-2">
          Les interruptions du Service ne sauraient ouvrir droit à une indemnisation au profit du Client.
        </p>
        <p className="text-gray-600 mt-2">
          Le Prestataire se réserve le droit de faire évoluer les fonctionnalités du Service (ajout, modification ou suppression de fonctionnalités) afin d&apos;en améliorer la qualité. Ces évolutions ne constituent pas une modification des conditions contractuelles dès lors qu&apos;elles n&apos;altèrent pas substantiellement le Service souscrit.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          11. Propriété intellectuelle
        </h2>
        <p className="text-gray-600">
          Le Prestataire conserve l&apos;intégralité des droits de propriété intellectuelle sur le Service, y compris le code source, l&apos;interface utilisateur, les algorithmes, la documentation et les marques associées.
        </p>
        <p className="text-gray-600 mt-2">
          L&apos;abonnement confère au Client un droit d&apos;utilisation personnel, non exclusif, non cessible et non transférable du Service, limité à la durée de l&apos;abonnement et à l&apos;objet défini aux présentes.
        </p>
        <p className="text-gray-600 mt-2">
          Le Client conserve la propriété de l&apos;ensemble des données qu&apos;il saisit dans le Service. Le Prestataire s&apos;interdit d&apos;utiliser ces données à d&apos;autres fins que l&apos;exécution du Service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          12. Limitation de responsabilité
        </h2>
        <p className="text-gray-600">
          Le Prestataire ne pourra être tenu responsable que des dommages directs, personnels et certains subis par le Client, à l&apos;exclusion expresse de tout dommage indirect, notamment le manque à gagner, la perte de clientèle, la perte de données, ou l&apos;atteinte à l&apos;image de marque.
        </p>
        <p className="text-gray-600 mt-2">
          En tout état de cause, la responsabilité totale du Prestataire, toutes causes confondues, est limitée aux sommes effectivement versées par le Client au titre des douze (12) derniers mois précédant le fait générateur du dommage.
        </p>
        <p className="text-gray-600 mt-2">
          Le Service est fourni « en l&apos;état ». Le Prestataire ne garantit pas que le Service fonctionnera de manière ininterrompue ou exempte d&apos;erreurs.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          13. Force majeure
        </h2>
        <p className="text-gray-600">
          Le Prestataire ne pourra être tenu responsable de tout manquement à ses obligations contractuelles résultant d&apos;un événement de force majeure au sens de l&apos;article 1218 du Code civil, notamment : catastrophes naturelles, pandémies, incendies, grèves, guerres, défaillances des réseaux de télécommunications, attaques informatiques, décisions gouvernementales, ou toute autre circonstance échappant au contrôle raisonnable du Prestataire.
        </p>
        <p className="text-gray-600 mt-2">
          En cas de force majeure d&apos;une durée supérieure à trois (3) mois, chacune des parties pourra résilier le contrat de plein droit, sans indemnité.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          14. Protection des données
        </h2>
        <p className="text-gray-600">
          Le Prestataire s&apos;engage à protéger les données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés. Pour plus d&apos;informations sur la collecte, le traitement et la conservation de vos données, consultez notre{' '}
          <Link href="/politique-confidentialite" className="text-indigo-600 hover:text-indigo-800 underline">
            politique de confidentialité
          </Link>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          15. Programme de parrainage entre commerçants
        </h2>
        <p className="text-gray-600">
          Qarte propose un programme de parrainage permettant à tout Client disposant d&apos;un abonnement actif (mensuel ou annuel) de recommander le Service à d&apos;autres commerçants.
        </p>
        <p className="text-gray-600 font-medium mt-3">Conditions :</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li>Lorsqu&apos;un commerçant parrainé souscrit un abonnement payant, le parrain bénéficie d&apos;un crédit de 10€ HT appliqué automatiquement sur sa prochaine facture.</li>
          <li>Ce crédit est limité à un (1) parrainage récompensé par mois calendaire.</li>
          <li>Le crédit n&apos;est pas convertible en numéraire et ne peut donner lieu à un remboursement.</li>
        </ul>
        <p className="text-gray-600 font-medium mt-3">Abonnement annuel :</p>
        <p className="text-gray-600 mt-1">
          Pour les Clients titulaires d&apos;un abonnement annuel, les crédits de parrainage s&apos;accumulent sur le solde client et sont déduits automatiquement lors du renouvellement de l&apos;abonnement.
        </p>
        <p className="text-gray-600 mt-3">
          Le Prestataire se réserve le droit de modifier ou de suspendre le programme de parrainage à tout moment, sous réserve d&apos;en informer les Clients. Les crédits déjà acquis restent valables.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          16. Médiation et règlement des litiges
        </h2>
        <p className="text-gray-600">
          En cas de litige, le Client est invité à adresser une réclamation écrite au Prestataire par email à{' '}
          <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
            contact@getqarte.com
          </a>.
        </p>
        <p className="text-gray-600 mt-2">
          Conformément aux articles L611-1 et suivants du Code de la consommation, le Client peut recourir à un médiateur de la consommation ou à tout mode alternatif de règlement des différends en vue de la résolution amiable du litige.
        </p>
        <p className="text-gray-600 mt-2">
          Le Client peut également recourir à la plateforme européenne de résolution des litiges en ligne :{' '}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">
            https://ec.europa.eu/consumers/odr/
          </a>
        </p>
        <p className="text-gray-600 mt-2">
          À défaut de résolution amiable, le litige sera soumis aux tribunaux compétents dans les conditions de droit commun.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          17. Loi applicable et juridiction
        </h2>
        <p className="text-gray-600">
          Les présentes CGV sont soumises au droit français. À défaut de résolution amiable dans un délai de soixante (60) jours, le litige sera soumis aux tribunaux compétents du ressort du siège social du Prestataire.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          18. Dispositions générales
        </h2>
        <p className="text-gray-600 font-medium">Modification des CGV :</p>
        <p className="text-gray-600 mt-1">
          Le Prestataire se réserve le droit de modifier les présentes CGV à tout moment, notamment pour se conformer à toute évolution législative ou réglementaire, ou pour tenir compte de l&apos;évolution du Service. Le Client sera informé par email de toute modification substantielle au moins trente (30) jours avant son entrée en vigueur. La poursuite de l&apos;utilisation du Service après cette date vaut acceptation des nouvelles CGV.
        </p>
        <p className="text-gray-600 font-medium mt-3">Cession :</p>
        <p className="text-gray-600 mt-1">
          Le Client ne peut céder ou transférer ses droits et obligations au titre des présentes CGV à un tiers sans l&apos;accord préalable écrit du Prestataire.
        </p>
        <p className="text-gray-600 font-medium mt-3">Communications électroniques :</p>
        <p className="text-gray-600 mt-1">
          Le Client accepte de recevoir les communications relatives au Service (notifications, factures, informations sur les évolutions du Service) par voie électronique à l&apos;adresse email renseignée lors de son inscription.
        </p>
        <p className="text-gray-600 font-medium mt-3">Divisibilité :</p>
        <p className="text-gray-600 mt-1">
          Si l&apos;une quelconque des stipulations des présentes CGV est déclarée nulle ou inapplicable, les autres stipulations resteront en vigueur et de plein effet.
        </p>
        <p className="text-gray-600 font-medium mt-3">Non-renonciation :</p>
        <p className="text-gray-600 mt-1">
          Le fait pour le Prestataire de ne pas exercer un droit ou une disposition des présentes CGV ne constitue pas une renonciation à ce droit ou à cette disposition, sauf accord écrit exprès.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          19. Contact
        </h2>
        <p className="text-gray-600">
          Pour toute question concernant les présentes CGV, contactez-nous à{' '}
          <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
            contact@getqarte.com
          </a>.
        </p>
      </section>
    </div>
  );
}

function CGVContentEN() {
  return (
    <div className="prose prose-gray max-w-none space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          1. Purpose
        </h2>
        <p className="text-gray-600">
          These Terms of Service (hereinafter &quot;Terms&quot;) govern the contractual relationship between SAS Tenga Labs, the company that publishes the Qarte service, with its registered office at 60 rue Fran&ccedil;ois 1er, 75008 Paris, France (hereinafter &quot;the Provider&quot;), and any business or individual (hereinafter &quot;the Client&quot;) subscribing to Qarte, a SaaS platform providing professional business pages and digital loyalty programs for beauty and wellness professionals.
        </p>
        <p className="text-gray-600 mt-2">
          Any subscription to the Service implies full and unconditional acceptance of these Terms, which shall prevail over any other document.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          2. Description of the Service
        </h2>
        <p className="text-gray-600">
          Qarte provides merchants with a solution to create and manage a digital loyalty program. The Service includes, but is not limited to:
        </p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li>Creation and customization of a digital loyalty card (stamp-based or cashback mode)</li>
          <li>QR code generation and NFC card compatibility for recording customer visits</li>
          <li>A customizable professional business page (bio, services, pricing, hours, photo gallery)</li>
          <li>An online scheduling module for availability management</li>
          <li>A dashboard for tracking and analytics</li>
          <li>Customer and reward management</li>
          <li>A customer referral system</li>
          <li>Automated follow-ups and push notifications to customers</li>
          <li>Google review collection</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          3. Pricing and Payment Terms
        </h2>
        <p className="text-gray-600">
          The Service is offered under the following plans:
        </p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li><strong>Monthly subscription:</strong> 24&#8364; excl. tax per month, with no minimum commitment, automatically renewed each month.</li>
          <li><strong>Annual subscription:</strong> 240&#8364; excl. tax per year (20&#8364; excl. tax/month), billed as a single payment in consideration of a firm twelve (12) month commitment.</li>
          <li><strong>Free trial:</strong> A 7-day free trial is available without requiring a credit card. At the end of the trial period, the Client must subscribe to a paid plan to continue using the Service.</li>
        </ul>
        <p className="text-gray-600 mt-3">
          Payment is processed by credit card through the secure Stripe payment platform. All prices are quoted exclusive of tax and are subject to the applicable VAT rate at the time of invoicing.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          4. Right of Withdrawal
        </h2>
        <p className="text-gray-600">
          In accordance with Article L221-28, 13&deg; of the French Consumer Code (Code de la consommation), the Client acknowledges and agrees that the performance of the Service begins upon validation of their registration and access to their personal account.
        </p>
        <p className="text-gray-600 mt-2">
          Accordingly, the Client expressly waives their fourteen (14) day right of withdrawal provided for in Article L221-18 of the French Consumer Code.
        </p>
        <p className="text-gray-600 mt-2">
          The Client acknowledges having been informed of this waiver prior to subscribing and having expressly agreed that the provision of the Service shall commence before the expiration of the withdrawal period.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          5. Duration and Termination
        </h2>
        <p className="text-gray-600 font-medium">Monthly subscription:</p>
        <p className="text-gray-600 mt-1">
          The contract is entered into for an indefinite period with a minimum term of one (1) month, automatically renewed by tacit agreement. The Client may cancel at any time from their dashboard. Cancellation takes effect at the end of the current monthly billing period. The Service remains accessible until the end of the paid period.
        </p>
        <p className="text-gray-600 font-medium mt-3">Annual subscription:</p>
        <p className="text-gray-600 mt-1">
          The contract is entered into for a period of twelve (12) months, automatically renewed by tacit agreement. The Client may opt out of renewal by canceling from their dashboard. In accordance with Article L215-1 of the French Consumer Code, the Client shall be notified by email of the option not to renew the contract no later than one (1) month before the end of the current period.
        </p>
        <p className="text-gray-600 font-medium mt-3">Suspension for non-payment:</p>
        <p className="text-gray-600 mt-1">
          In the event of non-payment, the Provider reserves the right to suspend access to the Service after a notice has been sent and remained without effect for eight (8) days.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          6. No Refund Policy
        </h2>
        <p className="text-gray-600 font-medium">Monthly subscription:</p>
        <p className="text-gray-600 mt-1">
          In the event of cancellation during a billing month, the Service remains accessible until the end of the current paid period. No pro-rata refund shall be issued for any partially used period.
        </p>
        <p className="text-gray-600 font-medium mt-3">Annual subscription:</p>
        <p className="text-gray-600 mt-1">
          The annual subscription is billed as a single payment for the entire 12-month period. All amounts paid are deemed earned by the Provider and shall not be refunded, in whole or in part, in the event of early termination initiated by the Client. The Service remains accessible until the end of the paid annual period.
        </p>
        <p className="text-gray-600 mt-2">
          The Client acknowledges that the annual rate constitutes a preferential rate granted in consideration of the 12-month commitment, and that early termination shall not entitle the Client to any pro-rata refund.
        </p>
        <p className="text-gray-600 mt-2">
          In the event of termination initiated by the Provider for reasons other than the Client&apos;s fault, the Client shall be refunded on a pro-rata basis for the remaining unused period.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          7. Client Obligations
        </h2>
        <p className="text-gray-600">The Client agrees to:</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li>Provide accurate and up-to-date information upon registration</li>
          <li>Use the Service in accordance with its intended purpose and these Terms</li>
          <li>Refrain from using the Service for any unlawful or unauthorized purpose</li>
          <li>Maintain the confidentiality of their login credentials</li>
          <li>Comply with applicable data protection regulations with respect to their own customers&apos; personal data</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          8. Provider Obligations
        </h2>
        <p className="text-gray-600">The Provider agrees to:</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li>Provide the Service in accordance with its description</li>
          <li>Ensure the security and confidentiality of hosted data</li>
          <li>Notify the Client of any scheduled Service interruptions</li>
          <li>Implement the necessary measures to ensure Service availability</li>
        </ul>
        <p className="text-gray-600 mt-3">
          The Provider&apos;s obligations are obligations of means (best efforts). The Provider undertakes to deliver the Service with due diligence and in accordance with industry standards, to the exclusion of any obligation of result.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          9. Suspension and Termination by the Provider
        </h2>
        <p className="text-gray-600">
          The Provider reserves the right to suspend or terminate access to the Service, without prior notice or compensation, in the following cases:
        </p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li>Breach of these Terms</li>
          <li>Fraudulent or abusive use of the Service</li>
          <li>Provision of false or incomplete information upon registration</li>
          <li>Unlawful activity or infringement of third-party rights</li>
          <li>Non-payment after a notice has remained without effect for eight (8) days</li>
        </ul>
        <p className="text-gray-600 mt-2">
          In the event of termination due to the Client&apos;s fault, no refund shall be due. The Provider shall notify the Client by email of the suspension or termination of their account.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          10. Service Availability and Evolution
        </h2>
        <p className="text-gray-600">
          The Provider endeavors to maintain the Service accessible 24 hours a day, 7 days a week, with a target availability of 99.5% per month, excluding scheduled maintenance periods.
        </p>
        <p className="text-gray-600 mt-2">
          The Provider reserves the right to temporarily interrupt the Service for maintenance, updates, or improvements, and shall endeavor to notify the Client within a reasonable timeframe.
        </p>
        <p className="text-gray-600 mt-2">
          Service interruptions shall not entitle the Client to any compensation.
        </p>
        <p className="text-gray-600 mt-2">
          The Provider reserves the right to modify the features of the Service (addition, modification, or removal of features) in order to improve its quality. Such changes shall not constitute a modification of the contractual terms, provided they do not substantially alter the subscribed Service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          11. Intellectual Property
        </h2>
        <p className="text-gray-600">
          The Provider retains all intellectual property rights in and to the Service, including the source code, user interface, algorithms, documentation, and associated trademarks.
        </p>
        <p className="text-gray-600 mt-2">
          The subscription grants the Client a personal, non-exclusive, non-assignable, and non-transferable right to use the Service, limited to the duration of the subscription and the purpose defined herein.
        </p>
        <p className="text-gray-600 mt-2">
          The Client retains ownership of all data entered into the Service. The Provider shall not use such data for any purpose other than the performance of the Service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          12. Limitation of Liability
        </h2>
        <p className="text-gray-600">
          The Provider shall only be liable for direct, personal, and certain damages suffered by the Client, expressly excluding any indirect damages, including but not limited to loss of profits, loss of customers, loss of data, or damage to brand reputation.
        </p>
        <p className="text-gray-600 mt-2">
          In any event, the total aggregate liability of the Provider, regardless of cause, shall be limited to the amounts actually paid by the Client during the twelve (12) months preceding the event giving rise to the claim.
        </p>
        <p className="text-gray-600 mt-2">
          The Service is provided &quot;as is.&quot; The Provider does not warrant that the Service will operate without interruption or be free from errors.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          13. Force Majeure
        </h2>
        <p className="text-gray-600">
          The Provider shall not be held liable for any failure to perform its contractual obligations resulting from a force majeure event within the meaning of Article 1218 of the French Civil Code, including but not limited to: natural disasters, pandemics, fires, strikes, wars, telecommunications network failures, cyberattacks, government decisions, or any other circumstance beyond the reasonable control of the Provider.
        </p>
        <p className="text-gray-600 mt-2">
          In the event of a force majeure lasting more than three (3) months, either party may terminate the contract by operation of law, without compensation.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          14. Data Protection
        </h2>
        <p className="text-gray-600">
          The Provider undertakes to protect personal data in accordance with the General Data Protection Regulation (GDPR) and the French Data Protection Act (Loi Informatique et Libert&eacute;s). For more information on the collection, processing, and storage of your data, please refer to our{' '}
          <Link href="/politique-confidentialite" className="text-indigo-600 hover:text-indigo-800 underline">
            Privacy Policy
          </Link>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          15. Merchant Referral Program
        </h2>
        <p className="text-gray-600">
          Qarte offers a referral program enabling any Client with an active subscription (monthly or annual) to recommend the Service to other merchants.
        </p>
        <p className="text-gray-600 font-medium mt-3">Conditions:</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
          <li>When a referred merchant subscribes to a paid plan, the referring Client receives a credit of 10&#8364; excl. tax, automatically applied to their next invoice.</li>
          <li>This credit is limited to one (1) rewarded referral per calendar month.</li>
          <li>The credit is not convertible to cash and cannot be refunded.</li>
        </ul>
        <p className="text-gray-600 font-medium mt-3">Annual subscription:</p>
        <p className="text-gray-600 mt-1">
          For Clients holding an annual subscription, referral credits accumulate on the client balance and are automatically deducted upon subscription renewal.
        </p>
        <p className="text-gray-600 mt-3">
          The Provider reserves the right to modify or suspend the referral program at any time, subject to notifying Clients. Credits already earned shall remain valid.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          16. Mediation and Dispute Resolution
        </h2>
        <p className="text-gray-600">
          In the event of a dispute, the Client is invited to send a written complaint to the Provider by email at{' '}
          <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
            contact@getqarte.com
          </a>.
        </p>
        <p className="text-gray-600 mt-2">
          In accordance with Articles L611-1 et seq. of the French Consumer Code, the Client may refer the matter to a consumer mediator or any other alternative dispute resolution mechanism for amicable settlement.
        </p>
        <p className="text-gray-600 mt-2">
          The Client may also use the European Online Dispute Resolution platform:{' '}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">
            https://ec.europa.eu/consumers/odr/
          </a>
        </p>
        <p className="text-gray-600 mt-2">
          Failing amicable resolution, the dispute shall be submitted to the competent courts under the applicable rules of jurisdiction.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          17. Governing Law and Jurisdiction
        </h2>
        <p className="text-gray-600">
          These Terms shall be governed by and construed in accordance with the laws of France. Failing amicable resolution within sixty (60) days, any dispute shall be submitted to the competent courts within the jurisdiction of the Provider&apos;s registered office.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          18. General Provisions
        </h2>
        <p className="text-gray-600 font-medium">Amendment of Terms:</p>
        <p className="text-gray-600 mt-1">
          The Provider reserves the right to amend these Terms at any time, in particular to comply with any legislative or regulatory changes, or to reflect changes to the Service. The Client shall be notified by email of any material change at least thirty (30) days before it takes effect. Continued use of the Service after such date shall constitute acceptance of the revised Terms.
        </p>
        <p className="text-gray-600 font-medium mt-3">Assignment:</p>
        <p className="text-gray-600 mt-1">
          The Client may not assign or transfer their rights and obligations under these Terms to any third party without the prior written consent of the Provider.
        </p>
        <p className="text-gray-600 font-medium mt-3">Electronic communications:</p>
        <p className="text-gray-600 mt-1">
          The Client agrees to receive communications relating to the Service (notifications, invoices, information about Service updates) electronically at the email address provided upon registration.
        </p>
        <p className="text-gray-600 font-medium mt-3">Severability:</p>
        <p className="text-gray-600 mt-1">
          If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
        </p>
        <p className="text-gray-600 font-medium mt-3">No waiver:</p>
        <p className="text-gray-600 mt-1">
          The failure of the Provider to exercise any right or provision of these Terms shall not constitute a waiver of such right or provision, unless expressly agreed in writing.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          19. Contact
        </h2>
        <p className="text-gray-600">
          For any questions regarding these Terms, please contact us at{' '}
          <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
            contact@getqarte.com
          </a>.
        </p>
      </section>
    </div>
  );
}

export default async function CGVPage() {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <NoRightClick>
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
            {t('legalCommon.back')}
          </Link>
        </div>
      </header>

      <main className="px-4 py-12 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('cgv.title')}
        </h1>
        <p className="text-gray-500 mb-10">
          {t('legalCommon.lastUpdate', { date: locale === 'fr' ? 'Mars 2026' : 'March 2026' })}
        </p>

        {locale === 'en' ? <CGVContentEN /> : <CGVContentFR />}
      </main>
    </div>
    </NoRightClick>
  );
}
