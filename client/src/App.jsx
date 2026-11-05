import { useCallback, useEffect, useState } from 'react'
import './App.css'


const API_BASE_URL = import.meta.env.VITE_API_URL || ''

async function api(path, options = {}) {
  const url = `${API_BASE_URL}${path}`

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || 'The request could not be completed.')
  }

  return payload
}


function App() {
  const [selectedCaseId, setSelectedCaseId] = useState(() => {
    const match = window.location.pathname.match(/^\/cases\/([a-f\d]{24})\/?$/i)
    return match?.[1] || null
  })
  const [selectedCaseBusy, setSelectedCaseBusy] = useState(() => /^\/cases\/[a-f\d]{24}\/?$/i.test(window.location.pathname))
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [cases, setCases] = useState([])
  const [casesBusy, setCasesBusy] = useState(false)
  const [caseError, setCaseError] = useState('')
  const [notice, setNotice] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)
  const [editingCase, setEditingCase] = useState(false)
  const [editCaseTitle, setEditCaseTitle] = useState('')
  const [editCaseSummary, setEditCaseSummary] = useState('')
  const [caseSaving, setCaseSaving] = useState(false)
  const [editCaseError, setEditCaseError] = useState('') 
  const [selectedCaseError, setSelectedCaseError] = useState('')
  const [clues, setClues] = useState([])
  const [cluesBusy, setCluesBusy] = useState(false)
  const [clueError, setClueError] = useState('')
  const [clueNotice, setClueNotice] = useState('')
  const [clueTitle, setClueTitle] = useState('')
  const [clueDetails, setClueDetails] = useState('')
  const [clueSaving, setClueSaving] = useState(false)
  const [editingClueId, setEditingClueId] = useState(null)
  const [editClueTitle, setEditClueTitle] = useState('')
  const [editClueDetails, setEditClueDetails] = useState('')
  const [suspects, setSuspects] = useState([])
  const [suspectsBusy, setSuspectsBusy] = useState(false)
  const [suspectError, setSuspectError] = useState('')
  const [suspectNotice, setSuspectNotice] = useState('')
  const [suspectName, setSuspectName] = useState('')
  const [suspectDetails, setSuspectDetails] = useState('')
  const [suspectSaving, setSuspectSaving] = useState(false)
  const [editingSuspectId, setEditingSuspectId] = useState(null)
  const [editSuspectName, setEditSuspectName] = useState('')
  const [editSuspectDetails, setEditSuspectDetails] = useState('')
  const [evidence, setEvidence] = useState([])
  const [evidenceBusy, setEvidenceBusy] = useState(false)
  const [evidenceError, setEvidenceError] = useState('')
  const [evidenceNotice, setEvidenceNotice] = useState('')
  const [evidenceTitle, setEvidenceTitle] = useState('')
  const [evidenceDetails, setEvidenceDetails] = useState('')
  const [evidenceSaving, setEvidenceSaving] = useState(false)
  const [editingEvidenceId, setEditingEvidenceId] = useState(null)
  const [editEvidenceTitle, setEditEvidenceTitle] = useState('')
  const [editEvidenceDetails, setEditEvidenceDetails] = useState('')
  const [relationships, setRelationships] = useState([])
  const [relationshipsBusy, setRelationshipsBusy] = useState(false)
  const [relationshipError, setRelationshipError] = useState('')
  const [relationshipNotice, setRelationshipNotice] = useState('')
  const [fromRecordKey, setFromRecordKey] = useState('')
  const [toRecordKey, setToRecordKey] = useState('')
  const [relationshipNote, setRelationshipNote] = useState('')
  const [relationshipSaving, setRelationshipSaving] = useState(false)

  const relationshipRecords = [
    ...clues.map((record) => ({ key: `clue:${record._id}`, type: 'clue', id: record._id, label: `Clue: ${record.title}` })),
    ...suspects.map((record) => ({ key: `suspect:${record._id}`, type: 'suspect', id: record._id, label: `Suspect: ${record.name}` })),
    ...evidence.map((record) => ({ key: `evidence:${record._id}`, type: 'evidence', id: record._id, label: `Evidence: ${record.title}` })),
  ]
  const relationshipRecordLabel = (type, id) => relationshipRecords.find((record) => record.type === type && record.id === id)?.label || `${type}: record no longer available`

  const navigate = useCallback((caseId = null) => {
    const path = caseId ? `/cases/${encodeURIComponent(caseId)}` : '/'
    window.history.pushState({}, '', path)
    setSelectedCaseId(caseId)
    setSelectedCase(null)
    setSelectedCaseBusy(Boolean(caseId))
    setSelectedCaseError('')
    setClues([])
    setCluesBusy(Boolean(caseId))
    setClueError('')
    setClueNotice('')
    setEditingClueId(null)
    setSuspects([])
    setSuspectsBusy(Boolean(caseId))
    setSuspectError('')
    setSuspectNotice('')
    setEditingSuspectId(null)
    setEvidence([])
    setEvidenceBusy(Boolean(caseId))
    setEvidenceError('')
    setEvidenceNotice('')
    setEditingEvidenceId(null)
    setRelationships([])
    setRelationshipsBusy(Boolean(caseId))
    setRelationshipError('')
    setRelationshipNotice('')
    setFromRecordKey('')
    setToRecordKey('')
  }, [])

  const loadCases = useCallback(async () => {
    setCasesBusy(true)
    setCaseError('')
    try {
      const result = await api('/api/cases')
      setCases(result.cases)
    } catch (error) {
      setCaseError(error.message)
    } finally {
      setCasesBusy(false)
    }
  }, [])

    const startEditingCase = (caseItem) => {
    setEditCaseTitle(caseItem.title || '')
    setEditCaseSummary(caseItem.summary || '')
    setEditCaseError('')
    setEditingCase(true)
  }

  const cancelEditingCase = () => {
    setEditingCase(false)
    setEditCaseError('')
  }

  const saveCase = async () => {
    if (!selectedCase) return

    setCaseSaving(true)
    setEditCaseError('')

    try {
      const result = await api(`/api/cases/${selectedCase._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editCaseTitle,
          summary: editCaseSummary,
        }),
      })

      setSelectedCase(result.case)
      setCases((currentCases) =>
        currentCases.map((item) =>
          item._id === result.case._id ? result.case : item
        )
      )

      setEditingCase(false)
      setNotice('Case updated successfully.')
    } catch (error) {
      setEditCaseError(error.message)
    } finally {
      setCaseSaving(false)
    }
  }

  useEffect(() => {
    api('/api/auth/me')
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false))
  }, [])

  useEffect(() => {
    if (user) Promise.resolve().then(loadCases)
  }, [user, loadCases])

  useEffect(() => {
    function syncLocation() {
      const match = window.location.pathname.match(/^\/cases\/([a-f\d]{24})\/?$/i)
      setSelectedCaseId(match?.[1] || null)
      setSelectedCase(null)
      setSelectedCaseBusy(Boolean(match?.[1]))
      setSelectedCaseError('')
      setClues([])
      setCluesBusy(Boolean(match?.[1]))
      setClueError('')
      setClueNotice('')
      setEditingClueId(null)
      setSuspects([])
      setSuspectsBusy(Boolean(match?.[1]))
      setSuspectError('')
      setSuspectNotice('')
      setEditingSuspectId(null)
      setEvidence([])
      setEvidenceBusy(Boolean(match?.[1]))
      setEvidenceError('')
      setEvidenceNotice('')
      setEditingEvidenceId(null)
      setRelationships([])
      setRelationshipsBusy(Boolean(match?.[1]))
      setRelationshipError('')
      setRelationshipNotice('')
      setFromRecordKey('')
      setToRecordKey('')
    }
    window.addEventListener('popstate', syncLocation)
    return () => window.removeEventListener('popstate', syncLocation)
  }, [])

  useEffect(() => {
    if (!user || !selectedCaseId) return
    let active = true
    api(`/api/cases/${encodeURIComponent(selectedCaseId)}`)
      .then(({ case: currentCase }) => { if (active) setSelectedCase(currentCase) })
      .catch((error) => { if (active) setSelectedCaseError(error.message) })
      .finally(() => { if (active) setSelectedCaseBusy(false) })
    return () => { active = false }
  }, [user, selectedCaseId])

  useEffect(() => {
    if (!user || !selectedCaseId) return
    const controller = new AbortController()
    let active = true
    Promise.resolve().then(async () => {
      setSuspectsBusy(true)
      setSuspectError('')
      try {
        const result = await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/suspects`, { signal: controller.signal })
        if (active) setSuspects(result.suspects)
      } catch (error) {
        if (active) setSuspectError(error.message)
      } finally {
        if (active) setSuspectsBusy(false)
      }
    })
    return () => { active = false; controller.abort() }
  }, [user, selectedCaseId])

  useEffect(() => {
    if (!user || !selectedCaseId) return
    const controller = new AbortController()
    let active = true
    Promise.resolve().then(async () => {
      setRelationshipsBusy(true)
      setRelationshipError('')
      try {
        const result = await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/relationships`, { signal: controller.signal })
        if (active) setRelationships(result.relationships)
      } catch (error) {
        if (active) setRelationshipError(error.message)
      } finally {
        if (active) setRelationshipsBusy(false)
      }
    })
    return () => { active = false; controller.abort() }
  }, [user, selectedCaseId])

  useEffect(() => {
    if (!user || !selectedCaseId) return
    const controller = new AbortController()
    let active = true
    Promise.resolve().then(async () => {
      setEvidenceBusy(true)
      setEvidenceError('')
      try {
        const result = await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/evidence`, { signal: controller.signal })
        if (active) setEvidence(result.evidence)
      } catch (error) {
        if (active) setEvidenceError(error.message)
      } finally {
        if (active) setEvidenceBusy(false)
      }
    })
    return () => { active = false; controller.abort() }
  }, [user, selectedCaseId])

  useEffect(() => {
    if (!user || !selectedCaseId) return
    const controller = new AbortController()
    let active = true
    Promise.resolve().then(async () => {
      setCluesBusy(true)
      setClueError('')
      try {
        const result = await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/clues`, { signal: controller.signal })
        if (active) setClues(result.clues)
      } catch (error) {
        if (active) setClueError(error.message)
      } finally {
        if (active) setCluesBusy(false)
      }
    })
    return () => { active = false; controller.abort() }
  }, [user, selectedCaseId])

  async function submitAuth(event) {
    event.preventDefault()
    setAuthBusy(true)
    setAuthError('')
    setNotice('')
    try {
      const result = await api(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST', body: JSON.stringify({ email, password }),
      })
      setUser(result.user)
      setPassword('')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthBusy(false)
    }
  }

  async function signOut() {
    setNotice('')
    try {
      await api('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setCases([])
      navigate()
      setNotice('You have signed out.')
    } catch (error) {
      setCaseError(error.message)
    }
  }

  async function createCase(event) {
    event.preventDefault()
    setCreating(true)
    setCaseError('')
    setNotice('')
    try {
      await api('/api/cases', {
        method: 'POST', body: JSON.stringify({ title, summary }),
      })
      setTitle('')
      setSummary('')
      setNotice('Investigation case created.')
      await loadCases()
    } catch (error) {
      setCaseError(error.message)
    } finally {
      setCreating(false)
    }
  }

  async function archiveCase(id) {
    setCaseError('')
    setNotice('')
    try {
      await api(`/api/cases/${id}/archive`, { method: 'POST' })
      setCases((current) => current.filter((item) => item._id !== id))
      if (selectedCaseId === id) navigate()
      setNotice('Case archived.')
    } catch (error) {
      setCaseError(error.message)
    }
  }

  async function createClue(event) {
    event.preventDefault()
    setClueSaving(true)
    setClueError('')
    setClueNotice('')
    try {
      const result = await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/clues`, {
        method: 'POST', body: JSON.stringify({ title: clueTitle, details: clueDetails }),
      })
      setClues((current) => [...current, result.clue])
      setClueTitle('')
      setClueDetails('')
      setClueNotice('Clue added.')
    } catch (error) {
      setClueError(error.message)
    } finally {
      setClueSaving(false)
    }
  }

  function startEditingClue(clue) {
    setEditingClueId(clue._id)
    setEditClueTitle(clue.title)
    setEditClueDetails(clue.details)
    setClueError('')
    setClueNotice('')
  }

  function cancelEditingClue() {
    setEditingClueId(null)
    setEditClueTitle('')
    setEditClueDetails('')
  }

  async function saveClue(event, clueId) {
    event.preventDefault()
    setClueSaving(true)
    setClueError('')
    setClueNotice('')
    try {
      const result = await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/clues/${encodeURIComponent(clueId)}`, {
        method: 'PATCH', body: JSON.stringify({ title: editClueTitle, details: editClueDetails }),
      })
      setClues((current) => current.map((clue) => clue._id === clueId ? result.clue : clue))
      cancelEditingClue()
      setClueNotice('Clue changes saved.')
    } catch (error) {
      setClueError(error.message)
    } finally {
      setClueSaving(false)
    }
  }

  async function createSuspect(event) {
    event.preventDefault(); setSuspectSaving(true); setSuspectError(''); setSuspectNotice('')
    try {
      const result = await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/suspects`, { method: 'POST', body: JSON.stringify({ name: suspectName, details: suspectDetails }) })
      setSuspects((current) => [...current, result.suspect]); setSuspectName(''); setSuspectDetails(''); setSuspectNotice('Suspect added.')
    } catch (error) { setSuspectError(error.message) } finally { setSuspectSaving(false) }
  }

  function startEditingSuspect(suspect) {
    setEditingSuspectId(suspect._id); setEditSuspectName(suspect.name); setEditSuspectDetails(suspect.details); setSuspectError(''); setSuspectNotice('')
  }

  async function saveSuspect(event, suspectId) {
    event.preventDefault(); setSuspectSaving(true); setSuspectError(''); setSuspectNotice('')
    try {
      const result = await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/suspects/${encodeURIComponent(suspectId)}`, { method: 'PATCH', body: JSON.stringify({ name: editSuspectName, details: editSuspectDetails }) })
      setSuspects((current) => current.map((suspect) => suspect._id === suspectId ? result.suspect : suspect)); setEditingSuspectId(null); setSuspectNotice('Suspect changes saved.')
    } catch (error) { setSuspectError(error.message) } finally { setSuspectSaving(false) }
  }

  async function deleteSuspect(suspectId) {
    setSuspectSaving(true); setSuspectError(''); setSuspectNotice('')
    try {
      await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/suspects/${encodeURIComponent(suspectId)}`, { method: 'DELETE' })
      setSuspects((current) => current.filter((suspect) => suspect._id !== suspectId)); setSuspectNotice('Suspect deleted.')
    } catch (error) { setSuspectError(error.message) } finally { setSuspectSaving(false) }
  }

  async function createEvidence(event) {
    event.preventDefault(); setEvidenceSaving(true); setEvidenceError(''); setEvidenceNotice('')
    try {
      const result = await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/evidence`, { method: 'POST', body: JSON.stringify({ title: evidenceTitle, details: evidenceDetails }) })
      setEvidence((current) => [...current, result.evidence]); setEvidenceTitle(''); setEvidenceDetails(''); setEvidenceNotice('Evidence added.')
    } catch (error) { setEvidenceError(error.message) } finally { setEvidenceSaving(false) }
  }

  function startEditingEvidence(item) {
    setEditingEvidenceId(item._id); setEditEvidenceTitle(item.title); setEditEvidenceDetails(item.details); setEvidenceError(''); setEvidenceNotice('')
  }

  async function saveEvidence(event, evidenceId) {
    event.preventDefault(); setEvidenceSaving(true); setEvidenceError(''); setEvidenceNotice('')
    try {
      const result = await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/evidence/${encodeURIComponent(evidenceId)}`, { method: 'PATCH', body: JSON.stringify({ title: editEvidenceTitle, details: editEvidenceDetails }) })
      setEvidence((current) => current.map((item) => item._id === evidenceId ? result.evidence : item)); setEditingEvidenceId(null); setEvidenceNotice('Evidence changes saved.')
    } catch (error) { setEvidenceError(error.message) } finally { setEvidenceSaving(false) }
  }

  async function deleteEvidence(evidenceId) {
    if (!window.confirm('Delete this evidence record? This action cannot be undone.')) return
    setEvidenceSaving(true); setEvidenceError(''); setEvidenceNotice('')
    try {
      await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/evidence/${encodeURIComponent(evidenceId)}`, { method: 'DELETE' })
      setEvidence((current) => current.filter((item) => item._id !== evidenceId)); setEvidenceNotice('Evidence deleted.')
    } catch (error) { setEvidenceError(error.message) } finally { setEvidenceSaving(false) }
  }

  async function createRelationship(event) {
    event.preventDefault()
    setRelationshipSaving(true); setRelationshipError(''); setRelationshipNotice('')
    try {
      const [fromType, fromRecordId] = fromRecordKey.split(':')
      const [toType, toRecordId] = toRecordKey.split(':')
      const result = await api(`/api/cases/${encodeURIComponent(selectedCaseId)}/relationships`, {
        method: 'POST', body: JSON.stringify({ fromType, fromRecordId, toType, toRecordId, note: relationshipNote }),
      })
      setRelationships((current) => [...current, result.relationship])
      setFromRecordKey(''); setToRecordKey(''); setRelationshipNote(''); setRelationshipNotice('Relationship saved.')
    } catch (error) { setRelationshipError(error.message) } finally { setRelationshipSaving(false) }
  }

  if (checkingSession) {
    return <main className="loading-screen" aria-live="polite">Opening your investigation room…</main>
  }

  if (!user) {
    const registering = mode === 'register'
    return (
      <main className="auth-layout">
        <section className="auth-aside" aria-label="Investigation Room">
          <a className="brand" href="/" aria-label="Investigation Room home">
            <span className="brand-mark">IR</span>
            <span>Investigation Room</span>
          </a>
          <div className="aside-copy">
            <span className="eyebrow">A clearer view of every case</span>
            <h1>Bring the details together.</h1>
            <p>A private workspace for organizing investigations and keeping every lead in view.</p>
          </div>
          <div className="aside-footer"><span className="status-dot" /> Private investigator workspace</div>
        </section>

        <section className="auth-main">
          <div className="auth-card">
            <div className="mobile-brand"><span className="brand-mark">IR</span> Investigation Room</div>
            <span className="eyebrow">{registering ? 'Create your account' : 'Welcome back'}</span>
            <h2>{registering ? 'Start an investigation room' : 'Sign in to your room'}</h2>
            <p className="form-intro">{registering ? 'Set up your investigator account to get started.' : 'Enter your credentials to continue.'}</p>
            <form onSubmit={submitAuth} className="auth-form">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              <div className="password-label">
                <label htmlFor="password">Password</label>
                {registering && <span>12 characters minimum</span>}
              </div>
              <input id="password" name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 12 : undefined} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={registering ? 'At least 12 characters' : 'Enter your password'} />
              {authError && <p className="error-message" role="alert">{authError}</p>}
              <button className="primary-button" type="submit" disabled={authBusy}>
                {authBusy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}
                {!authBusy && <span aria-hidden="true">→</span>}
              </button>
            </form>
            <p className="auth-switch">
              {registering ? 'Already have an account?' : 'New to the Investigation Room?'}{' '}
              <button type="button" onClick={() => { setMode(registering ? 'login' : 'register'); setAuthError('') }}>
                {registering ? 'Sign in' : 'Create an account'}
              </button>
            </p>
            <div className="security-note"><span aria-hidden="true">⌑</span> Your cases are private to your account.</div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <a className="brand dark-brand" href="/">
          <span className="brand-mark">IR</span>
          <span>Investigation Room</span>
        </a>
        <div className="account-menu"><span className="account-avatar">{user.email.slice(0, 1).toUpperCase()}</span><span className="account-email">{user.email}</span><button type="button" className="quiet-button" onClick={signOut}>Sign out</button></div>
      </header>
      {selectedCaseId ? (
      <section className="workspace-content case-detail">
        <button className="quiet-button back-button" type="button" onClick={() => navigate()}>← All cases</button>
        {selectedCaseBusy ? <p className="empty-state" aria-live="polite">Loading case overview…</p> : selectedCaseError ? (
          <div className="case-detail-error"><p className="error-message" role="alert">{selectedCaseError}</p><button className="quiet-button" type="button" onClick={() => navigate()}>Return to cases</button></div>
        ) : selectedCase ? (
          <>
            <div className="case-detail-heading">
              <div><span className="eyebrow">INVESTIGATION OVERVIEW</span><h1>{selectedCase.title}</h1><p>{selectedCase.summary || 'No summary added.'}</p></div>
              <span className={`case-status status-${selectedCase.status}`}>{selectedCase.status.replace('_', ' ')}</span>
            </div>
           <section className="case-panel overview-panel">
  <div className="panel-heading">
    <div>
      <span className="eyebrow">CASE DETAILS</span>
      <h2>Overview</h2>
    </div>

    {!editingCase && (
      <button
        className="quiet-button"
        type="button"
        onClick={() => startEditingCase(selectedCase)}
      >
        Edit case
      </button>
    )}
  </div>

  {editingCase ? (
    <form
      className="case-form"
      onSubmit={(event) => {
        event.preventDefault()
        saveCase()
      }}
    >
      <label htmlFor="edit-case-title">Case title</label>
      <input
        id="edit-case-title"
        value={editCaseTitle}
        onChange={(event) => setEditCaseTitle(event.target.value)}
        maxLength={160}
        required
      />

      <label htmlFor="edit-case-summary">Summary</label>
      <textarea
        id="edit-case-summary"
        value={editCaseSummary}
        onChange={(event) => setEditCaseSummary(event.target.value)}
        maxLength={5000}
        rows={3}
      />

      {editCaseError && (
        <p className="error-message" role="alert">{editCaseError}</p>
      )}

      <div className="clue-actions">
        <button
          className="primary-button"
          type="submit"
          disabled={caseSaving}
        >
          {caseSaving ? 'Saving…' : 'Save Changes'}
        </button>

        <button
          className="quiet-button"
          type="button"
          onClick={cancelEditingCase}
          disabled={caseSaving}
        >
          Cancel
        </button>
      </div>
    </form>
  ) : (
    <dl className="overview-grid">
      <div><dt>Priority</dt><dd>{selectedCase.priority}</dd></div>
      <div><dt>Created</dt><dd>{new Date(selectedCase.createdAt).toLocaleDateString()}</dd></div>
      <div><dt>Last updated</dt><dd>{new Date(selectedCase.updatedAt).toLocaleDateString()}</dd></div>
    </dl>
  )}
</section>
            <section className="case-panel case-tools-panel">
              <div><span className="eyebrow">CASE MANAGEMENT</span><h2>Case tools</h2><p>Archive this case when it is no longer active. Archived cases are preserved.</p></div>
              <button className="archive-detail-button" type="button" onClick={() => archiveCase(selectedCase._id)}>Archive case</button>
            </section>
            <section className="case-panel clues-panel" aria-labelledby="clues-heading">
              <div className="clues-heading"><div><span className="eyebrow">INVESTIGATION RECORDS</span><h2 id="clues-heading">Clues</h2></div><span className="clue-count">{clues.length} saved</span></div>
              {clueNotice && <p className="success-message" role="status">{clueNotice}</p>}
              {clueError && <p className="error-message" role="alert">{clueError}</p>}
              <form className="clue-form" onSubmit={createClue}>
                <h3>Add a clue</h3>
                <label htmlFor="clue-title">Title</label>
                <input id="clue-title" value={clueTitle} onChange={(event) => setClueTitle(event.target.value)} maxLength={160} required placeholder="Briefly name this clue" />
                <label htmlFor="clue-details">Details</label>
                <textarea id="clue-details" value={clueDetails} onChange={(event) => setClueDetails(event.target.value)} maxLength={5000} rows={3} required placeholder="Record what was observed or discovered" />
                <button className="primary-button clue-submit" type="submit" disabled={clueSaving}>{clueSaving ? 'Saving…' : 'Add clue'}</button>
              </form>
              <div className="clue-list" aria-live="polite">
                {cluesBusy ? <p className="clue-empty">Loading clues…</p> : clues.length === 0 ? (
                  <p className="clue-empty">No clues yet. Add a clue to begin building this investigation record.</p>
                ) : clues.map((clue) => (
                  <article className="clue-card" key={clue._id}>
                    {editingClueId === clue._id ? (
                      <form className="clue-edit-form" onSubmit={(event) => saveClue(event, clue._id)}>
                        <label htmlFor={`edit-clue-title-${clue._id}`}>Title</label>
                        <input id={`edit-clue-title-${clue._id}`} value={editClueTitle} onChange={(event) => setEditClueTitle(event.target.value)} maxLength={160} required />
                        <label htmlFor={`edit-clue-details-${clue._id}`}>Details</label>
                        <textarea id={`edit-clue-details-${clue._id}`} value={editClueDetails} onChange={(event) => setEditClueDetails(event.target.value)} maxLength={5000} rows={3} required />
                        <div className="clue-actions"><button className="primary-button" type="submit" disabled={clueSaving}>{clueSaving ? 'Saving…' : 'Save Changes'}</button><button className="quiet-button" type="button" onClick={cancelEditingClue} disabled={clueSaving}>Cancel</button></div>
                      </form>
                    ) : (
                      <>
                        <div className="clue-card-heading"><h3>{clue.title}</h3><button className="quiet-button" type="button" onClick={() => startEditingClue(clue)}>Edit</button></div>
                        <p>{clue.details}</p>
                      </>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section className="case-panel clues-panel" aria-labelledby="suspects-heading">
              <div className="clues-heading"><div><span className="eyebrow">INVESTIGATION RECORDS</span><h2 id="suspects-heading">Suspects</h2></div><span className="clue-count">{suspects.length} saved</span></div>
              {suspectNotice && <p className="success-message" role="status">{suspectNotice}</p>}
              {suspectError && <p className="error-message" role="alert">{suspectError}</p>}
              <form className="clue-form" onSubmit={createSuspect}>
                <h3>Add a suspect</h3>
                <label htmlFor="suspect-name">Suspect name</label>
                <input id="suspect-name" value={suspectName} onChange={(event) => setSuspectName(event.target.value)} maxLength={160} required placeholder="Enter a name" />
                <label htmlFor="suspect-details">Details</label>
                <textarea id="suspect-details" value={suspectDetails} onChange={(event) => setSuspectDetails(event.target.value)} maxLength={5000} rows={3} required placeholder="Record relevant, unverified information" />
                <button className="primary-button clue-submit" type="submit" disabled={suspectSaving}>{suspectSaving ? 'Saving…' : 'Add suspect'}</button>
              </form>
              <div className="clue-list" aria-live="polite">
                {suspectsBusy ? <p className="clue-empty">Loading suspects…</p> : suspects.length === 0 ? <p className="clue-empty">No suspects recorded. Keep involvement unverified unless evidence confirms it.</p> : suspects.map((suspect) => (
                  <article className="clue-card" key={suspect._id}>
                    {editingSuspectId === suspect._id ? (
                      <form className="clue-edit-form" onSubmit={(event) => saveSuspect(event, suspect._id)}>
                        <label htmlFor={`edit-suspect-name-${suspect._id}`}>Suspect name</label>
                        <input id={`edit-suspect-name-${suspect._id}`} value={editSuspectName} onChange={(event) => setEditSuspectName(event.target.value)} maxLength={160} required />
                        <label htmlFor={`edit-suspect-details-${suspect._id}`}>Details</label>
                        <textarea id={`edit-suspect-details-${suspect._id}`} value={editSuspectDetails} onChange={(event) => setEditSuspectDetails(event.target.value)} maxLength={5000} rows={3} required />
                        <div className="clue-actions"><button className="primary-button" type="submit" disabled={suspectSaving}>{suspectSaving ? 'Saving…' : 'Save Changes'}</button><button className="quiet-button" type="button" onClick={() => setEditingSuspectId(null)} disabled={suspectSaving}>Cancel</button></div>
                      </form>
                    ) : <><div className="clue-card-heading"><h3>{suspect.name}</h3><div className="suspect-actions"><button className="quiet-button" type="button" onClick={() => startEditingSuspect(suspect)} disabled={suspectSaving}>Edit</button><button className="quiet-button" type="button" onClick={() => deleteSuspect(suspect._id)} disabled={suspectSaving}>Delete</button></div></div><p>{suspect.details}</p></>}
                  </article>
                ))}
              </div>
            </section>
            <section className="case-panel clues-panel" aria-labelledby="evidence-heading">
              <div className="clues-heading"><div><span className="eyebrow">INVESTIGATION RECORDS</span><h2 id="evidence-heading">Evidence</h2></div><span className="clue-count">{evidence.length} saved</span></div>
              {evidenceNotice && <p className="success-message" role="status">{evidenceNotice}</p>}
              {evidenceError && <p className="error-message" role="alert">{evidenceError}</p>}
              <form className="clue-form" onSubmit={createEvidence}>
                <h3>Add evidence</h3>
                <label htmlFor="evidence-title">Title</label>
                <input id="evidence-title" value={evidenceTitle} onChange={(event) => setEvidenceTitle(event.target.value)} maxLength={160} required placeholder="Name this evidence item" />
                <label htmlFor="evidence-details">Details</label>
                <textarea id="evidence-details" value={evidenceDetails} onChange={(event) => setEvidenceDetails(event.target.value)} maxLength={5000} rows={3} required placeholder="Record what it is and where it was found" />
                <button className="primary-button clue-submit" type="submit" disabled={evidenceSaving}>{evidenceSaving ? 'Saving…' : 'Add evidence'}</button>
              </form>
              <div className="clue-list" aria-live="polite">
                {evidenceBusy ? <p className="clue-empty">Loading evidence…</p> : evidence.length === 0 ? <p className="clue-empty">No evidence recorded for this case yet.</p> : evidence.map((item) => (
                  <article className="clue-card" key={item._id}>
                    {editingEvidenceId === item._id ? (
                      <form className="clue-edit-form" onSubmit={(event) => saveEvidence(event, item._id)}>
                        <label htmlFor={`edit-evidence-title-${item._id}`}>Title</label>
                        <input id={`edit-evidence-title-${item._id}`} value={editEvidenceTitle} onChange={(event) => setEditEvidenceTitle(event.target.value)} maxLength={160} required />
                        <label htmlFor={`edit-evidence-details-${item._id}`}>Details</label>
                        <textarea id={`edit-evidence-details-${item._id}`} value={editEvidenceDetails} onChange={(event) => setEditEvidenceDetails(event.target.value)} maxLength={5000} rows={3} required />
                        <div className="clue-actions"><button className="primary-button" type="submit" disabled={evidenceSaving}>{evidenceSaving ? 'Saving…' : 'Save Changes'}</button><button className="quiet-button" type="button" onClick={() => setEditingEvidenceId(null)} disabled={evidenceSaving}>Cancel</button></div>
                      </form>
                    ) : <><div className="clue-card-heading"><h3>{item.title}</h3><div className="suspect-actions"><button className="quiet-button" type="button" onClick={() => startEditingEvidence(item)} disabled={evidenceSaving}>Edit</button><button className="quiet-button" type="button" onClick={() => deleteEvidence(item._id)} disabled={evidenceSaving}>Delete</button></div></div><p>{item.details}</p></>}
                  </article>
                ))}
              </div>
            </section>
            <section className="case-panel clues-panel" aria-labelledby="relationship-heading">
              <div className="clues-heading"><div><span className="eyebrow">CASE CONNECTIONS</span><h2 id="relationship-heading">Trace a Relationship</h2></div><span className="clue-count">{relationships.length} saved</span></div>
              <p className="relationship-intro">Connect existing clues, suspects, and evidence to record how they relate.</p>
              {relationshipNotice && <p className="success-message" role="status">{relationshipNotice}</p>}
              {relationshipError && <p className="error-message" role="alert">{relationshipError}</p>}
              {relationshipRecords.length < 2 ? <p className="clue-empty">Add at least two records to this case before connecting them.</p> : (
                <form className="clue-form relationship-form" onSubmit={createRelationship}>
                  <label htmlFor="relationship-from">From Record</label>
                  <select id="relationship-from" value={fromRecordKey} onChange={(event) => setFromRecordKey(event.target.value)} required>
                    <option value="">Choose a record</option>
                    {relationshipRecords.map((record) => <option key={record.key} value={record.key}>{record.label}</option>)}
                  </select>
                  <label htmlFor="relationship-to">To Record</label>
                  <select id="relationship-to" value={toRecordKey} onChange={(event) => setToRecordKey(event.target.value)} required>
                    <option value="">Choose a record</option>
                    {relationshipRecords.map((record) => <option key={record.key} value={record.key}>{record.label}</option>)}
                  </select>
                  <label htmlFor="relationship-note">Note</label>
                  <textarea id="relationship-note" value={relationshipNote} onChange={(event) => setRelationshipNote(event.target.value)} maxLength={2000} rows={3} required placeholder="Describe the connection or why it matters" />
                  <button className="primary-button clue-submit" type="submit" disabled={relationshipSaving || !fromRecordKey || !toRecordKey || fromRecordKey === toRecordKey}>{relationshipSaving ? 'Saving…' : 'Connect records'}</button>
                </form>
              )}
              <div className="clue-list" aria-live="polite">
                {relationshipsBusy ? <p className="clue-empty">Loading relationships…</p> : relationships.length === 0 ? <p className="clue-empty">No relationships recorded for this case yet.</p> : relationships.map((relationship) => (
                  <article className="clue-card relationship-card" key={relationship._id}>
                    <div className="relationship-record-pair"><div><span className="eyebrow">FROM</span><h3>{relationshipRecordLabel(relationship.fromType, relationship.fromRecordId)}</h3></div><span className="relationship-arrow" aria-hidden="true">→</span><div><span className="eyebrow">TO</span><h3>{relationshipRecordLabel(relationship.toType, relationship.toRecordId)}</h3></div></div>
                    <p>{relationship.note}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
      ) : <section className="workspace-content">
        <div className="welcome-row">
          <div><span className="eyebrow">YOUR WORKSPACE</span><h1>Investigation cases</h1><p>Keep your active work organized and easy to return to.</p></div>
          <div className="case-count"><strong>{cases.length.toString().padStart(2, '0')}</strong><span>visible cases</span></div>
        </div>
        {notice && <p className="success-message" role="status">{notice}</p>}
        {caseError && <p className="error-message workspace-error" role="alert">{caseError}</p>}

        <section className="case-panel create-panel">
          <div className="panel-heading"><div><span className="eyebrow">NEW RECORD</span><h2>Open a case</h2></div><span className="panel-icon" aria-hidden="true">＋</span></div>
          <form className="case-form" onSubmit={createCase}>
            <label htmlFor="case-title">Case title</label>
            <input id="case-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required placeholder="e.g. North pier incident" />
            <label htmlFor="case-summary">Summary <span className="optional-label">Optional</span></label>
            <textarea id="case-summary" value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={5000} rows={3} placeholder="A short overview to help you pick up where you left off…" />
            <button className="primary-button create-button" type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create case'} <span aria-hidden="true">→</span></button>
          </form>
        </section>

        <section className="case-list-section">
          <div className="list-heading"><div><span className="eyebrow">CASE FILES</span><h2>Your cases</h2></div><button className="quiet-button" type="button" onClick={loadCases} disabled={casesBusy}>{casesBusy ? 'Refreshing…' : 'Refresh'}</button></div>
          {casesBusy && cases.length === 0 ? <p className="empty-state">Loading your cases…</p> : cases.length === 0 ? (
            <div className="empty-state"><span className="empty-icon" aria-hidden="true">⌕</span><strong>No cases yet</strong><span>Create a case above to start organizing your investigation.</span></div>
          ) : (
            <div className="case-grid">
              {cases.filter((item) => !item.archived).map((item) => (
                <article className="case-card" key={item._id}>
                  <div className="case-card-top"><span className={`case-status status-${item.status}`}>{item.status.replace('_', ' ')}</span><button className="archive-button" type="button" onClick={() => archiveCase(item._id)} aria-label={`Archive ${item.title}`}>Archive</button></div>
                  <h3><button className="case-title-link" type="button" onClick={() => navigate(item._id)}>{item.title}</button></h3>
                  <p>{item.summary || 'No summary added.'}</p>
                  <button className="open-case-button" type="button" onClick={() => navigate(item._id)}>Open case <span aria-hidden="true">→</span></button>
                  <div className="case-card-footer"><span className={`priority-dot priority-${item.priority}`} />{item.priority} priority<span className="case-date">Updated {new Date(item.updatedAt).toLocaleDateString()}</span></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
      }
    </main>
  )
}

export default App
