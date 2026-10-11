"use client";

import { createContext, useContext, useEffect, useState } from "react";

const Context = createContext({
  reduced: true,
  systemReduced: true,
  paused: false,
  toggle: () => {},
});

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [systemReduced, setSystemReduced] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = systemReduced || paused ? "reduced" : "full";
  }, [systemReduced, paused]);

  return (
    <Context.Provider value={{
      reduced: systemReduced || paused,
      systemReduced,
      paused,
      toggle: () => setPaused((value) => !value),
    }}>
      {children}
    </Context.Provider>
  );
}

export const useMotion = () => useContext(Context);
