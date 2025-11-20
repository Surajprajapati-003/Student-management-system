
import React, { useEffect, useMemo, useState } from 'react';

const LS_KEY = 'students_v1';

const uid = () => Math.random().toString(36).slice(2,9);

const sample = [
  { id: uid(), name: 'Aarav Patel', roll: 'S1001', email: 'aarav@example.com', year: '3rd', branch: 'CSE', cgpa: 8.6 },
  { id: uid(), name: 'Diya Sharma', roll: 'S1002', email: 'diya@example.com', year: '2nd', branch: 'ECE', cgpa: 8.2 },
];

function useLocalStudents(){
  const [students, setStudents] = useState(() => {
    try{
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : sample;
    }catch(e){
      return sample;
    }
  });
  useEffect(()=> localStorage.setItem(LS_KEY, JSON.stringify(students)), [students]);
  return [students, setStudents];
}

function StudentForm({ initial, onCancel, onSave }){
  const [form, setForm] = useState(initial || { name:'', roll:'', email:'', year:'1st', branch:'', cgpa:'' });
  useEffect(()=> setForm(initial || { name:'', roll:'', email:'', year:'1st', branch:'', cgpa:'' }), [initial]);
  const update = (k,v)=> setForm(s=>({...s, [k]: v}));
  const submit = (e) => {
    e.preventDefault();
    if(!form.name || !form.roll) return alert('Name and Roll are required');
    onSave({ ...form, cgpa: form.cgpa === '' ? '' : Number(form.cgpa) });
  };
  return (
    <form onSubmit={submit} className="card">
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
        <input className="input" placeholder="Name" value={form.name} onChange={e=>update('name', e.target.value)} />
        <input className="input" placeholder="Roll No" value={form.roll} onChange={e=>update('roll', e.target.value)} />
        <input className="input" placeholder="Email" value={form.email} onChange={e=>update('email', e.target.value)} />
        <input className="input" placeholder="Branch" value={form.branch} onChange={e=>update('branch', e.target.value)} />
        <select className="input" value={form.year} onChange={e=>update('year', e.target.value)}>
          <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
        </select>
        <input className="input" placeholder="CGPA" value={form.cgpa} onChange={e=>update('cgpa', e.target.value)} />
      </div>
      <div style={{display:'flex', gap:8, marginTop:10, justifyContent:'flex-end'}}>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save</button>
      </div>
    </form>
  );
}

export default function App(){
  const [students, setStudents] = useLocalStudents();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 6;

  const filtered = useMemo(()=> {
    const q = query.trim().toLowerCase();
    let arr = students.filter(s => {
      if(!q) return true;
      return (s.name||'').toLowerCase().includes(q) || (s.roll||'').toLowerCase().includes(q) || (s.branch||'').toLowerCase().includes(q);
    });
    arr.sort((a,b)=>{
      if(sortBy==='cgpa') return (b.cgpa||0) - (a.cgpa||0);
      return (a[sortBy]||'').toString().localeCompare((b[sortBy]||'').toString());
    });
    return arr;
  }, [students, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(()=> { if(page>totalPages) setPage(totalPages); }, [totalPages]);

  const pageData = useMemo(()=> filtered.slice((page-1)*perPage, page*perPage), [filtered, page]);

  const addStudent = (payload) => {
    setStudents(s => [{ id: uid(), ...payload }, ...s]);
    setShowForm(false);
  };
  const updateStudent = (payload) => {
    setStudents(s => s.map(st => st.id === editing.id ? { ...editing, ...payload } : st));
    setEditing(null);
    setShowForm(false);
  };
  const remove = (id) => {
    if(!confirm('Delete this student?')) return;
    setStudents(s => s.filter(x => x.id !== id));
  };

  const importJSON = (text) => {
    try{
      const arr = JSON.parse(text);
      if(!Array.isArray(arr)) throw new Error('JSON must be an array of students');
      const normalized = arr.map(x=> ({ id: x.id || uid(), name:x.name||'', roll:x.roll||'', email:x.email||'', year:x.year||'', branch:x.branch||'', cgpa: x.cgpa==null ? '' : Number(x.cgpa) }));
      setStudents(s => [...normalized, ...s]);
      alert('Imported '+normalized.length+' students');
    }catch(e){
      alert('Import error: '+e.message);
    }
  };

  const exportJSON = () => {
    const data = JSON.stringify(students, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if(!confirm('Clear ALL students?')) return;
    setStudents([]);
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = e => importJSON(e.target.result);
    reader.readAsText(file);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Student Management</h1>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" onClick={()=>{ setShowForm(!showForm); setEditing(null); }}>{showForm ? 'Close' : 'Add Student'}</button>
          <button className="btn" onClick={exportJSON}>Export</button>
          <label className="btn" style={{cursor:'pointer'}}>
            Import
            <input type="file" accept="application/json" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])} />
          </label>
          <button className="btn" onClick={clearAll}>Clear</button>
        </div>
      </div>

      {showForm && (
        <StudentForm
          initial={editing ? editing : null}
          onCancel={()=>{ setShowForm(false); setEditing(null); }}
          onSave={(payload)=> editing ? updateStudent(payload) : addStudent(payload)}
        />
      )}

      <div style={{display:'flex', gap:8, marginTop:12, marginBottom:8, alignItems:'center'}}>
        <input className="input" placeholder="Search by name, roll or branch" value={query} onChange={e=>{ setQuery(e.target.value); setPage(1); }} />
        <select className="input" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="roll">Sort: Roll</option>
          <option value="cgpa">Sort: CGPA</option>
        </select>
      </div>

      <div className="card">
        <table className="table" aria-label="students table">
          <thead>
            <tr>
              <th>Name</th><th>Roll</th><th>Branch</th><th>Year</th><th>CGPA</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length===0 ? (
              <tr><td colSpan={6} className="small">No students found.</td></tr>
            ) : pageData.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.roll}</td>
                <td>{s.branch}</td>
                <td>{s.year}</td>
                <td>{s.cgpa}</td>
                <td>
                  <button className="btn" onClick={()=>{ setEditing(s); setShowForm(true); }}>Edit</button>
                  <button className="btn" onClick={()=>remove(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pager">
          <button className="btn" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
          <div className="small">Page {page} / {totalPages}</div>
          <button className="btn" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
        </div>
      </div>

      <div className="footer small">Data stored in localStorage (key: {LS_KEY}) — perfect for prototyping.</div>
    </div>
  );
}
