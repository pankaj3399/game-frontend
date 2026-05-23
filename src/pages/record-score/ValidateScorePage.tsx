import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage, getHttpStatus } from "@/lib/errors";
import { useValidateTournamentScoreQrConfirmContext } from "@/pages/tournaments/hooks/useTournamentScoreQr";
import {
  pruneScoreQrToken,
  readScoreQrToken,
  storeScoreQrToken,
} from "./scoreQrTokenSession";
import { usePromoteScoreQrTokenFromQuery } from "./hooks/usePromoteScoreQrTokenFromQuery";

export default function ValidateScorePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasNavigatedRef = useRef(false);
  const errorHandledRef = useRef(false);

  const tokenFromQuery = searchParams.get("token")?.trim() ?? "";
  const tokenFromScoreQrQuery = searchParams.get("scoreQrToken")?.trim() ?? "";
  const tokenRef = searchParams.get("qrRef")?.trim() ?? "";
  const tokenFromRef = readScoreQrToken(tokenRef);
  const tokenFromNavigationState =
    typeof (location.state as { scoreQrToken?: unknown } | null)?.scoreQrToken ===
    "string"
      ? String((location.state as { scoreQrToken: string }).scoreQrToken).trim()
      : "";

  usePromoteScoreQrTokenFromQuery();

  const effectiveToken = useMemo(
    () =>
      tokenFromRef ||
      tokenFromNavigationState ||
      tokenFromScoreQrQuery ||
      tokenFromQuery,
    [
      tokenFromNavigationState,
      tokenFromQuery,
      tokenFromRef,
      tokenFromScoreQrQuery,
    ],
  );

  useEffect(() => {
    if (!tokenRef) return;
    if (readScoreQrToken(tokenRef)) return;
    pruneScoreQrToken(tokenRef);
  }, [tokenRef]);

  const validateQuery = useValidateTournamentScoreQrConfirmContext(
    effectiveToken,
    Boolean(effectiveToken),
  );

  const confirmForbidden =
    Boolean(effectiveToken) &&
    !validateQuery.isPending &&
    validateQuery.isError &&
    getHttpStatus(validateQuery.error) === 403;

  const canContinue = Boolean(
    validateQuery.data?.valid === true && validateQuery.data?.request,
  );

  const showRecoverableFailure =
    Boolean(effectiveToken) &&
    !confirmForbidden &&
    !validateQuery.isPending &&
    !validateQuery.isFetching &&
    (validateQuery.isError ||
      (validateQuery.data != null && validateQuery.data.valid === false));

  useEffect(() => {
    if (confirmForbidden) {
      toast.error(
        t(
          "recordScorePage.validate.errors.linkWrongUser",
          "This QR link is not valid for your account.",
        ),
      );
      return;
    }
    if (!showRecoverableFailure || errorHandledRef.current) return;
    errorHandledRef.current = true;
    toast.error(
      validateQuery.isError
        ? getErrorMessage(validateQuery.error) ??
            t("recordScorePage.validate.errors.invalidToken")
        : validateQuery.data?.message ??
            t("recordScorePage.validate.errors.invalidToken"),
    );
    navigate("/record-score/validate/scan", { replace: true });
  }, [
    confirmForbidden,
    navigate,
    showRecoverableFailure,
    t,
    validateQuery.data?.message,
    validateQuery.error,
    validateQuery.isError,
  ]);

  useEffect(() => {
    if (!canContinue || !effectiveToken || hasNavigatedRef.current) return;
    const req = validateQuery.data?.request;
    if (!req) return;

    hasNavigatedRef.current = true;
    const storedRef = storeScoreQrToken(effectiveToken);
    const encodedMatchId = encodeURIComponent(req.matchId);
    const encodedTournamentId = encodeURIComponent(req.tournamentId ?? "");
    const encodedTournamentName = req.tournamentName?.trim()
      ? encodeURIComponent(req.tournamentName.trim())
      : "";
    const tokenSearchPart = storedRef
      ? `qrRef=${encodeURIComponent(storedRef)}`
      : `scoreQrToken=${encodeURIComponent(effectiveToken)}`;
    const targetSearch = [
      "mode=confirm",
      tokenSearchPart,
      `matchId=${encodedMatchId}`,
      `tournamentId=${encodedTournamentId}`,
      encodedTournamentName ? `tournamentName=${encodedTournamentName}` : "",
    ]
      .filter(Boolean)
      .join("&");
    navigate(`/record-score/manual?${targetSearch}`, {
      replace: true,
      ...(storedRef ? {} : { state: { scoreQrToken: effectiveToken } }),
    });
  }, [canContinue, effectiveToken, navigate, validateQuery.data?.request]);

  if (!effectiveToken) {
    return <Navigate to="/record-score/validate/scan" replace />;
  }

  if (confirmForbidden) {
    return <Navigate to="/record-score/validate/scan" replace />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0f1210]">
      <p className="text-sm text-white/70">
        {t("recordScorePage.validate.validationLoadingHint", "Checking QR token…")}
      </p>
    </div>
  );
}
