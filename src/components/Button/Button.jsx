import './Button.css';
export default function Button({
    children, onClick, type = 'button', variant = 'primary',
    size = 'md', loading = false, disabled = false, fullWidth = false, className = ''
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
        >
            {loading && <span className="btn-spinner" />}
            {children}
        </button>
    );
}
