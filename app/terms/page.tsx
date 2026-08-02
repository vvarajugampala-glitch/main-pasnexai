import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-blue-300 transition hover:text-white">
          Back to Pasnex.ai
        </Link>
        <section className="mt-8 rounded-lg border border-white/10 bg-[#07101d]/90 p-6 shadow-[0_20px_70px_rgba(0,0,0,.22)] sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Terms of Service</p>
          <h1 className="mt-4 text-4xl font-black">Terms for using Pasnex.ai</h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">Last updated: July 23, 2026</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-300">
            <section>
              <h2 className="text-xl font-bold text-white">Services</h2>
              <p className="mt-3">
                Pasnex.ai provides AI automation, social media conversation workflows, lead capture, customer support automation, and related consulting services for businesses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white">Acceptable Use</h2>
              <p className="mt-3">
                You agree not to use Pasnex.ai for spam, deceptive messaging, illegal content, platform policy violations, or unauthorized collection of personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white">Customer Responsibilities</h2>
              <p className="mt-3">
                Customers are responsible for providing accurate business information, obtaining required permissions from end users, and following the policies of platforms such as Meta, WhatsApp, Instagram, and Facebook.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white">Payments and Plans</h2>
              <p className="mt-3">
                Pricing, features, and limits may vary by plan. Custom or enterprise services may require separate written agreement before implementation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white">Limitation of Liability</h2>
              <p className="mt-3">
                Pasnex.ai is provided on a reasonable-efforts basis. We are not responsible for indirect losses, platform outages, third-party service changes, or business results outside our control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white">Contact</h2>
              <p className="mt-3">
                For questions, contact pasnexai@gmail.com or call +91 8919052808.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
