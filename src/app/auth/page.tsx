"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/api";
import { Loader2, ShieldAlert, Eye, EyeOff, Lock, Mail, User, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function AuthenticationPage() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Success state banner controller
  const [signupSuccess, setSignupSuccess] = useState<boolean>(false);

  // Form payload states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const clearFormError = () => setErrorMessage(null);

  const handleToggleView = () => {
    setIsLoginView(!isLoginView);
    clearFormError();
    setSignupSuccess(false);
    setPassword("");
    setFirstName("");
    setLastName("");
  };

  const handleFormSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (!isLoginView && (!firstName || !lastName))) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    clearFormError();
    setSignupSuccess(false);

    try {
      if (isLoginView) {
        // 1. Login Pipeline: Expects and saves session access keys
        const authData = await authApi.login({ email, password });
        localStorage.setItem("access_token", authData.accessToken);
        localStorage.setItem("refresh_token", authData.refreshToken);
        router.push("/dashboard");
      } else {
        // 2. Signup Pipeline: Creates account, displays success banner, prompts user to sign in
        await authApi.signup({ email, password, firstName, lastName });
        
        setSignupSuccess(true);
        setIsLoginView(true); // Bounce back to login card view automatically
        setPassword("");      // Clear password field for security
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        isLoginView
          ? "Authentication failed. Double check your credentials."
          : "Account initialization failed. The email might be taken."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl transition-all duration-300">
        
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck size={26} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {isLoginView ? "Welcome Back" : "Create Engine Account"}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {isLoginView ? "Connect to your vector clusters securely" : "Provision access permissions for OmniDocs AI"}
          </p>
        </div>

        {/* Signup Success Notification Banner */}
        {signupSuccess && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 text-emerald-800 dark:text-emerald-400 text-xs font-semibold leading-normal animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <p className="flex-1">Signup completed successfully! Please input your credentials below to log in.</p>
          </div>
        )}

        {/* Action Error Banner Alert */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-950/40 bg-red-50/50 dark:bg-red-950/20 p-3.5 text-red-800 dark:text-red-400 text-xs font-semibold leading-normal">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <p className="flex-1">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleFormSubmission} className="space-y-5">
          
          {/* Split Name Parameters Layout using Dummy Placeholders */}
          {!isLoginView && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">First Name</label>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-blue-50/50 transition-all">
                  <User size={14} className="text-zinc-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none placeholder-zinc-400 dark:placeholder-zinc-500"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Last Name</label>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-blue-50/50 transition-all">
                  <User size={14} className="text-zinc-400" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none placeholder-zinc-400 dark:placeholder-zinc-500"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Email Address</label>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-blue-50/50 transition-all">
              <Mail size={16} className="text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none placeholder-zinc-400 dark:placeholder-zinc-500"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Password</label>
              {isLoginView && (
                <button type="button" className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Forgot?
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-blue-50/50 transition-all">
              <Lock size={16} className="text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none placeholder-zinc-400 dark:placeholder-zinc-500"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isLoginView ? "Sign In" : "Register Credentials"}</span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {isLoginView ? "New to OmniDocs AI?" : "Already verified?"}{" "}
            <button
              onClick={handleToggleView}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline outline-none"
              disabled={submitting}
            >
              {isLoginView ? "Create an account" : "Sign in here"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}