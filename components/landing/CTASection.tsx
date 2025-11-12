'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTASection() {
  return (
    <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-900 to-black overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Glassmorphic Card */}
        <div className="glass-dark rounded-3xl p-12 border border-gray-800 relative overflow-hidden">
          {/* Gradient Border Glow */}
          <div className="absolute -inset-1 landing-gradient-neon rounded-3xl opacity-20 blur-xl" />

          <div className="relative space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-gray-300">
              <Sparkles className="h-4 w-4 text-green-400" />
              <span>Join the community today</span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Ready to Build{' '}
              <span className="landing-gradient-text">
                Lasting Habits?
              </span>
            </h2>

            {/* Subheading */}
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start tracking your progress, compete with friends, and achieve your goals.
              Join thousands of users already building better habits.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                asChild
                size="lg"
                className="text-lg px-8 py-6 font-semibold transition-all hover:scale-105"
                style={{
                  backgroundColor: '#00FF88',
                  color: '#0A0A0B',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}
              >
                <Link href="/signup">
                  Sign Up
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="text-lg px-8 py-6 font-semibold transition-all hover:scale-105 hover:opacity-90"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0A0A0B',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}
              >
                <Link href="/login">
                  Log In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
