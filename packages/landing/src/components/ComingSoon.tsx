"use client";

import { useState } from "react";
import {
  CheckIcon,
  ClockIcon,
  LightningIcon,
  CodeIcon,
  ArchiveIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  UsersIcon,
  ClipboardCheckIcon,
  PhoneIcon,
} from "./icons";

export function ComingSoon() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Hook up to actual email list API
    setSubmitted(true);
  };

  return (
    <section className="container-fluid py-24 bg-gradient-to-br from-soft-yellow/30 via-pastel-blue/20 to-bright-accent/10 rounded-tl-[6rem] rounded-br-3xl my-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-soft-yellow/50 text-yellow-700 text-sm font-bold px-4 py-2 rounded-full mb-6">
            <ClockIcon className="w-5 h-5" />
            COMING SOON
          </div>

          <h2 className="text-5xl font-extrabold tracking-tight text-text-dark mb-4">
            Internal Builds.
            <br />
            <span className="text-bright-accent">In Seconds.</span>
          </h2>

          <p className="text-xl text-text-light max-w-2xl mx-auto mb-8">
            Skip TestFlight's 24-48 hour wait. Build .ipa files and ship to your
            testers instantly.
          </p>

          {/* Email Signup - Now prominent and above everything */}
          <div className="max-w-xl mx-auto mb-12">
            {!submitted ? (
              <div className="bg-cream-bg rounded-2xl p-8 shadow-lg border-2 border-bright-accent/30">
                <h3 className="text-lg font-bold text-text-dark mb-2">
                  Be the first to know
                </h3>
                <p className="text-text-light mb-6">
                  Get notified when internal builds launch. No spam, just one email.
                </p>
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="flex-1 px-5 py-4 text-lg rounded-xl border-2 border-soft-yellow/50 bg-white focus:border-bright-accent focus:outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      className="bg-bright-accent text-white text-lg font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-bright-accent/30 transition-all whitespace-nowrap"
                    >
                      Notify Me
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-warm-green/20 border-2 border-warm-green rounded-2xl p-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-warm-green/30 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xl font-bold text-green-700">
                    You're on the list!
                  </span>
                </div>
                <p className="text-green-600">
                  We'll email you when internal builds are ready.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Visual Flow */}
        <div className="bg-cream-bg rounded-2xl p-8 shadow-lg border border-soft-yellow/30 mb-10">
          <div className="grid md:grid-cols-5 gap-4 items-center">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-bright-accent/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CodeIcon className="w-7 h-7 text-bright-accent" />
              </div>
              <div className="font-bold text-text-dark text-sm">Your Code</div>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex justify-center">
              <ArrowRightIcon className="w-8 h-8 text-text-light/30" />
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-warm-green/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ArchiveIcon className="w-7 h-7 text-green-600" />
              </div>
              <div className="font-bold text-text-dark text-sm">Build .ipa</div>
              <div className="text-xs text-text-light">~30 sec</div>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex justify-center">
              <ArrowRightIcon className="w-8 h-8 text-text-light/30" />
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-pastel-blue/40 rounded-xl flex items-center justify-center mx-auto mb-3">
                <PhoneIcon className="w-7 h-7 text-blue-600" />
              </div>
              <div className="font-bold text-text-dark text-sm">Send to Testers</div>
              <div className="text-xs text-text-light">Instant</div>
            </div>
          </div>

          {/* Comparison */}
          <div className="mt-8 pt-6 border-t border-soft-yellow/30">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                <ClockIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <div className="font-bold text-red-700">TestFlight</div>
                  <div className="text-red-600 text-sm">24-48 hours processing</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-warm-green/20 rounded-xl border border-warm-green">
                <LightningIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-green-700">BundleNudge</div>
                  <div className="text-green-600 text-sm">30 seconds. Done.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases - with SVG icons instead of emojis */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Bug Fix */}
          <div className="bg-cream-bg p-6 rounded-xl border border-soft-yellow/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangleIcon className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="font-bold text-text-dark text-lg mb-2">Found a bug?</h4>
            <p className="text-text-light">
              Fix it, build it, verify it. Before lunch.
            </p>
          </div>

          {/* Demo Request */}
          <div className="bg-cream-bg p-6 rounded-xl border border-soft-yellow/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <UsersIcon className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="font-bold text-text-dark text-lg mb-2">PM wants a demo?</h4>
            <p className="text-text-light">
              Ship it to their device in 30 seconds.
            </p>
          </div>

          {/* QA Sprint */}
          <div className="bg-cream-bg p-6 rounded-xl border border-soft-yellow/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <ClipboardCheckIcon className="w-6 h-6 text-purple-500" />
            </div>
            <h4 className="font-bold text-text-dark text-lg mb-2">QA sprint?</h4>
            <p className="text-text-light">
              Push updates as fast as they can test them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
