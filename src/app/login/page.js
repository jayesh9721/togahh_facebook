"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Stethoscope, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "../globals.css";
import "../login.css";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const [successStatus, setSuccessStatus] = useState(null);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (errorStatus || successStatus) {
      const timer = setTimeout(() => {
        setErrorStatus(null);
        setSuccessStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorStatus, successStatus]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorStatus(null);
    setSuccessStatus(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (error) throw error;
        setSuccessStatus("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (error) {
      setErrorStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Decorative background components */}
      <div className="bg-decor bg-decor-1"></div>
      <div className="bg-decor bg-decor-2"></div>

      <div className="auth-card animate-slide-up">
        <div className="auth-header">
          <div className="auth-logo">
            <Stethoscope size={28} />
          </div>
          <h1 className="auth-title tracking-tight">HealPoint AI</h1>
          <div className="auth-badge-container">
            <span className="auth-badge">Clinical Platform v2.4</span>
          </div>
        </div>

        <div className="auth-content">
          <h2 className="content-title">
            {isSignUp ? "Create Administrator Account" : "Clinical Team Login"}
          </h2>
          <p className="auth-subtitle">
            {isSignUp 
              ? "Join the network to manage hospital-wide digital campaigns." 
              : "Sign in to access your advertising and content dashboards."}
          </p>

          <form onSubmit={handleAuth} className="auth-form">
            <div className="input-group">
              <label className="input-label">Corporate Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  placeholder="name@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Security Credentials</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner-small"></div> Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {isSignUp ? <UserPlus size={18} /> : <ShieldCheck size={18} />}
                  {isSignUp ? "Register Account" : "Secure Access"}
                  <ArrowRight size={16} className="ml-1" />
                </div>
              )}
            </button>
          </form>

          {/* Status Messages */}
          {errorStatus && (
            <div className="status-msg error animate-shake">
              <AlertCircle size={16} />
              <span>{errorStatus}</span>
            </div>
          )}
          
          {successStatus && (
            <div className="status-msg success animate-fade-in">
              <CheckCircle2 size={16} />
              <span>{successStatus}</span>
            </div>
          )}
        </div>

        <div className="auth-footer">
          <div className="footer-divider">
            <span>{isSignUp ? "Already Registered?" : "Personnel Access Only"}</span>
          </div>
          <p className="footer-text">
            {isSignUp ? "Already have an account?" : "Need an administrative account?"}{" "}
            <button className="auth-link-btn" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Sign In Now" : "Request Access"}
            </button>
          </p>
        </div>
      </div>
      
      <div className="login-legal">
        <p>© 2026 HealPoint AI Healthcare Systems. Restricted Clinical Access.</p>
      </div>
    </div>
  );
}
