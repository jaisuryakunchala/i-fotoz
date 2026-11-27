import { Suspense } from "react";
import PhotosManager from "./PhotosManager";

export const metadata = { title: "Photos" };

export default function Page() {
  return <Suspense><PhotosManager /></Suspense>;
}
