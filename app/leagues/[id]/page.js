'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const posColor = {
  RB: '#F4B740',
  WR: '#5FB8E0',
  TE: '#C792EA',
  QB: '#F4776A',
}

export default function LeagueQueuePage() {
  const { id } = useParams()
  const [league, setLeague] = useState(null)
  const [team, setTeam] = useState(null)
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newPos, setNewPos] = useState('')
  const [dragIndex, setDragIndex] = useState(null)

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
    const tempId = `temp-${Date.now()}`
    const optimisticEntry = {
      id: tempId,
      player_name: newName,
      position: newPos,
      rank: nextRank,
    }
    setQueue([...queue, optimisticEntry])
    setNewName('')
    setNewPos('')

    const { data } = await supabase
      .from('queue_entries')
      .insert({
        team_id: team.id,
        player_yahoo_id: `manual-${Date.now()}`,
        player_name: optimisticEntry.player_name,
        position: optimisticEntry.position,
        rank: nextRank,
        status: 'pending',
      })
      .select()
      .single()

    if (data) {
      setQueue((current) => current.map((q) => (q.id === tempId ? data : q)))
    }
  }

  async function removePlayer(entryId) {
    setQueue((current) => current.filter((q) => q.id !== entryId))
    await supabase.from('queue_entries').delete().eq('id', entryId)
  }

  async function saveOrder(orderedQueue) {
    const updates = orderedQueue
      .map((entry, index) => ({ entry, newRank: index + 1 }))
      .filter(({ entry, newRank }) => entry.rank !== newRank)

    await Promise.all(
      updates.map(({ entry, newRank }) =>
        supabase.from('queue_entries').update({ rank: newRank }).eq('id', entry.id)
      )
    )

    setQueue(orderedQueue.map((entry, index) => ({ ...entry, rank: index + 1 })))
  }

  function move(index, direction) {
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= queue.length) return
    const newQueue = [...queue]
    ;[newQueue[index], newQueue[swapIndex]] = [newQueue[swapIndex], newQueue[index]]
    saveOrder(newQueue)
  }

  function onDrop(dropIndex) {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      return
    }
    const newQueue = [...queue]
    const [moved] = newQueue.splice(dragIndex, 1)
    newQueue.splice(dropIndex, 0, moved)
    setDragIndex(null)
    saveOrder(newQueue)
  }

  if (loading) {
    return (
      <div style={{ background: '#0B0F14', minHeight: '100vh', color: '#EDEFF2' }}>
        <p style={{ padding: 40 }}>Loading...</p>
      </div>
    )
  }
  if (!league) {
    return (
      <div style={{ background: '#0B0F14', minHeight: '100vh', color: '#EDEFF2' }}>
        <p style={{ padding: 40 }}>League not found.</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#0B0F14', minHeight: '100vh', color: '#EDEFF2', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '40px 20px' }}>
        <a href="/leagues" style={{ color: '#8A94A3', fontSize: 13, textDecoration: 'none' }}>
          Back to leagues
        </a>
        <h1 style={{ marginTop: 10, marginBottom: 4 }}>{league.name}</h1>
        <p style={{ color: '#8A94A3', margin: 0 }}>{league.sport} - Team: {team?.team_name}</p>

        <h2 style={{ marginTop: 32, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A94A3' }}>
          Priority Queue
        </h2>
        <p style={{ fontSize: 12, color: '#5A6472', marginTop: -6, marginBottom: 12 }}>
          Drag to reorder
        </p>

        {queue.length === 0 ? (
          <div style={{ border: '1px dashed #263140', borderRadius: 10, padding: 24, textAlign: 'center', color: '#5A6472' }}>
            No one queued yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {queue.map((entry, i) => (
              <div
                key={entry.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#141B24',
                  border: '1px solid #1B232D',
                  borderRadius: 8,
                  padding: 10,
                  cursor: 'grab',
                  opacity: dragIndex === i ? 0.5 : 1,
                }}
              >
                <span style={{ color: '#3E4A59', fontSize: 14 }}>⠿</span>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: '#1B232D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#8A94A3',
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>{entry.player_name}</span>
                    {entry.position && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: posColor[entry.position] || '#8A94A3',
                          border: '1px solid ' + (posColor[entry.position] || '#8A94A3'),
                          borderRadius: 4,
                          padding: '0 4px',
                        }}
                      >
                        {entry.position}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={btnStyle}>Up</button>
                <button onClick={() => move(i, 1)} disabled={i === queue.length - 1} style={btnStyle}>Down</button>
                <button onClick={() => removePlayer(entry.id)} style={{ ...btnStyle, color: '#F4776A' }}>Remove</button>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ marginTop: 32, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A94A3' }}>
          Add a player
        </h2>
        <form onSubmit={addPlayer} style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Player name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Pos"
            value={newPos}
            onChange={(e) => setNewPos(e.target.value)}
            style={{ ...inputStyle, width: 60 }}
          />
          <button
            type="submit"
            style={{
              background: '#1B232D',
              border: '1px solid #F4B740',
              color: '#F4B740',
              borderRadius: 6,
              padding: '8px 14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </form>
      </div>
    </div>
  )
}

const btnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#5A6472',
  cursor: 'pointer',
  padding: 4,
  fontSize: 14,
}

const inputStyle = {
  flex: 1,
  padding: 8,
  background: '#141B24',
  border: '1px solid #263140',
  borderRadius: 6,
  color: '#EDEFF2',
}