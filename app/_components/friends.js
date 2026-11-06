"use client";

import { getSupabase } from "./sync";

export const FRIENDS_CHANGED = "pelari:teman-berubah";

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

function announceChange() {
  window.dispatchEvent(new Event(FRIENDS_CHANGED));
}

export async function getMyProfile() {
  return unwrap(
    await getSupabase()
      .from("profiles")
      .select("display_name, area, friend_code, avatar")
      .maybeSingle(),
  );
}

export async function createProfile(name, area, stats) {
  unwrap(
    await getSupabase()
      .from("profiles")
      .insert({ display_name: name, area, stats }),
  );
  announceChange();
}

export async function updateProfile(userId, name, area) {
  unwrap(
    await getSupabase()
      .from("profiles")
      .update({ display_name: name, area, updated_at: new Date().toISOString() })
      .eq("user_id", userId),
  );
}

export async function listFriends() {
  return unwrap(await getSupabase().rpc("list_friends"));
}

export async function addFriend(code) {
  return unwrap(await getSupabase().rpc("add_friend", { code }));
}

export async function respondFriend(friend, accept) {
  unwrap(await getSupabase().rpc("respond_friend", { friend, accept }));
  announceChange();
}

export async function removeFriend(friend) {
  unwrap(await getSupabase().rpc("remove_friend", { friend }));
}

export async function listFeed() {
  return unwrap(await getSupabase().rpc("list_feed"));
}

export async function likePost(postUser, runId) {
  unwrap(await getSupabase().from("feed_likes").insert({ post_user: postUser, run_id: runId }));
}

export async function unlikePost(postUser, runId, userId) {
  unwrap(
    await getSupabase()
      .from("feed_likes")
      .delete()
      .match({ post_user: postUser, run_id: runId, user_id: userId }),
  );
}

export async function addComment(postUser, runId, body) {
  unwrap(
    await getSupabase()
      .from("feed_comments")
      .insert({ post_user: postUser, run_id: runId, body }),
  );
}

export async function deleteComment(id) {
  unwrap(await getSupabase().from("feed_comments").delete().eq("id", id));
}

export async function listMessages(me, friend) {
  return unwrap(
    await getSupabase()
      .from("messages")
      .select("id, sender, body, created_at")
      .or(`and(sender.eq.${me},recipient.eq.${friend}),and(sender.eq.${friend},recipient.eq.${me})`)
      .order("created_at", { ascending: false })
      .limit(100),
  ).reverse();
}

export async function sendMessage(recipient, body) {
  unwrap(await getSupabase().from("messages").insert({ recipient, body }));
}

export async function markRead(friend) {
  unwrap(await getSupabase().rpc("mark_read", { friend }));
  announceChange();
}

export async function unreadCounts() {
  const rows = unwrap(await getSupabase().rpc("unread_counts"));
  return Object.fromEntries(rows.map((row) => [row.friend_id, row.unread]));
}

export async function requestAnalysis(payload) {
  const { data } = await getSupabase().auth.getSession();
  const response = await fetch("/api/analisis", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${data.session?.access_token ?? ""}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "failed");
  return body;
}
