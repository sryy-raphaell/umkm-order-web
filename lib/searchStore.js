import { useSyncExternalStore } from "react";

let searchQuery = "";
const listeners = new Set();

export function getSearchQuery() {
  return searchQuery;
}

export function setSearchQuery(value) {
  searchQuery = value;
  listeners.forEach((cb) => cb(value));
}

export function subscribeSearchQuery(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSearchSnapshot() {
  return searchQuery;
}

function getSearchServerSnapshot() {
  return "";
}

export function useSearchStore() {
  const query = useSyncExternalStore(
    subscribeSearchQuery,
    getSearchSnapshot,
    getSearchServerSnapshot
  );
  return [query, setSearchQuery];
}
