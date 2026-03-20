import { CloudUpload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUploadThing } from '@/lib/uploadthing';

interface SponsorLogoUploadZoneProps {
	logoUrl: string;
	onLogoUrlChange: (nextUrl: string) => void;
	disabled?: boolean;
	label?: string;
	hint?: string;
}

const MAX_FILE_SIZE_MB = 8;

export function SponsorLogoUploadZone({
	logoUrl,
	onLogoUrlChange,
	disabled = false,
	label,
	hint,
}: SponsorLogoUploadZoneProps) {
	const { t } = useTranslation();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [isUploadingFile, setIsUploadingFile] = useState(false);

	const labelText = label ?? t('sponsors.logoUpload.label');
	const hintText = hint ?? t('sponsors.logoUpload.hint');

	const { startUpload } = useUploadThing('sponsorLogoUploader', {
		onClientUploadComplete: (files) => {
			const uploaded = files?.[0];
			if (!uploaded?.ufsUrl) {
				toast.error(t('sponsors.logoUpload.toastNoUrl'));
				return;
			}
			onLogoUrlChange(uploaded.ufsUrl);
			toast.success(t('sponsors.logoUpload.toastSuccess'));
		},
		onUploadError: (error: Error) => {
			toast.error(error.message || t('sponsors.logoUpload.toastUploadFailed'));
		},
	});

	const handleFileSelection = async (file: File | null) => {
		if (!file || disabled || isUploadingFile) return;

		if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
			toast.error(t('sponsors.logoUpload.fileTooLarge', { maxMb: MAX_FILE_SIZE_MB }));
			return;
		}

		setIsUploadingFile(true);
		try {
			await startUpload([file]);
		} finally {
			setIsUploadingFile(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const handleBrowseClick = () => {
		if (disabled || isUploadingFile) return;
		fileInputRef.current?.click();
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		if (disabled || isUploadingFile) return;
		void handleFileSelection(event.dataTransfer.files?.[0] ?? null);
	};

	return (
		<div className="space-y-[10px]">
			<p className="text-xs font-medium uppercase tracking-normal text-[#010a04]/70">{labelText}</p>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/png,image/jpeg,image/jpg"
				className="hidden"
				onChange={(event) => void handleFileSelection(event.target.files?.[0] ?? null)}
				disabled={disabled || isUploadingFile}
			/>

			<div
				onDragOver={(event) => event.preventDefault()}
				onDrop={handleDrop}
				className="flex w-full flex-col items-center justify-center gap-[15px] rounded-[8px] border-[1.5px] border-dashed border-[#067429] bg-[#06742914] px-3 py-[25px]"
			>
				<CloudUpload className="size-5 text-[#067429]" />
				<div className="flex flex-col items-center justify-center gap-[14px] text-[#010a04]">
					<p className="text-sm leading-normal">
						{isUploadingFile ? (
							<span>{t('sponsors.logoUpload.uploading')}</span>
						) : (
							<>
								<span>{t('sponsors.logoUpload.dragDropOr')} </span>
								<button
									type="button"
									onClick={handleBrowseClick}
									disabled={disabled || isUploadingFile}
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

			{logoUrl ? (
				<p className="text-[11px] leading-normal text-[#010a04]/60">
					{t('sponsors.logoUpload.uploadedLabel')}{' '}
					<a
						href={logoUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="font-medium text-[#067429] underline underline-offset-2"
					>
						{t('sponsors.logoUpload.uploadedOpenLink')}
					</a>
				</p>
			) : null}
		</div>
	);
}
