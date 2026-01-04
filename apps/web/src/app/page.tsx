import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center relative overflow-hidden">

      {/* Background Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 mix-blend-screen animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-600/10 rounded-full blur-[100px] -z-10" />

      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center z-50">
        <div className="text-2xl font-bold tracking-tighter text-white">
          Sub<span className="text-indigo-400">mail</span>.
        </div>
        <Link
          href="/dashboard"
          className="glass hover:bg-white/10 px-6 py-2 rounded-full text-sm font-medium transition-all text-white/90 hover:text-white"
        >
          Login
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center flex-1 text-center px-4 max-w-4xl mx-auto mt-10 mb-20">

        {/* Badge */}
        <div className="glass px-4 py-1.5 rounded-full mb-8 inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-indigo-300 tracking-wide uppercase">Discord Gated Security</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
          Identity Protection for <br />
          <span className="text-gradient">Discord Communities</span>
        </h1>

        <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl leading-relaxed">
          Create unlimited email aliases that forward to your real inbox.
          Managed entirely through your Discord identity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/dashboard"
            className="btn-primary px-8 py-4 rounded-xl text-lg font-bold tracking-wide transform hover:scale-105 transition-all"
          >
            Get Started with Discord
          </Link>
          <a // href="https://github.com/minseo0388/submail" 
            className="glass px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            Github Repo
            <span className="text-white/50">↗</span>
          </a>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-32 w-full grid md:grid-cols-3 gap-6">
        <FeatureCard
          title="Zero Spam"
          desc="Turn off an alias instantly if it receives spam. Your real email is never exposed."
          icon="🛡️"
        />
        <FeatureCard
          title="Community Locked"
          desc="Access is strictly limited to members of your verified Discord server."
          icon="🔐"
        />
        <FeatureCard
          title="Open Source"
          desc="Self-hostable and transparent. You own your data and routing rules."
          icon="📦"
        />
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-white/40 text-sm">
        <p>&copy; {new Date().getFullYear()} Submail System. Made by Choi Minseo.</p>
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: string }) {
  return (
    <div className="glass p-8 rounded-2xl hover:bg-white/5 transition-all duration-300 group">
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/60 leading-relaxed">
        {desc}
      </p>
    </div>
  )
}
