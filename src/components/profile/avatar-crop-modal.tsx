"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { MotionModal } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";

const VIEW = 280;
const OUTPUT = 512;

type Props = {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (blob: Blob) => void;
  confirming?: boolean;
};

/**
 * WhatsApp-style circular crop: pan + zoom, then export a square JPEG
 * clipped to the circle content (opaque square that fills the circle).
 */
export function AvatarCropModal({
  open,
  imageSrc,
  onClose,
  onConfirm,
  confirming = false,
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (!open || !imageSrc) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setNatural({ w, h });
      // Cover the circle: shortest side must fill VIEW
      const cover = Math.max(VIEW / w, VIEW / h);
      setMinZoom(cover);
      setZoom(cover);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [open, imageSrc]);

  const clampOffset = useCallback(
    (x: number, y: number, z: number) => {
      const scaledW = natural.w * z;
      const scaledH = natural.h * z;
      const maxX = Math.max(0, (scaledW - VIEW) / 2);
      const maxY = Math.max(0, (scaledH - VIEW) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [natural.w, natural.h],
  );

  function onZoomChange(next: number) {
    const z = Math.min(Math.max(next, minZoom), minZoom * 4);
    setZoom(z);
    setOffset((o) => clampOffset(o.x, o.y, z));
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const g = drag.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const nx = g.originX + (e.clientX - g.startX);
    const ny = g.originY + (e.clientY - g.startY);
    setOffset(clampOffset(nx, ny, zoom));
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    drag.current = null;
  }

  async function exportCrop() {
    const img = imgRef.current;
    if (!img || !natural.w) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Map circle viewport → source image coords
    const scale = zoom;
    const srcCenterX = natural.w / 2 - offset.x / scale;
    const srcCenterY = natural.h / 2 - offset.y / scale;
    const srcSize = VIEW / scale;
    const sx = srcCenterX - srcSize / 2;
    const sy = srcCenterY - srcSize / 2;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
    );
    if (blob) onConfirm(blob);
  }

  const scaledW = natural.w * zoom;
  const scaledH = natural.h * zoom;

  return (
    <MotionModal
      open={open && Boolean(imageSrc)}
      onClose={confirming ? () => undefined : onClose}
      labelledBy="avatar-crop-title"
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <h2
            id="avatar-crop-title"
            className="text-xl font-bold tracking-tight text-[var(--ink)]"
          >
            Ajustar foto
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Arraste para posicionar e use o zoom. A área no círculo será a sua
            foto.
          </p>
        </div>
        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-full bg-black"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="presentation"
        >
          {imageSrc && natural.w > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{
                width: scaledW,
                height: scaledH,
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          ) : null}
          {/* soft ring */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/70"
            aria-hidden
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="avatar-zoom"
            className="text-sm font-medium text-[var(--ink)]"
          >
            Zoom
          </label>
          <input
            id="avatar-zoom"
            type="range"
            min={minZoom}
            max={minZoom * 4 || 4}
            step={0.01}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={confirming}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="accent"
            onClick={() => void exportCrop()}
            disabled={confirming || !natural.w}
          >
            {confirming ? "Enviando…" : "Usar foto"}
          </Button>
        </div>
      </div>
    </MotionModal>
  );
}
