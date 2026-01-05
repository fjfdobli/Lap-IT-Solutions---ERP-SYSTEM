export default function Audit(){
  const mock = [
    { id: 'a1', timestamp: '2026-01-05T08:00:00Z', actor: 'Super Admin', action: 'user.create', target: 'user:2' }
  ]

  return (
    <div>
      <h2>Audit Logs</h2>
      <ul>
        {mock.map(a => <li key={a.id}>{a.timestamp} — {a.actor} — {a.action} — {a.target}</li>)}
      </ul>
    </div>
  )
}
