export type Post = {
    id: string;
    created_at: string;
    post_content: string;
    user_id: string;
}

export enum MessageType {
    PostCreatedMessage = "PostCreated",
    PostDeletedMessage = "PostDeleted",
    PostUpdatedMessage = "PostUpdated",
}
export type WSResponse = {
    type: MessageType;
    payload: Post;
}

export type Response<T> = {
    next: string;
    ok: boolean;
    result: T
}
