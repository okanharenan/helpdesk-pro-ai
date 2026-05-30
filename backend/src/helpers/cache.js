const redis = require('../config/redis')

const TTL = {
  tickets:     60 * 5,   // 5 minutos
  ticket:      60 * 5,   // 5 minutos
  users:       60 * 10,  // 10 minutos
  stats:       60 * 2,   // 2 minutos
  me:      60 * 5, // 5 minutos
}

const cache = {
  async get(key) {
    try {
      const data = await redis.get(key)
      return data
    } catch (err) {
      console.error('Cache get error:', err.message)
      return null
    }
  },

  async set(key, value, ttl) {
    try {
      await redis.set(key, JSON.stringify(value), { ex: ttl })
    } catch (err) {
      console.error('Cache set error:', err.message)
    }
  },

  async del(...keys) {
    try {
      await Promise.all(keys.map(k => redis.del(k)))
    } catch (err) {
      console.error('Cache del error:', err.message)
    }
  },

  async invalidateTickets(userId = null) {
    const keys = ['tickets:all']
    if (userId) keys.push(`tickets:user:${userId}`)
    await cache.del(...keys)
  },

  TTL,
}

module.exports = cache