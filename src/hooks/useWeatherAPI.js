import { useState, useEffect } from 'react'

// coordenadas de São Paulo (centro)
const SP_LAT = -23.55
const SP_LON = -46.63

// intervalo de atualização — clima não muda a cada segundo
const REFRESH_MS = 10 * 60 * 1000  // 10 minutos

const ENDPOINT = `https://api.open-meteo.com/v1/forecast?latitude=${SP_LAT}&longitude=${SP_LON}&current=temperature_2m&timezone=America/Sao_Paulo`

export function useWeatherAPI() {
  const [data, setData] = useState({
    temperature: null,
    loading:     true,
    error:       false,
  })

  useEffect(() => {
    let ativo = true

    const fetchClima = async () => {
      try {
        const res  = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) })
        if (!res.ok) throw new Error('open-meteo response not ok')
        const json = await res.json()
        if (!ativo) return
        setData({
          temperature: json.current?.temperature_2m ?? null,
          loading:     false,
          error:       false,
        })
      } catch {
        if (!ativo) return
        setData(prev => ({ ...prev, loading: false, error: true }))
      }
    }

    fetchClima()
    const interval = setInterval(fetchClima, REFRESH_MS)

    return () => {
      ativo = false
      clearInterval(interval)
    }
  }, [])

  return data
}
