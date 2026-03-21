import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SponsorLogoUploadZone } from "@/components/shared/SponsorLogoUploadZone";
import { toast } from "sonner";
import type { PlatformSponsor, UpsertPlatformSponsorInput } from "@/pages/admin/hooks";

interface SponsorFormState {
  name: string;
  link: string;
  logoUrl: string;
}

const EMPTY_FORM: SponsorFormState = {
  name: "",
  link: "",
  logoUrl: "",
};

const inputClassName =
  "h-[38px] rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] text-sm text-[#010a04] placeholder:text-[#010a04]/50";

export function PlatformSponsorFormDialogForm({
  editingSponsor,
  isSaving,
  onSave,
}: {
  editingSponsor: PlatformSponsor | null;
  isSaving: boolean;
  onSave: (input: UpsertPlatformSponsorInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<SponsorFormState>(() =>
    editingSponsor
      ? {
          name: editingSponsor.name,
          link: editingSponsor.link ?? "",
          logoUrl: editingSponsor.logoUrl ?? "",
        }
      : EMPTY_FORM
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload: UpsertPlatformSponsorInput = {
      name: form.name.trim(),
      link: form.link.trim() || null,
      logoUrl: form.logoUrl.trim() || null,
    };

    if (!payload.name) {
      toast.error(t("admin.platformSponsors.formNameRequired"));
      return;
    }

    await onSave(payload);
  };

  const submitLabel = editingSponsor
    ? t("admin.platformSponsors.formSave")
    : t("admin.platformSponsors.formCreate");

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
      <div className="space-y-2.5">
        <SponsorLogoUploadZone
          logoUrl={form.logoUrl}
          onLogoUrlChange={(nextUrl) => setForm((prev) => ({ ...prev, logoUrl: nextUrl }))}
          disabled={isSaving}
        />
      </div>

      <div className="space-y-[10px]">
        <Label
          htmlFor="admin-platform-sponsor-name"
          className="text-xs font-medium uppercase tracking-normal text-[#010a04]/70"
        >
          {t("admin.platformSponsors.formNameLabel")}
        </Label>
        <Input
          id="admin-platform-sponsor-name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder={t("admin.platformSponsors.formNamePlaceholder")}
          disabled={isSaving}
          className={inputClassName}
        />
      </div>

      <div className="space-y-[10px]">
        <Label
          htmlFor="admin-platform-sponsor-url"
          className="text-xs font-medium uppercase tracking-normal text-[#010a04]/70"
        >
          {t("admin.platformSponsors.formUrlLabel")}
        </Label>
        <Input
          id="admin-platform-sponsor-url"
          type="url"
          value={form.link}
          onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))}
          placeholder={t("admin.platformSponsors.formUrlPlaceholder")}
          disabled={isSaving}
          className={inputClassName}
        />
      </div>

      <Button
        type="submit"
        disabled={isSaving}
        className="h-[38px] w-full rounded-[8px] bg-linear-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] text-base font-medium text-white hover:opacity-95"
      >
        {isSaving ? t("admin.platformSponsors.formSaving") : submitLabel}
      </Button>
    </form>
  );
}
