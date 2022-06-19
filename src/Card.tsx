import { ParentComponent } from "solid-js";
import styles from './App.module.css';

export const Card: ParentComponent<{ onClick?: (e: Event) => void }> = ({ children, onClick }) => {
    return (
        <article class={styles.card} onClick={onClick}>
            {children}
        </article>
    );
}

export default Card;