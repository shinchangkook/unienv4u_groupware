import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import Layout from './layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Notice from './pages/Notice'
import Approval from './pages/Approval'
import Calendar from './pages/Calendar'
import Worklog from './pages/Worklog'
import Emp from './pages/Emp'
import Leave from './pages/Leave'
import Contract from './pages/Contract'
import Env from './pages/Env'
import ClientReg from './pages/ClientReg'
import Account from './pages/Account'
import AccLedger from './pages/AccLedger'
import Ledger from './pages/Ledger'
import Equip from './pages/Equip'
import MemberInfo from './pages/MemberInfo'

function Protected({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dash" element={<Dashboard />} />
        <Route path="/notice" element={<Notice />} />
        <Route path="/approval" element={<Approval />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/worklog" element={<Worklog />} />
        <Route path="/emp" element={<Emp />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/contract" element={<Contract />} />
        <Route path="/env" element={<Env />} />
        <Route path="/client-reg" element={<ClientReg />} />
        <Route path="/account" element={<Account />} />
        <Route path="/acc-ledger" element={<AccLedger />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/equip" element={<Equip />} />
        <Route path="/member-info" element={<MemberInfo />} />
      </Route>
      <Route path="*" element={<Navigate to="/dash" replace />} />
    </Routes>
  )
}
