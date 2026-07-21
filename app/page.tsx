'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  FileJson,
  ArrowRight,
  Terminal,
  TerminalSquare,
  Apple,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const features = [
  {
    icon: Lock,
    title: 'AES-256-GCM Encryption',
    description: 'Every secret is encrypted at rest with authenticated encryption — tampering is detected, not silently accepted.',
  },
  {
    icon: ShieldCheck,
    title: 'Hashed, Never Stored',
    description: 'Your master password is hashed with bcrypt. It never touches the database in plain text.',
  },
  {
    icon: KeyRound,
    title: 'Built-In Generator',
    description: 'Create strong, unique passwords in one click, with real-time strength feedback.',
  },
  {
    icon: FileJson,
    title: 'Import & Export',
    description: 'Take your vault with you. Export to JSON, or merge entries back in — your existing data is never overwritten by accident.',
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight truncate">SkelVault</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="hidden xs:inline-flex sm:h-10 sm:px-4" onClick={() => router.push('/auth/login')}>
              Sign in
            </Button>
            <Button size="sm" className="sm:h-10 sm:px-4" onClick={() => router.push('/auth/register')}>
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">Get started</span>
            </Button>
          </div>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto px-4 sm:px-6"
      >
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 items-center py-12 sm:py-16 lg:py-20">
          <motion.div variants={itemVariants} className="space-y-5 sm:space-y-6">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground border border-border rounded-full px-3 py-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
              <span className="truncate">Always Protected</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]"
            >
              One vault for every
              <br />
              password you own.
            </motion.h1>

            <motion.p variants={itemVariants} className="text-muted-foreground text-base sm:text-lg max-w-md">
              SkelVault keeps your credentials encrypted, organized, and available
              wherever you are — with nothing but your master password standing between them and you.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" className="w-full xs:w-auto" onClick={() => router.push('/auth/register')}>
                Create your vault
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="w-full xs:w-auto" onClick={() => router.push('/auth/login')}>
                Sign in
              </Button>
            </motion.div>
          </motion.div>

          {/* Code-Panel Signature Element */}
          <motion.div
            variants={itemVariants}
            className="relative"
          >
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-mono-tight text-muted-foreground">Vault.json</span>
                <div className="ml-auto flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-muted" />
                  <span className="w-2.5 h-2.5 rounded-full bg-muted" />
                  <span className="w-2.5 h-2.5 rounded-full bg-muted" />
                </div>
              </div>
              <pre className="p-4 sm:p-5 text-[11px] xs:text-xs sm:text-sm font-mono-tight leading-relaxed overflow-x-auto">
                <code>
                  <span className="text-muted-foreground">{'{'}</span>{'\n'}
                  {'  '}<span className="text-foreground">"entry"</span>: <span className="text-muted-foreground">{'{'}</span>{'\n'}
                  {'    '}<span className="text-foreground">"title"</span>: <span className="text-success">"Personal Email"</span>,{'\n'}
                  {'    '}<span className="text-foreground">"username"</span>: <span className="text-success">"you@example.com"</span>,{'\n'}
                  {'    '}<span className="text-foreground">"password"</span>: <span className="text-muted-foreground">"••••••••••••"</span>,{'\n'}
                  {'    '}<span className="text-foreground">"cipher"</span>: <span className="text-success">"AES-256-GCM"</span>,{'\n'}
                  {'    '}<span className="text-foreground">"category"</span>: <span className="text-success">"Email"</span>{'\n'}
                  {'  '}<span className="text-muted-foreground">{'}'}</span>{'\n'}
                  <span className="text-muted-foreground">{'}'}</span>
                </code>
              </pre>
            </div>
          </motion.div>
        </div>

        {/* Section Divider */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 my-10 sm:my-14"
        >
          <span className="text-xs font-mono-tight text-muted-foreground">
            01
          </span>
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-mono-tight text-muted-foreground">
            Downloads
          </span>
        </motion.div>

        {/* Downloads */}
        <motion.div
          variants={itemVariants}
          className="mb-16 sm:mb-24"
        >
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-border text-center">
              <h2 className="font-medium">Download SkelVault</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Available for Windows! macOS, and Linux Coming Soon.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <a
                href="https://github.com/Skelvric/SkelVault-Desktop/releases/download/v0.1.0/SkelVault.Setup.0.1.0.exe"
                className="p-5 sm:p-6 hover:bg-accent/40 transition-colors flex items-center gap-3"
              >
                <Monitor className="w-5 h-5" strokeWidth={1.75} />
                <div>
                  <div className="font-medium">Windows</div>
                  <div className="text-xs text-muted-foreground">
                    Download Installer
                  </div>
                </div>
              </a>

              <a
                href="https://vault.skelvric.com/"
                className="p-5 sm:p-6 hover:bg-accent/40 transition-colors flex items-center gap-3"
              >
                <Apple className="w-5 h-5" strokeWidth={1.75} />
                <div>
                  <div className="font-medium">macOS</div>
                  <div className="text-xs text-muted-foreground">
                    Coming Soon
                  </div>
                </div>
              </a>

              <a
                href="https://vault.skelvric.com/"
                className="p-5 sm:p-6 hover:bg-accent/40 transition-colors flex items-center gap-3"
              >
                <TerminalSquare className="w-5 h-5" strokeWidth={1.75} />
                <div>
                  <div className="font-medium">Linux</div>
                  <div className="text-xs text-muted-foreground">
                    Coming Soon
                  </div>
                </div>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Section Divider */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 my-10 sm:my-14"
        >
          <span className="text-xs font-mono-tight text-muted-foreground">
            02
          </span>
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-mono-tight text-muted-foreground">
            Features
          </span>
        </motion.div>

        {/* Features */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden border border-border mb-16 sm:mb-24">
          {features.map((feature) => (
            <div key={feature.title} className="bg-card p-5 sm:p-6 hover:bg-accent/40 transition-colors">
              <feature.icon className="w-5 h-5 mb-3 text-foreground" strokeWidth={1.75} />
              <h3 className="font-medium mb-1.5">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </motion.main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col xs:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© 2026 SkelVault — Built for Secure Simplicity.</span>
          <span className="font-mono-tight text-xs">Need Help? vault@skelvric.com</span>
        </div>
      </footer>
    </div>
  );
}
