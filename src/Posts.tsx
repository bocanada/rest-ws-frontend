import { createResource, For, onCleanup, useTransition } from "solid-js";
import styles from './App.module.css';
import { useAuth } from "./AuthProvider";
import Card from "./Card";
import { MessageType, Post, Response, WSResponse } from "./types";

const fetchData = async (): Promise<Post[]> => {
    console.log("Fetching...")
    const resp = await fetch(`${import.meta.env.VITE_HTTP_API_URL}/posts`, { method: "GET" });
    if (!resp.ok) {
        return [];
    }
    const data: Response<Post[]> = await resp.json();
    data.result = data.result?.sort((a, b) => a.id > b.id ? -1 : 1)
    return data.result;
}


export const Posts = () => {
    const [token, userId] = useAuth()
    const [posts, { mutate }] = createResource(fetchData, { initialValue: [] })
    const [_, start] = useTransition();
    const addPost = (post: Post) => start(() => mutate([post, ...posts()]))
    const deletePost = (post: Post) => start(() => mutate(posts().filter(p => p.id != post.id)))
    const updatePost = (post: Post) => {
        deletePost(post)
        addPost(post)
    }

    const ws = new WebSocket(`${import.meta.env.VITE_WS_API_URL}/ws`)

    ws.onmessage = (event) => {
        const { type, payload }: WSResponse = JSON.parse(event.data);
        if (type === MessageType.PostCreatedMessage) {
            const date = new Date()
            payload.created_at = date.toISOString()
            addPost(payload);
        } else if (type === MessageType.PostDeletedMessage) {
            deletePost(payload)
        } else if (type === MessageType.PostUpdatedMessage) {
            updatePost(payload)
        }
    }

    ws.onclose = (e) => {
        console.log("closing..", e);
    }

    onCleanup(() => ws.close())

    const handleClick = async (post: Post) => {
        if (!token()) { return; }
        if (post.user_id !== userId()) { return; }

        const resp = await fetch(`${import.meta.env.VITE_HTTP_API_URL}/api/v1/posts/${post.id}`,
            {
                method: "DELETE",
                headers: { authorization: token() },
            })
        if (!resp.ok) {
            return;
        }
        deletePost(post)
        const json = await resp.json();
        console.log(json);
    }

    const patchPost = async (post: Post, contents: string) => {
        if (post.post_content === contents) { return; }
        const resp = await fetch(`${import.meta.env.VITE_HTTP_API_URL}/api/v1/posts/${post.id}`,
            {
                headers: { authorization: token() },
                method: "PATCH",
                body: JSON.stringify({ post_content: contents })
            }
        );
        post.post_content = contents;
        const json = await resp.json();
        console.log(json);
    };

    return (
        <For each={posts()} fallback={posts()?.length !== 0 ? <div>There are no posts.</div> : <div>Loading...</div>}>
            {post =>
                <Card>
                    <p contentEditable={post.user_id === userId()}
                        onFocusOut={e => patchPost(post, e.target.textContent?.trim() as string)}>{post.post_content}</p>
                    {post.user_id === userId() &&
                        <input
                            type="checkbox"
                            name="delete"
                            id="delete"
                            contextMenu="bruh"
                            aria-label="delete"
                            onclick={[handleClick, post]}
                        />}
                    <footer class={styles.footer}>
                        <time datetime={post.created_at}> {
                            (new Date(post.created_at)).toLocaleString()
                        }</time>
                    </footer>
                </Card>
            }
        </For>
    );
}

export default Posts;