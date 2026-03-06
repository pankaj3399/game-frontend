import type { AppleFlowTrace } from "@/lib/auth/appleFlow";

interface AppleFlowDetailsProps {
  trace?: AppleFlowTrace | null;
  errorMessage?: string | null;
  applePayload?: Record<string, unknown> | null;
  title?: string;
  description?: string;
}

const levelClasses: Record<"info" | "warn" | "error", string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
}

export function AppleFlowDetails({
  trace,
  errorMessage,
  applePayload,
  title = "Apple sign-in trace",
  description = "Every recorded step from the backend callback is shown below.",
}: AppleFlowDetailsProps) {
  if (!trace && !errorMessage && !applePayload) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      {trace ? (
        <div className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 sm:grid-cols-2">
          <div>
            <span className="font-semibold text-slate-900">Trace ID:</span> {trace.traceId}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Status:</span> {trace.status}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Outcome:</span> {trace.outcomeCode ?? "n/a"}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Updated:</span> {formatTimestamp(trace.updatedAt)}
          </div>
          {trace.summary ? (
            <div className="sm:col-span-2">
              <span className="font-semibold text-slate-900">Summary:</span> {trace.summary}
            </div>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-900">
          <p className="font-semibold">Error message</p>
          <p className="mt-1 whitespace-pre-wrap break-words">{errorMessage}</p>
        </div>
      ) : null}

      {trace?.events?.length ? (
        <ol className="mt-4 space-y-3">
          {trace.events.map((event, index) => (
            <li
              key={`${event.at}-${event.code}-${index}`}
              className={`rounded-lg border p-3 ${levelClasses[event.level] ?? levelClasses.info}`}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-semibold">{event.message}</div>
                <div className="text-xs opacity-80">{formatTimestamp(event.at)}</div>
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide opacity-80">{event.code}</div>
              {event.details && Object.keys(event.details).length > 0 ? (
                <pre className="mt-3 overflow-auto rounded-md bg-white/70 p-3 text-xs text-slate-900">
                  {JSON.stringify(event.details, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {applePayload && Object.keys(applePayload).length > 0 ? (
        <details className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer font-semibold text-slate-900">Sanitized Apple callback payload</summary>
          <pre className="mt-3 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-900">
            {JSON.stringify(applePayload, null, 2)}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

export default AppleFlowDetails;
