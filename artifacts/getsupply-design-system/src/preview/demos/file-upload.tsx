import { FileUpload } from '../../components/ui/file-upload';
import { Stack } from '../parts';

export function FileUploadDemo() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <Stack label="Upload simples">
        <FileUpload
          accept=".pdf,.png,.jpg"
          helpText="PDF, PNG ou JPG · Máximo 10 MB"
        />
      </Stack>

      <Stack label="Múltiplos arquivos">
        <FileUpload
          multiple
          label="Envie os arquivos de arte gráfica"
          helpText="AI, PDF, SVG, PNG · Máximo 20 MB por arquivo"
          maxSizeMB={20}
        />
      </Stack>

      <Stack label="Estado de erro">
        <FileUpload error="Formato não suportado. Use PDF, PNG ou JPG." />
      </Stack>

      <Stack label="Desabilitado">
        <FileUpload disabled label="Upload desabilitado" />
      </Stack>
    </div>
  );
}
