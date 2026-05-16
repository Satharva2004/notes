import { Link } from "react-router-dom";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { Logo3D } from "@/components/Logo3D";
import testimonialAvatarAsset from "@/assets/testimonial-avatar.jpg.asset.json";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Github, Linkedin } from "lucide-react";
import { StackedLogo } from "@/components/StackedLogo";

const LOGO_VARIANT = 1;
const CUBE_SIZE = 840;
const CUBE_OFFSET_X = -140;
const CUBE_OFFSET_Y = -80;

const Landing = () => {
  const { theme, setTheme } = useTheme();
  const [cubeZoom, setCubeZoom] = useState(() => {
    const w = window.innerWidth;
    return w < 1024 ? 270 : 360;
  });

  useEffect(() => {
    const handleResize = () => {
      setCubeZoom(window.innerWidth < 1024 ? 270 : 360);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDark = theme === "dark";
  const diagonalLineColor = isDark ? "hsl(240 4% 26%" : "hsl(240 4% 80%";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full bg-background border-b border-border px-6">
        <div className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between">
          <Link to="/" className="flex items-center gap-2 -ml-0.5">
            <img src="/logo.jpg" alt="logo" className="h-8 w-8 grid place-items-center rounded-md text-primary" />
            <span className="text-[14px] font-bold text-foreground tracking-[0.08em] uppercase">DumpNotes</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2 text-muted-foreground hidden sm:flex">
              <a href="https://github.com/Satharva2004/notes" target="_blank" rel="noreferrer" className="h-8 w-8 flex items-center justify-center hover:text-foreground transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://www.linkedin.com/in/atharvasawant0804/" target="_blank" rel="noreferrer" className="h-8 w-8 flex items-center justify-center hover:text-foreground transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
              title="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
            <Link to="/auth">
              <button className="text-[13px] text-foreground/70 hover:text-foreground transition-colors h-8 px-3">
                Log in
              </button>
            </Link>
            <Link to="/auth">
              <button className="text-[13px] h-8 px-3 border border-foreground/40 text-foreground hover:bg-foreground hover:text-background transition-colors">
                Sign up
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-16 pb-0 px-6 overflow-hidden">
        <div className="mx-auto max-w-[1200px] relative">
          {/* Two-column hero: text left, cube right */}
          <div className="pt-[52px] pb-16 relative flex">
            {/* Left column — text */}
            <div className="relative z-[3] flex-1 min-w-0 max-w-[540px]">
              <h1 className="text-[clamp(2rem,4vw,3.2rem)] font-[500] leading-[1.08] tracking-[-0.04em] text-foreground max-w-[540px]">
                Start taking notes with a sync
              </h1>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground max-w-[420px]">
                A beautiful, real-time collaborative note-taking application designed for speed and simplicity.
              </p>
              <div className="mt-10 flex items-center gap-4">
                <Link to="/auth">
                  <button className="group relative inline-flex items-center gap-2 px-6 py-3 text-[14px] font-medium bg-foreground text-background transition-all duration-200 hover:bg-foreground/90">
                    Start taking notes
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Right column — 3D cube */}
            <div className="hidden md:block flex-1 relative z-[1] pointer-events-none" style={{ minWidth: 0 }}>
              <div className="absolute top-1/2 right-0 -translate-y-1/2" style={{ width: CUBE_SIZE, height: CUBE_SIZE, transform: `translate(${-CUBE_OFFSET_X}px, calc(-50% + ${CUBE_OFFSET_Y}px))` }}>
                <Logo3D variant={LOGO_VARIANT} size={CUBE_SIZE} zoom={cubeZoom} bgHex={theme === "dark" ? "#0e0e10" : "#ffffff"} lineHex={theme === "dark" ? "#58585e" : "#c0c0c8"} />
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Full-width divider */}
      <div className="relative z-10 w-full border-t border-border" />

      {/* Features */}
      <section className="relative z-10 pt-24 pb-24 px-6 overflow-hidden">
        <div className="mx-auto max-w-[1200px] relative">
          <p className="text-[13px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Built for speed
          </p>
          <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-[500] tracking-[-0.03em] text-foreground max-w-[500px] leading-[1.15]">
            Fast. Beautiful.<br />Collaborative.
          </h2>

          <div className="mt-16 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-3">
              {[
                {
                  title: "Real-time sync",
                  desc: "See cursors and changes instantly as your team types.",
                  graphic: "bars",
                },
                {
                  title: "Instant sharing",
                  desc: "Share a link and collaborate with anyone, anywhere.",
                  graphic: "flow",
                },
                {
                  title: "Beautiful design",
                  desc: "A distraction-free, aesthetic interface that makes writing a joy.",
                  graphic: "chart",
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className={`p-8 ${i < 2 ? "md:border-r border-border" : ""} ${i > 0 ? "border-t md:border-t-0 border-border" : ""}`}
                >
                  <div className="mb-6 h-32 rounded-lg border border-border bg-card/30 flex items-center justify-center">
                    <div className="space-y-2 w-full px-6">
                      {feature.graphic === "bars" && (
                        <>
                          {[
                            { w: "w-full", color: "bg-destructive" },
                            { w: "w-3/4", color: "bg-warning" },
                            { w: "w-1/2", color: "bg-primary" },
                            { w: "w-1/4", color: "bg-success" },
                          ].map((bar, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <div className={`h-2 ${bar.w} rounded-full ${bar.color}`} />
                            </div>
                          ))}
                        </>
                      )}
                      {feature.graphic === "flow" && (
                        <div className="flex items-center justify-between px-2">
                          {["bg-info", "bg-warning", "bg-success"].map((c, j) => (
                            <div key={j} className="flex flex-col items-center gap-2">
                              <div className={`h-8 w-8 rounded-full ${c}`} />
                              <div className="h-1 w-8 rounded-full bg-muted-foreground/10" />
                            </div>
                          ))}
                        </div>
                      )}
                      {feature.graphic === "chart" && (
                        <div className="flex items-end gap-1.5 h-16 px-2">
                          {[40, 65, 45, 80, 55, 70, 90].map((h, j) => (
                            <div key={j} className="relative flex-1 rounded-t border border-border overflow-hidden" style={{ height: `${h}%` }}>
                              <div className="absolute inset-0" style={{
                                backgroundImage: `repeating-linear-gradient(-45deg, ${diagonalLineColor} / 0.5) 0px, ${diagonalLineColor} / 0.5) 1px, transparent 1px, transparent 5px)`,
                              }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-[15px] font-medium text-foreground mb-2">{feature.title}</h3>
                  <p className="text-[13px] leading-[1.6] text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Full-width divider */}
      <div className="relative z-10 w-full border-t border-border" />


      {/* Footer */}
      <div className="relative z-10 border-t border-border">
        <div className="mx-auto max-w-[1200px] px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 -ml-0.5">
            <img src="/logo.jpg" alt="logo" className="h-6 w-6 rounded-md" />
            <span className="text-[12px] font-bold text-foreground uppercase tracking-[0.08em]">DumpNotes</span>
          </div>
          <span className="text-[12px] text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
};

export default Landing;
