"use client";

import { useCallback, useEffect, useState } from "react";
import Avatar from "./Avatar";
import { addComment, deleteComment, likePost, listFeed, unlikePost } from "./friends";
import { runTypeLabel } from "./runTypes";
import { formatClock, formatDistance, fullDate } from "./stats";
import { syncConfigured, useSyncStatus } from "./sync";

const REFRESH_MS = 30000;

function FeedPost({ post, userId, onChanged, onToast }) {
  const [showComments, setShowComments] = useState(post.comments.length > 0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setBusy(true);
    try {
      await action();
      await onChanged();
    } catch {
      onToast({ message: "Belum berhasil. Coba lagi." });
    }
    setBusy(false);
  }

  function toggleLike() {
    run(() =>
      post.liked
        ? unlikePost(post.author_id, post.run_id, userId)
        : likePost(post.author_id, post.run_id),
    );
  }

  async function submitComment(event) {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    await run(() => addComment(post.author_id, post.run_id, body));
    setText("");
  }

  return (
    <li className="bg-kertas p-4 text-aspal sm:p-5">
      <div className="flex items-center gap-3">
        <Avatar seed={post.avatar} size={48} />
        <div className="min-w-0">
          <p className="truncate font-display text-2xl font-black uppercase leading-none">
            {post.name}
            {post.mine ? " (kamu)" : ""}
          </p>
          <p className="mt-1 font-mono text-xs">
            {runTypeLabel(post.run_type)} · {fullDate(post.run_date)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="font-display text-5xl font-black leading-none tabular-nums">
          {formatDistance(Number(post.km))}
          <span className="ml-1 font-mono text-sm font-normal">km</span>
        </p>
        {post.pace_seconds > 0 && (
          <p className="font-mono text-sm tabular-nums">{formatClock(post.pace_seconds)}/km</p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={busy}
          aria-pressed={post.liked}
          aria-label={`Jempol, ${post.likes} orang`}
          onClick={toggleLike}
          className={`h-10 border-2 border-aspal px-3 text-sm font-medium transition-colors ${
            post.liked ? "bg-oranye" : "hover:bg-aspal/10"
          }`}
        >
          👍 {post.likes}
        </button>
        <button
          type="button"
          aria-expanded={showComments}
          onClick={() => setShowComments(!showComments)}
          className="h-10 border-2 border-aspal px-3 text-sm font-medium hover:bg-aspal/10"
        >
          Komentar {post.comments.length}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 border-t border-aspal/20 pt-3">
          <ul className="space-y-2">
            {post.comments.map((comment) => (
              <li key={comment.id} className="flex items-start gap-2 text-sm">
                <Avatar seed={comment.avatar} size={28} />
                <p className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                  <strong>{comment.name}</strong> {comment.body}
                </p>
                {(comment.mine || post.mine) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => deleteComment(comment.id))}
                    className="shrink-0 text-xs underline underline-offset-2"
                  >
                    Hapus
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={submitComment} className="mt-3 flex gap-2">
            <input
              aria-label="Tulis komentar"
              maxLength={300}
              placeholder="Tulis komentar"
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="h-11 min-w-0 flex-1 border-2 border-aspal bg-white px-3 text-base outline-none focus:border-biru"
            />
            <button
              type="submit"
              disabled={busy || !text.trim()}
              className="h-11 bg-biru px-4 text-sm font-medium text-kertas disabled:opacity-50"
            >
              Kirim
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

export default function Feed({ onToast }) {
  const { user } = useSyncStatus();
  const [posts, setPosts] = useState(null);
  const [failed, setFailed] = useState(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setPosts(await listFeed());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => active && load());
    const timer = setInterval(load, REFRESH_MS);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  return (
    <section className="min-h-[70dvh] bg-biru py-12 text-kertas lg:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <h1 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-[0.88]">
          Feed lari
        </h1>
        <p className="mt-3 font-mono text-sm">Lari kamu dan teman, 50 terbaru</p>

        {!user && (
          <p className="mt-5 max-w-lg text-lg leading-relaxed">
            {syncConfigured
              ? "Masuk lewat tombol di bagian atas halaman untuk melihat lari teman."
              : "Feed belum aktif di perangkat ini."}
          </p>
        )}
        {failed && <p className="mt-5">Feed belum bisa dimuat. Coba lagi nanti.</p>}
        {posts?.length === 0 && (
          <p className="mt-5 max-w-lg text-lg leading-relaxed">
            Belum ada lari di feed. Isi jarak saat absen lari, dan larimu muncul di sini setelah
            tersinkron.
          </p>
        )}
        {posts?.length > 0 && (
          <ul className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {posts.map((post) => (
              <FeedPost
                key={`${post.author_id}-${post.run_id}`}
                post={post}
                userId={userId}
                onChanged={load}
                onToast={onToast}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
