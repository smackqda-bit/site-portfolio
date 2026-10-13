"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo, Arrow } from "./Logo";
import { navigation } from "@/content/studio";
import { useMotion } from "./MotionProvider";
import { motion } from "@/lib/motion";

export function Header() {
  const [open, setOpen] = useState(false);
  const [keyboardMenu, setKeyboardMenu] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const animation = useRef<Animation | null>(null);
  const previousOverflow = useRef("");
  const { reduced } = useMotion();
  const router = useRouter();

  useEffect(() => {
    const menu = dialog.current;
    return () => {
      animation.current?.cancel();
      if (menu?.open) document.body.style.overflow = previousOverflow.current;
    };
  }, []);

  function show(event: React.MouseEvent<HTMLButtonElement>) {
    if (!dialog.current || dialog.current.open) return;
    setKeyboardMenu(event.detail === 0);
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.showModal();
    setOpen(true);
    closeButton.current?.focus();
  }

  async function close(href?: string) {
    if (closing.current || !dialog.current) return;
    closing.current = true;
    if (!reduced) {
      animation.current = dialog.current.animate(
        [{ clipPath: "inset(0% 0 0 0)" }, { clipPath: "inset(0% 0 100% 0)" }],
        { duration: motion.fast * 1000 + 100, easing: "cubic-bezier(.65,0,.35,1)" },
      );
      try { await animation.current.finished; } catch { /* Closing still restores focus. */ }
    }
    dialog.current?.close();
    animation.current?.cancel();
    animation.current = null;
    document.body.style.overflow = previousOverflow.current;
    setOpen(false);
    closing.current = false;
    trigger.current?.focus();
    if (href) {
      router.push(href);
      const id = href.split("#")[1];
      requestAnimationFrame(() => {
        const heading = id ? document.getElementById(id)?.querySelector<HTMLElement>("h2") : null;
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      });
    }
  }

  function navigate(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    void close(href);
  }

  return <>
    <header className="site-header">
      <Logo />
      <span className="header-note mono">Independent digital atelier</span>
      <nav aria-label="Primary navigation" className="desktop-nav">
        {navigation.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}
      </nav>
      <button ref={trigger} className="menu-trigger" onClick={show}
        aria-expanded={open} aria-controls="site-menu" aria-label="Open navigation menu"><span /><span /></button>
    </header>
    <dialog ref={dialog} id="site-menu" className="menu-dialog" aria-label="Site navigation"
      data-keyboard={keyboardMenu ? "" : undefined}
      onKeyDown={(event) => { if (event.key === "Tab") setKeyboardMenu(true); }}
      onPointerDown={() => setKeyboardMenu(false)}
      onCancel={(event) => { event.preventDefault(); void close(); }}>
      <div className="menu-top">
        <Link href="/" className="menu-home mono" onClick={(event) => navigate(event, "/")}>SMACKQ / Home ↗</Link>
        <button ref={closeButton} className="round-button" onClick={() => void close()} aria-label="Close navigation menu">×</button>
      </div>
      <div className="menu-layout">
        <span className="eyebrow">A different<br />state of digital.</span>
        <nav aria-label="Expanded navigation">
          {navigation.map((item, index) => (
            <Link key={item.label} href={item.href} onClick={(event) => navigate(event, item.href)}
              style={{ "--index": index } as React.CSSProperties}>
              <small className="mono">0{index + 1}</small>{item.label}<Arrow diagonal />
            </Link>
          ))}
        </nav>
      </div>
      <div className="menu-bottom mono"><span>Human vision. Digital possibility.</span><span>SMACKQ © {new Date().getFullYear()}</span></div>
    </dialog>
  </>;
}
