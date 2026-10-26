import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Copy, CreditCard, Eye, EyeOff, Landmark, LockKeyhole, LogOut, Plus, ShieldCheck, Wallet } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const TODAY = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: '2-digit' }).format(new Date()).toUpperCase();

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

function money(value) {
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 2 }).format(Number(value || 0));
}

export default function App() {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [ready, setReady] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({ username: '', email: '', password: '' });
  const [verificationPending, setVerificationPending] = useState(false);
  const [otp, setOtp] = useState('');
  const [transfer, setTransfer] = useState({ to: '', amount: '' });
  const [transactions, setTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [transferNotice, setTransferNotice] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadAccount = async () => {
    const result = await request('/api/account/');
    setAccount(result.account);
    if (result.account.user && typeof result.account.user === 'object') {
      setUser(currentUser => ({ ...currentUser, username: result.account.user.username, email: result.account.user.email }));
    }
    const balanceResult = await request(`/api/account/getbalance/${result.account._id}`);
    setBalance(balanceResult.balance);
  };

  const loadTransactions = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const result = await request('/api/transaction/history');
      setTransactions(result.transactions || []);
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    request('/api/auth/me').then(data => {
      setUser({ username: data.username, email: data.email, systemUser: data.systemUser });
      return Promise.all([loadAccount().catch(() => {}), loadTransactions()]);
    }).catch(() => {}).finally(() => setReady(true));
  }, []);

  const showMessage = (type, message) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 5000);
  };

  const showTransferMessage = (type, message) => {
    setTransferNotice({ type, message });
    window.setTimeout(() => setTransferNotice(null), 5000);
  };

  useEffect(() => {
    if (!user?.email) return;
    const refreshInterval = window.setInterval(async () => {
      try {
        await request('/api/auth/access-token', { method: 'POST' });
      } catch (error) {
        showMessage('error', `Session refresh failed: ${error.message}`);
      }
    }, 15 * 60 * 1000);
    return () => window.clearInterval(refreshInterval);
  }, [user?.email]);

  const handleAuth = async (event) => {
    event.preventDefault(); setBusy(true); setNotice(null);
    try {
      const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const data = await request(path, { method: 'POST', body: JSON.stringify(auth) });
      if (authMode === 'register') {
        setVerificationPending(true);
        setOtp('');
        showMessage('success', data.message);
        return;
      }
      const signedInUser = await request('/api/auth/me');
      setUser({ username: signedInUser.username, email: signedInUser.email, systemUser: signedInUser.systemUser });
      try { await Promise.all([loadAccount(), loadTransactions()]); }
      catch { setAccount(null); setBalance(0); }
      showMessage('success', `Welcome${signedInUser.username ? `, ${signedInUser.username}` : ''}. You’re signed in.`);
    } catch (error) {
      if (authMode === 'login' && error.message.toLowerCase().includes('verify your email')) {
        try {
          const result = await request('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email: auth.email }) });
          setVerificationPending(true);
          setOtp('');
          showMessage('success', `${result.message} Enter the code below to verify your email.`);
        } catch (resendError) {
          showMessage('error', resendError.message);
        }
      } else {
        showMessage('error', error.message);
      }
    }
    finally { setBusy(false); }
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault(); setBusy(true); setNotice(null);
    try {
      const data = await request('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ email: auth.email, otp }) });
      setVerificationPending(false);
      setAuthMode('login');
      setAuth({ ...auth, password: '' });
      setOtp('');
      showMessage('success', `${data.message} You can now sign in.`);
    } catch (error) { showMessage('error', error.message); }
    finally { setBusy(false); }
  };

  const resendOtp = async () => {
    setBusy(true);
    try {
      const data = await request('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email: auth.email }) });
      showMessage('success', data.message);
    } catch (error) { showMessage('error', error.message); }
    finally { setBusy(false); }
  };

  const createAccount = async () => {
    setBusy(true);
    try {
      const result = await request('/api/account/create', { method: 'POST', body: JSON.stringify({}) });
      setAccount(result.account); setBalance(0);
      showMessage('success', result.message || 'Your account is ready.');
    } catch (error) { showMessage('error', error.message); }
    finally { setBusy(false); }
  };

  const handleTransfer = async (event) => {
    event.preventDefault(); setBusy(true); setTransferNotice(null);
    try {
      const amount = Number(transfer.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter an amount greater than zero.');
      if (!transfer.to.trim()) throw new Error('Enter the recipient account ID.');
      const idempotencykey = crypto.randomUUID();
      const isSystemUser = user?.systemUser === true;
      const path = isSystemUser ? '/api/transaction/system/initial-funds' : '/api/transaction/';
      const body = isSystemUser
        ? { to: transfer.to.trim(), amount, idempotencykey }
        : { from: account._id, to: transfer.to.trim(), amount, idempotencykey };
      const data = await request(path, { method: 'POST', body: JSON.stringify(body) });
      setTransfer({ to: '', amount: '' }); await Promise.all([loadAccount(), loadTransactions()]);
      showTransferMessage('success', data.message || 'Transfer completed successfully.');
    } catch (error) { showTransferMessage('error', error.message); }
    finally { setBusy(false); }
  };

  const logout = async () => {
    try { await request('/api/auth/logout', { method: 'POST' }); } catch {}
    setUser(null); setAccount(null); setBalance(0); setTransactions([]); setAuth({ username: '', email: '', password: '' });
  };

  const logoutAll = async () => {
    setBusy(true);
    try {
      await request('/api/auth/logout-all', { method: 'POST' });
      setUser(null); setAccount(null); setBalance(0); setTransactions([]); setAuth({ username: '', email: '', password: '' });
      showMessage('success', 'You have been signed out from all devices.');
    } catch (error) {
      showMessage('error', error.message);
    } finally { setBusy(false); }
  };

  const copyAccount = async () => {
    if (!account?._id) return;
    await navigator.clipboard.writeText(account._id);
    setCopied(true); window.setTimeout(() => setCopied(false), 1600);
  };

  if (!ready) return <main className="loading"><div className="spinner" /><span>Opening your ledger…</span></main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#home"><span className="brand-icon"><Landmark size={20} /></span><span>ABC BANK</span></a>
      <div className="workspace-label">PERSONAL BANKING</div>
      <nav><a className="nav-link active" href="#overview"><Wallet size={18} /> Overview</a><a className="nav-link" href="#transfer"><ArrowLeftRight size={18} /> Send money</a></nav>
      <div className="sidebar-bottom"><div className="security-note"><span><ShieldCheck size={17} /></span><div><strong>Your money, in balance</strong><small>Secure ledger banking</small></div></div>{user && <><button className="logout-button" onClick={logout} disabled={busy}><LogOut size={16} /> Sign out</button><button className="logout-button" onClick={logoutAll} disabled={busy}><LogOut size={16} /> Sign out all devices</button></>}</div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Personal banking <span>/</span> <strong>Overview</strong></div><div className="top-user">{user ? <><span className="avatar">{user.username?.slice(0, 1).toUpperCase()}</span><span className="top-user-name">{user.username}<small>Personal account</small></span><ChevronDown size={15} /></> : <span className="secure-label"><LockKeyhole size={14} /> Secure access</span>}</div></header>

      <div className="content-wrap">
        <div className="page-heading"><div><div className="eyebrow">{TODAY}</div><h1>{user ? `Good to see you, ${user.username}.` : 'Your money, in balance.'}</h1><p>See what’s happening with your account.</p></div>{account && <span className="status-pill"><i /> Account active</span>}</div>

        {notice && user && <div className={`notice ${notice.type}`}><span>{notice.type === 'success' ? <Check size={16} /> : <CircleHelp size={16} />}</span>{notice.message}<button onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div>}

        {!user ? <section className="auth-layout">
          <div className="intro-card"><div className="intro-mark"><Landmark size={26} /></div><div className="eyebrow">SIMPLE, SECURE BANKING</div><h2>Money management<br />made clear.</h2><p>Sign in to check your balance, manage your account, and send money securely.</p><div className="intro-points"><span><ShieldCheck size={16} /> Protected access</span><span><ArrowLeftRight size={16} /> Fast transfers</span></div></div>
          <form className="auth-card" onSubmit={verificationPending ? handleVerifyEmail : handleAuth}><div className="auth-title"><span className="eyebrow">YOUR LEDGER ACCOUNT</span><h2>{verificationPending ? 'Verify your email' : authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p>{verificationPending ? `Enter the six-digit code sent to ${auth.email}.` : authMode === 'login' ? 'Enter your details to continue.' : 'A few details and you’re ready to go.'}</p></div>
            {!verificationPending && authMode === 'register' && <label>Full name<input value={auth.username} onChange={e => setAuth({ ...auth, username: e.target.value })} placeholder="e.g. Samira Thapa" required autoComplete="name" /></label>}
            <label>Email address<input type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com" required autoComplete="email" readOnly={verificationPending} /></label>
            {verificationPending ? <label>Verification code<input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" inputMode="numeric" autoComplete="one-time-code" required /></label> : <label>Password<input type="password" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="At least 8 characters" minLength="8" required autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} /></label>}
            {notice && !user && <div className={`notice ${notice.type}`}><span>{notice.type === 'success' ? <Check size={16} /> : <CircleHelp size={16} />}</span>{notice.message}<button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div>}
            <button className="primary-button full-button" disabled={busy}>{busy ? 'Please wait…' : verificationPending ? 'Verify email' : authMode === 'login' ? 'Sign in securely' : 'Create account'} <ArrowUpRight size={17} /></button>
            {verificationPending ? <div className="switch-auth">Didn’t receive the code? <button type="button" disabled={busy} onClick={resendOtp}>Resend OTP</button><br /><button type="button" onClick={() => { setVerificationPending(false); setAuthMode('register'); setNotice(null); }}>Back to registration</button></div> : <div className="switch-auth">{authMode === 'login' ? 'New to Ledger?' : 'Already have an account?'} <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setNotice(null); }}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></div>}
            <div className="form-lock"><LockKeyhole size={13} /> Your information is protected with secure sign-in</div>
          </form>
        </section> : !account ? <section className="empty-account"><div className="empty-icon"><CreditCard size={25} /></div><span className="eyebrow">ONE QUICK STEP</span><h2>Open your Ledger account</h2><p>Create your personal account to receive money and make transfers.</p><button className="primary-button" onClick={createAccount} disabled={busy}><Plus size={17} /> {busy ? 'Creating…' : 'Create account'}</button></section> : <>
          <section className="dashboard-grid" id="overview">
            <div className="balance-card"><div className="balance-top"><span className="balance-label"><span className="balance-icon"><Wallet size={17} /></span> Available balance</span><button className="eye-button" onClick={() => setShowBalance(!showBalance)} aria-label={showBalance ? 'Hide balance' : 'Show balance'}>{showBalance ? <Eye size={17} /> : <EyeOff size={17} />}</button></div><div className="balance-amount">{showBalance ? money(balance) : '••••••••'}</div><div className="balance-sub">Your current account balance <span>•</span> Nepalese Rupee</div><div className="balance-footer"><span>ACCOUNT NUMBER</span><button onClick={copyAccount}>{account._id} {copied ? <Check size={14} /> : <Copy size={14} />}</button></div></div>
            <div className="quick-card"><div className="section-heading"><div><span className="eyebrow">QUICK ACTION</span><h3>Move money</h3></div><span className="quick-icon"><ArrowUpRight size={19} /></span></div><p>Send money to another Ledger account in a few steps.</p><a className="text-link" href="#transfer">Make a transfer <ArrowUpRight size={15} /></a><div className="quick-rule" /><div className="quick-meta"><span><i /> Available to transfer</span><strong>{showBalance ? money(balance) : '••••••'}</strong></div></div>
          </section>
          <section className="lower-grid" id="transfer">
            <form className="transfer-card" onSubmit={handleTransfer}><div className="section-heading"><div><span className="eyebrow">PAYMENTS</span><h3>Send money</h3></div><span className="transfer-icon"><ArrowLeftRight size={19} /></span></div><p className="card-description">Transfer funds directly to another active account.</p><label>Recipient account ID<div className="input-with-icon"><CreditCard size={16} /><input value={transfer.to} onChange={e => setTransfer({ ...transfer, to: e.target.value })} placeholder="Paste the recipient’s account ID" required /></div></label><label>Amount<div className="amount-field"><span>NPR</span><input type="number" min="0.01" step="0.01" value={transfer.amount} onChange={e => setTransfer({ ...transfer, amount: e.target.value })} placeholder="0.00" required /><span className="currency-note">Nepalese Rupee</span></div></label>{transferNotice && <div className={`notice ${transferNotice.type}`}><span>{transferNotice.type === 'success' ? <Check size={16} /> : <CircleHelp size={16} />}</span>{transferNotice.message}<button type="button" onClick={() => setTransferNotice(null)} aria-label="Dismiss">×</button></div>}<button className="primary-button full-button" disabled={busy || !transfer.amount}>{busy ? 'Processing transfer…' : 'Review and send'} <ArrowUpRight size={17} /></button><div className="transfer-footnote"><LockKeyhole size={13} /> Transfers are recorded securely in your ledger.</div></form>
            <div className="activity-card"><div className="section-heading"><div><span className="eyebrow">ACCOUNT</span><h3>Your account</h3></div><span className="account-icon"><Landmark size={18} /></span></div><div className="account-detail"><span>Account holder</span><strong>{user.username}</strong></div><div className="account-detail"><span>Account type</span><strong>Personal current account</strong></div><div className="account-detail"><span>Currency</span><strong>NPR <small>Nepalese Rupee</small></strong></div><div className="account-detail"><span>Account status</span><strong className="active-text"><i /> Active</strong></div><div className="activity-note"><ShieldCheck size={16} /><span>Balances are calculated from your account’s immutable ledger entries.</span></div></div>
          </section>
          <section className="history-card">
            <div className="section-heading"><div><span className="eyebrow">ACTIVITY</span><h3>Transaction history</h3></div><button className="history-refresh" type="button" onClick={loadTransactions} disabled={historyLoading}>{historyLoading ? 'Loading…' : 'Refresh'}</button></div>
            {historyLoading && transactions.length === 0 ? <p className="history-message">Loading transactions…</p> : historyError ? <p className="history-message error">{historyError} <button type="button" onClick={loadTransactions}>Try again</button></p> : transactions.length === 0 ? <p className="history-message">No transactions yet.</p> : <div className="transaction-list">{transactions.map(transaction => <div className="transaction-row" key={transaction._id}><span className={`transaction-direction ${transaction.direction}`} aria-hidden="true">{transaction.direction === 'received' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span><div className="transaction-details"><strong>{transaction.direction === 'received' ? 'Received from' : 'Sent to'} {transaction.counterparty?.username || transaction.counterparty?.accountId || 'Account'}</strong><small>{new Date(transaction.createdAt).toLocaleString()}</small></div><div className={`transaction-value ${transaction.direction}`}><strong>{transaction.direction === 'received' ? '+' : '−'}{money(transaction.amount)}</strong><small>{transaction.status}</small></div></div>)}</div>}
          </section>
        </>}
        <footer>© 2026 Ledger <span>•</span> Simple, secure banking</footer>
      </div>
    </main>
  </div>;
}
