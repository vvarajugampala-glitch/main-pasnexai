import Link from "next/link";
import { FaPhoneAlt } from "react-icons/fa";
import { HiCheckBadge, HiOutlineArrowLeft, HiOutlineSparkles } from "react-icons/hi2";
import { SiWhatsapp } from "react-icons/si";

const whatsappLink =
  "https://wa.me/918919052808?text=Hi%20Pasnex.ai%2C%20I%20submitted%20the%20demo%20form%20and%20want%20to%20discuss%20automation.";

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-5xl items-center justify-center">
        <section className="relative w-full overflow-hidden rounded-lg border border-white/10 bg-[#07101d]/90 p-6 text-center shadow-[0_24px_80px_rgba(37,99,235,.22)] sm:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_35px_rgba(37,99,235,.45)]">
            <HiCheckBadge className="h-9 w-9 text-white" />
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-blue-300">
            Request submitted successfully
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Thank you. Your Pasnex.ai demo request is confirmed.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            We received your business details, contact number, and automation requirement. Our team will review your channels and reply within 24 hours with the best setup plan.
          </p>

          <div className="mx-auto mt-8 grid max-w-3xl gap-4 text-left md:grid-cols-3">
            {[
              "Review your business and selected channel",
              "Prepare a practical automation workflow",
              "Contact you by email or WhatsApp",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <HiOutlineSparkles className="h-6 w-6 text-violet-300" />
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(16,185,129,.28)] transition hover:-translate-y-1"
            >
              <SiWhatsapp className="h-5 w-5" />
              Message on WhatsApp
            </a>
            <a
              href="tel:+918919052808"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-1 hover:border-blue-300/50 hover:bg-white/[0.08]"
            >
              <FaPhoneAlt className="h-4 w-4 text-blue-300" />
              Call +91 8919052808
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-1 hover:border-blue-300/50 hover:bg-white/[0.08]"
            >
              <HiOutlineArrowLeft className="h-5 w-5 text-blue-300" />
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
