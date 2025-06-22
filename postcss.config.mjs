/**
 * @file postcss.config.mjs
 * @description This file contains the configuration for PostCSS.
 * PostCSS is a tool for transforming CSS with JavaScript plugins.
 * This configuration enables the Tailwind CSS plugin.
 */
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
