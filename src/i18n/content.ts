// All visible copy lives here so / and /fr/ stay in sync.

export type Lang = 'en' | 'fr';

export const links = {
  email: 'antoineoparin@gmail.com',
  github: 'https://github.com/AntoineOparin',
  linkedin: 'https://www.linkedin.com/in/antoineoparin/',
  ramifie: 'https://ramifie.com',
  cv: '/Antoine_Oparin_CV.pdf',
};

const content = {
  en: {
    meta: {
      title: 'Antoine Oparin, Software Developer',
      description:
        'Software developer and Computer Science student in Montreal, open to 4-8 month internships.',
    },
    skip: 'Skip to content',
    nav: {
      story: 'Story',
      resume: 'Résumé',
      contact: 'Contact',
      menu: 'Menu',
      close: 'Close menu',
      theme: 'Toggle dark mode',
      otherLang: 'FR',
      otherLangLabel: 'Voir en français',
    },
    hero: {
      hello: 'Hi, I’m Antoine.',
      sub: 'Computer Science student at Concordia. I just wrapped up a developer internship at TS Imagine, and I’m ready for the next one.',
      status: 'Open to 4-8 month internships, any term.',
      resume: 'See my résumé',
      email: 'Email me',
      portraitAlt: 'Antoine Oparin smiling under a clear umbrella',
    },
    story: {
      heading: 'How I got here',
      chapters: [
        {
          year: '2023',
          title: 'Where it started',
          body: 'I started Computer Science Technology at Dawson College and spent three years building apps for the web, desktop and mobile. That’s where coding went from a class I took to something I wanted to do every day.',
        },
        {
          year: '2025',
          title: 'A game for my sister',
          body: 'My sister loves word games, so I built her one. Ramifie is a daily crossword puzzle I designed and coded on my own. Then other people started playing too, and today more than 50 of them come back to it regularly.',
          link: 'Play today’s puzzle',
          imageAlt: 'A Ramifie puzzle in progress, words outlined in green.',
        },
        {
          year: '2026',
          title: 'My first internship',
          body: 'This summer I joined the Fixed Income team at TS Imagine as a software developer intern. I worked on both the backend and the frontend, helped move older services onto a modern stack, and built a tool the team was still using after my internship ended.',
        },
        {
          year: 'Now',
          title: 'What’s next',
          body: 'I’ve just started my Bachelor of Computer Science at Concordia University. Now I’m looking for a 4-8 month internship with a team where I can contribute to real work and keep growing as an engineer.',
        },
      ],
    },
    traits: {
      heading: 'How I work',
      items: [
        { title: 'I ship things and keep them running.', body: 'Ramifie has been live since June 2025, with a new puzzle every single day.' },
        { title: 'I make the work easier for whoever comes next.', body: 'During the migration at TS Imagine, I packaged what I learned into a tool the team kept using after I left.' },
        { title: 'I’m comfortable across the stack.', body: 'I’ve built React interfaces and Spring Boot services, and I like understanding how all the pieces fit together.' },
      ],
    },
    resume: {
      heading: 'Résumé',
      sub: 'Scroll through it here, or download a copy.',
      download: 'Download PDF',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      loading: 'Loading résumé…',
      error: 'The preview could not load. You can still open the PDF.',
      open: 'Open PDF',
      label: 'Antoine Oparin’s résumé',
    },
    contact: {
      heading: 'Let’s connect.',
      body: 'I’m looking for a 4-8 month internship in Montreal, remote, or somewhere new. If you think I’d be a good fit for your team, I’d love to hear from you.',
      copy: 'Copy',
      copied: 'Copied',
    },
    footer: 'Made in Montreal.',
  },

  fr: {
    meta: {
      title: 'Antoine Oparin, développeur logiciel',
      description:
        'Développeur logiciel et étudiant en informatique à Montréal, disponible pour un stage de 4 à 8 mois.',
    },
    skip: 'Aller au contenu',
    nav: {
      story: 'Parcours',
      resume: 'CV',
      contact: 'Contact',
      menu: 'Menu',
      close: 'Fermer le menu',
      theme: 'Changer le thème',
      otherLang: 'EN',
      otherLangLabel: 'View in English',
    },
    hero: {
      hello: 'Salut, moi c’est Antoine.',
      sub: 'Étudiant en informatique à Concordia. Je viens de terminer un stage de développeur chez TS Imagine, et je suis prêt pour le prochain.',
      status: 'Disponible pour un stage de 4 à 8 mois, toute session.',
      resume: 'Voir mon CV',
      email: 'Écrivez-moi',
      portraitAlt: 'Antoine Oparin souriant sous un parapluie transparent',
    },
    story: {
      heading: 'Mon parcours',
      chapters: [
        {
          year: '2023',
          title: 'Le point de départ',
          body: 'J’ai commencé un DEC en informatique au Collège Dawson et j’ai passé trois ans à créer des applications web et mobiles. C’est là que le codage est passée de que être cours à quelque chose que j’avais envie de faire tous les jours.',
        },
        {
          year: '2025',
          title: 'Un jeu pour ma sœur',
          body: 'Ma sœur adore les jeux de mots, alors je lui en ai créé un. Ramifie est un mots-croisés quotidien que j’ai conçu et programmé seul. D’autres personnes ont commencé à y jouer, et aujourd’hui plus de 50 joueurs y reviennent régulièrement.',
          link: 'Jouer au casse-tête du jour',
          imageAlt: 'Une partie de Ramifie en cours, les mots encadrés en vert.',
        },
        {
          year: '2026',
          title: 'Mon premier stage',
          body: 'Cet été, j’ai rejoint l’équipe revenu fixe de TS Imagine comme stagiaire développeur. J’ai travaillé côté backend et frontend, aidé à migrer d’anciens services vers une architecture moderne, et créé un outil que l’équipe utilisait encore après la fin de mon stage.',
        },
        {
          year: 'Auj.',
          title: 'La suite',
          body: 'Je viens de commencer mon baccalauréat en informatique à l’Université Concordia. Je cherche maintenant un stage de 4 à 8 mois dans une équipe où je pourrai contribuer à de vrais projets et continuer à progresser.',
        },
      ],
    },
    traits: {
      heading: 'Ma façon de travailler',
      items: [
        { title: 'Je deploy, et je maintiens.', body: 'Ramifie est en ligne depuis juin 2025, avec un nouveau casse-tête chaque jour.' },
        { title: 'Je facilite le travail de ceux qui suivent.', body: 'Pendant la migration chez TS Imagine, j’ai rassemblé ce que j’avais appris dans un outil que l’équipe a continué d’utiliser après mon départ.' },
        { title: 'Je suis à l’aise sur toute la pile.', body: 'J’ai créé des interfaces React et des services Spring Boot, et j’aime comprendre comment toutes les pièces s’assemblent.' },
      ],
    },
    resume: {
      heading: 'CV',
      sub: 'Parcourez-le ici ou téléchargez-en une copie.',
      download: 'Télécharger le PDF',
      zoomIn: 'Agrandir',
      zoomOut: 'Réduire',
      loading: 'Chargement du CV…',
      error: 'L’aperçu n’a pas pu se charger. Vous pouvez quand même ouvrir le PDF.',
      open: 'Ouvrir le PDF',
      label: 'CV d’Antoine Oparin',
    },
    contact: {
      heading: 'Restons en contact.',
      body: 'Je cherche un stage de 4 à 8 mois à Montréal, à distance ou ailleurs. Si vous pensez que je pourrais bien m’intégrer à votre équipe, j’ai hâte de vous lire.',
      copy: 'Copier',
      copied: 'Copié',
    },
    footer: 'Fait à Montréal.',
  },
};

export function t(lang: Lang) {
  return content[lang];
}

export type Copy = ReturnType<typeof t>;
