import { render } from "phase.ts";

import { App } from "./App";

const root = document.getElementById("app");
if (root) render(App, root);
