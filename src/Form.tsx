import { Component } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import styles from './App.module.css';
import Card from "./Card";


function checkValid({ element, validators = [] }: { element: any; validators: any; }, setErrors: SetStoreFunction<{}>, errorClass: any) {
    validators = typeof validators == "boolean" ? [] : validators

    return async () => {
        element.setCustomValidity("");
        element.checkValidity();
        let message = element.validationMessage;
        if (!message) {
            for (const validator of validators) {
                const text = await validator(element);
                if (text) {
                    element.setCustomValidity(text);
                    break;
                }
            }
            message = element.validationMessage;
        }
        if (message) {
            errorClass && element.classList.toggle(errorClass, true);
            setErrors({ [element.name]: message });
        }
    };
}

export function useForm({ errorClass }: { errorClass: string }) {
    const [errors, setErrors] = createStore<{ password: string, email: string }>(Object()),
        fields = {};

    const validate = (ref: { name: string | number; onblur: () => Promise<void>; oninput: () => void; classList: { toggle: (arg0: string, arg1: boolean) => any; }; }, accessor: () => never[]) => {
        const validators = accessor() || [];
        let config;
        fields[ref.name] = config = { element: ref, validators };
        ref.onblur = checkValid(config, setErrors, errorClass);
        ref.oninput = () => {
            if (!errors[ref.name]) return;
            setErrors({ [ref.name]: undefined });
            errorClass && ref.classList.toggle(errorClass, false);
        };
    };

    const formSubmit = (ref: { setAttribute: (arg0: string, arg1: string) => void; onsubmit: (e: any) => Promise<void>; }, accessor: [any, () => () => void]) => {
        const [arg, callback] = accessor() || [undefined, (() => { })];
        ref.setAttribute("novalidate", "");
        ref.onsubmit = async (e: { preventDefault: () => void; }) => {
            e.preventDefault();
            let errored = false;

            for (const k in fields) {
                const field = fields[k];
                await checkValid(field, setErrors, errorClass)();
                if (!errored && field.element.validationMessage) {
                    field.element.focus();
                    errored = true;
                }
            }
            !errored && callback(arg, ref);
        };
    };

    return { validate, formSubmit, errors };
}

const ErrorMessage: Component<{ error: string }> = ({ error }) => <><br /><span class={styles.error_message}>{error}</span></>

type Props = {
    title: string;
    onSubmit: (fields: { email: string; password: string }) => void
}

export const Form: Component<Props> = ({ title, onSubmit }) => {
    const { validate, formSubmit, errors } = useForm({ errorClass: styles.error_input });

    const [fields, setFields] = createStore({ email: "", password: "string" });

    return (
        <Card>
            <form use:formSubmit={[fields, onSubmit]}>
                <h2>{title}</h2>
                <div class="field-block">
                    <input type="email"
                        name="email"
                        placeholder="email"
                        required
                        use:validate
                        onInput={(e) => setFields("email", (e.target as HTMLInputElement).value)} />
                    {errors.email && <ErrorMessage error={errors.email} />}
                </div>
                <div class="field-block">
                    <input type="password" name="password"
                        id="password"
                        placeholder="password"
                        required
                        minLength={3}
                        onInput={(e) => setFields("password", (e.target as HTMLInputElement).value)}
                        use:validate />
                    {errors.password && <ErrorMessage error={errors.password} />}
                </div>
                <button class={styles.submit} type="submit">Submit</button>
            </form>
        </Card>
    );
}
