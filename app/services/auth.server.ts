import { createCookieSessionStorage, redirect } from "@remix-run/node";
import axios from "./axios.server";
import type { AxiosResponse } from "axios";

export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "codante_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [process.env.SESSION_SECRET as string],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export let { getSession, commitSession, destroySession } = sessionStorage;

export async function register({
  request,
  name,
  email,
  password,
  passwordConfirmation,
}: {
  request: Request;
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}) {
  let response: AxiosResponse;
  let session = await sessionStorage.getSession(request.headers.get("Cookie"));

  try {
    response = await axios.post("/register", {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  } catch (error: any) {
    return { errors: error?.response?.data?.message };
  }

  // let userData: { token?: string } = {};
  // if (session.get("user")) {
  //   userData = session.get("user");
  // }
  // userData.token = response.data.token;
  // session.set("user", userData);

  return {
    redirector: redirect("/", {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    }),
  };
}

export async function login({
  request,
  email,
  password,
}: {
  request: Request;
  email: string;
  password: string;
}) {
  let response: AxiosResponse;
  let session = await sessionStorage.getSession(request.headers.get("Cookie"));

  try {
    response = await axios.post("/login", { email, password });
  } catch (error: any) {
    console.log(error.response.data.errors);
    // return { errors: Object.values(error?.response?.data?.errors).flat() };
    return { errors: error?.response?.data?.message };
  }

  let userData: { token?: string } = {};
  if (session.get("user")) {
    userData = session.get("user");
  }
  userData.token = response.data.token;
  session.set("user", userData);

  return {
    redirector: redirect("/", {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    }),
  };
}

export async function logout({ request }: { request: Request }) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  let { token } = session.get("user");

  try {
    await axios.post(
      "/logout",
      {},
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
  } catch (e) {}

  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

export async function currentToken({ request }: { request: Request }) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  if (session.has("user")) {
    const { token } = session.get("user");
    return token;
  }
}

export async function user({
  request,
  params,
}: {
  request: Request;
  params?: any;
}) {
  let response;
  let token = await currentToken({ request });

  try {
    response = await axios.get("/api/user", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });
  } catch (error: any) {
    // se o usuário não estiver autenticado, destrua a sessão e redirecione de volta.
    if (error?.response?.status === 401) {
      const session = await getSession(request.headers.get("Cookie"));
      if (session.has("user")) {
        return redirect(`/${params?.name}`, {
          headers: {
            "Set-Cookie": await sessionStorage.destroySession(session),
          },
        });
      }
    }
    return null;
  }
  return response.data;
}

export async function requireGuest({ request }: { request: Request }) {
  if (await user({ request })) {
    throw redirect("/");
  }
}

export async function requireAuth({ request }: { request: Request }) {
  let token = await currentToken({ request });

  if (!token) {
    throw redirect("/login");
  }
}

export async function resetPassword({
  token,
  email,
  password,
  passwordConfirmation,
}: {
  token: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}) {
  try {
    const res = await axios.post("/reset-password", {
      token,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  } catch (error: any) {
    console.log(error);
    return { errors: Object.values(error?.response?.data?.errors).flat() };
  }

  return {
    redirector: redirect("/login"),
  };
}

export async function sendPasswordLink({ email }: { email: string }) {
  try {
    const res = await axios.post("/forgot-password", { email });
  } catch (error: any) {
    console.log(error);
    return { errors: Object.values(error?.response?.data?.errors).flat() };
  }
}
