'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';

interface Challenge {
  id: number;
  text: string;
  completed: boolean;
}

export function HeroSection() {
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: 1, text: '💧 Drink 8 glasses of water', completed: false },
    { id: 2, text: '📚 Read for 30 minutes', completed: false },
    { id: 3, text: '🏃 Exercise for 20 minutes', completed: false },
  ]);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState<number | null>(null);

  // Watch for when all challenges are completed and increment streak once
  useEffect(() => {
    const allCompleted = challenges.every(c => c.completed);
    if (allCompleted && streak === 0 && challenges.some(c => c.completed)) {
      setStreak(1);
    } else if (!allCompleted && streak === 1) {
      setStreak(0);
    }
  }, [challenges, streak]);

  const toggleChallenge = (id: number) => {
    const challenge = challenges.find(c => c.id === id);
    if (!challenge) return;

    // Trigger confetti for completing
    if (!challenge.completed) {
      setShowConfetti(id);
      setTimeout(() => setShowConfetti(null), 600);
    }

    // Toggle the challenge
    setChallenges(prev =>
      prev.map(c => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  return (
    <section
      className="relative min-h-screen flex items-center"
      style={{
        background: 'linear-gradient(to bottom, #0A0A0B 0%, #0F1419 100%)',
      }}
    >
      {/* Radial green glow behind demo panel */}
      <div
        className="absolute top-1/2 right-1/4 w-[800px] h-[800px] -translate-y-1/2 pointer-events-none hidden lg:block"
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-[40%_60%] gap-8 lg:gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="space-y-6">
            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight" style={{ color: '#FFFFFF', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Track Anything.{' '}
              <span style={{ color: '#00FF88' }}>
                Together.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl lg:text-2xl" style={{ color: '#9CA3AF', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Create custom goals, invite friends, stay accountable
            </p>

            {/* CTA */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
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

          {/* Right Side - Interactive Demo Panel */}
          <div
            id="demo-panel"
            className="w-full p-8 rounded-2xl border"
            style={{
              backgroundColor: '#151515',
              borderColor: '#2A2A2A',
              borderWidth: '1px',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          >
            {/* Streak Counter */}
            <div className="mb-6 pb-6 border-b" style={{ borderColor: '#2A2A2A' }}>
              <div className="text-sm mb-2" style={{ color: '#9CA3AF' }}>
                Current Streak
              </div>
              <div className="text-5xl font-bold" style={{ color: '#00FF88' }}>
                {streak} days
              </div>
            </div>

            {/* Challenges List */}
            <div className="space-y-3">
              <div className="text-sm font-semibold mb-4" style={{ color: '#FFFFFF' }}>
                Today's Challenges
              </div>
              {challenges.map((challenge) => (
                <button
                  key={challenge.id}
                  onClick={() => toggleChallenge(challenge.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: challenge.completed ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                    borderColor: challenge.completed ? '#00FF88' : '#2A2A2A',
                    borderWidth: '1px',
                    position: 'relative',
                    transform: showConfetti === challenge.id ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  {/* Checkbox */}
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: challenge.completed ? '#00FF88' : '#2A2A2A',
                      backgroundColor: challenge.completed ? '#00FF88' : 'transparent',
                    }}
                  >
                    {challenge.completed && (
                      <Check className="h-4 w-4" style={{ color: '#0A0A0B' }} />
                    )}
                  </div>

                  {/* Challenge Text */}
                  <span
                    className="text-lg flex-1 text-left"
                    style={{
                      color: challenge.completed ? '#FFFFFF' : '#9CA3AF',
                      textDecoration: challenge.completed ? 'line-through' : 'none'
                    }}
                  >
                    {challenge.text}
                  </span>

                  {/* Confetti Animation */}
                  {showConfetti === challenge.id && (
                    <>
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="confetti-particle"
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: '8px',
                            height: '8px',
                            backgroundColor: i % 2 === 0 ? '#00FF88' : '#FFFFFF',
                            borderRadius: '50%',
                            pointerEvents: 'none',
                            animation: `confetti-${i} 0.6s ease-out forwards`,
                          }}
                        />
                      ))}
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Progress Text */}
            <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: '#2A2A2A' }}>
              <div className="text-sm" style={{ color: '#9CA3AF' }}>
                {challenges.filter(c => c.completed).length} of {challenges.length} completed today
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti-0 {
          to {
            transform: translate(-40px, -60px) rotate(180deg);
            opacity: 0;
          }
        }
        @keyframes confetti-1 {
          to {
            transform: translate(40px, -60px) rotate(-180deg);
            opacity: 0;
          }
        }
        @keyframes confetti-2 {
          to {
            transform: translate(-60px, -30px) rotate(90deg);
            opacity: 0;
          }
        }
        @keyframes confetti-3 {
          to {
            transform: translate(60px, -30px) rotate(-90deg);
            opacity: 0;
          }
        }
        @keyframes confetti-4 {
          to {
            transform: translate(-30px, -70px) rotate(45deg);
            opacity: 0;
          }
        }
        @keyframes confetti-5 {
          to {
            transform: translate(30px, -70px) rotate(-45deg);
            opacity: 0;
          }
        }
        @keyframes confetti-6 {
          to {
            transform: translate(-50px, -40px) rotate(270deg);
            opacity: 0;
          }
        }
        @keyframes confetti-7 {
          to {
            transform: translate(50px, -40px) rotate(-270deg);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
