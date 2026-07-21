/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // these are breakpoint import from mantine ui
      screens: {
        xm: "576px",
        sm: "768px",
        md: "992px",
        lg: "1200px",
        xl: "1400px",
        "2xl": "1536px",
      },
      colors: {
        brand: {
          primary: "#0A6925",
          secondary: "#F4C95D",
          tertiary: "#D96D00",
          black: "#010A04",
          white: "#F3F8F4",
          divider: "#010A04",
        },
        tableBorder: "#010A0414",
        tableHeader: "#010A040A",
        tableBorderBottom: "#0000000F",
        tab: "#010A040D",
      },
      fontFamily: {
        primary: ["var(--font-primary)"],
        secondary: ["var(--font-secondary)"],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          lg: "2rem",
        },
        screens: {
          sm: "100%",
          md: "1200px",
          lg: "1340px",
          "2xl": "1400px",
        },
      },
      backgroundImage: {
        "gradient-btn":
          "linear-gradient(239.35deg,rgb(69, 250, 9) -70.22%,rgb(209, 122, 16) 182.39%)",
      },
      boxShadow: {
        "gradient-btn-shadow": "0px 12px 24px 0px #211D4C29",
        "auth-pop-shadow": "0px 24px 40px 0px #00000014",
        table: "0px 3px 15px 0px #0000000F",
        tab: "0px 4px 8px 0px #0000000F",
        info: "0px 6px 16px 0px #0000001F",
      },
      keyframes: {
        jerk: {
          "0%, 100%": { transform: "translateY(0)" },
          "25%": { transform: "translateY(-2px)" },
          "75%": { transform: "translateY(2px)" },
        },
      },
      animation: {
        jerk: "jerk 0.2s ease-in-out",
      },
    },
  },
  plugins: [],
};
