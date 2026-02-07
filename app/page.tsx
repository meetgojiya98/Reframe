"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Lock, ShieldCheck, Sparkles, BarChart3, MessageCircle, Zap, Calendar, FileEdit, Wind, Bot, TrendingUp } from "lucide-react";
import { APP_NAME, APP_TAGLINE, DISCLAIMER_LINES } from "@/lib/constants";
import { ReframeLogo } from "@/components/reframe-logo";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    title: "Daily check-ins",
    description: "Track mood and energy in seconds and spot trends over time.",
    icon: Calendar,
    color: "from-emerald-500/20 to-teal-500/20",
    delay: 0
  },
  {
    title: "Thought records",
    description: "Turn a tough moment into a structured exercise: situation, thoughts, evidence, and a balanced reframe.",
    icon: FileEdit,
    color: "from-teal-500/20 to-cyan-500/20",
    delay: 0.05
  },
  {
    title: "Short skills",
    description: "Use breathing, grounding, and reflection exercises when you need a reset.",
    icon: Wind,
    color: "from-cyan-500/20 to-sky-500/20",
    delay: 0.1
  },
  {
    title: "Optional AI coach",
    description: "Get gentle, evidence-based prompts and suggestions (you control when it's on).",
    icon: Bot,
    color: "from-sky-500/20 to-emerald-500/20",
    delay: 0.15
  },
  {
    title: "Insights",
    description: "See patterns in your emotions and what helps, without judgment.",
    icon: TrendingUp,
    color: "from-emerald-600/20 to-teal-600/20",
    delay: 0.2
  }
];

const STEPS = [
  {
    title: "Notice",
    description: "Capture what happened, what you thought, and what you felt.",
    icon: MessageCircle
  },
  {
    title: "Examine",
    description: "Spot patterns and test thoughts with evidence.",
    icon: BarChart3
  },
  {
    title: "Reframe",
    description: "Draft a balanced thought and one tiny next action.",
    icon: Zap
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero with gradient mesh + floating orbs */}
      <header className="relative overflow-hidden px-4 pt-16 pb-24 sm:px-6 sm:pt-24 sm:pb-32 lg:px-8">
        {/* Dynamic gradient orbs (Stripe-style) */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -left-40 -top-40 h-80 w-80 rounded-full opacity-30 blur-3xl animate-float"
            style={{
              background: "radial-gradient(circle, rgba(72, 187, 120, 0.4) 0%, transparent 70%)"
            }}
          />
          <div
            className="absolute right-0 top-1/4 h-96 w-96 rounded-full opacity-20 blur-3xl animate-float"
            style={{
              background: "radial-gradient(circle, rgba(34, 197, 94, 0.35) 0%, transparent 70%)",
              animationDelay: "-2s"
            }}
          />
          <div
            className="absolute bottom-20 left-1/3 h-64 w-64 rounded-full opacity-25 blur-3xl animate-float"
            style={{
              background: "radial-gradient(circle, rgba(22, 163, 74, 0.3) 0%, transparent 70%)",
              animationDelay: "-4s"
            }}
          />
        </div>

        <motion.div
          className="relative mx-auto max-w-4xl text-center"
          initial="hidden"
          animate="show"
          variants={container}
        >
          <motion.p
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm"
            variants={item}
          >
            <Sparkles className="h-4 w-4" />
            CBT-inspired · Privacy-first
          </motion.p>
          <motion.div className="flex flex-col items-center gap-3" variants={item}>
            <ReframeLogo variant="full" size="xl" gradientWordmark className="scale-90 sm:scale-100 lg:scale-110" />
          </motion.div>
          <motion.p
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl"
            variants={item}
          >
            {APP_TAGLINE}
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            variants={item}
          >
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full px-8 text-base shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            >
              <Link href="/signup">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-2 px-8 text-base transition-all duration-200 hover:scale-[1.02] hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </motion.div>
          <motion.p className="mt-4 text-sm text-muted-foreground" variants={item}>
            Free account · Your data is private and secure
          </motion.p>
          <motion.div
            className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-border/60 pt-10"
            variants={item}
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              Your data, your account
            </span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Safety-aware
            </span>
            <span className="text-sm text-muted-foreground">Educational tool, not a substitute for care</span>
          </motion.div>
        </motion.div>
      </header>

      {/* What Reframe is — split layout with dynamic visual */}
      <section className="relative overflow-hidden border-t border-border/60 px-4 py-20 sm:px-6 lg:px-8">
        {/* Ambient orbs for depth */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-0 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full opacity-15 blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, transparent 70%)"
            }}
          />
          <div
            className="absolute right-0 top-1/3 h-64 w-64 rounded-full opacity-10 blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(20, 184, 166, 0.4) 0%, transparent 70%)",
              animation: "float 12s ease-in-out infinite"
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: animated illustration */}
            <motion.div
              className="relative order-2 lg:order-1"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Image
                  src="/reframe-what-is.png"
                  alt="Calm, reflective space — thoughts becoming clearer"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
                {/* Subtle animated ring */}
                <motion.div
                  className="absolute -inset-1 rounded-2xl border-2 border-primary/20"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              {/* Floating metric pills */}
              <motion.div
                className="absolute -right-2 top-1/4 flex gap-2"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <span className="rounded-full border border-primary/30 bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-sm">
                  Notice → Reframe
                </span>
              </motion.div>
              <motion.div
                className="absolute -bottom-2 left-4 flex gap-2"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <span className="rounded-full border border-primary/30 bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-sm">
                  CBT-inspired
                </span>
              </motion.div>
            </motion.div>

            {/* Right: copy */}
            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl lg:text-left">
                What is Reframe?
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed lg:text-left">
                Reframe is a personal, CBT-inspired space to notice your thoughts, question unhelpful patterns, and choose calmer, clearer responses. It&apos;s not therapy—it&apos;s a daily practice that helps you step back from stress and overthinking so you can act from a steadier place.
              </p>
              {/* Mini flow visualization */}
              <motion.div
                className="mt-8 flex items-center gap-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                {["Notice", "Examine", "Reframe"].map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <motion.span
                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                    >
                      {label}
                    </motion.span>
                    {i < 2 && (
                      <motion.span
                        className="h-px w-4 bg-primary/30"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        style={{ transformOrigin: "left" }}
                      />
                    )}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What it does for you — dynamic feature cards */}
      <section className="relative border-t border-border/60 bg-muted/20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.h3
            className="text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            What it does for you
          </motion.h3>
          <motion.p
            className="mx-auto mt-2 max-w-xl text-center text-muted-foreground"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            One place for check-ins, thought work, skills, and insights.
          </motion.p>

          {/* Feature illustration strip (optional visual) */}
          <motion.div
            className="relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-inner"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative h-32 w-full sm:h-40">
              <Image
                src="/reframe-features.png"
                alt="Reframe features: check-ins, thought records, skills, coach, insights"
                fill
                className="object-cover object-center opacity-90"
                sizes="(max-width: 768px) 100vw, 896px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-muted/30 to-transparent" />
            </div>
          </motion.div>

          <motion.div
            className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={container}
          >
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              const isFifthCard = index === 4;
              return (
                <motion.div
                  key={feature.title}
                  className={`card-hover group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-sm ${isFifthCard ? "sm:col-span-2 sm:max-w-md sm:justify-self-center lg:col-span-2 lg:col-start-2 lg:max-w-none" : ""}`}
                  variants={item}
                  transition={{ type: "spring", stiffness: 300, damping: 24, delay: feature.delay }}
                >
                  {/* Animated gradient background on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="relative">
                    <motion.div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-primary"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--primary) / 0.06) 100%)"
                      }}
                      whileHover={{ scale: 1.08, rotate: 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <Icon className="h-6 w-6" />
                    </motion.div>
                    <h4 className="font-semibold text-foreground">{feature.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    {/* Animated progress bar (decorative) */}
                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full w-full rounded-full bg-primary/60"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 + feature.delay }}
                        style={{ transformOrigin: "left" }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How it works — cards with hover and stagger */}
      <section className="relative border-t border-border/60 bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            className="text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            How it works
          </motion.h2>
          <motion.p
            className="mx-auto mt-2 max-w-xl text-center text-muted-foreground"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Short, structured check-ins designed for real life.
          </motion.p>
          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={container}
          >
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  className="card-hover rounded-2xl border border-border/80 bg-card p-6 text-left shadow-sm"
                  variants={item}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-primary"
                    style={{
                      background: `linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.08) 100%)`
                    }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-4 font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-t border-border/60 px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl rounded-2xl border border-primary/15 bg-primary/5 p-6 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          {DISCLAIMER_LINES.map((line) => (
            <p className="mb-1 last:mb-0" key={line}>
              {line}
            </p>
          ))}
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/60 px-4 py-14 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <p className="font-medium text-foreground">Ready to shift your thoughts, gently?</p>
          <Button
            asChild
            className="mt-4 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            size="lg"
            variant="secondary"
          >
            <Link href="/signup">Open Reframe</Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
