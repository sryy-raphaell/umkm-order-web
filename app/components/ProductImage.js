"use client";

import { useState } from "react";
import { LuShoppingBag } from "./icons";

export default function ProductImage({
  src,
  alt = "",
  fill = false,
  style,
  placeholderIconSize = 20,
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-tertiary)",
        }}
      >
        <LuShoppingBag size={placeholderIconSize} color="var(--text-muted)" aria-hidden />
      </div>
    );
  }

  return (
    // Native img: avoids Next.js optimizer issues (private IP, missing /uploads files)
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setError(true)}
      style={{
        display: "block",
        objectFit: "contain",
        ...(fill
          ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
          : { width: "100%", height: "100%" }),
        ...style,
      }}
    />
  );
}
