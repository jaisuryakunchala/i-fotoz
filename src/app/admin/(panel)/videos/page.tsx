import { Suspense } from "react";
import VideosManager from "./VideosManager";

export const metadata = { title: "Videos" };

export default function Page() {
  return <Suspense><VideosManager /></Suspense>;
}
