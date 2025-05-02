export interface User {
  id: string;
  name: string;
  email: string;
}

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  return { user: { id: "1", name: "Test User", email } };
}

export async function signUp({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  return { user: { id: "1", name, email } };
}
