/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Smartphone, 
  Target, 
  Layers, 
  Instagram, 
  Search, 
  ArrowRight, 
  Download, 
  LayoutGrid,
  Menu,
  X,
  CreditCard,
  Rocket,
  Copy,
  Check,
  Languages,
  Globe,
  Cpu,
  MousePointer2,
  Lock,
  ChevronRight,
  TrendingUp,
  Brain
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { translations, Language } from './translations';
import { useFirebase } from './components/FirebaseProvider';
import { LogIn, LogOut, User as UserIcon, Bookmark, BookmarkCheck } from 'lucide-react';
import { db, OperationType, handleFirestoreError } from './lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';

// --- Types ---
interface Prompt {
  id: string;
  category: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  prompt: string;
}

// --- Data ---
const PROMPTS: Prompt[] = [
  // --- DINHEIRO E NEGÓCIOS ---
  {
    id: "101",
    category: "money",
    title: { pt: "A Máquina de Ofertas", en: "The Offer Machine", es: "La Máquina de Ofertas" },
    description: { pt: "Crie uma oferta irresistível focada no desejo irracional.", en: "Create an irresistible offer focused on irrational desire.", es: "Crea una oferta irresistible enfocada en el deseo irracional." },
    prompt: "Crie uma oferta irresistível para [PRODUTO] focada no desejo irracional do cliente de [DESEJO], ignorando especificações técnicas."
  },
  {
    id: "102",
    category: "money",
    title: { pt: "Quebra-Objeções", en: "Objection Breaker", es: "Rompe-Objeciones" },
    description: { pt: "Escreva contra-argumentos emocionais para as 5 maiores objeções.", en: "Write emotional counter-arguments for the 5 biggest objections.", es: "Escribe contraargumentos emocionais para las 5 maiores objeciones." },
    prompt: "Liste as 5 maiores objeções de quem não quer comprar [PRODUTO] e escreva um contra-argumento emocional para cada uma."
  },
  {
    id: "103",
    category: "money",
    title: { pt: "Anúncio de Tráfego Direto", en: "Direct Traffic Ad", es: "Anuncio de Tráfico Directo" },
    description: { pt: "Copies para Facebook Ads focadas em 'Dor Aguda'.", en: "Facebook Ads copies focused on 'Sharp Pain'.", es: "Copies para Facebook Ads enfocadas en 'Dolor Agudo'." },
    prompt: "Crie 3 copies para Facebook Ads focadas em 'Dor Aguda' para vender [SERVIÇO]. Formato: Hook, Agitação da Dor, Solução Rápida, CTA."
  },
  // --- INSTAGRAM MAGNÉTICO ---
  {
    id: "201",
    category: "instagram",
    title: { pt: "Carrossel Soco na Cara", en: "Punch in the Face Carousel", es: "Carrusel Golpe en la Cara" },
    description: { pt: "Copy para carrossel polêmico que destrói mitos.", en: "Copy for a controversial carousel that destroys myths.", es: "Copy para carrusel polémico que destruye mitos." },
    prompt: "Crie a copy para um carrossel de 5 slides que destrua o mito de [MITO DO NICHO]. Tom polarizante. Slide 1 deve ofender levemente."
  },
  {
    id: "202",
    category: "instagram",
    title: { pt: "Stories Loop Aberto", en: "Open Loop Stories", es: "Historias de Loop Abierto" },
    description: { pt: "Sequência de Stories para vender amanhã.", en: "Story sequence to sell tomorrow.", es: "Secuencia de historias para vender mañana." },
    prompt: "Escreva um roteiro de 5 sequências de Stories usando a técnica de 'Loop Aberto' para vender [PRODUTO] amanhã."
  },
  // --- TIKTOK / SHORTS VIRAIS ---
  {
    id: "301",
    category: "tiktok",
    title: { pt: "Hook Dopaminérgico", en: "Dopaminergic Hook", es: "Gancho Dopaminérgico" },
    description: { pt: "Ganchos virais que forçam a atenção.", en: "Viral hooks that force attention.", es: "Ganchos virales que fuerzan la atención." },
    prompt: "Crie 5 inícios de vídeo (primeiros 3 segundos) usando a fórmula: 'O segredo que [AUTORIDADE] não quer que você saiba sobre [TÓPICO]'."
  },
  {
    id: "302",
    category: "tiktok",
    title: { pt: "Roteiro Estética Clean", en: "Clean Aesthetic Script", es: "Guion de Estética Limpia" },
    description: { pt: "Roteiro de 10s para vídeos cinematográficos.", en: "10s script for cinematic videos.", es: "Guion de 10s para videos cinematográficos." },
    prompt: "Escreva um roteiro de 10 segundos para ser narrado com voz de IA em cima de um vídeo estético de luxo sobre [TÓPICO]."
  },
  // --- PRODUTIVIDADE GOD MODE ---
  {
    id: "401",
    category: "productivity",
    title: { pt: "Delegação Imediata", en: "Immediate Delegation", es: "Delegación Inmediata" },
    description: { pt: "Instruções exatas para assistentes virtuais.", en: "Exact instructions for virtual assistants.", es: "Instrucciones exactas para asistentes virtuales." },
    prompt: "Aqui está a tarefa [TAREFA]. Escreva as instruções exatas de como um assistente virtual deve executá-la passo-a-passo."
  },
  {
    id: "402",
    category: "productivity",
    title: { pt: "Escrita de Meta-Velocidade", en: "Meta-Speed Writing", es: "Escritura de Meta-Velocidad" },
    description: { pt: "Escreva 500 palavras em segundos no estilo Pro.", en: "Write 500 words in seconds in Pro style.", es: "Escribe 500 palabras en segundos al estilo Pro." },
    prompt: "Escreva um rascunho de 500 palavras sobre [TÓPICO] no estilo de escrita do [AUTOR FAMOSO]. Não use introduções, vá direto ao ponto."
  },
  // --- MARKETING E COPYWRITING ---
  {
    id: "501",
    category: "marketing",
    title: { pt: "Copy P.A.S.T.O.R.", en: "P.A.S.T.O.R. Copy", es: "Copy P.A.S.T.O.R." },
    description: { pt: "Venda qualquer coisa com esta estrutura bíblica.", en: "Sell anything with this biblical structure.", es: "Vende cualquier cosa con esta estructura bíblica." },
    prompt: "Use a fórmula Problema, Amplificação, Solução, Transformação, Oferta e Resposta para vender [PRODUTO]."
  },
  {
    id: "502",
    category: "marketing",
    title: { pt: "O Título de 1 Milhão", en: "The 1 Million Headline", es: "El Titular de 1 Millón" },
    description: { pt: "Variações de títulos usando técnicas de Gary Halbert.", en: "Headline variations using Gary Halbert techniques.", es: "Variaciones de titulares usando técnicas de Gary Halbert." },
    prompt: "Crie 10 variações do título para minha Landing Page usando as técnicas diretas de Gary Halbert."
  },
  // --- IA SYSTEMS ---
  {
    id: "601",
    category: "ai",
    title: { pt: "Prompt Engenheiro Pro", en: "Pro Prompt Engineer", es: "Prompter Ingeniero Pro" },
    description: { pt: "Elimine alucinações da IA agora.", en: "Eliminate AI hallucinations now.", es: "Elimina las alucinaciones de la IA ahora." },
    prompt: "Melhore o prompt a seguir para que ele não gere alucinações e exija o passo a passo da IA: [SEU PROMPT]."
  },
  {
    id: "602",
    category: "ai",
    title: { pt: "Robô de Pesquisa Sênior", en: "Senior Research Robot", es: "Robot de Investigación Sénior" },
    description: { pt: "Resumos de tendências baseados em fontes primárias.", en: "Trend summaries based on primary sources.", es: "Resúmenes de tendencias basados en fuentes primarias." },
    prompt: "Aja como um pesquisador sênior. Resuma as 5 principais tendências de [MERCADO] para 2026 usando apenas fontes primárias."
  }
];

const CATEGORIES = [
  "all", "productivity", "money", "studies", "instagram", "tiktok", "creator", "ai", "marketing", "copywriting"
];

// --- Components ---

const CyberBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {/* Moving Beam Horizontal */}
    <motion.div
      animate={{
        x: ["-100%", "200%"],
        opacity: [0, 0.3, 0]
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "linear",
      }}
      className="absolute top-0 bottom-0 w-[2px] bg-neon-blue shadow-[0_0_20px_#00F0FF] blur-[1px]"
    />
    {/* Moving Beam Vertical */}
    <motion.div
      animate={{
        y: ["-100%", "200%"],
        opacity: [0, 0.2, 0]
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear",
        delay: 5
      }}
      className="absolute left-0 right-0 h-[1px] bg-neon-blue/50 shadow-[0_0_15px_#00F0FF] blur-[1px]"
    />
    
    {/* Neon Particles */}
    {Array.from({ length: 15 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ 
          x: Math.random() * 100 + "%", 
          y: Math.random() * 100 + "%",
          opacity: 0 
        }}
        animate={{ 
          y: ["0%", "100%", "0%"],
          opacity: [0, 0.4, 0]
        }}
        transition={{ 
          duration: 10 + Math.random() * 20, 
          repeat: Infinity, 
          delay: Math.random() * 10 
        }}
        className="absolute w-1 h-1 bg-neon-blue rounded-full shadow-[0_0_8px_#00F0FF]"
      />
    ))}

    {/* Scanning Grid Overlay */}
    <div className="absolute inset-0 bg-grid-large opacity-[0.03] cyber-mask" />
    <motion.div 
      animate={{ y: ["-100%", "100%"] }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-blue/5 to-transparent h-[20%] w-full"
    />
  </div>
);

const LanguageSwitcher = ({ current, onChange }: { current: Language, onChange: (l: Language) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const flags = { pt: "🇧🇷", en: "🇺🇸", es: "🇪🇸" };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-wider"
      >
        <span>{flags[current]}</span>
        <span className="hidden sm:inline">{current}</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full right-0 mt-2 p-1 bg-black border border-white/10 rounded-xl overflow-hidden z-[100] min-w-[120px] glass-card"
          >
            {(Object.keys(flags) as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => { onChange(lang); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-white/5 transition-all text-sm ${current === lang ? 'text-neon-blue' : 'text-white/60'}`}
              >
                <span>{flags[lang]}</span>
                <span className="uppercase">{lang}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LoadingScreen = ({ onComplete, lang }: { onComplete: () => void; lang: Language }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[999] flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="scanline" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        className="relative"
      >
        <div className="w-24 h-24 border-t-2 border-r-2 border-neon-blue rounded-full animate-spin glow-blue" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="w-8 h-8 text-neon-blue animate-pulse" />
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 text-center"
      >
        <h2 className="text-xl font-display font-black italic uppercase italic tracking-[0.4em] glow-text">EASY MODE<span className="text-neon-blue">™</span></h2>
        <p className="text-[10px] text-white/30 uppercase tracking-[0.5em] mt-2 font-mono">{(translations[lang] as any).common.loading}</p>
      </motion.div>
      
      <div className="absolute bottom-12 w-full max-w-xs h-[1px] bg-white/10 overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-1/2 h-full bg-neon-blue shadow-[0_0_10px_#00F0FF]"
        />
      </div>
    </div>
  );
};

interface PromptCardProps {
  prompt: Prompt;
  lang: Language;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, lang }) => {
  const { user } = useFirebase();
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const t = translations[lang].hub;

  useEffect(() => {
    if (!user) return;

    const savedPromptsRef = collection(db, 'users', user.uid, 'saved_prompts');
    const q = query(savedPromptsRef, where('promptId', '==', prompt.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsSaved(!snapshot.empty);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/saved_prompts`);
    });

    return () => unsubscribe();
  }, [user, prompt.id]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const savedPromptId = prompt.id;
    const docRef = doc(db, 'users', user.uid, 'saved_prompts', savedPromptId);

    try {
      if (isSaved) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          userId: user.uid,
          promptId: prompt.id,
          title: prompt.title[lang],
          savedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/saved_prompts/${savedPromptId}`);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        y: -6, 
        scale: 1.01,
        boxShadow: "0 12px 25px -12px rgba(0, 240, 255, 0.25)"
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="glass-card-premium p-6 border-white/5 hover:border-neon-blue/30 transition-colors group flex flex-col h-full hologram-effect cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-neon-blue/5 blur-[40px] pointer-events-none group-hover:bg-neon-blue/20 transition-all" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="p-2.5 bg-white/5 rounded-xl text-neon-blue border border-white/5 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
          <Cpu className="w-5 h-5 shadow-neon-blue" />
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <button 
              onClick={toggleSave}
              className={`transition-colors p-1.5 rounded-lg hover:bg-white/5 ${isSaved ? 'text-neon-blue' : 'text-white/20 hover:text-white'}`}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          )}
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 bg-white/5 px-2 py-1 rounded border border-white/5">{prompt.category}</span>
        </div>
      </div>
      
      <div className="flex-1 relative z-10">
        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-3 group-hover:text-neon-blue transition-colors">
          {prompt.title[lang]}
        </h3>
        <p className="text-sm text-white/40 mb-8 leading-relaxed font-medium">
          {prompt.description[lang]}
        </p>
      </div>
      
      <button 
        onClick={handleCopy}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10 ${
          copied ? 'bg-neon-blue text-black shadow-[0_0_20px_#00FFFF]' : 'bg-white/5 hover:bg-neon-blue/10 text-white border border-white/5 hover:border-neon-blue/30'
        }`}
      >
        <div className="relative">
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <Check className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {isButtonHovered ? <Zap className="w-4 h-4 text-neon-blue fill-neon-blue" /> : <Lock className="w-4 h-4 text-white/40" />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span>{copied ? t.copied : t.copy}</span>
      </button>

      {/* Aesthetic Scanline for card */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

const RotatingHeadline = ({ headlines }: { headlines: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % headlines.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [headlines]);

  return (
    <div className="h-[1.5em] sm:h-[1.2em] relative overflow-hidden flex justify-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={`${headlines[index]}-${index}`}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute text-center w-full px-4"
        >
          {headlines[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const { user, loading, login, logout } = useFirebase();
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<Language>('pt');
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  
  const t = translations[lang];

  const filteredPrompts = useMemo(() => {
    return PROMPTS.filter(p => {
      const matchesSearch = p.title[lang].toLowerCase().includes(search.toLowerCase()) || 
                           p.description[lang].toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "all" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory, lang]);

  return (
    <div className="min-h-screen bg-black text-white relative selection:bg-neon-blue selection:text-black font-sans">
      <AnimatePresence>
        {isLoading && <LoadingScreen lang={lang} onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      {/* Grid Background */}
      <div className="fixed inset-0 bg-grid opacity-5 pointer-events-none z-0 cyber-mask" />
      <CyberBackground />
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 sm:px-12 py-6 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-neon-blue rounded-full shadow-[0_0_10px_#00F0FF] animate-pulse"></div>
          <span className="text-xl font-black italic tracking-tighter uppercase">EASY MODE<span className="text-neon-blue font-normal uppercase text-[9px] align-top ml-0.5 tracking-normal">™</span></span>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="hidden lg:flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] font-medium text-white/30">
            <a href="#hub" className="hover:text-neon-blue transition-colors font-bold">{t.nav.assets}</a>
            <a href="#premium" className="hover:text-neon-blue transition-colors font-bold">{t.nav.premium}</a>
          </div>
          
          <LanguageSwitcher current={lang} onChange={setLang} />

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-neon-blue tracking-widest">{user.displayName}</span>
                <button onClick={logout} className="text-[8px] uppercase text-white/40 hover:text-white transition-colors tracking-[0.2em]">{t.nav.logout}</button>
              </div>
              <div className="w-8 h-8 rounded-full border border-neon-blue/40 overflow-hidden bg-white/5 flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-white/40" />
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              <LogIn className="w-3 h-3" />
              <span>{t.nav.login}</span>
            </button>
          )}

          <motion.a 
            href="https://kiwify.app/8FU8vze"
            target="_blank"
            rel="noopener noreferrer"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex px-4 sm:px-6 py-2 sm:py-2.5 border border-neon-blue bg-neon-blue/20 text-neon-blue rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-neon-blue hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] whitespace-nowrap"
          >
            {t.nav.cta}
          </motion.a>
        </div>
      </nav>

      {/* Custom HUD Elements (Desktop) */}
      <div className="hidden xl:block fixed left-12 top-1/2 -translate-y-1/2 z-20 space-y-12">
        <div className="flex flex-col gap-2 font-mono text-[9px] text-white/20 uppercase tracking-[0.3em] rotate-[-90deg]">
          <span>{(t as any).common.hud}</span>
          <div className="h-[1px] w-24 bg-white/10" />
        </div>
      </div>

      <main className="relative z-10 pt-24">
        {/* Corner Decorators */}
        <div className="fixed top-32 left-8 w-12 h-12 border-t border-l border-white/10 pointer-events-none" />
        <div className="fixed top-32 right-8 w-12 h-12 border-t border-r border-white/10 pointer-events-none" />
        <div className="fixed bottom-32 left-8 w-12 h-12 border-b border-l border-white/10 pointer-events-none" />
        <div className="fixed bottom-32 right-8 w-12 h-12 border-b border-r border-white/10 pointer-events-none" />

        {/* Hero Section */}
        <section id="hero" className="min-h-[85vh] flex flex-col items-center justify-center px-6 overflow-hidden relative">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-neon-blue/10 rounded-full blur-[150px] pointer-events-none" />
          
          <div className="container max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-neon-blue/10 border border-neon-blue/30 rounded text-neon-blue text-[9px] sm:text-[10px] uppercase font-bold tracking-widest mb-10"
            >
              <span className="flex h-2 w-2 rounded-full bg-neon-blue animate-pulse"></span> {t.hero.badge}
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-7xl lg:text-9xl font-black italic tracking-tighter leading-[0.95] sm:leading-[0.85] uppercase mb-10 max-w-5xl"
            >
              <RotatingHeadline headlines={t.hero.headlines} />
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/40 text-lg sm:text-2xl max-w-2xl font-light leading-relaxed mb-12"
            >
              {t.hero.subheadline}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col items-center gap-8 w-full max-w-md sm:max-w-none px-4"
            >
              <div className="flex flex-col items-center gap-3">
                <a 
                  href="https://kiwify.app/8FU8vze"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="skew-btn px-16 py-6 bg-neon-blue text-black font-black uppercase text-sm sm:text-base hover:scale-105 transition-all text-center group glow-pulse shadow-[0_0_30px_rgba(0,255,255,0.4)]"
                >
                  <span className="block italic flex items-center justify-center gap-3">
                    {t.hero.cta} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>
                <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black">{t.hero.subtext}</span>
              </div>

              <a 
                href="#hub"
                className="px-10 py-5 bg-white/5 border border-white/10 rounded-none text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                {t.hero.secondary}
              </a>
            </motion.div>
          </div>

          {/* Floating UI Elements */}
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 2, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute bottom-10 right-10 hidden lg:block"
          >
            <div className="glass-card p-6 border-neon-blue/20 max-w-[280px]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-neon-blue/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-neon-blue w-6 h-6" />
                </div>
                <div>
                  <div className="text-[9px] uppercase font-bold text-white/30 tracking-widest">{(t as any).common.activeData}</div>
                  <div className="text-sm font-black italic">{(t as any).common.optimizing}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div animate={{ width: ["10%", "85%", "40%", "95%"] }} transition={{ repeat: Infinity, duration: 4 }} className="h-full bg-neon-blue" />
                </div>
                <div className="h-1.5 w-[70%] bg-white/5 rounded-full overflow-hidden">
                  <motion.div animate={{ width: ["60%", "30%", "90%", "50%"] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5 }} className="h-full bg-neon-blue/50" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Pain Points Section */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter mb-4">{t.pain.title}</h2>
              <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] sm:text-xs">{t.pain.subtitle}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.pain.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card-premium p-8 border-white/5 hover:border-red-500/20 transition-all group"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-6 text-white/20 group-hover:text-red-500 group-hover:bg-red-500/10 transition-all">
                    <X className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2 tracking-tight group-hover:text-red-500 transition-colors">{item.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="mt-20 flex flex-col items-center"
            >
              <div className="h-24 w-[1px] bg-gradient-to-b from-white/0 via-red-500/50 to-neon-blue shadow-[0_0_15px_#00FFFF]" />
              <div className="mt-8 px-6 py-2 bg-neon-blue text-black font-black uppercase text-[10px] tracking-[0.3em] glow-blue">
                {t.pain.transition}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Prompt Library Hub */}
        <section id="hub" className="py-32 px-6 bg-white/[0.01] relative overflow-hidden">
          <div className="container max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
              <div>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-neon-blue/10 border border-neon-blue/30 rounded text-neon-blue text-[10px] uppercase font-bold tracking-widest mb-4"
                >
                  <span className="flex h-2 w-2 rounded-full bg-neon-blue"></span> {t.hub.subtitle}
                </motion.div>
                <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
                  {t.hub.title.split(' ').map((word, i) => (
                    <span key={i} className={i === 1 ? "text-stroke border-b-2 border-neon-blue block md:inline" : ""}>
                      {word}{' '}
                    </span>
                  ))}
                </h2>
              </div>
              
              <div className="w-full md:max-w-md">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-neon-blue transition-colors">
                    <Search className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder={t.hub.search}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-none pl-12 pr-6 text-sm focus:outline-none focus:border-neon-blue focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-3 mb-12">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 text-[10px] uppercase font-black tracking-widest border transition-all ${
                    activeCategory === cat 
                    ? 'bg-neon-blue border-neon-blue text-black' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                  }`}
                >
                  {cat === "all" ? t.hub.all : (t.hub as any)[cat]}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} lang={lang} />
              ))}
              {filteredPrompts.length === 0 && (
                <div className="col-span-full py-24 text-center">
                  <Brain className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/30 uppercase tracking-[0.2em] text-sm">No systems found matching parameters...</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Digital Advantage Section */}
        <section className="py-32 px-6 relative overflow-hidden bg-white/[0.01]">
          <div className="container max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="text-neon-blue text-[10px] uppercase font-black tracking-[0.5em] mb-6">{(t as any).advantage.badge}</div>
                <h2 className="text-4xl sm:text-7xl font-black italic uppercase tracking-tighter leading-none mb-8">
                  {(t as any).advantage.title.split(' ').map((word: string, i: number) => (
                    <span key={i} className={word.toLowerCase() === 'internet' ? "text-stroke" : ""}>
                      {word}{' '}
                    </span>
                  ))}
                </h2>
                <p className="text-lg text-white/50 leading-relaxed max-w-xl mb-10">
                  {(t as any).advantage.subtitle}
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-3xl font-black text-neon-blue mb-1">{(t as any).advantage.stat1}</div>
                    <div className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{(t as any).advantage.stat1Desc}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-neon-blue mb-1">{(t as any).advantage.stat2}</div>
                    <div className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{(t as any).advantage.stat2Desc}</div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="flex-1 w-full lg:w-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="glass-card-premium p-4 sm:p-8 relative group"
              >
                <div className="absolute inset-0 bg-neon-blue/5 blur-[100px] pointer-events-none" />
                <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                  <div className="w-12 h-12 bg-neon-blue/20 rounded-xl flex items-center justify-center text-neon-blue animate-pulse">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-black text-white/30">{(t as any).advantage.status}</div>
                    <div className="text-xs font-black italic">{(t as any).advantage.optimization}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-neon-blue/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-neon-blue" />
                        </div>
                        <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                           <motion.div animate={{ scaleX: [0, 1] }} transition={{ duration: 1, delay: i * 0.2 }} className="h-full bg-neon-blue origin-left" />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-neon-blue">{(t as any).advantage.active}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Premium Products */}
        <section id="premium" className="py-32 px-6 relative overflow-hidden bg-black">
          <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
          <div className="container max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-neon-blue/10 border border-neon-blue/30 rounded text-neon-blue text-[10px] uppercase font-bold tracking-widest mb-4"
              >
                {t.products.subtitle}
              </motion.div>
              <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter">{t.products.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Product 1: EASY FIX */}
              <motion.div 
                whileHover={{ 
                  y: -8,
                  scale: 1.01,
                  boxShadow: "0 20px 40px -15px rgba(0, 240, 255, 0.08)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="glass-card p-12 border-white/10 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                  <Zap className="w-32 h-32 text-white rotate-12" />
                </div>
                <div className="mb-10">
                  <h3 className="text-3xl font-black italic uppercase mb-2">EASY FIX™</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-black text-neon-blue">{t.products.pricePrefix}{lang === 'pt' ? '10' : '9' }</span>
                    <span className="text-[10px] text-white/30 uppercase font-black uppercase italic">{(t as any).common.activation}</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-12 text-white/50 text-xs font-bold uppercase tracking-widest">
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-neon-blue rounded-full"></div>
                    {t.products.perks.fixes}
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-neon-blue rounded-full"></div>
                    {t.products.perks.support}
                  </li>
                </ul>
                <a 
                  href="https://kiwify.app/8FU8vze"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase text-xs tracking-[0.3em] text-center transition-all"
                >
                   {t.products.cta}
                </a>
              </motion.div>

              {/* Product 2: EASY MODE PRO */}
              <motion.div 
                whileHover={{ 
                  y: -10,
                  scale: 1.02,
                  boxShadow: "0 25px 50px -12px rgba(0, 240, 255, 0.25)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="glass-card p-12 border-neon-blue/30 relative overflow-hidden group bg-neon-blue/[0.02]"
              >
                <div className="absolute -top-4 -right-4 px-6 py-2 bg-neon-blue text-black font-black uppercase text-[9px] tracking-widest skew-x-[-12deg] z-20">
                  <span className="block skew-x-[12deg]">{(t as any).common.viral}</span>
                </div>
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-50 transition-opacity">
                  <Rocket className="w-32 h-32 text-neon-blue rotate-12" />
                </div>
                <div className="mb-10">
                  <h3 className="text-3xl font-black italic uppercase mb-2">EASY MODE™</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-display font-black text-neon-blue glow-text">{t.products.pricePrefix}{lang === 'pt' ? '50' : '19' }</span>
                    <span className="text-[10px] text-white/30 uppercase font-black uppercase italic">{(t as any).common.mastery}</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-12 text-white/60 text-xs font-bold uppercase tracking-widest">
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-neon-blue rounded-full glow-blue"></div>
                    {t.products.perks.full}
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-neon-blue rounded-full glow-blue"></div>
                    {t.products.perks.assets}
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-neon-blue rounded-full glow-blue"></div>
                    {t.products.perks.support}
                  </li>
                </ul>
                <a 
                  href="https://kiwify.app/8FU8vze"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full skew-btn block py-5 bg-neon-blue text-black font-black uppercase text-xs tracking-[0.3em] text-center transition-all shadow-[0_0_30px_rgba(0,240,255,0.2)]"
                >
                   <span className="block">{t.products.cta} {(t as any).common.pix}</span>
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-24 border-t border-white/5 bg-black relative z-10 px-6">
          <div className="container max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex flex-col items-center md:items-start gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-neon-blue shadow-[0_0_8px_#00F0FF] rounded-full"></div>
                 <span className="text-xs font-black italic uppercase italic tracking-widest">EASY MODE<span className="text-neon-blue">™</span></span>
               </div>
               <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-mono text-center md:text-left">
                 {t.footer.rights}
               </p>
            </div>
            
            <div className="flex items-center gap-8 opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
               <div className="px-4 py-2 bg-white/5 border border-white/10 font-black italic uppercase text-[9px] tracking-widest uppercase">{(t as any).common.verified}</div>
               <div className="px-4 py-2 bg-white/5 border border-white/10 font-black italic uppercase text-[9px] tracking-widest uppercase">{(t as any).common.secured}</div>
               <div className="px-4 py-2 bg-white/5 border border-white/10 font-black italic uppercase text-[9px] tracking-widest uppercase">{(t as any).common.optimized}</div>
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <span className="text-[8px] text-white/10 uppercase tracking-[1em] block mb-2">{t.footer.sync}</span>
            <div className="flex justify-center gap-1">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.1, 0.4, 0.1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.05 }}
                  className="w-0.5 h-1 bg-neon-blue/40"
                />
              ))}
            </div>
          </div>
        </footer>
      </main>

      {/* Fixed Sticky CTA (Mobile) */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[40]">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="relative"
        >
          <div className="absolute -inset-0.5 bg-neon-blue blur opacity-30 animate-pulse rounded-2xl" />
          <a 
            href="https://kiwify.app/8FU8vze"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full relative flex items-center justify-center gap-3 py-5 bg-black border-2 border-neon-blue text-neon-blue font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.2)] active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4 fill-neon-blue" />
            <span>{t.nav.cta}</span>
          </a>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-neon-blue text-black text-[8px] font-black uppercase tracking-widest rounded-full">
            {(t as any).common.limited}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

