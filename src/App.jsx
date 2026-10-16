import { useEffect, useRef, useState } from 'react'

const SYMBOLS = [
  { symbol: '🍊', name: '橘子', color: '#ec7d4c' },
  { symbol: '🍐', name: '西洋梨', color: '#9aaa5c' },
  { symbol: '🍓', name: '草莓', color: '#d95858' },
  { symbol: '🍋', name: '檸檬', color: '#e2ad3f' },
  { symbol: '🍇', name: '葡萄', color: '#7e648e' },
  { symbol: '🍑', name: '桃子', color: '#e9917b' },
  { symbol: '🥝', name: '奇異果', color: '#6f8d52' },
  { symbol: '🍒', name: '櫻桃', color: '#b9484d' },
]

function shuffleCards() {
  return [...SYMBOLS, ...SYMBOLS]
    .map((item, index) => ({ ...item, id: `${item.name}-${index}`, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function playSound(audioRef) {
  const audio = audioRef.current
  if (!audio) return
  audio.currentTime = 0
  audio.play().catch(() => {})
}

export default function App() {
  const [cards, setCards] = useState(shuffleCards)
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const [locked, setLocked] = useState(false)
  const timeoutRef = useRef(null)
  const matchSoundRef = useRef(null)
  const completeSoundRef = useRef(null)
  const isComplete = matched.length === cards.length

  useEffect(() => {
    matchSoundRef.current = new Audio(`${import.meta.env.BASE_URL}sounds/match.wav`)
    completeSoundRef.current = new Audio(`${import.meta.env.BASE_URL}sounds/complete.wav`)
    matchSoundRef.current.preload = 'auto'
    completeSoundRef.current.preload = 'auto'

    return () => {
      matchSoundRef.current?.pause()
      completeSoundRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    if (!started || isComplete) return undefined
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [started, isComplete])

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  function chooseCard(card) {
    if (locked || isComplete || flipped.includes(card.id) || matched.includes(card.id)) return
    if (!started) setStarted(true)

    const nextFlipped = [...flipped, card.id]
    setFlipped(nextFlipped)

    if (nextFlipped.length === 2) {
      setMoves((value) => value + 1)
      setLocked(true)
      const [firstId, secondId] = nextFlipped
      const firstCard = cards.find((item) => item.id === firstId)
      const secondCard = cards.find((item) => item.id === secondId)

      if (firstCard.name === secondCard.name) {
        playSound(matchSoundRef)
        timeoutRef.current = window.setTimeout(() => {
          setMatched((current) => {
            const nextMatched = [...current, firstId, secondId]
            if (nextMatched.length === cards.length) playSound(completeSoundRef)
            return nextMatched
          })
          setFlipped([])
          setLocked(false)
        }, 520)
      } else {
        timeoutRef.current = window.setTimeout(() => {
          setFlipped([])
          setLocked(false)
        }, 850)
      }
    }
  }

  function restartGame() {
    window.clearTimeout(timeoutRef.current)
    matchSoundRef.current?.pause()
    completeSoundRef.current?.pause()
    if (matchSoundRef.current) matchSoundRef.current.currentTime = 0
    if (completeSoundRef.current) completeSoundRef.current.currentTime = 0
    setCards(shuffleCards())
    setFlipped([])
    setMatched([])
    setMoves(0)
    setSeconds(0)
    setStarted(false)
    setLocked(false)
  }

  return (
    <main className="page-shell">
      <div className="grain" aria-hidden="true" />
      <header className="game-header">
        <div>
          <p className="eyebrow">MEMORY GARDEN · 01</p>
          <h1>果實小徑</h1>
          <p className="subtitle">翻開每一張牌，找出藏在花園裡的成對果實。</p>
        </div>

        <div className="stats" aria-label="遊戲狀態">
          <div className="stat-block">
            <span>步數</span>
            <strong>{String(moves).padStart(2, '0')}</strong>
          </div>
          <div className="stat-divider" />
          <div className="stat-block">
            <span>時間</span>
            <strong>{formatTime(seconds)}</strong>
          </div>
        </div>
      </header>

      <section className="game-area" aria-label="記憶翻牌遊戲區">
        <div className="board-wrap">
          <div className="board">
            {cards.map((card, index) => {
              const isFlipped = flipped.includes(card.id)
              const isMatched = matched.includes(card.id)
              return (
                <button
                  className={`card ${isFlipped ? 'is-flipped' : ''} ${isMatched ? 'is-matched' : ''}`}
                  key={card.id}
                  onClick={() => chooseCard(card)}
                  disabled={locked || isMatched}
                  aria-label={isFlipped || isMatched ? card.name : `第 ${index + 1} 張牌，尚未翻開`}
                  aria-pressed={isFlipped}
                  style={{ '--accent': card.color }}
                >
                  <span className="card-inner">
                    <span className="card-face card-back" aria-hidden="true">
                      <span className="leaf-mark">✦</span>
                      <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
                    </span>
                    <span className="card-face card-front">
                      <span className="fruit" role="img" aria-label={card.name}>{card.symbol}</span>
                      <span className="fruit-name">{card.name}</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <footer className="game-footer">
          <span>{matched.length / 2} / 8 組已找到</span>
          <button className="text-button" onClick={restartGame}>重新洗牌 ↗</button>
        </footer>
      </section>

      {isComplete && (
        <div className="modal-backdrop" role="presentation">
          <section className="complete-card" role="dialog" aria-modal="true" aria-labelledby="complete-title">
            <div className="complete-icon" aria-hidden="true">✓</div>
            <p className="eyebrow">ALL PAIRS FOUND</p>
            <h2 id="complete-title">完成！</h2>
            <p>你走完了果實小徑，所有果實都找到夥伴了。</p>
            <div className="result-row">
              <div><span>總步數</span><strong>{moves}</strong></div>
              <div><span>完成時間</span><strong>{formatTime(seconds)}</strong></div>
            </div>
            <button className="primary-button" onClick={restartGame}>再玩一次</button>
          </section>
        </div>
      )}
    </main>
  )
}
