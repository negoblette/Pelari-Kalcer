"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import { listMessages, markRead, sendMessage } from "./friends";

const REFRESH_MS = 4000;

function timeLabel(iso) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}.${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ChatDialog({ friend, userId, onClose }) {
  const dialogRef = useRef(null);
  const listRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await listMessages(userId, friend.id);
      setMessages((current) => (current.at(-1)?.id === rows.at(-1)?.id ? current : rows));
      setFailed(false);
      if (rows.some((row) => row.sender === friend.id)) await markRead(friend.id);
    } catch {
      setFailed(true);
    }
  }, [friend.id, userId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => active && load());
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  async function submit(event) {
    event.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await sendMessage(friend.id, body);
      setText("");
      await load();
    } catch {
      setFailed(true);
    }
    setBusy(false);
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      aria-labelledby="chat-title"
      className="m-auto h-[min(36rem,calc(100dvh-1.5rem))] w-[calc(100%-2rem)] max-w-md bg-kertas p-0 text-aspal backdrop:bg-biru/80"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 bg-oranye px-4 py-3">
          <Avatar seed={friend.avatar} size={40} />
          <h2
            id="chat-title"
            className="min-w-0 flex-1 truncate font-display text-3xl font-black uppercase leading-none"
          >
            {friend.name}
          </h2>
          <button type="button" onClick={onClose} className="h-10 px-2 text-sm font-medium underline underline-offset-4">
            Tutup
          </button>
        </div>

        <ol ref={listRef} aria-live="polite" className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {messages.length === 0 && !failed && (
            <li className="font-mono text-sm">Belum ada pesan. Ajak lari bareng, yuk.</li>
          )}
          {messages.map((message) => {
            const mine = message.sender === userId;
            return (
              <li key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[80%] px-3 py-2 [overflow-wrap:anywhere] ${
                    mine ? "bg-biru text-kertas" : "bg-white"
                  }`}
                >
                  {message.body}
                  <span className="ml-2 font-mono text-xs opacity-70">{timeLabel(message.created_at)}</span>
                </p>
              </li>
            );
          })}
        </ol>

        {failed && <p className="px-4 pb-2 text-sm font-medium text-biru">Pesan belum bisa dimuat atau dikirim.</p>}

        <form onSubmit={submit} className="flex gap-2 border-t-2 border-aspal p-3">
          <input
            autoFocus
            aria-label="Tulis pesan"
            maxLength={1000}
            placeholder="Tulis pesan"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="h-12 min-w-0 flex-1 border-2 border-aspal bg-white px-3 text-base outline-none focus:border-biru"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="h-12 bg-biru px-5 font-display text-xl font-extrabold uppercase text-kertas disabled:opacity-50"
          >
            Kirim
          </button>
        </form>
      </div>
    </dialog>
  );
}
