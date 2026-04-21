/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        "on-primary": "#e2e2e2",
        surface: "#f9f9f9",
        "surface-container": "#eeeeee",
        "surface-container-low": "#f3f3f4",
        "surface-container-highest": "#e2e2e2",
        tertiary: "#7d001d",
        "tertiary-fixed": "#ba1434",
        "accent-red": "#C41E3A",
        "outline-variant": "#c6c6c6",
        "on-surface": "#1a1a1a",
        "on-surface-variant": "#474747",
      },
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        full: 9999,
      },
      fontFamily: {
        headline: ["System"],
        "headline-medium": ["System"],
        body: ["Inter_400Regular", "Inter_300Light"],
        "body-medium": ["Inter_500Medium"],
        label: ["System"],
        "label-bold": ["System"],
      },
      letterSpacing: {
        widest: "0.15em",
        wider: "0.1em",
        wide: "0.05em",
      },
    },
  },
  plugins: [],
};
