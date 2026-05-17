import { CloudUpload } from '@/icons/figma-icons';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SponsorLogoUploadZoneProps {
	logoUrl: string;
	onLogoUrlChange: (nextUrl: string) => void;
	disabled?: boolean;
	label?: string;
	hint?: string;
	successMessage?: string;
	uploadFailedMessage?: string;
	invalidFileTypeMessage?: string;
}

const MAX_FILE_SIZE_MB = 2;

const ACCEPTED_IMAGE_MIME_TYPES = [
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/webp',
] as const;

const ACCEPT_IMAGE_ATTR = ACCEPTED_IMAGE_MIME_TYPES.join(',');
const ACCEPTED_IMAGE_MIME_SET = new Set<string>(ACCEPTED_IMAGE_MIME_TYPES);

export function SponsorLogoUploadZone({
	logoUrl,
	onLogoUrlChange,
	disabled = false,
	label,
	hint,
	successMessage,
	uploadFailedMessage,
	invalidFileTypeMessage,
}: SponsorLogoUploadZoneProps) {
	const { t } = useTranslation();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [isProcessingFile, setIsProcessingFile] = useState(false);

	const trimmedLogo = logoUrl.trim();
	const hasLogoPreview = trimmedLogo.length > 0;

	const labelText = label ?? t('sponsors.logoUpload.label');
	const hintText = hint ?? t('sponsors.logoUpload.hint');

	const handleFileSelection = async (file: File | null) => {
		if (!file) return;

		if (!ACCEPTED_IMAGE_MIME_SET.has(file.type)) {
			toast.error(invalidFileTypeMessage ?? t('sponsors.logoUpload.invalidFileType'));
			return;
		}

		if (disabled || isProcessingFile) return;

		if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
			toast.error(t('sponsors.logoUpload.fileTooLarge', { maxMb: MAX_FILE_SIZE_MB }));
			return;
		}

		setIsProcessingFile(true);
		try {
			const base64 = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(String(reader.result));
				reader.onerror = () => reject(new Error('Failed to read image file'));
				reader.readAsDataURL(file);
			});

			onLogoUrlChange(base64);
			toast.success(successMessage ?? t('sponsors.logoUpload.toastSuccess'));
		} catch (error) {
			const message =
				uploadFailedMessage ??
				(error instanceof Error ? error.message : t('sponsors.logoUpload.toastUploadFailed'));
			toast.error(message);
		} finally {
			setIsProcessingFile(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const handleBrowseClick = () => {
		if (disabled || isProcessingFile) return;
		fileInputRef.current?.click();
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		if (disabled || isProcessingFile) return;
		void handleFileSelection(event.dataTransfer.files?.[0] ?? null);
	};

	return (
		<div
			className="space-y-2.5"
			onDragOver={(event) => event.preventDefault()}
			onDrop={handleDrop}
		>
			<p className="text-xs font-medium uppercase tracking-[0.06em] text-[#010a04]/50">
				{labelText}
			</p>

			<input
				ref={fileInputRef}
				type="file"
				accept={ACCEPT_IMAGE_ATTR}
				className="hidden"
				onChange={(event) => void handleFileSelection(event.target.files?.[0] ?? null)}
				disabled={disabled || isProcessingFile}
			/>

			{hasLogoPreview ? (
				<div className="flex flex-col items-center">
					<button
						type="button"
						onClick={handleBrowseClick}
						disabled={disabled || isProcessingFile}
						aria-label={t('sponsors.logoUpload.browseFile')}
						className={cn(
							'relative flex w-full max-w-full flex-col items-center justify-center rounded-lg border-0 bg-transparent p-0 outline-none',
							'focus-visible:ring-2 focus-visible:ring-[#067429] focus-visible:ring-offset-2',
							(disabled || isProcessingFile) && 'cursor-not-allowed opacity-70',
							!disabled && !isProcessingFile && 'cursor-pointer',
						)}
					>
						<img
							src={trimmedLogo}
							alt=""
							className="max-h-[min(180px,40vh)] w-auto max-w-full object-contain"
						/>
						{isProcessingFile ? (
							<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70">
								<span className="text-sm font-medium text-[#010a04]">
									{t('sponsors.logoUpload.uploading')}
								</span>
							</div>
						) : null}
					</button>

					<div className="mt-4 h-px w-full bg-[#e5e5e5]" aria-hidden />

					<p className="mt-3 w-full text-center text-[11px] leading-normal text-[#010a04]/55">
						{hintText}
					</p>
				</div>
			) : (
				<>
					<div className="flex w-full flex-col items-center justify-center gap-3 rounded-[10px] border-2 border-dashed border-[#067429] bg-[#f0fdf4] px-4 py-8">
						<CloudUpload className="size-6 shrink-0 text-neutral-500" />
						<div className="flex w-full flex-col items-center gap-3 text-center text-[#010a04]">
							<p className="text-sm leading-normal">
								{isProcessingFile ? (
									<span>{t('sponsors.logoUpload.uploading')}</span>
								) : (
									<>
										<span>{t('sponsors.logoUpload.dragDropOr')} </span>
										<button
											type="button"
											onClick={handleBrowseClick}
											disabled={disabled || isProcessingFile}
											className="font-medium text-[#067429] underline underline-offset-2 decoration-[#067429] disabled:cursor-not-allowed disabled:opacity-70"
										>
											{t('sponsors.logoUpload.browseFile')}
										</button>
									</>
								)}
							</p>
							<p className="text-xs leading-normal text-[#010a04]/55">
								{t('sponsors.logoUpload.supports', { maxMb: MAX_FILE_SIZE_MB })}
							</p>
						</div>
					</div>

					<p className="text-center text-[11px] leading-normal text-[#010a04]/55">
						{hintText}
					</p>
				</>
			)}
		</div>
	);
}
