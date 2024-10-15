import { App } from "./app";
import { Controllers } from "@/controllers";

const app = new App(Controllers);
app.listen();
