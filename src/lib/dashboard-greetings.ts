// Pool de salutations / motivations affichées sous le titre de la dashboard home.
// 60 phrases : tient ~2 mois sans répétition pour un merchant qui ouvre son dashboard
// une fois par jour. Ton « copine qui t'aide » — direct, chaleureux, sans jargon.
// Pas de corporate, pas d'analytics-speak.

const GREETINGS = [
  // Énergie / impulsion
  "Nouvelle semaine — ton énergie donne le ton.",
  "Commence fort, le reste suivra.",
  "Ton salon t'attend, rends-le beau aujourd'hui.",
  "Un café, tes outils, c'est parti.",
  "Respire, puis lance-toi.",

  // Exigence / détail
  "Chaque détail compte, tes clientes le sentent.",
  "Ce qui fait la différence, c'est le détail que personne n'attend.",
  "Prends le temps de bien faire, c'est ça qu'elles reviendront chercher.",
  "La précision aujourd'hui paye demain.",
  "Ton geste, ta signature.",

  // Flow / focus
  "Au cœur de la semaine — reste dans ton flow.",
  "Concentre-toi, le reste peut attendre.",
  "Un RDV à la fois, tu gères.",
  "Laisse ton rythme porter ta journée.",
  "Écoute tes mains, elles savent.",

  // Fin de semaine / transformation
  "Presque vendredi — finis les détails qui font la différence.",
  "Finis en beauté, laisse une impression qui reste.",
  "Une cliente qui repart heureuse, c'est une victoire.",
  "Ce que tu crées aujourd'hui, elles le raconteront demain.",
  "Les belles transformations se jouent dans les derniers coups.",

  // Samedi / jour fort
  "Le jour des transformations, prends-en soin.",
  "Grosse journée, petite respiration avant de démarrer.",
  "Ton agenda est plein — c'est que tu fais bien.",
  "Une belle cadence, un beau rendu.",
  "Aujourd'hui, tu donnes le meilleur de toi.",

  // Repos / prise de recul
  "Respire, prépare la semaine en douceur.",
  "Le repos fait partie du métier.",
  "Poser ses ciseaux, c'est aussi du travail.",
  "Un dimanche tranquille, ça répare tout.",
  "Prends le temps de regarder ce que tu as construit.",

  // Fierté / célébration
  "Regarde où tu en es — sois fière de ça.",
  "Tu tiens ton salon, c'est déjà énorme.",
  "Chaque cliente fidèle, c'est une preuve que tu fais bien.",
  "Ton salon, c'est ton histoire, chapeau.",
  "Les pros silencieux sont les meilleurs.",

  // Client / relation
  "Tes clientes te choisissent — rends-leur cette confiance.",
  "Une bonne discussion vaut parfois mieux qu'un bon brushing.",
  "Écoute d'abord, le reste viendra.",
  "Une cliente comprise, c'est une cliente fidèle.",
  "Tu connais tes habituées mieux que personne.",

  // Métier / rituel
  "Le métier se cache dans la répétition.",
  "Mêmes gestes, meilleur rendu chaque jour.",
  "Tu sais ce que tu fais — n'oublie pas.",
  "Ton œil est affûté, fais-lui confiance.",
  "Le bon coiffeur voit ce que les autres ne voient pas.",

  // Croissance / évolution
  "Une cliente aujourd'hui, dix demain.",
  "Grandir doucement, c'est grandir longtemps.",
  "Chaque bonne recommandation fait son chemin.",
  "Les salons qui durent sont ceux qu'on recommande.",
  "Pas besoin d'être partout, juste d'être bon là où tu es.",

  // Émotion / ambiance
  "Un salon chaleureux, ça commence par toi.",
  "Souris d'abord, le reste viendra.",
  "Tu es l'ambiance, pas juste la main.",
  "Ta cliente vient pour ses cheveux, elle revient pour toi.",
  "Le café, la musique, le ton — tout compte.",

  // Urgence douce / pragmatique
  "Deux minutes maintenant valent deux heures plus tard.",
  "Réponds maintenant, ne laisse pas traîner.",
  "Le RDV qu'on prend aujourd'hui, c'est celui qu'on ne perd pas.",
  "Un SMS rapide, une cliente gagnée.",
  "Moins de hunt, plus de salon.",
];

/**
 * Retourne une salutation stable pour la date donnée.
 * Même journée = même salutation. Change chaque jour, tourne sur ~2 mois.
 */
export function pickGreeting(date: Date = new Date()): string {
  // Day of year pour avoir une rotation stable sur l'année
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return GREETINGS[dayOfYear % GREETINGS.length];
}

export const GREETINGS_COUNT = GREETINGS.length;
