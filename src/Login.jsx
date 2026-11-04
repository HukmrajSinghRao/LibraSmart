
import { useState } from "react";
import { supabase } from "./supabase";
import {
  BookOpen,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) throw error;
        onLogin(data.user);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });

        if (error) throw error;

        setMessage("Account created! Please verify your email.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <BookOpen size={32} className="text-cyan-400" />
          <h1 className="text-2xl font-bold tracking-tight">
            Libra<span className="text-cyan-400">Smart</span>
          </h1>
        </div>
        <p className="text-sm text-slate-400 tracking-widest">
          READ <span className="text-cyan-400">•</span> STUDY{" "}
          <span className="text-cyan-400">•</span> GROW
        </p>
      </header>

      {/* Main section */}
      <main className="flex-1 grid lg:grid-cols-2">
        {/* Library image section */}
        <section
          className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-cover bg-center relative"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(7,13,24,0.65), rgba(7,13,24,0.35)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=85')",
          }}
        >
          <div className="relative z-10 max-w-xl">
            <p className="text-cyan-400 text-sm uppercase tracking-[0.3em] mb-6">
              Your space. Your focus.
            </p>

            <h2 className="text-4xl xl:text-5xl font-serif italic leading-tight">
              "A library is not just a room,
              <br />
              but a gateway to a{" "}
              <span className="text-cyan-400">brighter future.</span>"
            </h2>

            <p className="text-slate-400 mt-5">— Unknown</p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-6 border-t border-white/20 pt-8">
            <div>
              <BookOpen className="text-cyan-400 mb-3" size={25} />
              <p className="text-sm text-slate-300">
                Check Seat
                <br />
                Availability
              </p>
            </div>
            <div>
              <ArrowRight className="text-cyan-400 mb-3" size={25} />
              <p className="text-sm text-slate-300">
                Reserve Your
                <br />
                Study Space
              </p>
            </div>
            <div>
              <Lock className="text-cyan-400 mb-3" size={25} />
              <p className="text-sm text-slate-300">
                Your Personal
                <br />
                Library Space
              </p>
            </div>
          </div>
        </section>

        {/* Authentication section */}
        <section className="flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md bg-white/[0.04] border border-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl">
            <div className="text-center mb-8">
              <BookOpen size={42} className="mx-auto text-cyan-400 mb-4" />
              <h2 className="text-3xl font-bold">
                Libra<span className="text-cyan-400">Smart</span>
              </h2>
              <p className="text-slate-400 mt-2">
                Your Smart Library Companion
              </p>
            </div>

            {/* Login / Register tabs */}
            <div className="flex border-b border-white/10 mb-7">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
                className={`w-1/2 pb-3 font-medium transition ${
                  isLogin
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-slate-400"
                }`}
              >
                Login
              </button>

              <button
                onClick={() => {
                  setIsLogin(false);
                  setMessage("");
                }}
                className={`w-1/2 pb-3 font-medium transition ${
                  !isLogin
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-slate-400"
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-4 top-4 text-slate-400"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-4 text-slate-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-4 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-12 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {message && (
                <p className="text-sm text-cyan-300 bg-cyan-400/10 border border-cyan-400/20 rounded-lg p-3">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-900/30 disabled:opacity-50"
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-7">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                }}
                className="text-cyan-400 font-medium hover:text-cyan-300"
              >
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col sm:flex-row justify-between items-center gap-3 px-6 md:px-12 py-5 border-t border-white/10 text-sm text-slate-500">
        <p>LibraSmart • Bikaner Technical University</p>
        <p>
          <span className="text-cyan-400">⟶</span> Smarter Library. Smarter You.
        </p>
      </footer>
    </div>
  );
}
