import './Table.css';
export default function Table({ columns, data, renderRow, emptyMessage = 'No data available' }) {
    if (!data || data.length === 0) {
        return (
            <div className="table-empty">
                <div className="table-empty-icon">📋</div>
                <p>{emptyMessage}</p>
            </div>
        );
    }
    return (
        <div className="table-wrapper">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => renderRow(item, index))}
                </tbody>
            </table>
        </div>
    );
}
