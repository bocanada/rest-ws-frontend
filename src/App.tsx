import { Component, createSignal, ErrorBoundary, Show, useTransition } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import styles from './App.module.css';
import { AuthProvider, useAuth } from './AuthProvider';
import Card from './Card';
import Posts from './Posts';
import { Form } from './Form';

const Login: Component = () => {
  const [token, _, { clearAuth, setToken, setUserId }] = useAuth();

  const onSubmitHandler = async ({ email, password }: { email: string, password: string }) => {
    if (!email || !password) { return; };

    const resp = await fetch(`${import.meta.env.VITE_HTTP_API_URL}/login`,
      {
        method: "POST",
        body: JSON.stringify({ email: email, password: password })
      })
    if (!resp.ok) {
      return;
    }
    const { result } = await resp.json()
    setToken(result.token);
    await getMe();
  }

  const getMe = async () => {
    const resp = await fetch(`${import.meta.env.VITE_HTTP_API_URL}/me`,
      { headers: { authorization: token() } });
    if (!resp.ok) {
      return;
    };
    const { result } = await resp.json();
    setUserId(result.id as string)
  }

  return (
    <Show when={token()} fallback={
      <Form title="Login" onSubmit={onSubmitHandler} />
    }>
      <button onClick={clearAuth}>Logout</button>
    </Show>
  );
}

const PostInput: Component = () => {
  const [token] = useAuth();
  let content: HTMLInputElement | undefined

  const createPost = async (e: Event) => {
    e.preventDefault();
    if (!content || !content.value) {
      return;
    }
    const resp = await fetch(`${import.meta.env.VITE_HTTP_API_URL}/api/v1/posts`, {
      method: "POST",
      body: JSON.stringify({
        post_content: content.value
      }),
      headers: {
        "Authorization": token(),
      },
    });
    const json = await resp.json();
    console.log(json);
  }

  return (
    <Card>
      <form onSubmit={createPost}>
        <input class={styles.input} type="text" placeholder='Lorem ipsum' required ref={content!} />
        <button formAction="submit">Create post</button>
      </form>
    </Card>
  );
}

const ErrorMessage: Component = () => <><h1>500</h1><p>A fatal error has occurred :(</p></>


const HomePosts: Component = () => {
  const [token] = useAuth();
  return <><Show when={token()} fallback={<p>You're not logged in.</p>}> <PostInput /> </Show> <Posts /></>
}

const SignUpForm: Component = () => {
  const fn = async (arg: Object) => {

    const resp = await fetch(`${import.meta.env.VITE_HTTP_API_URL}/signup`,
      { method: "POST", body: JSON.stringify(arg) }
    )
    const json = await resp.json()
    console.log(json);
  }
  return <Form onSubmit={fn} title="Sign Up" />
}

const Home: Component = () => {
  const [tab, setTab] = createSignal(0);
  const [pending, start] = useTransition();
  const updateTab = (index: number) => () => start(() => setTab(index));

  const tabs: Component[] = [
    HomePosts,
    Login,
    SignUpForm
  ]

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <h1>Post stream</h1>
        <ul class={styles.inline}>
          <li classList={{ [styles.selected]: tab() === 0 }} onClick={updateTab(0)}>Posts</li>
          <li classList={{ [styles.selected]: tab() === 1 }} onClick={updateTab(1)}>Login</li>
          <li classList={{ [styles.selected]: tab() === 2 }} onClick={updateTab(2)}>Signup</li>
        </ul>
        <ErrorBoundary fallback={<ErrorMessage />}>
          <div classList={{ [styles.pending]: pending() }}>
            <Dynamic component={tabs[tab()]} />
          </div>
        </ErrorBoundary>
      </header>
    </div>
  );
}

const App: Component = () => {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
};

export default App;
