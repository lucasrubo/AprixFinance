"use client";

import React, { useRef, useState, useCallback } from "react";
import { Camera, X, RotateCw, Check } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  onCancel?: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cleanup ao desmontar componente
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);

      // Verificar se o navegador suporta mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(
          "Seu navegador não suporta acesso à câmera. Use um navegador moderno como Chrome, Firefox ou Safari.",
        );
        return;
      }

      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!stream) {
        setError("Não foi possível obter acesso à câmera.");
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);

      // Mensagens de erro mais específicas
      if (err.name === "NotAllowedError") {
        setError(
          "Acesso à câmera foi negado. Permita o acesso nas configurações do navegador.",
        );
      } else if (
        err.name === "NotFoundError" ||
        err.name === "NotSupportedError"
      ) {
        setError("Nenhuma câmera foi encontrada no dispositivo.");
      } else if (
        err.name === "NotReadableError" ||
        err.name === "SecurityError"
      ) {
        setError(
          "Não foi possível acessar a câmera. Tente recarregar a página ou use HTTPS.",
        );
      } else {
        setError(
          `Erro ao acessar câmera: ${err.message || "Erro desconhecido"}`,
        );
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Definir tamanho do canvas igual ao vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame atual no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para base64
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageBase64);
    stopCamera();
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleCancel = () => {
    stopCamera();
    setCapturedImage(null);
    onCancel?.();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-red-500 text-center">
          <p className="font-medium">❌ Erro ao acessar câmera</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
        <div className="text-xs text-muted-foreground text-center bg-muted p-3 rounded-lg">
          <p className="mb-2">💡 Dicas para resolver:</p>
          <ul className="text-left space-y-1">
            <li>• Verifique se está em uma página segura (HTTPS)</li>
            <li>• Confirme que o navegador tem permissão de câmera</li>
            <li>• Nenhuma outra aba está usando a câmera</li>
            <li>• Tente recarregar a página</li>
          </ul>
        </div>
        <Button onClick={handleCancel} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  if (capturedImage) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <img
            src={capturedImage}
            alt="Recibo capturado"
            className="w-full h-auto max-h-96 object-contain rounded-lg border"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={retakePhoto} variant="outline" className="flex-1">
            <RotateCw className="w-4 h-4 mr-2" />
            Tirar Novamente
          </Button>
          <Button onClick={confirmCapture} className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Usar esta Foto
          </Button>
        </div>

        <Button onClick={handleCancel} variant="ghost" className="w-full">
          Cancelar
        </Button>
      </div>
    );
  }

  if (!isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Camera className="w-16 h-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-medium">Capturar Recibo</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Posicione o recibo na câmera para capturar automaticamente os dados
          </p>
        </div>
        <div className="text-xs text-muted-foreground text-center bg-muted p-3 rounded-lg">
          ⚠️ Certifique-se que o navegador tem permissão para acessar a câmera
        </div>
        <div className="flex gap-2">
          <Button onClick={startCamera}>
            <Camera className="w-4 h-4 mr-2" />
            Iniciar Câmera
          </Button>
          <Button onClick={handleCancel} variant="outline">
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto max-h-96 rounded-lg border"
          onLoadedMetadata={() => {
            // Video carregado com sucesso
            if (videoRef.current) {
              videoRef.current.play().catch((err) => {
                console.error("Erro ao reproduzir vídeo:", err);
                setError("Não foi possível reproduzir o vídeo da câmera.");
              });
            }
          }}
          onError={(e) => {
            console.error("Erro no elemento video:", e);
            setError("Erro ao carregar o vídeo da câmera. Tente novamente.");
          }}
        />

        <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg pointer-events-none">
          <div className="absolute inset-4 border border-white/30 rounded-lg">
            <div className="text-white/80 text-xs absolute -top-5 left-0">
              Posicione o recibo dentro desta área
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-2">
        <Button onClick={capturePhoto} className="flex-1">
          <Camera className="w-4 h-4 mr-2" />
          Capturar Foto
        </Button>
        <Button onClick={handleCancel} variant="outline">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        💡 Dica: Posicione o recibo em uma superfície plana com boa iluminação
      </div>
    </div>
  );
}
