import { useState, useEffect, useRef } from 'react';

interface UseGameLogicReturn {
  // Audio functions
  playSound: (type: 'click' | 'win' | 'lose') => void;
  
  // Animation helpers
  addPopAnimation: (element: HTMLElement) => void;
  addGlowAnimation: (element: HTMLElement) => void;
}

export function useGameLogic(): UseGameLogicReturn {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
      }
    };
    
    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  const playSound = (type: 'click' | 'win' | 'lose') => {
    if (!audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Configure sound based on type
      switch (type) {
        case 'click':
          oscillator.frequency.value = 600;
          oscillator.type = 'square';
          gainNode.gain.value = 0.02;
          break;
        case 'win':
          oscillator.frequency.value = 880;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.05;
          break;
        case 'lose':
          oscillator.frequency.value = 220;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.04;
          break;
      }
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start();
      setTimeout(() => {
        try {
          oscillator.stop();
        } catch (e) {
          // Oscillator already stopped
        }
      }, type === 'click' ? 50 : 120);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  };

  const addPopAnimation = (element: HTMLElement) => {
    element.classList.add('pop');
    setTimeout(() => {
      element.classList.remove('pop');
    }, 250);
  };

  const addGlowAnimation = (element: HTMLElement) => {
    element.classList.add('glow');
    setTimeout(() => {
      element.classList.remove('glow');
    }, 600);
  };

  return {
    playSound,
    addPopAnimation,
    addGlowAnimation,
  };
}
