import { Suspense } from "react";
import SettingsManager from "./SettingsManager";

export const metadata = { title: "Website Settings" };

export default function Page() {
  return <Suspense><SettingsManager /></Suspense>;
}
