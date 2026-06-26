'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Shield, Zap, ArrowRight, User, Settings } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const features = [
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Bank-Level Encryption',
      description: 'AES-256 encryption keeps your passwords secure.',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Zero-Knowledge',
      description: 'We never see or store your passwords in plain tex.t',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning Fast',
      description: 'Instant access to all your passwords from any device.',
    },
    {
      icon: <User className="w-8 h-8" />,
      title: 'Profile Management',
      description: 'Personalize your account with custom profiles.',
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: 'Easy Settings',
      description: 'Manage profile picture, bio, and preferences.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -left-40 w-80 h-80 bg-slate-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative max-w-6xl mx-auto px-4 py-20 sm:py-32"
      >
        {/* Header */}
        <motion.header variants={itemVariants} className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl"
            >
              <Lock className="w-8 h-8 text-slate-900" />
            </motion.div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">SkelVault</h1>
          <p className="text-xl text-slate-300 mb-8">
            The secure password manager with profile management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth/register')}
              className="px-8 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth/login')}
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-10 transition-all"
            >
              Sign In
            </motion.button>
          </div>
        </motion.header>

        {/* Features */}
        <motion.div
          variants={itemVariants}
          className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all"
            >
              <div className="text-white mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-300 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="grid sm:grid-cols-3 gap-8 text-center"
        >
          <div>
            <p className="text-4xl font-bold text-white">256-Bit</p>
            <p className="text-slate-300 text-sm">Military Grade</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-white">0%</p>
            <p className="text-slate-300 text-sm">Data Compromise</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-white">∞</p>
            <p className="text-slate-300 text-sm">Passwords Supported</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center py-8 text-slate-400 text-sm border-t border-slate-700/50"
      >
        <p>© 2026 Skelvric — All rights reserved.</p>
      </motion.footer>
    </div>
  );
}
