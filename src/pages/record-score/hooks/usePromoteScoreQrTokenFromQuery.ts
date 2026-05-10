import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { storeScoreQrToken } from "../scoreQrTokenSession";

/**
 * When `?token=` is present, moves it into session (`qrRef`) or navigation state and
 * replaces the URL on `/record-score/validate` (entry from validate or scan routes).
 */
export function usePromoteScoreQrTokenFromQuery() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token")?.trim() ?? "";

  useEffect(() => {
    if (!tokenFromQuery) return;

    const storedRef = storeScoreQrToken(tokenFromQuery);
    if (storedRef) {
      navigate(`/record-score/validate?qrRef=${encodeURIComponent(storedRef)}`, {
        replace: true,
      });
      return;
    }

    navigate("/record-score/validate", {
      replace: true,
      state: { scoreQrToken: tokenFromQuery },
    });
  }, [navigate, tokenFromQuery]);
}
