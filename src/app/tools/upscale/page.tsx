import { ensureStorageDirectories } from "@/lib/storage";
import { getImage, listImages } from "@/lib/images";
import { UpscaleTool } from "@/components/tools/upscale-tool";

type PageProps = { searchParams: Promise<{ imageId?: string }> };

export default async function UpscalePage({ searchParams }: PageProps) {
  await ensureStorageDirectories();
  const params = await searchParams;
  const images = listImages();
  const preselected = params.imageId ? getImage(params.imageId) : null;
  return <UpscaleTool initialImages={images} preselectedImage={preselected} />;
}
