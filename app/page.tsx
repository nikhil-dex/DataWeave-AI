"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Database,
  Download,
  FileDown,
  History,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
  X,
  Zap,
} from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Source = {
  id: number;
  name: string;
  url: string;
  status: string;
  reason: string | null;
  attempted_at: string | null;
  completed_at: string | null;
  records_extracted: number;
};

type Execution = {
  workflow_id: number;
  status: string;
  structured_requirement: {
    intent: string;
    target_entity: string;
    filters: Record<string, unknown>;
    required_fields: string[];
    source_preferences: string[];
    output_format: string;
    query_description: string;
    identity_fields: string[];
  };
  summary: Record<string, number>;
  schema: string[];
  records: Array<Record<string, unknown> & { record_id: number }>;
  sources: Source[];
};

type Trace = {
  record_id: number;
  final_values: Record<string, unknown>;
  validation_status: string;
  validation_reason: string | null;
  duplicate_of_id: number | null;
  raw_values: Record<string, unknown>;
  source: Source;
  retrieved_at: string;
  transformations: Array<{ field_name: string; extracted_value: string | null; normalized_value: string | null; operation: string }>;
};

type HistoryItem = { id: number; requirement: string; status: string; created_at: string };

const pipelineLabels = [
  ["requirement_understood", "Requirement understood"],
  ["sources_selected", "Sources selected"],
  ["collection_completed", "Collection completed"],
  ["normalization_completed", "Normalization completed"],
  ["validation_completed", "Validation completed"],
  ["deduplication_completed", "Deduplication completed"],
  ["dataset_generated", "Dataset generated"],
] as const;

function displayField(field: string) {
  return field.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Not attempted";
}

export default function Home() {
  const [requirement, setRequirement] = useState("Find software engineering internships in Delhi with stipend above ₹10,000");
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState("ready");
  const [notice, setNotice] = useState("");
  const [execution, setExecution] = useState<Execution | null>(null);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function loadHistory() {
    try {
      const response = await fetch(`${apiUrl}/api/workflows`);
      if (response.ok) setHistory(await response.json());
    } catch {
      // The main workflow action shows the actionable connection error.
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function runWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRunning(true);
    setPhase("creating");
    setNotice("");
    setExecution(null);
    setTrace(null);
    try {
      const createResponse = await fetch(`${apiUrl}/api/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement }),
      });
      if (!createResponse.ok) throw new Error("The API could not create this workflow.");
      const workflow = await createResponse.json();
      setPhase("executing");
      const executeResponse = await fetch(`${apiUrl}/api/workflows/${workflow.id}/execute`, { method: "POST" });
      const body = await executeResponse.json();
      if (!executeResponse.ok) throw new Error(body.detail ?? "Workflow execution failed.");
      setExecution(body);
      setPhase("complete");
      setNotice(`Workflow #${body.workflow_id} completed with ${body.summary.final_records} final records.`);
      await loadHistory();
    } catch (error) {
      setPhase("error");
      setNotice(error instanceof Error ? error.message : "Workflow execution failed.");
    } finally {
      setIsRunning(false);
    }
  }

  async function openTrace(recordId: number) {
    try {
      const response = await fetch(`${apiUrl}/api/records/${recordId}/trace`);
      if (!response.ok) throw new Error("Trace unavailable");
      setTrace(await response.json());
    } catch {
      setNotice("This record trace could not be loaded.");
    }
  }

  const steps = new Map<string, string>();
  if (execution) {
    pipelineLabels.forEach(([name]) => steps.set(name, "completed"));
  }
  const summary = execution?.summary;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Layers3 size={18} /></div><span>DataWeave AI<span className="brand-dot">.</span></span></div>
        <div className="workspace-switcher"><div className="workspace-avatar">N</div><div><strong>Nikhil&apos;s workspace</strong><small>Personal workspace</small></div><ChevronDown size={15} /></div>
        <nav className="side-nav">
          <p className="nav-label">Workspace</p>
          <a className="nav-item active" href="#overview"><Table2 size={17} /> Overview</a>
          <a className="nav-item" href="#runs"><History size={17} /> Workflow history <span className="nav-count">{history.length}</span></a>
          <a className="nav-item" href="#sources"><Database size={17} /> Source library</a>
          <p className="nav-label nav-label-spaced">Manage</p>
          <a className="nav-item" href="#settings"><LockKeyhole size={17} /> Access &amp; keys</a>
          <a className="nav-item" href="#help"><CircleHelp size={17} /> Help center</a>
        </nav>
        <div className="sidebar-bottom"><div className="security-line"><ShieldCheck size={16} /><span>Traceability enabled</span></div><div className="profile"><div className="profile-avatar">NK</div><div><strong>Nikhil Kumar</strong><small>Admin</small></div><ChevronDown size={15} /></div></div>
      </aside>

      <section className="content-area" id="overview">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Overview</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search"><Search size={18} /></button><button className="button button-dark" onClick={() => document.getElementById("requirement")?.focus()}><Plus size={16} /> New workflow</button></div></header>
        <div className="content-inner">
          <section className="hero-row"><div><p className="eyebrow"><Sparkles size={14} /> DATA INTELLIGENCE WORKSPACE</p><h1>Turn questions into<br /><em>trusted datasets.</em></h1><p className="hero-copy">Describe what you need. Cubicle builds a transparent collection workflow and keeps every value traceable to its source.</p></div><div className="hero-orbit"><div className="orbit-ring ring-one"></div><div className="orbit-ring ring-two"></div><div className="orbit-core"><Zap size={25} /></div><span className="orbit-tag tag-top">parse</span><span className="orbit-tag tag-right">clean</span><span className="orbit-tag tag-bottom">trace</span></div></section>

          <section className="query-panel"><div className="panel-heading"><div><span className="step-number">01</span><div><h2>What are you researching?</h2><p>Gemini will structure the requirement, then the permitted demo sources will execute it.</p></div></div><span className={`status-pill ${phase === "error" ? "status-error" : ""}`}><span className="status-dot"></span> {phase === "executing" ? "Executing" : phase === "complete" ? "Complete" : phase === "error" ? "Needs attention" : "Ready"}</span></div><form onSubmit={runWorkflow}><textarea id="requirement" value={requirement} onChange={(event) => setRequirement(event.target.value)} aria-label="Data requirement" /><div className="form-footer"><span className="hint"><Sparkles size={14} /> Gemini structured output + deterministic processing</span><button className="button button-accent" disabled={isRunning || requirement.length < 5}>{isRunning ? <LoaderCircle className="spin" size={16} /> : <Play size={15} fill="currentColor" />} {phase === "creating" ? "Creating..." : phase === "executing" ? "Executing..." : "Run workflow"}</button></div></form>{notice && <p className={`notice ${phase === "error" ? "notice-error" : ""}`}>{notice}</p>}</section>

          {execution && <>
            <section className="result-banner"><div><span className="demo-label"><Sparkles size={13} /> DEMO DATA INCLUDED</span><h2>Workflow #{execution.workflow_id} is complete</h2><p>{execution.structured_requirement.query_description}</p></div><div className="result-actions"><a className="button button-dark" href={`${apiUrl}/api/workflows/${execution.workflow_id}/export?format=csv`}><Download size={15} /> CSV</a><a className="text-button" href={`${apiUrl}/api/workflows/${execution.workflow_id}/export?format=json`}><FileDown size={14} /> JSON</a></div></section>
            <section className="understanding-panel"><div className="section-title compact"><div><p className="eyebrow">AI UNDERSTANDING</p><h2>Structured requirement</h2></div><span className="understanding-intent">{execution.structured_requirement.intent}</span></div><div className="understanding-grid"><div><small>Target entity</small><strong>{displayField(execution.structured_requirement.target_entity)}</strong></div>{Object.entries(execution.structured_requirement.filters).map(([key, value]) => <div key={key}><small>{displayField(key)}</small><strong>{typeof value === "number" ? value.toLocaleString() : String(value)}</strong></div>)}<div className="required-fields"><small>Required fields</small><strong>{execution.structured_requirement.required_fields.map(displayField).join(" · ")}</strong></div></div></section>
          </>}

          <section className="section-block"><div className="section-title"><div><p className="eyebrow">LIVE WORKFLOW</p><h2>Pipeline overview</h2></div><span className="last-run">{execution ? `Completed ${formatDate(new Date().toISOString())}` : "Waiting for a run"} <ArrowUpRight size={15} /></span></div><div className="pipeline-card pipeline-wide"><div className="pipeline-track"></div>{pipelineLabels.map(([name, label], index) => { const status = steps.get(name) ?? (isRunning && index === 0 ? "running" : "pending"); return <div className="pipeline-step" key={name}><div className={`step-icon ${status}`}>{status === "completed" ? <Check size={15} /> : status === "running" ? <LoaderCircle className="spin" size={13} /> : <span>{String(index + 1).padStart(2, "0")}</span>}</div><strong>{label}</strong><small>{status === "completed" ? "Complete" : status === "running" ? "In progress" : "Waiting"}</small></div>; })}</div></section>

          {summary && <section className="stats-strip">{[["sources_attempted", "Sources attempted"], ["sources_retrieved", "Retrieved"], ["sources_unavailable", "Unavailable"], ["raw_records", "Raw records"], ["valid_records", "Valid records"], ["duplicates_removed", "Duplicates removed"], ["final_records", "Final records"]].map(([key, label]) => <div className="stat-card" key={key}><small>{label}</small><strong>{summary[key]}</strong></div>)}</section>}

          <section className="dashboard-grid"><div className="stats-panel dataset-panel"><div className="section-title compact"><div><p className="eyebrow">FINAL DATASET</p><h2>{execution ? `${summary?.final_records ?? 0} validated records` : "Nothing collected yet"}</h2></div><Database size={20} className="muted-icon" /></div>{execution && execution.records.length > 0 ? <div className="table-scroll"><table className="dataset-table"><thead><tr>{execution.schema.map((field) => <th key={field}>{displayField(field)}</th>)}</tr></thead><tbody>{execution.records.map((record) => <tr key={record.record_id} onClick={() => void openTrace(record.record_id)}>{execution.schema.map((field) => <td key={field}>{record[field] == null ? <span className="missing-value">—</span> : field.endsWith("url") || field === "website" ? <span className="url-value">{String(record[field])}</span> : String(record[field])}</td>)}</tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><Table2 size={22} /></div><p>{execution ? "No records matched this requirement" : "Your final dataset will appear here"}</p><small>{execution ? "Sources were processed, but no valid canonical records met the requested filters." : "Run a workflow to see validated records, quality signals, and provenance."}</small></div>}</div><div className="sources-panel" id="sources"><div className="section-title compact"><div><p className="eyebrow">SOURCE STATUS</p><h2>{execution ? `${execution.sources.length} sources attempted` : "No sources attempted"}</h2></div><ShieldCheck size={20} className="muted-icon" /></div><div className="source-empty">{execution ? execution.sources.map((source) => <div className="source-row" key={source.id}><div className={`source-icon source-${source.status}`}><span>{source.status === "retrieved" ? "✓" : source.status === "unavailable" ? "!" : "·"}</span></div><div><strong>{source.name}</strong><small>{source.url}</small><small>{source.reason ?? `${source.records_extracted} records retrieved`} · {formatDate(source.attempted_at)}</small></div><span className={`${source.status === "retrieved" ? "ready-label" : "pending-label"}`}>{source.status}</span></div>) : <div className="source-row"><div className="source-icon"><Search size={16} /></div><div><strong>Source discovery</strong><small>Run a workflow to begin collection</small></div><span className="pending-label">Pending</span></div>}</div></div></section>

          <section className="section-block" id="runs"><div className="section-title"><div><p className="eyebrow">WORKSPACE MEMORY</p><h2>Recent workflows</h2></div><button className="text-button" onClick={() => void loadHistory()}>Refresh <ArrowUpRight size={14} /></button></div><div className="history-list">{history.length > 0 ? history.map((run) => <div className="history-row" key={run.id}><div className="history-icon"><History size={17} /></div><div className="history-name"><strong>{run.requirement}</strong><small>{formatDate(run.created_at)}</small></div><span className={`run-state ${run.status}`}>{run.status}</span><button className="icon-button small" aria-label={`Open workflow ${run.id}`} onClick={() => setRequirement(run.requirement)}><ArrowUpRight size={16} /></button></div>) : <div className="history-empty">Completed and draft workflows will appear here.</div>}</div></section>
          <footer className="footer"><span>© 2026 Cubicle Intelligence</span><span>Built for Code Cubicle 6.0</span><span className="footer-right"><FileDown size={14} /> Every final value is source-traceable</span></footer>
        </div>
      </section>

      {trace && <div className="trace-backdrop" onClick={() => setTrace(null)}><aside className="trace-drawer" onClick={(event) => event.stopPropagation()}><div className="trace-header"><div><p className="eyebrow">PROVENANCE TRACE</p><h2>Record #{trace.record_id}</h2></div><button className="icon-button" onClick={() => setTrace(null)} aria-label="Close trace"><X size={19} /></button></div><p className="trace-caption">Every value below is grounded in the stored source chain.</p><div className="trace-chain"><div className="trace-node final-node"><small>FINAL DATASET</small><strong>{Object.entries(trace.final_values).map(([key, value]) => <span key={key}>{displayField(key)}: {String(value ?? "—")}</span>)}</strong></div>{trace.transformations.map((item) => <div className="trace-node" key={item.field_name}><small>NORMALIZED · {displayField(item.field_name)}</small><strong>{item.normalized_value ?? "—"}</strong><p>{item.operation}</p><span className="trace-arrow">↓</span><div className="trace-raw"><small>RAW VALUE</small><strong>{item.extracted_value ?? "—"}</strong></div></div>)}<div className="trace-node source-node"><small>SOURCE</small><strong>{trace.source.name}</strong><a href={trace.source.url} target="_blank" rel="noreferrer">{trace.source.url}</a><p>Retrieved {formatDate(trace.retrieved_at)}</p></div></div></aside></div>}
    </main>
  );
}
