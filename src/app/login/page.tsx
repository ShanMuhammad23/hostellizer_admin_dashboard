"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Loader2,
  Users,
  Receipt,
  UserCheck,
  MessageSquare,
  IdCard,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const VALUE_PROPS = [
  {
    icon: Users,
    pain: "Student records scattered across registers and WhatsApp chats",
    solution: "One searchable directory with rooms, rent status, and documents",
  },
  {
    icon: Receipt,
    pain: "Forgotten dues and messy expense notebooks",
    solution: "Rent tracking, expense logs, and profit snapshots on your dashboard",
  },
  {
    icon: UserCheck,
    pain: "Room and mess attendance on paper that never adds up",
    solution: "Digital roll call and mess marks — know who ate and who is in",
  },
  {
    icon: IdCard,
    pain: "Staff payroll, advances, and CNIC files in separate folders",
    solution: "Staff directory with payroll, leave, and attendance in one place",
  },
  {
    icon: MessageSquare,
    pain: "Application updates lost in endless group messages",
    solution: "Approve applicants and chat with students from the admin panel",
  },
] as const;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const callbackUrl = decodeURIComponent(searchParams.get("callbackUrl") || "/dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setSuccess(true);
      router.push(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(result.error);
        toast.error("Login failed", {
          description: result.error,
          duration: 5000,
        });
      } else if (result?.ok) {
        await update();
        setSuccess(true);
        toast.success("Login successful!", {
          description: "Redirecting to dashboard...",
          duration: 2000,
        });
        router.push(callbackUrl);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during login";
      setError(errorMessage);
      toast.error("Login failed", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — value proposition */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 px-10 py-12 xl:px-14 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-bold ring-1 ring-white/20">
              H
            </span>
            <span className="text-xl font-bold tracking-tight">Hostellizer</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 my-10 max-w-lg"
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-emerald-300/90">
            Built for hostel owners in Pakistan
          </p>
          <h1 className="text-3xl font-bold leading-tight xl:text-4xl">
            Stop juggling registers.{" "}
            <span className="text-emerald-300">Run everything from one dashboard.</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-emerald-50/75">
            Hostellizer replaces spreadsheets, paper attendance, and chaotic group chats
            with a single admin panel for students, staff, finances, and admissions.
          </p>

          <ul className="mt-10 space-y-5">
            {VALUE_PROPS.map((item, index) => (
              <motion.li
                key={item.solution}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.08 * index }}
                className="flex gap-4"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <item.icon className="h-4 w-4 text-emerald-300" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm leading-snug text-emerald-100/55 line-through decoration-emerald-100/30">
                    {item.pain}
                  </p>
                  <p className="flex items-start gap-1.5 text-sm font-medium leading-snug text-white">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {item.solution}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <div className="relative z-10 flex flex-wrap gap-6 border-t border-white/10 pt-8 text-sm text-emerald-100/70">
          <div>
            <p className="text-2xl font-bold text-white">5+ hrs</p>
            <p>saved weekly on admin</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">1 place</p>
            <p>for students & staff</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Real-time</p>
            <p>rent & occupancy view</p>
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex flex-col justify-center bg-gradient-to-br from-slate-50 to-slate-100 items-center ">
        <div className="lg:hidden mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">Hostellizer</h1>
          </Link>
          <p className="mt-2 text-sm text-slate-600 max-w-md">
            Manage students, rent, attendance, staff, and applications — all in one place.
          </p>
          <ul className="mt-4 space-y-2">
            {VALUE_PROPS.slice(0, 3).map((item) => (
              <li key={item.solution} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                <span>{item.solution}</span>
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md lg:mx-0  lg:mr-0"
        >
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="mt-1 text-slate-600 text-sm">
                Sign in to your hostel owner dashboard
              </p>
            </div>

            <div className="mb-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5">
              <ArrowRight className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
              <p className="text-amber-800 text-sm leading-snug">
                New hostel?{" "}
                <Link href="/" className="font-semibold underline underline-offset-2">
                  Contact us
                </Link>{" "}
                to register and get your login credentials.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-slate-700 font-medium mb-1.5 text-sm">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="owner@yourhostel.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-slate-700 font-medium mb-1.5 text-sm">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3.5 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-red-700 text-sm">{error}</p>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg"
                  >
                    <p className="text-emerald-700 text-sm">Login successful! Redirecting…</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  "Sign in to dashboard"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-slate-500 text-xs">
              Secure access for registered hostel owners only
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
