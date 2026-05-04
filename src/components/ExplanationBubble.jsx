import { useState, useEffect } from 'react'

export function ExplanationBubble({ messages }) {
  const [visible, setVisible] = useState([])

  useEffect(() => {
    if (!messages.length) return
    const latest = messages[0]

    setVisible(prev => {
      if (prev.length && prev[0].id === latest.id) return prev
      return [latest, ...prev].slice(0, 3)
    })

    const timer = setTimeout(() => {
      setVisible(prev => prev.filter(m => m.id !== latest.id))
    }, 4000)

    return () => clearTimeout(timer)
  }, [messages])

  if (!visible.length) return null

  return (
    <div className="explanation-overlay">
      {visible.map(m => (
        <div key={m.id} className={`explanation-bubble bubble-${m.type}`}>
          {m.text}
        </div>
      ))}
    </div>
  )
}
