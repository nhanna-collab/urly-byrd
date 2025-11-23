import { motion } from "framer-motion";
import { Sparkles, Zap, TrendingUp, Clock, Star, Home, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AllConcepts() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <header className="border-b border-purple-500/20 backdrop-blur-xl bg-slate-950/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/concept-lab">
            <button className="flex items-center gap-2 text-purple-300 hover:text-purple-100 transition-colors" data-testid="button-back-lab">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back to Lab</span>
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              urly byrd
            </span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      {/* Hero Section - Bold Typography + Kinetic Text */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 blur-3xl"
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-display font-black leading-none mb-6"
          >
            <span className="block bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 text-transparent bg-clip-text">
              Flash
            </span>
            <motion.span
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              className="block bg-gradient-to-r from-pink-400 via-cyan-400 to-purple-400 bg-[length:200%_auto] text-transparent bg-clip-text"
            >
              Marketing
            </motion.span>
            <span className="block text-white/90">Reimagined</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 max-w-2xl"
          >
            <p className="text-xl text-purple-100 leading-relaxed mb-6">
              Create urgency. Drive immediate sales. Clear excess inventory.
              Join merchants seeing up to{" "}
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-cyan-400 font-bold"
              >
                195% conversion
              </motion.span>{" "}
              rate increases.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-purple-500/50"
                data-testid="button-hero-cta"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="backdrop-blur-xl bg-white/5 border-white/20 text-white hover:bg-white/10"
                data-testid="button-hero-learn"
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Unconventional Layout - Asymmetric Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl font-display font-bold text-white mb-12"
          >
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text">
              Why Merchants
            </span>{" "}
            <span className="text-white/80">Love Flash Sales</span>
          </motion.h2>

          <div className="grid grid-cols-12 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="col-span-12 md:col-span-8"
            >
              <Card className="h-full bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl border-purple-500/30 p-8">
                <TrendingUp className="w-12 h-12 text-cyan-400 mb-4" />
                <h3 className="text-lg font-display font-bold text-white mb-3">
                  Instant Revenue Boost
                </h3>
                <p className="text-purple-100 text-lg">
                  Generate immediate cash flow by moving excess inventory fast.
                  Our merchants see average order values increase by 47% during
                  flash campaigns.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="col-span-12 md:col-span-4"
            >
              <Card className="h-full bg-gradient-to-br from-cyan-900/40 to-purple-900/40 backdrop-blur-xl border-cyan-500/30 p-8">
                <Clock className="w-10 h-10 text-pink-400 mb-4" />
                <h3 className="text-2xl font-display font-bold text-white mb-3">
                  Create Urgency
                </h3>
                <p className="text-purple-100">
                  Time-limited offers drive action. Fast.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="col-span-12 md:col-span-5"
            >
              <Card className="h-full bg-gradient-to-br from-cyan-900/40 to-slate-900/40 backdrop-blur-xl border-cyan-500/30 p-8">
                <Star className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-2xl font-display font-bold text-white mb-3">
                  Local Focus
                </h3>
                <p className="text-purple-100">
                  Reach customers within 10 miles. Build your local community
                  and drive foot traffic to your store.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="col-span-12 md:col-span-7"
            >
              <Card className="h-full bg-gradient-to-br from-pink-900/40 to-purple-900/40 backdrop-blur-xl border-pink-500/30 p-8">
                <Zap className="w-12 h-12 text-cyan-400 mb-4" />
                <h3 className="text-lg font-display font-bold text-white mb-3">
                  No Learning Curve
                </h3>
                <p className="text-purple-100 text-lg mb-4">
                  Launch your first flash sale in under 5 minutes. Our
                  intuitive dashboard guides you through every step.
                </p>
                <ul className="space-y-2 text-purple-200">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Set your offer terms
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Choose duration and limits
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    Launch and watch results pour in
                  </li>
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Horizontal Scrolling Gallery */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl font-display font-bold text-white"
          >
            <span className="text-white/80">Live</span>{" "}
            <span className="bg-gradient-to-r from-pink-400 to-cyan-400 text-transparent bg-clip-text">
              Flash Deals
            </span>
          </motion.h2>
          <p className="text-purple-300 mt-2">Scroll to explore →</p>
        </div>

        <div className="flex gap-6 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
          {[
            {
              merchant: "Joe's Coffee",
              offer: "50% Off All Lattes",
              time: "2h left",
              gradient: "from-amber-500/20 to-orange-500/20",
              border: "border-amber-500/30",
            },
            {
              merchant: "Bloom Boutique",
              offer: "BOGO Summer Dresses",
              time: "4h left",
              gradient: "from-pink-500/20 to-rose-500/20",
              border: "border-pink-500/30",
            },
            {
              merchant: "TechHub",
              offer: "$100 Off Laptops",
              time: "1h left",
              gradient: "from-blue-500/20 to-cyan-500/20",
              border: "border-cyan-500/30",
            },
            {
              merchant: "Green Grocer",
              offer: "30% Off Organic",
              time: "6h left",
              gradient: "from-green-500/20 to-emerald-500/20",
              border: "border-green-500/30",
            },
            {
              merchant: "Fitness First",
              offer: "Free Month Trial",
              time: "12h left",
              gradient: "from-purple-500/20 to-violet-500/20",
              border: "border-purple-500/30",
            },
          ].map((deal, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="min-w-[320px] snap-center"
            >
              <Card
                className={`h-64 bg-gradient-to-br ${deal.gradient} backdrop-blur-xl border ${deal.border} p-6 flex flex-col justify-between hover-elevate cursor-pointer`}
              >
                <div>
                  <div className="text-xs text-purple-300 mb-2 font-mono">
                    {deal.merchant}
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    {deal.offer}
                  </h3>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-purple-200 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {deal.time}
                  </div>
                  <Button
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                    data-testid="button-claim-deal"
                  >
                    Claim
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Handcrafted Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <svg
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-20 left-10 w-64 h-64 text-cyan-500"
          >
            <path
              fill="currentColor"
              d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.8C64.7,56.4,53.6,69,39.8,76.1C26,83.2,9.5,84.8,-6.1,83.3C-21.7,81.8,-36.4,77.2,-49.9,69.8C-63.4,62.4,-75.7,52.2,-82.8,38.9C-89.9,25.6,-91.8,9.2,-89.7,-6.3C-87.6,-21.8,-81.5,-36.4,-72.4,-48.9C-63.3,-61.4,-51.2,-71.8,-37.5,-79.3C-23.8,-86.8,-8.4,-91.4,4.6,-89.1C17.6,-86.8,30.6,-83.6,44.7,-76.4Z"
              transform="translate(100 100)"
            />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl font-display font-bold text-white mb-6">
              Built for{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text">
                  Local Heroes
                </span>
                <motion.svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="12"
                  viewBox="0 0 200 12"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <motion.path
                    d="M0,6 Q50,0 100,6 T200,6"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-cyan-400"
                  />
                </motion.svg>
              </span>
            </h2>
            <p className="text-xl text-purple-200 leading-relaxed">
              We believe in the power of local businesses. Real people, real
              communities, real connections. Urly Byrd puts the tools of big
              marketing in the hands of your neighborhood coffee shop,
              boutique, and restaurant.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 backdrop-blur-xl bg-slate-950/50 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-purple-300 text-sm">
            All Concepts Combined — Complete Design Showcase
          </p>
          <p className="text-purple-400/60 text-xs mt-2">
            Bold Typography • Dark Mode • Glassmorphism • Unconventional Layouts • Handcrafted Design
          </p>
        </div>
      </footer>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
