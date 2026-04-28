import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCode from "./pages/AuthCode";
import Profile from "./pages/Profile";
import Pymes from "./pages/Pymes";
import Aprendizaje from "./pages/Aprendizaje";
import Herramientas from "./pages/Herramientas";
import Dashboard from "./pages/Dashboard";
import Blog from "./pages/Blog";
import Settings from "./pages/Settings";

import { SiteBackground } from "@/components/ui/site-background";


export default function App() {
  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <SiteBackground />
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth-code" element={<AuthCode />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pymes" element={<Pymes />} />
          <Route path="/aprendizaje" element={<Aprendizaje />} />
          <Route path="/herramientas" element={<Herramientas />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}
