"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, X, RotateCw, Check, Loader2, ImagePlus, Aperture } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  onCancel?: () => void;
}

type Mode = "choose" | "file-preview" | "live-loading" | "live-streaming" | "captured";

/** Retorna true se o contexto é seguro (HTTPS ou localhost) */
function isSecureContext() {
  return (
    window.isSecureContext ||
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  );
}

/** Converte File em base64 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<Mode>("choose");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canUseCamera, setCanUseCamera] = useState(false);

  useEffect(() => {
    setCanUseCamera(isSecureContext() && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  // Stop stream on unmount
  useEffect(() => () => stopStream(), []);

  // Start live camera when mode = "live-loading"
  useEffect(() => {
    if (mode !== "live-loading") return;
    let cancelled = false;

    const start = async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        streamRef.current = stream;

        if (!videoRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          setError("Elemento de vídeo não encontrado.");
          setMode("choose");
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (!cancelled) setMode("live-streaming");
      } catch (err: any) {
        if (cancelled) return;
        setError(getCameraErrorMessage(err));
        setMode("choose");
      }
    };

    start();
    return () => { cancelled = true; };
  }, [mode]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // ── File input (galeria / câmera nativa) ──────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setCapturedImage(base64);
      setMode("file-preview");
    } catch {
      setError("Erro ao ler a imagem. Tente novamente.");
    }
    // Reset input so same file can be picked again
    e.target.value = "";
  };

  // ── Live camera capture ───────────────────────────────────────
  const captureFromLive = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(base64);
    stopStream();
    setMode("captured");
  };

  const confirmCapture = () => {
    if (capturedImage) onCapture(capturedImage);
  };

  const reset = () => {
    stopStream();
    setCapturedImage(null);
    setError(null);
    setMode("choose");
  };

  const handleCancel = () => {
    stopStream();
    setCapturedImage(null);
    setError(null);
    setMode("choose");
    onCancel?.();
  };

  // ─── RENDER: escolha de modo ───────────────────────────────────────────────
  if (mode === "choose") {
    return (
      <div className="flex flex-col gap-4 p-4">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Hidden file inputs */}
        {/* Gallery / any image */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {/* Native camera (capture attribute forces camera on mobile) */}
        <input
          id="camera-input-native"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center py-4 gap-5 text-center">
          <div className="rounded-full bg-muted p-6">
            <Camera className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Adicionar Recibo</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tire uma foto ou selecione da galeria
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {/* Primary: native camera button — works on HTTP/HTTPS */}
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => document.getElementById("camera-input-native")?.click()}
          >
            <Camera className="w-5 h-5" />
            Tirar Foto com Câmera
          </Button>

          {/* Secondary: gallery picker */}
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="w-5 h-5" />
            Escolher da Galeria
          </Button>

          {/* Tertiary: live camera preview (requires HTTPS) */}
          {canUseCamera && (
            <Button
              size="lg"
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => { setError(null); setMode("live-loading"); }}
            >
              <Aperture className="w-5 h-5" />
              Câmera ao Vivo (preview)
            </Button>
          )}
        </div>

        <Button variant="ghost" className="w-full" onClick={handleCancel}>
          Cancelar
        </Button>
      </div>
    );
  }

  // ─── RENDER: prévia de arquivo selecionado ─────────────────────────────────
  if (mode === "file-preview" && capturedImage) {
    return (
      <div className="space-y-4 p-4">
        <div className="relative rounded-lg overflow-hidden border bg-black">
          <img
            src={capturedImage}
            alt="Recibo selecionado"
            className="w-full h-auto max-h-80 object-contain"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={reset}>
            <RotateCw className="w-4 h-4" />
            Escolher Outra
          </Button>
          <Button className="flex-1 gap-2" onClick={confirmCapture}>
            <Check className="w-4 h-4" />
            Usar Esta Foto
          </Button>
        </div>
        <Button variant="ghost" className="w-full" onClick={handleCancel}>
          Cancelar
        </Button>
      </div>
    );
  }

  // ─── RENDER: câmera ao vivo (loading + streaming) ──────────────────────────
  if (mode === "live-loading" || mode === "live-streaming") {
    return (
      <div className="space-y-4 p-4">
        <div className="relative rounded-lg overflow-hidden border bg-black min-h-48">
          {mode === "live-loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <span className="text-sm text-white/80">Iniciando câmera...</span>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-h-80 object-cover"
          />

          {mode === "live-streaming" && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-6 border-2 border-white/60 rounded-lg">
                <span className="absolute -top-6 left-0 text-white/80 text-xs drop-shadow">
                  Posicione o recibo aqui
                </span>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2">
          <Button
            className="flex-1 gap-2"
            disabled={mode !== "live-streaming"}
            onClick={captureFromLive}
          >
            <Camera className="w-4 h-4" />
            {mode === "live-loading" ? "Aguardando..." : "Capturar"}
          </Button>
          <Button variant="outline" size="icon" onClick={reset}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── RENDER: captura ao vivo confirmada ────────────────────────────────────
  if (mode === "captured" && capturedImage) {
    return (
      <div className="space-y-4 p-4">
        <div className="relative rounded-lg overflow-hidden border bg-black">
          <img
            src={capturedImage}
            alt="Foto capturada"
            className="w-full h-auto max-h-80 object-contain"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => { setCapturedImage(null); setMode("live-loading"); }}>
            <RotateCw className="w-4 h-4" />
            Tirar Novamente
          </Button>
          <Button className="flex-1 gap-2" onClick={confirmCapture}>
            <Check className="w-4 h-4" />
            Usar Esta Foto
          </Button>
        </div>
        <Button variant="ghost" className="w-full" onClick={handleCancel}>
          Cancelar
        </Button>
      </div>
    );
  }

  return null;
}

function getCameraErrorMessage(err: any): string {
  switch (err?.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Acesso à câmera negado. Use o botão 'Tirar Foto com Câmera' abaixo.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "Nenhuma câmera encontrada. Use a opção de galeria.";
    case "NotReadableError":
    case "TrackStartError":
      return "Câmera ocupada por outro app. Use a opção de galeria.";
    case "SecurityError":
      return "Câmera ao vivo requer HTTPS. Use o botão 'Tirar Foto com Câmera'.";
    default:
      return `Não foi possível ativar a câmera ao vivo. Use o botão 'Tirar Foto' abaixo.`;
  }
}
