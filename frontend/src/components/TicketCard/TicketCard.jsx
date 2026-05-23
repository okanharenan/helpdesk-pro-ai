function TicketCard({ ticket }) {
  return (
    <div className='bg-white shadow rounded p-4'>
      <h2 className='font-bold text-lg'>{ticket.title}</h2>

      <p>Status: {ticket.status}</p>
      <p>Prioridade: {ticket.priority}</p>
    </div>
  )
}

export default TicketCard