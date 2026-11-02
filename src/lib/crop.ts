export type Size = { width: number; height: number };
export type Offset = { x: number; y: number };

/** Escala a que a imagem aparece na moldura: com zoom 1, cobre a moldura toda sem sobrar espaço vazio. */
export function displayScale(image: Size, frame: Size, zoom: number) {
  return Math.max(frame.width / image.width, frame.height / image.height) * zoom;
}

/** Limita o deslocamento (a partir do centro) para a imagem nunca deixar a moldura a descoberto. */
export function clampOffset(offset: Offset, image: Size, frame: Size, zoom: number): Offset {
  const scale = displayScale(image, frame, zoom);
  const maxX = Math.max(0, (image.width * scale - frame.width) / 2);
  const maxY = Math.max(0, (image.height * scale - frame.height) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

/** Parte da imagem original (em píxeis) que está visível na moldura. */
export function cropRect(image: Size, frame: Size, zoom: number, offset: Offset) {
  const scale = displayScale(image, frame, zoom);
  const width = frame.width / scale;
  const height = frame.height / scale;
  return {
    x: (image.width - width) / 2 - offset.x / scale,
    y: (image.height - height) / 2 - offset.y / scale,
    width,
    height,
  };
}

/** Tamanho final: reduz até ao máximo, sem nunca aumentar uma imagem pequena. Mantém a proporção do recorte. */
export function outputSize(crop: Size, maxWidth: number): Size {
  const width = Math.max(1, Math.round(Math.min(maxWidth, crop.width)));
  return { width, height: Math.max(1, Math.round((width * crop.height) / crop.width)) };
}
