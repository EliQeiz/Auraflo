/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Screenshot-derived AuraFlow palette: deep violet base, cyan CTA, and violet profile glow.
        "background-dark": "#0A0118",
        "background-panel": "#120D25",
        "primary-glow": "#6D5DFB",
        "accent-cyan": "#00E5FF",
        "accent-light-blue": "#5B7CFF",
        "accent-purple": "#8B5CF6",
        "accent-violet": "#A855F7",
        "text-main": "#F0F9FF",
        "text-muted": "#A8B3CF",
        "glass-backdrop": "rgba(17, 20, 45, 0.58)",
      },
      boxShadow: {
        // Use with hover transitions for the diffuse neon halo seen in the reference.
        "cyan-glow": "0 0 24px rgba(0, 229, 255, 0.42)",
        "purple-glow": "0 0 28px rgba(139, 92, 246, 0.45)",
        "card-glow": "0 20px 80px rgba(0, 229, 255, 0.10)",
      },
      backgroundImage: {
        "cta-cyan": "linear-gradient(135deg, #00E5FF 0%, #5B7CFF 100%)",
        "profile-purple": "radial-gradient(circle at 30% 20%, #A855F7 0%, #6D5DFB 45%, #31205C 100%)",
        "aurora-field":
          "radial-gradient(circle at 15% 30%, rgba(109, 93, 251, 0.34), transparent 32%), radial-gradient(circle at 85% 28%, rgba(0, 229, 255, 0.24), transparent 28%), linear-gradient(135deg, #0A0118 0%, #090B1B 48%, #04131A 100%)",
      },
      borderColor: {
        glass: "rgba(240, 249, 255, 0.14)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Orbitron", "Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
