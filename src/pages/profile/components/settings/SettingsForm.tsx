import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { type AuthUser } from "@/contexts/auth";
import { useUpdateProfile } from "@/pages/profile/hooks";
import InlineLoader from "@/components/shared/InlineLoader";
import { Calendar03Icon, Delete01Icon, Upload01Icon } from "@/icons/figma-icons";
import { toast } from "sonner";
import { formatDateForApi, parseIsoDateSafely } from "@/utils/date";
import { uploadImageFile, deleteUploadedImage } from "@/lib/api/uploadImage";

const inputClassName =
  "h-[38px] w-full rounded-[8px] border border-[#e1e3e8] bg-[#f9fafc] px-3 text-[14px] text-[#010a04] placeholder:text-[#010a04]/45 transition-colors focus-visible:border-[#9ca3af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#9ca3af] disabled:opacity-100";

const MAX_PROFILE_IMAGE_SIZE_MB = 2;
const ACCEPTED_PROFILE_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ACCEPTED_PROFILE_IMAGE_MIME_SET = new Set(ACCEPTED_PROFILE_IMAGE_MIME_TYPES);

function getInitialInputs(user: AuthUser) {
  const dob = user.dateOfBirth ? parseIsoDateSafely(String(user.dateOfBirth)) ?? undefined : undefined;
  return {
    alias: user.alias ?? "",
    name: user.name ?? "",
    profilePictureUrl: user.profilePictureUrl ?? "",
    dateOfBirth: dob,
    gender: (user.gender as "male" | "female" | "other" | "") ?? "",
  };
}

export function SettingsForm({ user }: { user: AuthUser }) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [inputs, setInputs] = useState(() => getInitialInputs(user));
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const { updateProfile, isLoading } = useUpdateProfile();
  const initials =
    [inputs.name, inputs.alias]
      .filter(Boolean)
      .map((value) => value.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  const imageFailed =
    Boolean(inputs.profilePictureUrl) &&
    failedImageUrl === inputs.profilePictureUrl;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const dateValue = formatDateForApi(inputs.dateOfBirth) || null;

    const result = await updateProfile({
      alias: inputs.alias,
      name: inputs.name,
      profilePictureUrl: inputs.profilePictureUrl || null,
      dateOfBirth: dateValue,
      gender: inputs.gender || null,
    });

    if (result.success) {
      toast.success(t("settings.saveSuccess"));
    } else {
      toast.error(result.message);
    }
  };

  const handleProfileImageSelection = async (file: File | null) => {
    if (!file || isLoading || isProcessingImage) return;

    if (!ACCEPTED_PROFILE_IMAGE_MIME_SET.has(file.type)) {
      toast.error(t("settings.profilePictureInvalidFileType"));
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(t("sponsors.logoUpload.fileTooLarge", { maxMb: MAX_PROFILE_IMAGE_SIZE_MB }));
      return;
    }

    setIsProcessingImage(true);
    const prev = inputs.profilePictureUrl;
    try {
      const uploaded = await uploadImageFile({
        file,
        kind: "user_avatar",
        assetId: user.id,
      });

      setInputs((prevInputs) => ({ ...prevInputs, profilePictureUrl: uploaded.url }));
      const result = await updateProfile({ profilePictureUrl: uploaded.url });
      if (!result.success) {
        setInputs((prevInputs) => ({ ...prevInputs, profilePictureUrl: prev }));
        toast.error(result.message);
        return;
      }
      void deleteUploadedImage(prev.startsWith("http") ? prev : null);
      toast.success(t("settings.profilePictureUploadSuccess"));
    } catch (error) {
      setInputs((prevInputs) => ({ ...prevInputs, profilePictureUrl: prev }));
      toast.error(error instanceof Error ? error.message : t("settings.profilePictureUploadError"));
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-3 lg:mb-5 lg:justify-between">
        <h2 className="sr-only text-[20px] font-semibold leading-none text-[#010a04] lg:not-sr-only lg:block">
          {t("settings.title")}
        </h2>
        <Button
          type="submit"
          form="settings-form"
          disabled={isLoading}
          className="h-[30px] shrink-0 rounded-[8px] border border-[rgba(1,10,4,0.12)] bg-brand-accent px-[15px] text-[12px] font-medium text-[#010a04] hover:bg-brand-accent-hover"
        >
          <span className="inline-flex items-center gap-2">
            {isLoading && <InlineLoader size="sm" className="shrink-0" />}
            <span>{t("settings.saveChanges")}</span>
          </span>
        </Button>
      </div>
      <form id="settings-form" onSubmit={handleSave} className="space-y-5">
        <div className="rounded-[10px] border border-[#e5e7eb] bg-[#fbfcfb] p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_PROFILE_IMAGE_MIME_TYPES.join(",")}
            className="hidden"
            onChange={(event) => void handleProfileImageSelection(event.target.files?.[0] ?? null)}
            disabled={isLoading || isProcessingImage}
          />

          <div className="flex items-center gap-4">
            {/* Clickable avatar */}
            <div className="group relative shrink-0">
              <div
                onClick={() => !(isLoading || isProcessingImage) && fileInputRef.current?.click()}
                className="flex size-[68px] cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#d9dee3] bg-white text-[20px] font-semibold text-[#010a04]/65 shadow-[0_1px_2px_rgba(1,10,4,0.05)] transition-all group-hover:border-[#067429]/50 group-hover:shadow-[0_0_0_3px_rgba(6,116,41,0.08)]"
              >
                {isProcessingImage ? (
                  <InlineLoader size="sm" />
                ) : inputs.profilePictureUrl && !imageFailed ? (
                  <img
                    src={inputs.profilePictureUrl}
                    alt={t("settings.profilePicture")}
                    className="size-full object-cover"
                    onError={() => setFailedImageUrl(inputs.profilePictureUrl)}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              {/* Upload overlay icon */}
              {!isProcessingImage && (
                <div
                  onClick={() => !(isLoading || isProcessingImage) && fileInputRef.current?.click()}
                  className="pointer-events-none absolute inset-0 flex items-end justify-end"
                >
                  <div className="flex size-5 items-center justify-center rounded-full border border-[#e1e3e8] bg-white shadow-sm transition-colors group-hover:border-[#067429]/30 group-hover:bg-[#f0faf2]">
                    <Upload01Icon size={10} className="text-[#067429]" />
                  </div>
                </div>
              )}
            </div>

            {/* Text + actions */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-normal text-[#010a04]/70">
                    {t("settings.profilePicture")}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-5 text-[#010a04]/50">
                    {t("settings.profilePictureUploadHint")}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading || isProcessingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-[30px] rounded-[7px] border-[#cfd6dc] bg-white px-2.5 text-[12px] font-medium text-[#010a04] shadow-none hover:bg-[#f4f6f5]"
                  >
                    {isProcessingImage ? (
                      <InlineLoader size="sm" />
                    ) : (
                      <Upload01Icon size={13} className="text-[#067429]" />
                    )}
                    <span>
                      {inputs.profilePictureUrl
                        ? t("settings.profilePictureChange")
                        : t("settings.profilePictureUpload")}
                    </span>
                  </Button>

                  {inputs.profilePictureUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLoading || isProcessingImage}
                      onClick={async () => {
                        const previousUrl = inputs.profilePictureUrl;
                        const result = await updateProfile({ profilePictureUrl: null });
                        if (result.success) {
                          setInputs((prev) => ({ ...prev, profilePictureUrl: "" }));
                        } else {
                          setInputs((prev) => ({ ...prev, profilePictureUrl: previousUrl }));
                          toast.error(result.message);
                        }
                      }}
                      className="h-[30px] rounded-[7px] border-[#ead1d1] bg-white px-2.5 text-[12px] font-medium text-[#b42318] shadow-none hover:bg-[#fff5f5] hover:text-[#b42318]"
                    >
                      <Delete01Icon size={13} className="text-[#b42318]" />
                      <span>{t("settings.profilePictureRemove")}</span>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field className="gap-[10px]">
            <FieldLabel
              htmlFor="settings-email"
              className="text-[12px] font-medium uppercase tracking-normal text-[#010a04]/70"
            >
              {t("signup.emailAddress")}
            </FieldLabel>
            <Input
              id="settings-email"
              type="email"
              disabled
              className={inputClassName}
              value={user.email ?? ""}
            />
          </Field>

          <Field className="gap-[10px]">
            <FieldLabel
              htmlFor="settings-alias"
              className="text-[12px] font-medium uppercase tracking-normal text-[#010a04]/70"
            >
              {t("signup.alias")}
            </FieldLabel>
            <Input
              id="settings-alias"
              type="text"
              name="alias"
              className={inputClassName}
              value={inputs.alias}
              onChange={handleInputChange}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field className="gap-[10px]">
            <FieldLabel
              htmlFor="settings-name"
              className="text-[12px] font-medium uppercase tracking-normal text-[#010a04]/70"
            >
              {t("signup.name")}
            </FieldLabel>
            <Input
              id="settings-name"
              type="text"
              name="name"
              className={inputClassName}
              value={inputs.name}
              onChange={handleInputChange}
            />
          </Field>

          <Field className="gap-[10px]">
            <FieldLabel
              htmlFor="settings-dob"
              className="text-[12px] font-medium uppercase tracking-normal text-[#010a04]/70"
            >
              {t("settings.dateOfBirthOptional")}
            </FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="settings-dob"
                  type="button"
                  variant="outline"
                  className={`${inputClassName} justify-between border-[#e1e3e8] text-left font-medium hover:bg-[#f9fafc]`}
                >
                  {inputs.dateOfBirth ? (
                    <span>{format(inputs.dateOfBirth, "dd/MM/yyyy")}</span>
                  ) : (
                    <span className="text-[#010a04]/45">{t("signup.selectDateOfBirth")}</span>
                  )}
                  <Calendar03Icon size={16} className="ml-2 shrink-0 text-[#010a04]/60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={inputs.dateOfBirth}
                  onSelect={(date) =>
                    setInputs((prev) => ({ ...prev, dateOfBirth: date }))
                  }
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  autoFocus
                  captionLayout="dropdown"
                />
              </PopoverContent>
            </Popover>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field className="gap-[10px]">
            <FieldLabel
              htmlFor="settings-gender"
              className="text-[12px] font-medium uppercase tracking-normal text-[#010a04]/70"
            >
              {t("settings.genderOptional")}
            </FieldLabel>
            <Select
              value={inputs.gender || undefined}
              onValueChange={(value) =>
                setInputs((prev) => ({
                  ...prev,
                  gender: value === "male" || value === "female" || value === "other" ? value : "",
                }))
              }
            >
              <SelectTrigger id="settings-gender" className={`${inputClassName} justify-between`}>
                <SelectValue placeholder={t("signup.selectGender")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("signup.male")}</SelectItem>
                <SelectItem value="female">{t("signup.female")}</SelectItem>
                <SelectItem value="other">{t("signup.other")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="hidden sm:block" aria-hidden />
        </div>
      </form>
    </>
  );
}
