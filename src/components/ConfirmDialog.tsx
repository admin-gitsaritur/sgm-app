import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './ui/Button';
import { IconBadge } from './ui/IconBadge';
import { CellText } from './ui/CellText';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    loading?: boolean;
}

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', loading = false }: ConfirmDialogProps) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="sm"
        footer={
            <>
                <Button variant="outline" onClick={onClose}>
                    Cancelar
                </Button>
                <Button
                    variant="danger"
                    onClick={onConfirm}
                    isLoading={loading}
                >
                    {confirmLabel}
                </Button>
            </>
        }
    >
        <div className="flex items-start gap-3">
            <IconBadge icon={<AlertTriangle className="w-5 h-5" />} theme="rose" size="md" className="rounded-full" />
            <CellText variant="muted" className="pt-2">{message}</CellText>
        </div>
    </Modal>
);
