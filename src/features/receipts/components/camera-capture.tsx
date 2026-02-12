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

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      const constraints = {
        video: {
          facingMode: "environment", // Câmera traseira preferível para documentos
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
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
  }, [stopCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
    }
  }, [capturedImage, onCapture]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const handleCancel = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    onCancel?.();
  }, [stopCamera, onCancel]);

  // Cleanup ao desmontar componente
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-red-500 text-center">
          <p className="font-medium">Erro ao acessar câmera</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
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
          className="w-full h-auto max-h-96 rounded-lg border"
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