import React from "react";
import { X } from "lucide-react";

interface PrivacyTermsProps {
  type: "privacy" | "terms" | null;
  onClose: () => void;
  isDark: boolean;
}

export default function PrivacyTerms({ type, onClose, isDark }: PrivacyTermsProps) {
  if (!type) return null;

  const title = type === "privacy" ? "Privacy Policy" : "Terms & Conditions";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-6 md:p-8 transition-all duration-300 ${
          isDark
            ? "bg-[#18181b] text-zinc-200 border border-zinc-800"
            : "bg-white text-stone-800 border border-stone-200"
        }`}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/10 dark:border-zinc-200/10">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-stone-100 text-stone-500"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm md:text-base leading-relaxed font-light">
          {type === "privacy" ? (
            <>
              <p className="font-semibold text-base">Your Private Digital Mind, Protected.</p>
              <p>
                At Virtual Self, we believe your personal thoughts, memories, quirks, and stories belong
                uniquely to you. Your data privacy is our highest technical commitment.
              </p>
              <h3 className="font-medium text-base mt-4">1. Local-First Device Storage</h3>
              <p>
                By default, all conversational data, personal insights, and virtual human traits you generate
                remain stored strictly within your browser's local sandbox (local storage). No third parties,
                including our servers, can see or read your dialogues during the creation phase.
              </p>
              <h3 className="font-medium text-base mt-4">2. Voluntary Device Syncing</h3>
              <p>
                If and when you choose to access your virtual self across multiple devices, we invite you to create a
                unique username (min 8 characters) and validate your email address. Only at this explicit moment
                will your profile be synchronized with our server.
              </p>
              <h3 className="font-medium text-base mt-4">3. AI Training and Anonymity</h3>
              <p>
                Our server-side AI uses conversations to understand human depth and refine its empathetic dialogue models.
                However, this conversation pipeline is completely decoupled from your personal identity. We do not link
                your chats to individuals, ensuring your virtual human remains anonymous.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-6">
                Last updated: June 24, 2026. Designed with uncompromising integrity.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-base">Agreement for Creating Virtual Humanities</p>
              <p>
                Welcome to Virtual Self. By using our minimalist conversation builder, you agree to these Terms.
              </p>
              <h3 className="font-medium text-base mt-4">1. Authenticity of Persona</h3>
              <p>
                This space is created for honest reflection. You are encouraged to talk about your true memories,
                philosophies, and desires. You agree not to impersonate public figures or generate malicious representations
                of real individuals.
              </p>
              <h3 className="font-medium text-base mt-4">2. Interaction with Clones</h3>
              <p>
                Your virtual human is a companion and an interface designed to build connections in the future.
                When choosing to publish your virtual self, you consent to let other users initiate simulated
                conversations with your digital clone in a respectful manner.
              </p>
              <h3 className="font-medium text-base mt-4">3. Respectful Conduct</h3>
              <p>
                We host a warm, empathetic ecosystem. Any attempt to exploit, reverse engineer, or feed toxic
                prompts to other virtual clones to elicit abusive behavior will result in an immediate block
                of your server sync capabilities.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-6">
                Last updated: June 24, 2026. Let's create mindful, respectful connections.
              </p>
            </>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl font-medium transition-all ${
              isDark
                ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                : "bg-stone-900 text-stone-100 hover:bg-stone-800"
            }`}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
