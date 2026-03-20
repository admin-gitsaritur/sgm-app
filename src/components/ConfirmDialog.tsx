import { AlertModal } from './ui/SariturModal';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false
}: any) {
  return (
    <AlertModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      type="danger"
      title={title}
      message={description}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}
