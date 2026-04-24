# Product

## Register

product

## Users

**Primary** — Professionnels indépendants de la beauté en France/Belgique/Suisse : coiffeurs, barbiers, esthéticiennes, onglerie, spa, tatoueurs. Souvent solo ou petite équipe (1-5 personnes). Pas de background tech. Utilisent leur téléphone en mouvement : debout au bac, entre deux clientes, mains parfois occupées. Contexte d'usage dominant : pic d'activité entre 10h-18h, moments creux en fin de journée pour regarder les chiffres.

**Secondary** — Clientes des salons (grand public FR), 18-65 ans. Utilisent la PWA client pour consulter leurs tampons, réserver, voir leurs récompenses. Pas de compte à créer, auth par cookie téléphone.

## Product Purpose

Qarte remplace les cartes de fidélité papier et les plateformes de réservation à commission (Planity, Booksy, Treatwell) par un outil unique, sans commission, que le merchant contrôle. Succès = le merchant économise du temps administratif, ses clientes reviennent plus souvent, et il récupère ses avis Google qui lui appartiennent vraiment.

## Brand Personality

Chaleureux, direct, pratique. Tutoiement côté merchant (copine qui t'aide), vouvoiement côté cliente finale. Zéro jargon tech, zéro bullshit marketing. Le ton fait sentir qu'on comprend le quotidien du métier — pas un logiciel froid d'entreprise, pas non plus un truc mignon-débile.

## Anti-references

- **Planity, Booksy, Treatwell** : modèle à commission qui capte les clientes du merchant. Interface qui met en avant la plateforme, pas le salon.
- **Doctolib** : trop corporate, impersonnel, verbosité administrative.
- **Zoho CRM** : densité d'UI qui noie, paramètres partout, expert-mode par défaut.
- Tout ce qui ressemble à un ERP : tables DataGrid infinies, filtres à 15 niveaux, vocabulaire SaaS B2B (« KPIs », « insights », « leads »).

## Design Principles

1. **Le temps du merchant est sacré** — chaque écran doit livrer la valeur en < 5 secondes. Pas de hunt-the-button, pas de validation en 3 étapes quand 1 suffit.
2. **L'information actionnable avant la data brute** — on montre "3 clientes à rappeler aujourd'hui" avant "127 clients total". Chiffres connectés à une action.
3. **Le dashboard ressemble à ton salon, pas à un ERP** — chaleureux, coloré par feature (pas par sévérité), humain. Zéro gris corporate partout.
4. **Mobile d'abord, desktop ensuite** — le merchant est debout, le client scanne sur son iPhone. Desktop est la vue confort, pas la vue primaire.
5. **On parle comme lui** — « Ta semaine », « Tes clientes », « Tes rendez-vous ». Jamais « utilisateur », « entity », « resource ».

## Accessibility & Inclusion

- Cible **WCAG AA** sur le dashboard (contraste texte ≥ 4.5:1, interactifs ≥ 3:1).
- Tap targets ≥ 44×44 px sur mobile (merchant mains occupées, parfois mouillées).
- Textes ≥ 14px body, jamais en-dessous sauf badges/meta.
- `prefers-reduced-motion` respecté (désactive animations framer-motion).
- Clientes finales parfois 60+ : taille police par défaut confortable sur la PWA client, contraste fort.
- Français uniquement pour l'instant (EN redirigé 301, infra gardée pour plus tard).
