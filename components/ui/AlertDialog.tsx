"use client";

import { Button, Dialog } from "@whop/react/components";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  variant?: "danger" | "success" | "warning" | "info";
}

export default function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "OK",
  variant = "info",
}: AlertDialogProps) {
  const variantConfig = {
    danger: {
      icon: <XCircle className="w-12 h-12 text-red-11" />,
      buttonClass: "bg-red-9 hover:bg-red-10 text-white",
    },
    success: {
      icon: <CheckCircle className="w-12 h-12 text-green-11" />,
      buttonClass: "bg-green-9 hover:bg-green-10 text-white",
    },
    warning: {
      icon: <AlertTriangle className="w-12 h-12 text-yellow-11" />,
      buttonClass: "bg-yellow-9 hover:bg-yellow-10 text-white",
    },
    info: {
      icon: <Info className="w-12 h-12 text-blue-11" />,
      buttonClass: "bg-blue-9 hover:bg-blue-10 text-white",
    },
  };

  const config = variantConfig[variant];

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

          <Button
            onClick={onClose}
            className={`w-full cursor-pointer ${config.buttonClass}`}
          >
            {buttonText}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
