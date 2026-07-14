import { api } from '../mock/api'
import { useApi, PageHeader, Card, Loading } from '../components/ui'

export default function ClientReg() {
  const { data } = useApi(() => api.listClients())
  if (!data) return <Loading />
  return (
    <>
      <PageHeader title="거래처등록" desc="거래처 정보 관리 · 엑셀 일괄 등록"
        action={<div style={{ display: 'flex', gap: 8 }}><button className="btn"><i className="ti ti-download" /> 템플릿</button><button className="btn"><i className="ti ti-upload" /> 파일 업로드</button><button className="btn pri"><i className="ti ti-plus" /> 거래처 등록</button></div>} />
      <Card>
        <div className="tw">
          <table className="tb">
            <thead><tr><th>코드</th><th>상호</th><th>사업자번호</th><th>대표자</th><th>연락처</th><th>담당자</th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.code}>
                  <td>{c.code}</td><td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.bizno}</td><td>{c.ceo}</td><td>{c.tel}</td><td>{c.manager}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
