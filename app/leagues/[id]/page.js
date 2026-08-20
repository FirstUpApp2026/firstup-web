'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function LeagueQueuePage() {
  const { id } = useParams()
  const [league, setLeague] = useState(null)
  const [team, setTeam] = useState(null)
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newPos, setNewPos] = useState('')

  async function loadData() {
    const { data: leagueData } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single()
    setLeague(leagueData)

    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('league_id', id)
      .single()
    setTeam(teamData)

    if (teamData) {
      const { data: queueData } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('team_id', teamData.id)
        .order('rank', { ascending: true })
      setQueue(queueData || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function addPlayer(e) {
    e.preventDefault()
    if (!newName.trim() || !team) return

    const nextRank = queue.length + 1
    await supabase.from('queue_entries').insert({
      team_id: team.id,
      player_yahoo_id: `manual-${Date.now()}`,
      player_name: newName,
      position: newPos,
      rank: nextRank,
      status: 'pending',
    })

    setNewName('')
    setNewPos('')
    loadData()
  }

  async function removePlayer(entryId) {
    await supabase.from('queue_entries').delete().eq('id', entryId)
    loadData()
  }

  async function move(index, direction) {
    const newQueue = [...queue]
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= newQueue.length) {
      return
    }

    const a = newQueue[index]
    const b = newQueue[swapIndex]

    await supabase.from('queue_entries').update({ rank: b.rank }).eq('id', a.id)
    await supabase.from('queue_entries').update({ rank: a.rank }).eq('id', b.id)

    loadData()
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Loading...</p>
  }
  if (!league) {
    return <p style={{ padding: 40 }}>League not found.</p>
  }

  return (
    <div style={{ maxWidth: 500, margin: '60px auto', padding: 20 }}>
      <a href="/leagues">Back to leagues</a>
      <h1 style={{ marginTop: 10 }}>{league.name}</h1>
      <p style={{ color: '#888' }}>{league.sport} - Team: {team?.team_name}</p>

      <h2 style={{ marginTop: 30, fontSize: 18 }}>Priority Queue</h2>
      {queue.length === 0 ? (
        <p style={{ color: '#888' }}>No one queued yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {queue.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: '1px solid #333',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <span style={{ fontWeight: 700, width: 20 }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{entry.player_name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{entry.position}</div>
              </div>
              <button onClick={() => move(i, -1)} disabled={i === 0}>Up</button>
              <button onClick={() => move(i, 1)} disabled={i === queue.length - 1}>Down</button>
              <button onClick={() => removePlayer(entry.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: 30, fontSize: 18 }}>Add a player</h2>
      <form onSubmit={addPlayer} style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="Player name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <input
          placeholder="Pos"
          value={newPos}
          onChange={(e) => setNewPos(e.target.value)}
          style={{ width: 60, padding: 8 }}
        />
        <button type="submit" style={{ padding: 8 }}>Add</button>
      </form>
    </div>
  )
}