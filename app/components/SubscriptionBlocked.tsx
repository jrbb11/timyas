import React from 'react';
import { ShieldAlert, CreditCard, ExternalLink, Mail } from 'lucide-react';

export default function SubscriptionBlocked() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
      
      <div className="relative w-full max-w-2xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12 backdrop-blur-2xl shadow-2xl">
          {/* Glassmorphism Header */}
          <div className="mb-8 flex justify-center">
            <div className="rounded-2xl bg-red-500/10 p-4 ring-1 ring-red-500/50">
              <ShieldAlert className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Service <span className="text-red-500">Suspended</span>
            </h1>
            <p className="text-lg text-white/60 max-w-md mx-auto">
              Your domain and hosting subscription for <span className="text-white font-medium">Timyas Lechon Manok</span> has expired as of <span className="text-red-400 font-semibold">March 08, 2026</span>.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://klyrahost.space"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2 group-hover:bg-blue-500/20 transition-colors">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">Renew Subscription</p>
                  <p className="text-xs text-white/40">Open Klyra Host Portal</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-white/20 group-hover:text-white/60 transition-colors" />
            </a>

            <a
              href="mailto:support@klyrahost.space"
              className="group flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2 group-hover:bg-purple-500/20 transition-colors">
                  <Mail className="h-5 w-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">Contact Billing</p>
                  <p className="text-xs text-white/40">Get assistance now</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-white/20 group-hover:text-white/60 transition-colors" />
            </a>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-xs uppercase tracking-widest text-white/30">
              Powered by Klyra Digital Solutions
            </p>
          </div>
        </div>
        
        {/* Subtle Footer Link */}
        <div className="mt-8 text-center text-white/20 text-sm hover:text-white/40 transition-colors cursor-pointer">
          If you believe this is an error, please contact your administrator.
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        .animate-pulse {
          animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .delay-700 {
          animation-delay: 1.5s;
        }
      `}} />
    </div>
  );
}
