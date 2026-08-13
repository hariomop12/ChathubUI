/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
          bg: "var(--primary-bg)",
          glow: "var(--primary-glow)",
        },
        bg: {
          DEFAULT: "var(--bg)",
          card: "var(--bg-card)",
          sidebar: "var(--bg-sidebar)",
          hover: "var(--bg-hover)",
          active: "var(--bg-active)",
        },
        text: {
          DEFAULT: "var(--text)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        border: {
          DEFAULT: "var(--border)",
          light: "var(--border-light)",
        },
        call: {
          green: "var(--call-green)",
          red: "var(--call-red)",
          blue: "var(--call-blue)",
        },
        msg: {
          own: "var(--msg-own)",
          other: "var(--msg-other)",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        full: "9999px",
      },
      fontFamily: {
        sans: ['Inter', 'Nunito Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "audio-bounce": {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
        "typing-bounce": {
          "0%, 80%, 100%": { transform: "scale(0)", opacity: "0.3" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "gradient-shift": "gradient-shift 15s ease infinite",
        "audio-bounce": "audio-bounce 0.8s ease-in-out infinite",
        "typing-bounce": "typing-bounce 1.4s infinite ease-in-out both",
      },
    },
  },
  plugins: [],
};
