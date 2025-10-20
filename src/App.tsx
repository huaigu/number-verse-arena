import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { config } from './config/wagmi';
import { FhevmProvider } from './providers/FhevmProvider';
import LandingPage from "./pages/LandingPage";
import GamePage from "./pages/GamePage";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import { Analytics } from "@vercel/analytics/react"
import './i18n';

const queryClient = new QueryClient();

/**
 * Main App component with global FHEVM initialization
 *
 * FhevmProvider initializes the FHEVM SDK once at app startup and shares
 * the instance across all components, eliminating delays when users navigate
 * to game pages. This ensures:
 * - Single SDK load on app mount (no repeated CDN fetches)
 * - Shared FHEVM instance across all components
 * - Instant encryption availability when users reach game pages
 * - Better user experience with preloaded encryption system
 */
const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <FhevmProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/create-room" element={<CreateRoom />} />
                <Route path="/join-room" element={<JoinRoom />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Analytics />
          </TooltipProvider>
        </FhevmProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
