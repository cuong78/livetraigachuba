import ViewerPageClient from "@/components/ViewerPageClient";
import { streamApi, recordingApi } from "@/services/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialStream = null;
  let initialRecordings = [];

  try {
    initialStream = await streamApi.getCurrentStream();
  } catch (err) {
    // Backend offline or unreachable at SSR time -> fallback to null
  }

  try {
    initialRecordings = await recordingApi.getRecentRecordings();
  } catch (err) {
    // Backend offline or unreachable at SSR time -> fallback to empty array
  }

  return (
    <ViewerPageClient
      initialStream={initialStream}
      initialRecordings={initialRecordings}
    />
  );
}

