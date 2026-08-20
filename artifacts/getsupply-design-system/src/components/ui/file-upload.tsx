import { useCallback, useRef, useState } from 'react';
import { AlertCircle, FileText, Upload, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

// ---------------------------------------------------------------------------
// FileUpload — drag-and-drop or click-to-upload
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  label?: string;
  helpText?: string;
  /** External validation error shown below the drop zone. */
  error?: string;
  disabled?: boolean;
  onChange?: (files: File[]) => void;
  className?: string;
}

export function FileUpload({
  accept,
  maxSizeMB = 10,
  multiple = false,
  label = 'Arraste ou clique para enviar',
  helpText,
  error,
  disabled = false,
  onChange,
  className,
}: FileUploadProps) {
  const [files, setFiles]       = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = error ?? localError;

  const handleFiles = useCallback(
    (incoming: File[]) => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      const big = incoming.find((f) => f.size > maxBytes);
      if (big) {
        setLocalError(`"${big.name}" excede o limite de ${maxSizeMB} MB.`);
        return;
      }
      setLocalError(null);
      const next = multiple ? [...files, ...incoming] : incoming;
      setFiles(next);
      onChange?.(next);
    },
    [files, maxSizeMB, multiple, onChange],
  );

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onChange?.(next);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) handleFiles(Array.from(e.dataTransfer.files));
  };

  const defaultHelp = `Máximo ${maxSizeMB} MB${accept ? ` · ${accept}` : ''}`;

  return (
    <div className={cn('space-y-3', className)}>
      {/* ── Drop zone ──────────────────────────────── */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' '))
            inputRef.current?.click();
        }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-background hover:bg-muted/40',
          disabled && 'cursor-not-allowed opacity-50',
          displayError && !dragging && 'border-destructive',
        )}
      >
        <Upload
          className={cn(
            'h-8 w-8',
            dragging ? 'text-primary' : 'text-muted-foreground',
          )}
        />
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {helpText ?? defaultHelp}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) handleFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
      </div>

      {/* ── Validation error ───────────────────────── */}
      {displayError && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {displayError}
        </p>
      )}

      {/* ── File list ──────────────────────────────── */}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-none">
                  {file.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                aria-label={`Remover ${file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
