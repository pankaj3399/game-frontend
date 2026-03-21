import { CloudUpload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface SponsorLogoUploadZoneProps {
	logoUrl: string;
	onLogoUrlChange: (nextUrl: string) => void;
	disabled?: boolean;
	label?: string;
	hint?: string;
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
}: SponsorLogoUploadZoneProps) {
	const { t } = useTranslation();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [isProcessingFile, setIsProcessingFile] = useState(false);
	void logoUrl;

	const labelText = label ?? t('sponsors.logoUpload.label');
	const hintText = hint ?? t('sponsors.logoUpload.hint');

	const handleFileSelection = async (file: File | null) => {
		if (!file) return;

		if (!ACCEPTED_IMAGE_MIME_SET.has(file.type)) {
			toast.error(t('sponsors.logoUpload.invalidFileType'));
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
			toast.success(t('sponsors.logoUpload.toastSuccess'));
		} catch (error) {
			const message = error instanceof Error ? error.message : t('sponsors.logoUpload.toastUploadFailed');
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
		<div className="space-y-[10px]">
			<p className="text-xs font-medium uppercase tracking-normal text-[#010a04]/70">{labelText}</p>

			<input
				ref={fileInputRef}
				type="file"
				accept={ACCEPT_IMAGE_ATTR}
				className="hidden"
				onChange={(event) => void handleFileSelection(event.target.files?.[0] ?? null)}
				disabled={disabled || isProcessingFile}
			/>

			<div
				onDragOver={(event) => event.preventDefault()}
				onDrop={handleDrop}
				className="flex w-full flex-col items-center justify-center gap-[15px] rounded-[8px] border-[1.5px] border-dashed border-[#067429] bg-[#06742914] px-3 py-[25px]"
			>
				<CloudUpload className="size-5 text-[#067429]" />
				<div className="flex flex-col items-center justify-center gap-[14px] text-[#010a04]">
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
									className="font-medium text-[#067429] underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
								>
									{t('sponsors.logoUpload.browseFile')}
								</button>
							</>
						)}
					</p>
					<p className="text-xs leading-normal text-[#010a04]/60">
						{t('sponsors.logoUpload.supports', { maxMb: MAX_FILE_SIZE_MB })}
					</p>
				</div>
			</div>

			<p className="text-[11px] leading-normal text-[#010a04]/60">{hintText}</p>
		</div>
	);
}
