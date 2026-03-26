import path from "node:path";
import { fileURLToPath } from "node:url";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Explicit config so custom `theme.extend` colors resolve in `@apply` (fixes missing `bg-market-*`). */
export default {
  plugins: [
    tailwindcss({ config: path.join(__dirname, "tailwind.config.js") }),
    autoprefixer(),
  ],
};
