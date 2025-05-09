import path from "path";
import checker from "vite-plugin-checker";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// ----------------------------------------------------------------------

const PORT = 3001;

export default defineConfig(() => {
  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // 'wcp': ["@wcp/wario-ux-shared", "@wcp/wcpshared"],
          },
        },
      },
      outDir: "dist",
    },
    plugins: [
      react(),
      // checker({
      //   typescript: true,
      //   eslint: {
      //     useFlatConfig: true,
      //     lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
      //     dev: { logLevel: ["error"] },
      //   },
      //   overlay: {
      //     position: "tl",
      //     initialIsOpen: false,
      //   },
      // }),
    ],
    resolve: {
      alias: [
        {
          find: /^~(.+)/,
          replacement: path.resolve(process.cwd(), "node_modules/$1"),
        },
        {
          find: /^src(.+)/,
          replacement: path.resolve(process.cwd(), "src/$1"),
        },
      ],
    },
    server: { port: PORT, host: true },
    preview: { port: PORT, host: true },
  };
});
