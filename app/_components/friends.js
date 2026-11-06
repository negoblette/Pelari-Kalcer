"use client";

import { getSupabase } from "./sync";

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export async function getMyProfile() {
  return unwrap(
    await getSupabase()
      .from("profiles")
      .select("display_name, area, friend_code")
      .maybeSingle(),
  );
}

export async function createProfile(name, area, stats) {
  unwrap(
    await getSupabase()
      .from("profiles")
      .insert({ display_name: name, area, stats }),
  );
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
}

export async function removeFriend(friend) {
  unwrap(await getSupabase().rpc("remove_friend", { friend }));
}
