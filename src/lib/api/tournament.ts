
import { api } from "@/lib/api";

export async function cancelActiveTournamentScoreQrSession(): Promise<void> {
  await api.delete("/api/tournaments/score-qr/active");
}
