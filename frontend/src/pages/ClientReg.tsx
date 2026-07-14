import { useEffect, useState } from 'react'
import { api } from '../mock/api'
import { PageHeader, Card, Loading } from '../components/ui'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import type { Client } from '../types'

const inStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '0.5px solid var(--border-p)', borderRadius: 8, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)' }

export default function ClientReg() {
  const toast = useToast()
  const [clients, setClients] = useState<Client[] | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', bizno: '', ceo: '', tel: '', manager: '' })

  useEffect(() => { api.listClients().then(setClients) }, [])
  if (!clients) return <Loading />

  function submit() {
    if (!form.name) { toast('상호를 입력해주세요.', 'warning'); return }
    const code = 'CL-' + String(clients!.length + 1).padStart(3, '0')
    setClients((s) => [...(s || []), { code, ...form }])
    setOpen(false)
    setForm({ name: '', bizno: '', ceo: '', tel: '', manager: '' })
    toast(`거래처 "${form.name}"가 등록되었습니다. (${code})`, 'success')
  }

  return (
    <>
      <PageHeader title="거래처등록" desc="거래처 정보 관리 · 엑셀 일괄 등록"
        action={<div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => toast('거래처 등록 템플릿(.xlsx)을 다운로드합니다.', 'info')}><i className="ti ti-download" /> 템플릿</button>
          <button className="btn" onClick={() => toast('엑셀 파일 업로드 시 일괄 등록됩니다.', 'info')}><i className="ti ti-upload" /> 파일 업로드</button>
          <button className="btn pri" onClick={() => setOpen(true)}><i className="ti ti-plus" /> 거래처 등록</button>
        </div>} />
      <Card>
        <div className="tw">
          <table className="tb">
            <thead><tr><th>코드</th><th>상호</th><th>사업자번호</th><th>대표자</th><th>연락처</th><th>담당자</th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.code}>
                  <td>{c.code}</td><td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.bizno}</td><td>{c.ceo}</td><td>{c.tel}</td><td>{c.manager}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} title="거래처 등록" onClose={() => setOpen(false)}
        footer={<><button className="btn" onClick={() => setOpen(false)}>취소</button><button className="btn pri" onClick={submit}>등록</button></>}>
        <label className="fld"><span>상호 *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inStyle} placeholder="○○환경(주)" /></label>
        <label className="fld"><span>사업자번호</span><input value={form.bizno} onChange={(e) => setForm({ ...form, bizno: e.target.value })} style={inStyle} placeholder="123-45-67890" /></label>
        <label className="fld"><span>대표자</span><input value={form.ceo} onChange={(e) => setForm({ ...form, ceo: e.target.value })} style={inStyle} /></label>
        <label className="fld"><span>연락처</span><input value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} style={inStyle} placeholder="02-000-0000" /></label>
        <label className="fld"><span>담당자</span><input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} style={inStyle} /></label>
      </Modal>
    </>
  )
}
