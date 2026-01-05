export default function PosClients(){
  const mock = [
    { id: 'c1', name: 'Client A', status: 'healthy', lastSyncedAt: '2026-01-05T08:00:00Z' }
  ]

  return (
    <div>
      <h2>POS Clients</h2>
      <ul>
        {mock.map(c => <li key={c.id}>{c.name} — {c.status} (last: {c.lastSyncedAt})</li>)}
      </ul>
    </div>
  )
}
