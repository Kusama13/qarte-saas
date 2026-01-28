"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  ChevronRight,
  Mail,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Search
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Article {
  id: number;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  readTime: string;
  featured?: boolean;
}

const CATEGORIES = ["Tous", "Fidélisation", "Marketing", "Conseils", "Actualités"];

const ARTICLES: Article[] = [
  {
    id: 1,
    featured: true,
    category: "Fidélisation",
    title: "Comment transformer un client de passage en habitué fidèle ?",
    excerpt: "Découvrez les secrets psychologiques derrière la rétention client et comment les outils numériques peuvent automatiser votre croissance sans perdre le contact humain.",
    image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=1200&auto=format&fit=crop",
    date: "12 Mai 2024",
    readTime: "8 min"
  },
  {
    id: 2,
    category: "Marketing",
    title: "5 astuces pour booster votre visibilité locale sur Instagram",
    excerpt: "Le marketing de proximité passe par l'image. Apprenez à créer du contenu qui engage votre quartier.",
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop",
    date: "8 Mai 2024",
    readTime: "5 min"
  },
  {
    id: 3,
    category: "Conseils",
    title: "Pourquoi le parrainage est l'arme secrète du commerçant",
    excerpt: "Vos clients actuels sont vos meilleurs vendeurs. Voici comment mettre en place un système de parrainage efficace.",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=600&auto=format&fit=crop",
    date: "5 Mai 2024",
    readTime: "6 min"
  },
  {
    id: 4,
    category: "Actualités",
    title: "L'impact de l'IA sur le commerce de proximité en 2024",
    excerpt: "Décryptage des nouvelles technologies qui simplifient la gestion des stocks et la relation client.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop",
    date: "2 Mai 2024",
    readTime: "10 min"
  },
  {
    id: 5,
    category: "Conseils",
    title: "Gérer les avis négatifs : Transformez un problème en opportunité",
    excerpt: "Un client mécontent peut devenir votre plus grand fan si vous savez répondre avec empathie et professionnalisme.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
    date: "28 Avril 2024",
    readTime: "7 min"
  },
  {
    id: 6,
    category: "Fidélisation",
    title: "Le guide ultime des programmes de fidélité par points",
    excerpt: "Gamification, paliers, récompenses : tout ce qu'il faut savoir pour structurer votre offre de fidélité.",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=600&auto=format&fit=crop",
    date: "24 Avril 2024",
    readTime: "9 min"
  },
  {
    id: 7,
    category: "Marketing",
    title: "Saisonnalité : Préparer vos ventes d'été dès maintenant",
    excerpt: "N'attendez pas Juillet pour lancer vos campagnes. La planification est la clé d'un été réussi.",
    image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=600&auto=format&fit=crop",
    date: "20 Avril 2024",
    readTime: "4 min"
  }
];

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn(
    "px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase",
    "bg-emerald-100 text-emerald-800 border border-emerald-200",
    className
  )}>
    {children}
  </span>
);

const SectionHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
      <TrendingUp className="w-6 h-6 text-emerald-600" />
      {title}
    </h2>
    {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [email, setEmail] = useState("");

  const filteredArticles = ARTICLES.filter(art => !art.featured && (activeCategory === "Tous" || art.category === activeCategory));
  const featuredArticle = ARTICLES.find(art => art.featured);

  return (
    <div className="min-h-screen bg-[#FBFDFA] text-slate-900 font-sans selection:bg-emerald-200">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-50 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] rounded-full bg-amber-50 blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Hero Section */}
        <section className="mb-20 text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm mb-4">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-600">Le Mag de la Croissance Locale</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            Blog <span className="text-emerald-600">Qarte</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Devenez le commerçant préféré de votre quartier. Conseils d&apos;experts, stratégies de fidélisation et astuces marketing concrètes.
          </p>
        </section>

        {/* Featured Article */}
        {featuredArticle && (
          <section className="mb-16 animate-slide-up">
            <div className="group relative overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row min-h-[400px] transition-all duration-300 hover:shadow-2xl">
              <div className="w-full md:w-1/2 relative h-64 md:h-auto overflow-hidden">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-6 left-6">
                  <Badge className="bg-emerald-600 text-white border-transparent">À la une</Badge>
                </div>
              </div>
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {featuredArticle.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {featuredArticle.readTime}</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4 leading-tight group-hover:text-emerald-700 transition-colors">
                  {featuredArticle.title}
                </h2>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                  {featuredArticle.excerpt}
                </p>
                <button className="flex items-center gap-2 font-bold text-emerald-600 group/btn">
                  Lire l&apos;article complet
                  <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Categories & Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                  activeCategory === cat
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Article Grid */}
        <section className="mb-20">
          <SectionHeading title="Derniers Articles" subtitle="Toutes les clés pour booster votre activité" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article, idx) => (
              <article
                key={article.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 flex flex-col h-full"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/95 backdrop-blur shadow-sm">{article.category}</Badge>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                    {article.excerpt}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-50">
                    <button className="text-sm font-bold text-slate-900 flex items-center gap-1 group/link">
                      Lire la suite
                      <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-emerald-900 text-white p-8 md:p-16">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,#fff_1px,transparent_0)] bg-[size:32px_32px]" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="w-12 h-12 bg-emerald-800 rounded-2xl flex items-center justify-center border border-emerald-700">
                <Mail className="w-6 h-6 text-emerald-300" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Rejoignez 1 200+ commerçants visionnaires</h2>
              <p className="text-emerald-100/80 text-lg max-w-lg leading-relaxed">
                Recevez chaque mardi une dose d&apos;inspiration et des conseils concrets pour automatiser votre fidélisation et augmenter votre panier moyen.
              </p>
              <ul className="space-y-3">
                {["Zéro spam, promis", "Désinscription en 1 clic", "Contenu exclusif"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full lg:w-1/2">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-3xl border border-white/20">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre adresse email professionnelle"
                    className="flex-grow px-6 py-4 bg-white rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400"
                  />
                  <button className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group whitespace-nowrap">
                    S&apos;abonner gratuitement
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
              <p className="mt-4 text-xs text-emerald-200/60 text-center lg:text-left">
                En vous inscrivant, vous acceptez notre politique de confidentialité.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 py-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <BookOpen className="w-5 h-5" />
            <span className="font-bold tracking-tight text-slate-900">QARTE MAG</span>
          </div>
          <p className="text-slate-400 text-sm">© 2024 Qarte. Tous droits réservés.</p>
          <div className="flex gap-6">
            <a href="/mentions-legales" className="text-slate-400 hover:text-emerald-600 transition-colors text-sm font-medium">Mentions légales</a>
            <a href="/contact" className="text-slate-400 hover:text-emerald-600 transition-colors text-sm font-medium">Contact</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
