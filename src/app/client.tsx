"use client";

export const Client = ({ users }: { users: Record<string, unknown>[] }) => {
  return <div>Client component: {JSON.stringify(users)}</div>;
};
