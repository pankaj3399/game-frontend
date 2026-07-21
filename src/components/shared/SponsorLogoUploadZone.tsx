import { CloudUpload, XIcon } from '@/icons/figma-icons';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadImageFile, type AssetKind } from '@/lib/api/uploadImage';

interface SponsorLogoUploadZoneProps {
	logoUrl: string;
	onLogoUrlChange: (nextUrl: string) => void;
	kind?: AssetKind;
	assetId?: string;
	disabled?: boolean;
	label?: string;
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

/** Matches empty-state drop zone footprint so preview does not jump layout. */
const UPLOAD_ZONE_HEIGHT_CLASS = 'h-[56px] min-h-[56px]';
const UPLOAD_ZONE_EMPTY_CLASS =
	'relative w-full overflow-hidden rounded-[10px] border-2 border-dashed border-[#067429] bg-[#f0fdf4]';
const UPLOAD_ZONE_PREVIEW_CLASS =
	'relative w-full overflow-hidden rounded-[10px] bg-[#f9fafc]';

export function SponsorLogoUploadZone({
	logoUrl,
	onLogoUrlChange,
	kind = 'sponsor_logo',
	assetId,
	disabled = false,
	label,
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
			const uploaded = await uploadImageFile({
				file,
				kind,
				assetId,
				replaceUrl: trimmedLogo.startsWith('http') ? trimmedLogo : null,
			});
			onLogoUrlChange(uploaded.url);
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

	const handleRemoveLogo = () => {
		if (disabled || isProcessingFile) return;
		onLogoUrlChange('');
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		if (disabled || isProcessingFile) return;
		void handleFileSelection(event.dataTransfer.files?.[0] ?? null);
	};

	return (
		<div
			className="space-y-2"
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
				<div
					className={cn(
						UPLOAD_ZONE_PREVIEW_CLASS,
						UPLOAD_ZONE_HEIGHT_CLASS,
						'relative flex items-center justify-center',
					)}
				>
					<button
						type="button"
						onClick={handleBrowseClick}
						disabled={disabled || isProcessingFile}
						aria-label={t('sponsors.logoUpload.browseFile')}
						className={cn(
							'flex h-full w-full items-center justify-center p-0 outline-none focus-visible:ring-2 focus-visible:ring-[#067429] focus-visible:ring-offset-2',
							(disabled || isProcessingFile) && 'cursor-not-allowed opacity-70',
							!disabled && !isProcessingFile && 'cursor-pointer',
						)}
					>
						<img
							src={trimmedLogo}
							alt=""
							className="max-h-full max-w-full object-contain"
						/>
					</button>
					<button
						type="button"
						onClick={handleRemoveLogo}
						disabled={disabled || isProcessingFile}
						aria-label={t('sponsors.logoUpload.removeLogo')}
						className={cn(
							'absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#010a04]/75 text-white outline-none transition-colors hover:bg-[#010a04]/90 focus-visible:ring-2 focus-visible:ring-[#067429] focus-visible:ring-offset-1',
							(disabled || isProcessingFile) && 'cursor-not-allowed opacity-70',
						)}
					>
						<XIcon size={14} aria-hidden />
					</button>
					{isProcessingFile ? (
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70">
							<span className="text-sm font-medium text-[#010a04]">
								{t('sponsors.logoUpload.uploading')}
							</span>
						</div>
					) : null}
				</div>
			) : (
				<>
				<div
					className={cn(
						UPLOAD_ZONE_EMPTY_CLASS,
						UPLOAD_ZONE_HEIGHT_CLASS,
						'flex flex-row items-center justify-center gap-2.5 px-4 py-3',
					)}
				>
					<CloudUpload className="size-5 shrink-0 text-neutral-500" />
					<div className="flex flex-col items-start gap-0.5 text-[#010a04]">
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
			</>
			)}
		</div>
	);
}
