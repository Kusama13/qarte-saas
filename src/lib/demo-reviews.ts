import type { ShopType } from '@/types';
import type { GoogleReviewsData } from '@/lib/google-places';

// Avis Google FICTIFS pour les pages démo (/p/demo-*) de la landing.
// Aucun appel API : données statiques crédibles par métier, pour montrer le
// rendu de la section avis sur la vitrine. Pas de lien « voir tout » (mapsUri
// null) → le CTA Google ne s'affiche pas sur les démos.

const r = (author: string, text: string, relativeTime: string, rating = 5) => ({
  author,
  authorPhoto: null,
  rating,
  text,
  relativeTime,
});

const DEMO_REVIEWS: Record<ShopType, GoogleReviewsData> = {
  onglerie: {
    rating: 4.9,
    ratingCount: 142,
    mapsUri: null,
    reviews: [
      r('Sarah L.', "Manucure semi-permanente impeccable, ça tient 3 semaines sans bouger. Accueil adorable.", 'il y a 2 semaines'),
      r('Inès B.', "Le nail art est juste sublime, on me complimente à chaque fois. Je recommande les yeux fermés.", 'il y a 1 mois'),
      r('Manon R.', "Salon très propre, prestations soignées et toujours à l'heure. Mon onglerie préférée.", 'il y a 5 jours'),
    ],
  },
  coiffeur: {
    rating: 4.9,
    ratingCount: 208,
    mapsUri: null,
    reviews: [
      r('Camille D.', "Mon balayage est exactement ce que je voulais, résultat naturel et lumineux. Merci !", 'il y a 3 semaines'),
      r('Julie M.', "À l'écoute, de bons conseils, et une coupe qui me va enfin. Je ne change plus de salon.", 'il y a 1 mois'),
      r('Léa P.', "Ambiance au top et coiffeurs vraiment doués. Toujours satisfaite en sortant.", 'il y a 1 semaine'),
    ],
  },
  barbier: {
    rating: 4.9,
    ratingCount: 173,
    mapsUri: null,
    reviews: [
      r('Karim B.', "Dégradé net et taille de barbe parfaite, exactement ce que je demande à chaque fois.", 'il y a 2 semaines'),
      r('Antoine R.', "Accueil chaleureux, vrai savoir-faire. Le meilleur barbier du coin sans hésiter.", 'il y a 1 mois'),
      r('Yanis M.', "Toujours impeccable, rapide et soigné. Je recommande à tous mes potes.", 'il y a 4 jours'),
    ],
  },
  institut_beaute: {
    rating: 4.9,
    ratingCount: 118,
    mapsUri: null,
    reviews: [
      r('Sophie T.', "Soin du visage divin, ma peau n'a jamais été aussi belle. Moment de détente garanti.", 'il y a 3 semaines'),
      r('Nadia K.', "Esthéticiennes douces et professionnelles, institut très propre. Je ressors toujours apaisée.", 'il y a 1 mois'),
      r('Clara F.', "Épilation rapide et quasi indolore, prestations au top. Je recommande vivement.", 'il y a 1 semaine'),
    ],
  },
  spa: {
    rating: 5.0,
    ratingCount: 87,
    mapsUri: null,
    reviews: [
      r('Élodie M.', "Massage exceptionnel, cadre apaisant, on déconnecte totalement. Un vrai cocon.", 'il y a 2 semaines'),
      r('Laura B.', "Accueil parfait, soins haut de gamme. La parenthèse bien-être dont j'avais besoin.", 'il y a 1 mois'),
      r('Céline D.', "Tout est pensé pour la détente, personnel aux petits soins. À refaire absolument.", 'il y a 5 jours'),
    ],
  },
  estheticienne: {
    rating: 4.9,
    ratingCount: 96,
    mapsUri: null,
    reviews: [
      r('Amandine L.', "Soins personnalisés et résultats visibles dès la première séance. Très pro.", 'il y a 3 semaines'),
      r('Fanny R.', "À l'écoute, douce et minutieuse. Ma peau la remercie ! Je recommande.", 'il y a 1 mois'),
      r('Marion P.', "Rendez-vous toujours agréable, conseils avisés. Je ne vais plus ailleurs.", 'il y a 1 semaine'),
    ],
  },
  tatouage: {
    rating: 4.9,
    ratingCount: 134,
    mapsUri: null,
    reviews: [
      r('Thomas G.', "Travail d'une précision incroyable, mon tatouage est une œuvre d'art. Hygiène parfaite.", 'il y a 2 mois'),
      r('Marine V.', "Très à l'écoute du projet, le rendu dépasse mes attentes. Studio au top.", 'il y a 3 semaines'),
      r('Hugo L.', "Geste sûr, ligne nette, et un accueil hyper pro. Je reviendrai pour la suite.", 'il y a 6 jours'),
    ],
  },
  autre: {
    rating: 4.9,
    ratingCount: 73,
    mapsUri: null,
    reviews: [
      r('Sarah B.', "Prestations de qualité, accueil parfait et résultat au rendez-vous. Top !", 'il y a 2 semaines'),
      r('Thomas L.', "Équipe professionnelle et à l'écoute. Je recommande les yeux fermés.", 'il y a 1 mois'),
      r('Julie M.', "Toujours satisfaite, un vrai moment pour soi. Merci à toute l'équipe.", 'il y a 6 jours'),
    ],
  },
};

export function getDemoGoogleReviews(shopType: ShopType): GoogleReviewsData {
  return DEMO_REVIEWS[shopType] || DEMO_REVIEWS.autre;
}
