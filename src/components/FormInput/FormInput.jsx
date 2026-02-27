import './FormInput.css';
export default function FormInput({
    label, type = 'text', name, value, onChange, onBlur, placeholder,
    error, required = false, maxLength, options, rows
}) {
    const id = `input-${name}`;
    if (type === 'select') {
        return (
            <div className="form-group">
                {label && <label htmlFor={id} className="form-label">{label} {required && <span className="form-required">*</span>}</label>}
                <select id={id} name={name} value={value} onChange={onChange} onBlur={onBlur} className={`form-select ${error ? 'form-error' : ''}`}>
                    <option value="">{placeholder || 'Select...'}</option>
                    {options?.map((opt) => (
                        <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
                    ))}
                </select>
                {error && <span className="form-error-text">{error}</span>}
            </div>
        );
    }
    if (type === 'textarea') {
        return (
            <div className="form-group">
                {label && <label htmlFor={id} className="form-label">{label} {required && <span className="form-required">*</span>}</label>}
                <textarea
                    id={id} name={name} value={value} onChange={onChange} onBlur={onBlur}
                    placeholder={placeholder} rows={rows || 4}
                    className={`form-textarea ${error ? 'form-error' : ''}`}
                />
                {error && <span className="form-error-text">{error}</span>}
            </div>
        );
    }
    return (
        <div className="form-group">
            {label && <label htmlFor={id} className="form-label">{label} {required && <span className="form-required">*</span>}</label>}
            <input
                id={id} type={type} name={name} value={value} onChange={onChange} onBlur={onBlur}
                placeholder={placeholder} maxLength={maxLength}
                className={`form-input ${error ? 'form-error' : ''}`}
            />
            {error && <span className="form-error-text">{error}</span>}
        </div>
    );
}
