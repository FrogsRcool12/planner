import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Calendar, CheckSquare, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">SF</div>
            <span className="font-bold text-xl tracking-tight">StudyFlow</span>
          </div>
          <div className="flex gap-4">
            <Link href={`${basePath}/sign-in`}>
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href={`${basePath}/sign-up`}>
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 overflow-hidden">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              <span>AI-powered student workspace</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-[1.1]">
              The smartest way to organize your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">school life</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Drop in your syllabus, paste an assignment, or just type what's due. StudyFlow extracts it, schedules it, and helps you get it done.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href={`${basePath}/sign-up`}>
                <Button size="lg" className="h-14 px-8 text-lg rounded-xl">
                  Start for free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">No credit card required</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-20 relative mx-auto w-full max-w-5xl"
          >
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-2xl p-2 md:p-4">
              <img 
                src={`${basePath}/hero-mockup.png`} 
                alt="StudyFlow Dashboard" 
                className="w-full h-auto rounded-xl border border-border shadow-sm object-cover aspect-[16/9]"
              />
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to ace your classes</h2>
            <p className="text-muted-foreground">Designed specifically for the modern student workflow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl border border-border">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Task Extraction</h3>
              <p className="text-muted-foreground">Just paste your assignment descriptions. We'll extract due dates, difficulty, and create a study plan automatically.</p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl border border-border">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Visual Weekly Grid</h3>
              <p className="text-muted-foreground">See exactly what classes you have and what's due for each period. Color-coded perfection.</p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Prioritization</h3>
              <p className="text-muted-foreground">Know exactly what to work on next with our 5-star priority system and workload estimation.</p>
            </div>
          </div>
        </section>

        {/* AI Highlight Section */}
        <section className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Type it. Done.</h2>
            <p className="text-lg text-muted-foreground mb-8">
              "Math worksheet due tomorrow, biology quiz on Friday, and read chapter 4 for history."
              <br/><br/>
              Just type how you think. StudyFlow understands the context, categorizes by subject, and places it exactly where it belongs on your calendar.
            </p>
            <ul className="space-y-4">
              {['Auto-categorization by subject', 'Smart due date detection', 'Workload time estimation'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">✓</div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1">
            <div className="rounded-2xl border border-border bg-card shadow-2xl p-2">
              <img 
                src={`${basePath}/ai-mockup.png`} 
                alt="AI parsing input" 
                className="w-full rounded-xl"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-6 w-6 rounded flex items-center justify-center bg-muted text-foreground font-bold text-xs">SF</div>
            <span className="font-semibold text-foreground">StudyFlow</span>
          </div>
          <p>© {new Date().getFullYear()} StudyFlow. Designed for students.</p>
        </div>
      </footer>
    </div>
  );
}
