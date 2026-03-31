// Tiny unique ID generator (no crypto dependency)
export function nanoid(len = 10): string {
  const a = Math.random().toString(36).slice(2);
  const b = Math.random().toString(36).slice(2);
  return (a + b).slice(0, len);
}

// Check if a drag is coming from the palette
export function isPaletteSource(data: Record<string, unknown>): boolean {
  return data?.source === 'palette';
}

// Get the effective drop position (before or after the over element)
export function getDropPosition(
  over: { rect: DOMRect; id: string } | null,
  active: { rect: DOMRect } | null
): 'before' | 'after' {
  if (!over || !active) return 'after';
  const overCenter = over.rect.top + over.rect.height / 2;
  const activeTop = active.rect.top;
  return activeTop < overCenter ? 'before' : 'after';
}
