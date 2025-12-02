"use client";

import { Button, Dialog } from "@whop/react/components";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "success" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: {
      icon: <XCircle className="w-12 h-12 text-red-11" />,
      confirmClass: "bg-red-9 hover:bg-red-10 text-white",
    },
    success: {
      icon: <CheckCircle className="w-12 h-12 text-green-11" />,
      confirmClass: "bg-green-9 hover:bg-green-10 text-white",
    },
    warning: {
      icon: <AlertTriangle className="w-12 h-12 text-yellow-11" />,
      confirmClass: "bg-yellow-9 hover:bg-yellow-10 text-white",
    },
    info: {
      icon: <Info className="w-12 h-12 text-blue-11" />,
      confirmClass: "bg-blue-9 hover:bg-blue-10 text-white",
    },
  };

  const config = variantConfig[variant];

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="max-w-md">
        <div className="flex flex-col items-center text-center p-6">
          <div className="mb-4">{config.icon}</div>

          <Dialog.Title className="text-5 font-semibold text-gray-12 mb-2">
            {title}
          </Dialog.Title>

          <Dialog.Description className="text-3 text-gray-11 mb-6">
            {message}
          </Dialog.Description>

          <div className="flex gap-3 w-full">
            <Button
              variant="surface"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 cursor-pointer"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 cursor-pointer ${config.confirmClass}`}
            >
              {isLoading ? "Processing..." : confirmText}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
