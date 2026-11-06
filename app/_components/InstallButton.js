"use client";

import { useEffect, useState } from "react";

const HELP =
  "Di Chrome Android pilih menu lalu Tambahkan ke layar utama. Di iPhone buka Safari, ketuk Bagikan, lalu Tambah ke Layar Utama.";

export default function InstallButton({ onToast }) {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    function capture(event) {
      event.preventDefault();
      setPrompt(event);
    }
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  async function handleClick() {
    if (!prompt) {
      onToast({ message: HELP });
      return;
    }
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }

  return (
    <button type="button" onClick={handleClick} className="underline underline-offset-4 hover:text-marka">
      Pasang di HP
    </button>
  );
}
