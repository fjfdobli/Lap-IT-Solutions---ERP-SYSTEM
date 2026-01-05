export default function Roles(){
  const mock = [
    { id: 'r1', name: 'Admin', description: 'Full access to ERP' },
    { id: 'r2', name: 'Manager', description: 'Limited access' }
  ]

  return (
    <div>
      <h2>Roles</h2>
      <ul>
        {mock.map(r => <li key={r.id}><strong>{r.name}</strong> — {r.description}</li>)}
      </ul>
    </div>
  )
}
