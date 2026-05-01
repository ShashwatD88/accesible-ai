export function getIntent(text: string) {
  text = text.toLowerCase();

  if (/zoom.*in/.test(text)) return { action: "zoom_in" };
  if (/zoom.*out/.test(text)) return { action: "zoom_out" };

  if (/open.*map|show.*map/.test(text))
    return { action: "open_map" };

  if (/restaurant|cafe|food/.test(text))
    return { action: "search" };

  if (/left/.test(text)) return { action: "pan_left" };
  if (/right/.test(text)) return { action: "pan_right" };

  if (/stop/.test(text)) return { action: "stop" };

  return { action: "unknown" };
}