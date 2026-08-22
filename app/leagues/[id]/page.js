'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { pageStyle, containerStyle, sectionHeaderStyle, positionColors, colors, inputStyle, buttonPrimaryStyle, buttonGhostStyle, formatSport } from '../../../lib/theme'
import Header from '../../../components/Header'
import SportIcon from '../../../components/SportIcon'

export default function LeagueQueuePage() {
  const { id } = useParams()
  const [league, setLeague] = useState(null)
  const [team, setTeam] = useState(null)
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newPos, setNewPos] = useState('')
  const [newBid, setNewBid] = useState('')
  const [dragIndex, setDragIndex] = useState(null)
  const [user, setUser] = useState(null)

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser()
    setUser(userData.user)

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

    const tempId = 'temp-' + Date.now()
    const bidValue = newBid.trim() ? Number(newBid) : null

    let insertIndex = queue.length
    if (bidValue !== null) {
      insertIndex = queue.findIndex(function (entry) {
        return entry.bid_amount === null || entry.bid_amount === undefined || bidValue > entry.bid_amount
      })
      if (insertIndex === -1) insertIndex = queue.length
    }

    const optimisticEntry = {
      id: tempId,
      player_name: newName,
      position: newPos,
      bid_amount: bidValue,
    }
    const newQueue = [...queue]
    newQueue.splice(insertIndex, 0, optimisticEntry)
    setQueue(newQueue.map(function (entry, index) { return { ...entry, rank: index + 1 } }))
    setNewName('')
    setNewPos('')
    setNewBid('')

    const { data } = await supabase
      .from('queue_entries')
      .insert({
        team_id: team.id,
        player_yahoo_id: 'manual-' + Date.now(),
        player_name: optimisticEntry.player_name,
        position: optimisticEntry.position,
        rank: insertIndex + 1,
        bid_amount: bidValue,
        status: 'pending',
      })
      .select()
      .single()

    if (data) {
      const finalQueue = newQueue.map(function (entry) { return entry.id === tempId ? data : entry })
      const rankedFinal = finalQueue.map(function (entry, index) { return { ...entry, rank: index + 1 } })
      setQueue(rankedFinal)
      saveOrder(rankedFinal)
    }
  }

  async function removePlayer(entryId) {
    setQueue(function (current) { return current.filter(function (q) { return q.id !== entryId }) })
    await supabase.from('queue_entries').delete().eq('id', entryId)
  }

  async function saveOrder(orderedQueue) {
    const updates = orderedQueue
      .map(function (entry, index) { return { entry: entry, newRank: index + 1 } })
      .filter(function (item) { return item.entry.rank !== item.newRank })

    await Promise.all(
      updates.map(function (item) {
        return supabase.from('queue_entries').update({ rank: item.newRank }).eq('id', item.entry.id)
      })
    )

    setQueue(orderedQueue.map(function (entry, index) { return { ...entry, rank: index + 1 } }))
  }

  function move(index, direction) {
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= queue.length) return
    const newQueue = [...queue]
    const tmp = newQueue[index]
    newQueue[index] = newQueue[swapIndex]
    newQueue[swapIndex] = tmp
    saveOrder(newQueue)
  }

  function onDrop(dropIndex) {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      return
    }
    const newQueue = [...queue]
    const moved = newQueue.splice(dragIndex, 1)[0]
    newQueue.splice(dropIndex, 0, moved)
    setDragIndex(null)
    saveOrder(newQueue)
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ padding: 40 }}>Loading...</p>
      </div>
    )
  }
  if (!league) {
    return (
      <div style={pageStyle}>
        <p style={{ padding: 40 }}>League not found.</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <Header user={user} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 6 }}>
          <SportIcon sport={formatSport(league.sport)} />
          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors.textSecondary }}>
            {formatSport(league.sport)}
          </span>
        </div>
        <h1 style={{ margin: 0, marginBottom: 2, fontSize: 24 }}>{team ? team.team_name : league.name}</h1>
        {team && (
          <p style={{ color: colors.textMuted, margin: 0, fontSize: 14 }}>{league.name}</p>
        )}

        <h2 style={sectionHeaderStyle}>Priority Queue</h2>
        <p style={{ fontSize: 12, color: '#5A6472', marginTop: -6, marginBottom: 12 }}>
          Drag to reorder
        </p>

        {queue.length === 0 ? (
          <div style={{ border: '1px dashed ' + colors.border, borderRadius: 10, padding: 24, textAlign: 'center', color: colors.textFaint }}>
            No one queued yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {queue.map(function (entry, i) {
              return (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={function () { setDragIndex(i) }}
                  onDragOver={function (e) { e.preventDefault() }}
                  onDrop={function () { onDrop(i) }}
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
                  <div style={{ display: 'grid', gridTemplateColumns: '3px 3px', gridTemplateRows: '3px 3px', gap: 3, flexShrink: 0 }}><div style={{ width: 3, height: 3, borderRadius: '50%', background: colors.textFaint }} /><div style={{ width: 3, height: 3, borderRadius: '50%', background: colors.textFaint }} /><div style={{ width: 3, height: 3, borderRadius: '50%', background: colors.textFaint }} /><div style={{ width: 3, height: 3, borderRadius: '50%', background: colors.textFaint }} /></div>
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
                            color: positionColors[entry.position] || '#8A94A3',
                            border: '1px solid ' + (positionColors[entry.position] || '#8A94A3'),
                            borderRadius: 4,
                            padding: '0 4px',
                          }}
                        >
                          {entry.position}
                        </span>
                      )}
                      {entry.bid_amount != null && (
                        <span style={{ fontSize: 11, color: '#8A94A3' }}>${entry.bid_amount}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={function () { removePlayer(entry.id) }} style={{ ...buttonGhostStyle, color: colors.danger, display: 'flex', alignItems: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <h2 style={sectionHeaderStyle}>Add a player</h2>
        <form onSubmit={addPlayer} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="Player name"
            value={newName}
            onChange={function (e) { setNewName(e.target.value) }}
            style={{ ...inputStyle, flex: '1 1 140px' }}
          />
          <input
            placeholder="Pos"
            value={newPos}
            onChange={function (e) { setNewPos(e.target.value) }}
            style={{ ...inputStyle, width: 60 }}
          />
          <input
            placeholder="Bid ($)"
            value={newBid}
            onChange={function (e) { setNewBid(e.target.value) }}
            style={{ ...inputStyle, width: 70 }}
          />
          <button type="submit" style={{ ...buttonPrimaryStyle, padding: '8px 16px' }}>
            Add
          </button>
        </form>
      </div>
    </div>
  )
}

