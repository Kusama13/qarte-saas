import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import NoRightClick from '@/components/NoRightClick';
import { getTranslations } from 'next-intl/server';

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
          Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent les relations contractuelles entre la société SAS Tenga Labs, éditrice du service Qarte, dont le siège social est situé au 58 rue de Monceau, CS 48756, 75380 Paris Cedex 08 (ci-après « le Prestataire ») et tout professionnel ou particulier (ci-après « le Client ») souscrivant au service Qarte, une plateforme SaaS de page professionnelle et de programme de fidélité digital pour les professionnels de la beauté et du bien-être.
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
          <li>L&apos;envoi de SMS transactionnels (confirmations, rappels de rendez-vous, anniversaires) et de campagnes SMS marketing, dans la limite des packs souscrits (50 à 250 SMS/mois), sans dépassement automatique et dans le respect des plages horaires légales (10h-20h du lundi au samedi). Le Client est responsable du consentement explicite de ses destinataires finaux au regard de la réglementation applicable.</li>
        </ul>
        <p className="text-gray-600 mt-3">
          Le Service est actuellement disponible pour les professionnels établis en France, Belgique et Suisse. Les clients finaux (destinataires des SMS, bénéficiaires des cartes de fidélité) peuvent résider dans l&apos;Union Européenne et en Suisse.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          3. Tarification et modalités de paiement
        </h2>
        <p className="text-gray-600">
          Le Service est proposé selon deux formules, au choix du Client :
        </p>
        <p className="text-gray-600 mt-3"><strong>Formule Fidélité</strong> — programme de fidélité digital + page professionnelle + relances et avis Google :</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-1">
          <li><strong>Mensuel :</strong> 19€ par mois, sans engagement, renouvelable par tacite reconduction chaque mois.</li>
          <li><strong>Annuel :</strong> 190€ par an (soit ~16€/mois), facturé en une fois, engagement ferme de douze (12) mois.</li>
        </ul>
        <p className="text-gray-600 mt-3"><strong>Formule Tout-en-un</strong> — Formule Fidélité + réservation en ligne, planning et gestion des acomptes :</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-1">
          <li><strong>Mensuel :</strong> 24€ par mois, sans engagement, renouvelable par tacite reconduction chaque mois.</li>
          <li><strong>Annuel :</strong> 240€ par an (soit 20€/mois), facturé en une fois, engagement ferme de douze (12) mois.</li>
        </ul>
        <p className="text-gray-600 mt-3"><strong>Essai gratuit :</strong> un essai gratuit de 7 jours est proposé sans carte bancaire. À l&apos;issue de l&apos;essai, le Client doit souscrire une formule pour continuer à utiliser le Service.</p>
        <p className="text-gray-600 mt-3">
          Les prix indiqués s&apos;entendent hors taxes (HT). La TVA applicable au jour de la facturation (20% pour la France, taux applicable dans le pays de résidence du Client pour la Belgique et la Suisse) est ajoutée au tarif HT. Le paiement est effectué par carte bancaire via la plateforme sécurisée Stripe. Le Client peut basculer d&apos;une formule à l&apos;autre à tout moment ; un prorata est appliqué en cas d&apos;upgrade en cours de période et le changement prend effet à la prochaine échéance en cas de downgrade.
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
          Pour toute question concernant les présentes CGV, contactez-nous par email à{' '}
          <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
            contact@getqarte.com
          </a>{' '}ou par WhatsApp au{' '}
          <a href="https://wa.me/33607447420" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">
            +33 6 07 44 74 20
          </a>.
        </p>
      </section>
    </div>
  );
}


export default async function CGVPage() {
  const t = await getTranslations();

  return (
    <NoRightClick>
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-4xl">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-indigo-600">
            Qarte
          </Link>
          <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-5 h-5 inline mr-1" />
            {t('legalCommon.back')}
          </Link>
        </div>
      </header>

      <main className="px-4 py-12 mx-auto max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
          {t('cgv.title')}
        </h1>
        <p className="text-gray-500 mb-10">
          {t('legalCommon.lastUpdate', { date: 'Avril 2026' })}
        </p>

        <CGVContentFR />
      </main>
    </div>
    </NoRightClick>
  );
}
