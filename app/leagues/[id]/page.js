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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [freeAgents, setFreeAgents] = useState([])
  const [toastVisible, setToastVisible] = useState(false)
  const [duplicateError, setDuplicateError] = useState('')
  const [notAuthorized, setNotAuthorized] = useState(false)
  function showSavedToast() {
    setToastVisible(true)
    setTimeout(function () { setToastVisible(false) }, 2000)
  }
  const [user, setUser] = useState(null)

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser()
    setUser(userData.user)

    const { data: leagueData } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single()

    if (!leagueData || leagueData.user_id !== userData.user.id) {
      setLoading(false)
      setNotAuthorized(true)
      return
    }

    setLeague(leagueData)

    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('league_id', id)
      .eq('user_id', userData.user.id)
      .maybeSingle()   
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
  useEffect(() => {
    async function loadFreeAgents() {
      if (!league || league.platform !== 'espn') return
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return
      const res = await fetch('/api/espn/free-agents?user_id=' + userData.user.id + '&espn_league_id=' + league.yahoo_league_key)
      const json = await res.json()
      if (json.players) setFreeAgents(json.players)
    }
    loadFreeAgents()
  }, [league])

  async function handleSearchChange(value) {
    setSearchQuery(value)
    setSelectedPlayer(null)
    if (!value.trim()) {
      setSearchResults([])
      return
    }
    if (league.platform === 'sleeper') {
      const res = await fetch('/api/sleeper/free-agents?sleeper_league_id=' + league.yahoo_league_key + '&q=' + encodeURIComponent(value))
      const json = await res.json()
      setSearchResults(json.players || [])
    } else {
      const matches = freeAgents.filter(function (p) {
        return p.name.toLowerCase().includes(value.toLowerCase())
      }).slice(0, 6)
      setSearchResults(matches)
    }
  }

  function selectPlayer(player) {
    setSelectedPlayer(player)
    setSearchQuery(player.name)
    setSearchResults([])
    setNewName(player.name)
    setNewPos(player.position)
  }

  async function addPlayer(e) {
    e.preventDefault()
    if (!newName.trim() || !team) return

    const alreadyQueued = queue.some(function (entry) {
      return entry.player_name.trim().toLowerCase() === newName.trim().toLowerCase()
    })
    if (alreadyQueued) {
      setDuplicateError(newName.trim() + ' is already in your queue.')
      return
    }
    setDuplicateError('')

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
      player_team: selectedPlayer ? selectedPlayer.team : null,
      player_image_url: selectedPlayer ? selectedPlayer.imageUrl : null,
    }
    const newQueue = [...queue]
    newQueue.splice(insertIndex, 0, optimisticEntry)
    setQueue(newQueue.map(function (entry, index) { return { ...entry, rank: index + 1 } }))
    setNewName('')
    setNewPos('')
    setNewBid('')
    setSearchQuery('')
    setSelectedPlayer(null)

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
        player_team: optimisticEntry.player_team,
        player_image_url: optimisticEntry.player_image_url,
      })
      .select()
      .single()

    if (data) {
      const finalQueue = newQueue.map(function (entry) { return entry.id === tempId ? data : entry })
      const rankedFinal = finalQueue.map(function (entry, index) { return { ...entry, rank: index + 1 } })
      setQueue(rankedFinal)
      saveOrder(rankedFinal)
      showSavedToast()
    }
  }

  async function removePlayer(entryId) {
    setQueue(function (current) { return current.filter(function (q) { return q.id !== entryId }) })
    await supabase.from('queue_entries').delete().eq('id', entryId)
    showSavedToast()
  }

  async function saveOrder(orderedQueue) {
    const updates = orderedQueue
      .map(function (entry, index) { return { entry: entry, newRank: index + 1 } })
      .filter(function (item) { return item.entry.rank !== item.newRank })

    if (updates.length === 0) return

    await Promise.all(
      updates.map(function (item) {
        return supabase.from('queue_entries').update({ rank: item.newRank }).eq('id', item.entry.id)
      })
    )

    setQueue(orderedQueue.map(function (entry, index) { return { ...entry, rank: index + 1 } }))
    showSavedToast()
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
  if (notAuthorized) {
    return (
      <div style={pageStyle}>
        <p style={{ padding: 40 }}>You don't have access to this league.</p>
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
                  {entry.player_image_url && (
                    <img
                      src={entry.player_image_url}
                      alt=""
                      style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', background: '#1B232D', flexShrink: 0 }}
                      onError={function (e) { e.target.style.display = 'none' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>{entry.player_name}</span>
                      {entry.player_team && (
                        <span style={{ fontSize: 12, color: '#8A94A3' }}>{entry.player_team}</span>
                      )}
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
        <form onSubmit={addPlayer}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            {selectedPlayer ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#141B24', border: '1px solid #1B232D', borderRadius: 8, padding: '8px 10px' }}>
                {selectedPlayer.imageUrl && (
                  <img
                    src={selectedPlayer.imageUrl}
                    alt=""
                    style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', background: '#1B232D', flexShrink: 0 }}
                    onError={function (e) { e.target.style.display = 'none' }}
                  />
                )}
                <span style={{ fontSize: 14 }}>{selectedPlayer.name}</span>
                {selectedPlayer.team && (
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{selectedPlayer.team}</span>
                )}
                {selectedPlayer.position && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.accent, border: '1px solid ' + colors.accent, borderRadius: 4, padding: '0 5px' }}>
                    {selectedPlayer.position}
                  </span>
                )}
                <span
                  onClick={function () { setSelectedPlayer(null); setSearchQuery(''); setNewName(''); setNewPos('') }}
                  style={{ marginLeft: 'auto', fontSize: 12, color: colors.textFaint, cursor: 'pointer' }}
                >
                  &times;
                </span>
              </div>
            ) : (
              <input
                placeholder={league.platform === 'espn' || league.platform === 'sleeper' ? 'Search player name' : 'Player name'}
                value={searchQuery}
                onChange={function (e) { handleSearchChange(e.target.value) }}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', textTransform: 'capitalize' }}
              />
            )}
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: 42, background: '#141B24', border: '1px solid #1B232D', borderRadius: 8, overflow: 'hidden', zIndex: 10 }}>
                {searchResults.map(function (p) {
                  return (
                    <div
                      key={p.id}
                      onClick={function () { selectPlayer(p) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid #1B232D', cursor: 'pointer' }}
                    >
                      {p.imageUrl && (
                        <img
                          src={p.imageUrl}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', background: '#1B232D', flexShrink: 0 }}
                          onError={function (e) { e.target.style.display = 'none' }}
                        />
                      )}
                      <span style={{ fontSize: 14, flex: 1 }}>{p.name}</span>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>
                        {p.team ? p.team + ' \u00b7 ' : ''}{p.position}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {league.uses_faab ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Bid ($)"
                value={newBid}
                onChange={function (e) { setNewBid(e.target.value) }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="submit" style={{ ...buttonPrimaryStyle, flex: 1 }}>
                Add
              </button>
            </div>
          ) : (
            <button type="submit" style={{ ...buttonPrimaryStyle, width: '100%' }}>
              Add
            </button>
          )}
        </form>
        {duplicateError && (
          <p style={{ marginTop: 8, color: colors.danger, fontSize: 13 }}>{duplicateError}</p>
        )}

      </div>
      {toastVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#1B2E22',
            border: '1px solid #2E5A3E',
            borderRadius: 8,
            padding: '10px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 50,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 13, color: '#4ADE80', fontWeight: 500 }}>Saved</span>
        </div>
      )}
    </div>
  )
}
