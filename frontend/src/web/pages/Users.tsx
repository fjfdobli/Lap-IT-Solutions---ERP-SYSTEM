export default function Users() {
  const mock = [
    { id: '1', fullName: 'Super Admin', email: 'superadmin@example.com', roles: ['SuperAdmin'] }
  ]

  return (
    <div>
      <h2>Users</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Roles</th></tr>
        </thead>
        <tbody>
          {mock.map(u => (
            <tr key={u.id}><td>{u.fullName}</td><td>{u.email}</td><td>{u.roles.join(', ')}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
