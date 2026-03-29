import { ensureStorageDirectories } from "@/lib/storage";
import { getImage, listImages } from "@/lib/images";
import { SynthesizeTool } from "@/components/tools/synthesize-tool";

type PageProps = { searchParams: Promise<{ imageId?: string }> };

export default async function SynthesizePage({ searchParams }: PageProps) {
  await ensureStorageDirectories();
  const params = await searchParams;
  const images = listImages();
  const preselected = params.imageId ? getImage(params.imageId) : null;
  return <SynthesizeTool initialImages={images} preselectedImage={preselected} />;
}
