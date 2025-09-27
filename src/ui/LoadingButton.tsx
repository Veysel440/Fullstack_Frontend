type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };
export default function LoadingButton({ loading, children, ...rest }: Props){
    return (
        <button disabled={loading || rest.disabled} {...rest}>
            {loading ? "…" : children}
        </button>
    );
}
