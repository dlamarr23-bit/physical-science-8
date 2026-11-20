// The name and top bar of the review pages (app/). Inside the physical science site they are hidden (its own top bar
// shows instead); a page opened on its own (the Class Pass sign-in window, the Mole Hunt Teacher Remote) has them.
// Change these, then run `node app-source/build.mjs` and push.
export const site = {
  // The browser tab and the footer.
  title: 'Physical Science 8',
  tagline: 'Review: flashcards and live class games',
  // The name in the top bar, and an optional second line under it ('' for none).
  brandLine: "Mr. LaMarr's Physical Science Classroom",
  brandSub: '',
  // A link with teacher: true shows only in a browser where the teacher has
  // signed in with the teacher password. Each href is from app/, so ../ is the
  // top of the site: these open the site's own pages, with its top bar.
  links: [
    { label: 'Review', href: '../flashcards', key: 'flashcards' },
    { label: 'Host a game', href: '../flashcards?go=host', key: 'live', teacher: true },
    { label: 'Join a game', href: '../join', key: 'join' },
    { label: 'Leaderboard', href: '../leaderboard', key: 'leaderboard' }
  ]
};

// The kit has no textbook units; the page templates expect this list.
export const units = [];
