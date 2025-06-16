import { useEffect, useState } from "react";
import axios from "axios";

export default function ManageClassTypes() {
    const [types, setTypes] = useState([]);

    useEffect(() => {
        axios.get("/admin/class-types").then(res => setTypes(res.data));
    }, []);

    function handleChange(id, val) {
        axios.put(`/admin/class-type/${id}/max`, { MaxParticipants: Number(val) })
            .then(() => setTypes(types => types.map(t => t.id === id ? { ...t, MaxParticipants: Number(val) } : t)));
    }

    return (
        <table>
            <thead>
                <tr>
                    <th>Class Type</th>
                    <th>Max Participants</th>
                </tr>
            </thead>
            <tbody>
                {types.map(type => (
                    <tr key={type.id}>
                        <td>{type.type}</td>
                        <td>
                            <input
                                type="number"
                                value={type.MaxParticipants}
                                min={1}
                                onChange={e => handleChange(type.id, e.target.value)}
                                style={{ width: 60 }}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
