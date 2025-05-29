import { useState } from "react";
import axios from "axios";
const REPORT_TYPES = [
  { value: "members", label: "Members Report" },
  { value: "classes", label: "Classes Report" },
  { value: "trainers", label: "Trainers Report" },
  // add more as needed
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState("members");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  async function generateReport() {
    setLoading(true);
    const res = await axios.get(`/admin/report/${reportType}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Generate Report</h1>
      <select value={reportType} onChange={e => setReportType(e.target.value)}>
        {REPORT_TYPES.map(rt => (
          <option key={rt.value} value={rt.value}>{rt.label}</option>
        ))}
      </select>
      <button onClick={generateReport} disabled={loading}>
        {loading ? "Generating..." : "Generate Report"}
      </button>
      <div style={{ marginTop: "2rem" }}>

        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
