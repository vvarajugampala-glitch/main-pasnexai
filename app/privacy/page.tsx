import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-blue-300 transition hover:text-white">
          Back to Pasnex.ai
        </Link>
        <section className="mt-8 rounded-lg border border-white/10 bg-[#07101d]/90 p-6 shadow-[0_20px_70px_rgba(0,0,0,.22)] sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Privacy Policy</p>
          <h1 className="mt-4 text-4xl font-black">How Pasnex.ai handles your information</h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">Last updated: July 23, 2026</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-300">
            <section>
              <h2 className="text-xl font-bold text-white">Information We Collect</h2>
              <p className="mt-3">
                We collect information you submit through our demo form, email, phone, or WhatsApp, including your name, business name, contact details, social media channels, and automation requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white">How We Use Information</h2>
              <p className="mt-3">
                We use your information to respond to enquiries, schedule demos, recommend automation workflows, provide support, improve our services, and communicate business updates.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white">Data Sharing</h2>
              <p className="mt-3">
                We do not sell your personal information. We may use trusted service providers for email delivery, hosting, analytics, communication, and support where required to operate Pasnex.ai.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white">Security</h2>
              <p className="mt-3">
                We use reasonable technical and organizational safeguards to protect business enquiries and customer communication data. No online service can guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white">Your Choices</h2>
              <p className="mt-3">
                You can request correction or deletion of your information by contacting us at pasnexai@gmail.com or +91 8919052808.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white">Contact</h2>
              <p className="mt-3">
                Email: pasnexai@gmail.com
                <br />
                Phone: +91 8919052808
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
