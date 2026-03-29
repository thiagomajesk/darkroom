import { ensureStorageDirectories } from "@/lib/storage";
import { listImages } from "@/lib/images";
import { HomePage } from "@/components/home/home-page";

export default async function Home() {
  await ensureStorageDirectories();
  const images = listImages();
  return <HomePage initialImages={images} />;
}
