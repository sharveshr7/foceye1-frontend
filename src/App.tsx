import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "./components/AppLayout";
import { LoadingScreen } from "./components/LoadingScreen";
import { PatientProvider } from "./contexts/PatientContext";
import { lazyWithRetry } from "./utils/lazyWithRetry";

// Lazy load pages with chunk retry & deployment recovery
const Welcome = lazyWithRetry(() => import("./pages/Welcome"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const Signup = lazyWithRetry(() => import("./pages/Signup"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const Analytics = lazyWithRetry(() => import("./pages/Analytics"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const SettingsPage = lazyWithRetry(() => import("./pages/SettingsPage"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const TherapySelection = lazyWithRetry(() => import("./pages/TherapySelection"));
const DeviceDashboard = lazyWithRetry(() => import("./pages/DeviceDashboard"));
const Calibration = lazyWithRetry(() => import("./pages/Calibration"));
const AIInsights = lazyWithRetry(() => import("./pages/AIInsights"));
const TherapySession = lazyWithRetry(() => import("./pages/TherapySession"));
const Patients = lazyWithRetry(() => import("./pages/Patients"));
const VisionTest = lazyWithRetry(() => import("./pages/VisionTest"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PatientProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/mode-selection" element={<TherapySelection />} />
                <Route path="/therapy-session" element={<TherapySession />} />
                <Route path="/device" element={<DeviceDashboard />} />
                <Route path="/vision-test" element={<VisionTest />} />
                <Route path="/calibration" element={<Calibration />} />
                <Route path="/ai-insights" element={<AIInsights />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </PatientProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
