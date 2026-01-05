export default function Devices(){
  const mock = [
    { deviceId: 'dev-1', deviceName: 'POS-Terminal-1', user: 'Juan', lastSeen: '2026-01-05T09:00:00Z' }
  ]

  return (
    <div>
      <h2>Devices</h2>
      <table>
        <thead><tr><th>Device</th><th>User</th><th>Last seen</th></tr></thead>
        <tbody>
          {mock.map(d => <tr key={d.deviceId}><td>{d.deviceName}</td><td>{d.user}</td><td>{d.lastSeen}</td></tr>)}
        </tbody>
      </table>
    </div>
  )
}
