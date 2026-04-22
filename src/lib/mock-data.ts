import afrobeats from "@/assets/event-afrobeats.jpg";
import concert from "@/assets/event-concert.jpg";
import brunch from "@/assets/event-brunch.jpg";
import football from "@/assets/event-football.jpg";
import expo from "@/assets/event-expo.jpg";
import djset from "@/assets/event-djset.jpg";

export type Category = "Soirée" | "Concert" | "Sport" | "Culture" | "Networking";
export type FlameStatus = "none" | "chaud" | "going";

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  online?: boolean;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;       // human readable
  time: string;
  dayLabel: string;   // e.g. "Ce soir", "Samedi"
  location: string;
  lat: number;
  lng: number;
  category: Category;
  cover: string;
  isFree: boolean;
  price?: string;     // e.g. "2000 FCFA"
  trending?: boolean;
  tonight?: boolean;
  flameCount: number;
  hotFriends: Friend[]; // friends "chaud" for this
  organizer: Friend;
};

const A = (seed: string, color = "F97316") =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${color}`;

export const FRIENDS: Friend[] = [
  { id: "f1", name: "Kofi", avatar: A("Kofi", "E8593C"), online: true },
  { id: "f2", name: "Afi", avatar: A("Afi", "F97316"), online: true },
  { id: "f3", name: "Yawo", avatar: A("Yawo", "8b5cf6") },
  { id: "f4", name: "Akua", avatar: A("Akua", "10b981"), online: true },
  { id: "f5", name: "Komi", avatar: A("Komi", "3b82f6") },
  { id: "f6", name: "Esi", avatar: A("Esi", "ec4899"), online: true },
  { id: "f7", name: "Mawuli", avatar: A("Mawuli", "14b8a6") },
  { id: "f8", name: "Sena", avatar: A("Sena", "f59e0b") },
];

export const ME: Friend = {
  id: "me",
  name: "Toi",
  avatar: A("Moi", "E8593C"),
  online: true,
};

export const EVENTS: EventItem[] = [
  {
    id: "e1",
    title: "Soirée Afrobeats au Palais de la Mer",
    description:
      "La plus grosse soirée Afrobeats de Lomé revient ! DJ résidents, scène extérieure face à l'océan, cocktails signature et une ambiance folle jusqu'au lever du soleil.",
    date: "Sam. 26 avril",
    time: "23h00",
    dayLabel: "Samedi",
    location: "Palais de la Mer, Lomé",
    lat: 6.1319,
    lng: 1.2228,
    category: "Soirée",
    cover: afrobeats,
    isFree: false,
    price: "2 000 FCFA",
    trending: true,
    flameCount: 287,
    hotFriends: [FRIENDS[0], FRIENDS[1], FRIENDS[3], FRIENDS[5]],
    organizer: FRIENDS[0],
  },
  {
    id: "e2",
    title: "Concert Keblack Live — Lomé",
    description:
      "Keblack débarque à Lomé pour une date unique au Palais des Congrès. Première partie assurée par les meilleurs artistes togolais.",
    date: "Ven. 25 avril",
    time: "20h00",
    dayLabel: "Vendredi",
    location: "Palais des Congrès, Lomé",
    lat: 6.1378,
    lng: 1.2123,
    category: "Concert",
    cover: concert,
    isFree: false,
    price: "5 000 FCFA",
    trending: true,
    flameCount: 340,
    hotFriends: [FRIENDS[1], FRIENDS[2], FRIENDS[4], FRIENDS[6], FRIENDS[7]],
    organizer: FRIENDS[2],
  },
  {
    id: "e3",
    title: "Brunch & Networking Tech Togo",
    description:
      "Rencontre la communauté tech togolaise autour d'un brunch décontracté. Pitchs, échanges et bonnes vibes.",
    date: "Dim. 27 avril",
    time: "10h00",
    dayLabel: "Dimanche",
    location: "Café Nuances, Lomé",
    lat: 6.1725,
    lng: 1.2314,
    category: "Networking",
    cover: brunch,
    isFree: true,
    flameCount: 64,
    hotFriends: [FRIENDS[3], FRIENDS[6]],
    organizer: FRIENDS[3],
  },
  {
    id: "e4",
    title: "Coupe du Togo — ASCK vs Maranatha",
    description:
      "Choc au sommet de la Coupe du Togo. Ambiance garantie au stade Omnisports de Kégué.",
    date: "Sam. 26 avril",
    time: "16h00",
    dayLabel: "Samedi",
    location: "Stade Omnisports de Kégué",
    lat: 6.1856,
    lng: 1.2156,
    category: "Sport",
    cover: football,
    isFree: false,
    price: "500 FCFA",
    flameCount: 152,
    hotFriends: [FRIENDS[2], FRIENDS[4], FRIENDS[7]],
    organizer: FRIENDS[4],
  },
  {
    id: "e5",
    title: "Expo Photo « Lomé en Couleurs »",
    description:
      "Une plongée visuelle dans le quotidien vibrant de Lomé à travers le regard de 12 photographes togolais.",
    date: "Toute la semaine",
    time: "10h–19h",
    dayLabel: "Cette semaine",
    location: "Galerie du Centre",
    lat: 6.1265,
    lng: 1.2255,
    category: "Culture",
    cover: expo,
    isFree: true,
    flameCount: 41,
    hotFriends: [FRIENDS[5]],
    organizer: FRIENDS[5],
  },
  {
    id: "e6",
    title: "After-work DJ Set au Byblos",
    description:
      "On termine la semaine en douceur avec un DJ set rooftop au Byblos. Coucher de soleil, cocktails offerts entre 19h et 20h.",
    date: "Jeu. 24 avril",
    time: "19h00",
    dayLabel: "Ce soir",
    location: "Bar Byblos, Lomé",
    lat: 6.1399,
    lng: 1.2283,
    category: "Soirée",
    cover: djset,
    isFree: true,
    tonight: true,
    flameCount: 98,
    hotFriends: [FRIENDS[0], FRIENDS[1], FRIENDS[5]],
    organizer: FRIENDS[1],
  },
];

export const CATEGORIES: { label: string; value: Category | "Tous" | "Gratuit" | "Ce soir" }[] = [
  { label: "Tous", value: "Tous" },
  { label: "Soirée", value: "Soirée" },
  { label: "Concert", value: "Concert" },
  { label: "Sport", value: "Sport" },
  { label: "Culture", value: "Culture" },
  { label: "Gratuit", value: "Gratuit" },
  { label: "Ce soir", value: "Ce soir" },
];

export const categoryColor = (c: Category): string => {
  switch (c) {
    case "Soirée": return "var(--cat-soiree)";
    case "Concert": return "var(--cat-concert)";
    case "Sport": return "var(--cat-sport)";
    case "Culture": return "var(--cat-culture)";
    case "Networking": return "var(--cat-networking)";
  }
};
