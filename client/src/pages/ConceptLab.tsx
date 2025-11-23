import { motion } from "framer-motion";
import { Sparkles, Zap, TrendingUp, Clock, Star, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import birdLogo from "@assets/image_1763871339972.png";

export default function ConceptLab() {
  const conceptPages = [
    {
      title: "Hero Concepts",
      subtitle: "Bold Typography + Kinetic Text",
      path: "/concept-lab/all",
      gradient: "from-cyan-500 to-purple-600",
    },
    {
      title: "Dark Mode Showcase",
      subtitle: "High Contrast + Neon Accents",
      path: "/concept-lab/all",
      gradient: "from-purple-600 to-pink-600",
    },
    {
      title: "Glassmorphism",
      subtitle: "Frosted Glass Effects",
      path: "/concept-lab/all",
      gradient: "from-pink-500 to-orange-500",
    },
    {
      title: "Unconventional Layouts",
      subtitle: "Asymmetric Grids + Horizontal Scroll",
      path: "/concept-lab/all",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Handcrafted Design",
      subtitle: "Organic Shapes + Retro Vibes",
      path: "/concept-lab/all",
      gradient: "from-green-500 to-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Simple Header */}
      <header className="border-b border-purple-500/20 backdrop-blur-xl bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-2 text-purple-300 hover:text-purple-100 transition-colors">
              <img 
                src={birdLogo} 
                alt="Home" 
                className="w-12 h-12"
              />
              <span className="text-sm">Back to Site</span>
            </button>
          </Link>
          <div className="text-center">
            <div className="font-display text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              Design Concept Lab
            </div>
            <div className="text-xs text-purple-400 mt-1">Visual Exploration Canvas</div>
          </div>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-xl font-display font-black mb-6">
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 text-transparent bg-clip-text">
              Explore Modern
            </span>
            <br />
            <span className="text-white/90">Design Trends</span>
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Navigate through different aesthetic concepts for Urly Byrd. Each page showcases
            modern design trends without the functional complexity.
          </p>
        </motion.div>

        {/* Concept Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conceptPages.map((concept, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={concept.path}>
                <Card className="group h-64 bg-slate-900/50 backdrop-blur-xl border-slate-700/50 p-6 flex flex-col justify-between hover-elevate cursor-pointer transition-all">
                  <div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${concept.gradient} mb-4 group-hover:scale-110 transition-transform`} />
                    <h3 className="text-2xl font-display font-bold text-white mb-2">
                      {concept.title}
                    </h3>
                    <p className="text-purple-300 text-sm">
                      {concept.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center text-cyan-400 text-sm font-medium group-hover:gap-2 transition-all">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* All-in-One Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <Link href="/concept-lab/all">
            <Card className="group bg-gradient-to-br from-slate-900/70 to-purple-900/50 backdrop-blur-xl border-purple-500/30 p-8 hover-elevate cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-8 h-8 text-cyan-400" />
                    <h3 className="text-lg font-display font-bold text-white">
                      All Concepts Combined
                    </h3>
                  </div>
                  <p className="text-purple-200">
                    See all design trends integrated into a single cohesive experience
                  </p>
                </div>
                <ArrowRight className="w-8 h-8 text-purple-400 group-hover:translate-x-2 transition-transform" />
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* Design Principles */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900/30 backdrop-blur-xl border-slate-700/50 p-6">
            <h4 className="text-lg font-display font-bold text-white mb-3">
              What This Is
            </h4>
            <ul className="space-y-2 text-purple-200 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                <span>Visual design exploration without functional complexity</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                <span>Modern aesthetic trends applied to Urly Byrd branding</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-2" />
                <span>Static showcases with navigation between concepts</span>
              </li>
            </ul>
          </Card>

          <Card className="bg-slate-900/30 backdrop-blur-xl border-slate-700/50 p-6">
            <h4 className="text-lg font-display font-bold text-white mb-3">
              Design Trends Featured
            </h4>
            <ul className="space-y-2 text-purple-200 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                <span>Bold typography with kinetic animations</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                <span>Dark mode with high-contrast neon accents</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-2" />
                <span>Glassmorphism and dynamic gradients</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2" />
                <span>Unconventional layouts and scrolling patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2" />
                <span>Nostalgic handcrafted design elements</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 backdrop-blur-xl bg-slate-950/50 py-8 px-4 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-purple-300 text-sm">
            Concept Lab — Pure Visual Exploration
          </p>
          <p className="text-purple-400/60 text-xs mt-2">
            No forms • No auth • Just design aesthetics
          </p>
        </div>
      </footer>
    </div>
  );
}
